/**
 * Per-key sliding-window rate limiter (in-process).
 * No Redis exists in this deployment, so counters live in memory: exact for a single Node process,
 * per-instance when running several — put a shared store behind the same `hit()` interface (or an
 * edge limiter) before scaling the API out horizontally.
 */
export interface RateResult { allowed: boolean; limit: number; remaining: number; resetMs: number }

export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();

  constructor(private windowMs = 60_000) {
    // Drop idle keys so the map can't grow without bound.
    setInterval(() => this.sweep(), 5 * 60_000).unref();
  }

  hit(key: string, limit: number, now = Date.now()): RateResult {
    const cutoff = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    const allowed = list.length < limit;
    if (allowed) list.push(now);
    this.hits.set(key, list);
    const oldest = list[0] ?? now;
    return { allowed, limit, remaining: Math.max(limit - list.length, 0), resetMs: Math.max(oldest + this.windowMs - now, 0) };
  }

  forget(key: string): void {
    this.hits.delete(key);
  }

  private sweep(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [k, v] of this.hits) if (v.every((t) => t <= cutoff)) this.hits.delete(k);
  }
}
