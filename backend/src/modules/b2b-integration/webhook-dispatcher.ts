import { createHmac, randomUUID } from 'crypto';
import type { B2BIntegrationRepository, ClaimedDelivery } from './b2b-integration.repository';
import { decryptSecret } from './secret-crypto';
import { postJson } from './safe-http';

const LEASE_SECONDS = 120;
const BATCH = 25;
const MAX_BACKOFF_MS = 60 * 60_000;

/** 30s, 60s, 120s, 240s… (capped at 1h). Base is overridable for tests. */
export const backoffMs = (attempt: number): number => {
  const base = Number(process.env.B2B_WEBHOOK_BACKOFF_BASE_MS ?? 30_000);
  return Math.min(base * 2 ** Math.max(attempt - 1, 0), MAX_BACKOFF_MS);
};

/**
 * Signature = HMAC-SHA256(secret, `${timestamp}.${rawBody}`), sent as `sha256=<hex>`.
 * Including the timestamp lets receivers reject replays; verify with a timing-safe comparison.
 */
export const signPayload = (secret: string, timestamp: string, body: string): string =>
  `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;

export class WebhookDispatcher {
  private running = false;
  private rerun = false;

  constructor(
    private repository: B2BIntegrationRepository,
    private onError: (err: unknown) => void,
  ) {}

  /** Called after a transaction that enqueued events commits; coalesces overlapping calls. */
  kick(): void {
    void this.processDue().catch(this.onError);
  }

  /** Sends everything that is due. Safe to run from many processes at once (rows are leased). */
  async processDue(): Promise<number> {
    if (this.running) { this.rerun = true; return 0; }
    this.running = true;
    let total = 0;
    try {
      do {
        this.rerun = false;
        for (;;) {
          const batch = await this.repository.claimDue(BATCH, LEASE_SECONDS);
          if (batch.length === 0) break;
          await Promise.allSettled(batch.map((d) => this.deliver(d)));
          total += batch.length;
        }
      } while (this.rerun);
    } finally {
      this.running = false;
    }
    return total;
  }

  private async deliver(d: ClaimedDelivery): Promise<void> {
    const attempt = d.attemptCount + 1;
    const endpoint = await this.repository.findEndpointForDelivery(d.endpointId);
    if (!endpoint || !endpoint.isActive) {
      return this.repository.recordAttempt(d.id, { status: 'FAILED', attemptCount: attempt, responseCode: null, error: 'Endpoint was disabled or deleted', nextRetryAt: null, deliveredAt: null });
    }

    let code: number | null = null;
    let error: string | null = null;
    try {
      const body = JSON.stringify(d.payload);
      const ts = Math.floor(Date.now() / 1000).toString();
      const res = await postJson(endpoint.url, {
        'Content-Type': 'application/json',
        'User-Agent': 'JoyfulTrekking-B2B-Webhooks/1.0',
        'X-B2B-Event': d.eventType,
        'X-B2B-Delivery-Id': d.id,
        'X-B2B-Timestamp': ts,
        'X-B2B-Signature': signPayload(decryptSecret(endpoint.secret), ts, body),
      }, body, Number(process.env.B2B_WEBHOOK_TIMEOUT_MS ?? 10_000));
      code = res.status;
      if (res.status < 200 || res.status >= 300) error = `HTTP ${res.status}${res.bodySnippet ? `: ${res.bodySnippet.slice(0, 200)}` : ''}`;
    } catch (err) {
      error = err instanceof Error ? err.message.slice(0, 300) : 'Network error';
    }

    if (!error) {
      return this.repository.recordAttempt(d.id, { status: 'DELIVERED', attemptCount: attempt, responseCode: code, error: null, nextRetryAt: null, deliveredAt: new Date() });
    }
    const exhausted = attempt >= d.maxAttempts;
    return this.repository.recordAttempt(d.id, {
      status: exhausted ? 'FAILED' : 'PENDING', attemptCount: attempt, responseCode: code, error,
      nextRetryAt: exhausted ? null : new Date(Date.now() + backoffMs(attempt)), deliveredAt: null,
    });
  }

  /** Test-event id helper (kept here so the id format stays in one place). */
  static newEventId(): string {
    return randomUUID();
  }
}
