import { createHash, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../common/exceptions/api-error';
import type { AuthUserPayload } from '../../common/guards/jwt.guard';
import type { B2BIntegrationRepository } from './b2b-integration.repository';
import type { SlidingWindowLimiter } from './rate-window';

export const API_KEY_PREFIX = 'b2b_live_';
const TOUCH_EVERY_MS = 60_000;

export const hashApiKey = (token: string): string => createHash('sha256').update(token).digest('hex');

const safeEqualHex = (a: string, b: string): boolean => {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
};

const extractToken = (req: Request): string | null => {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.length > 0) return header.trim();
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    if (t.startsWith(API_KEY_PREFIX)) return t; // a dashboard JWT sent here is not an API key
  }
  return null;
};

/**
 * Authenticates a partner API key (`x-api-key` or `Authorization: Bearer b2b_live_…`), enforces its
 * per-key rate limit, and attaches the partner scope as `req.user` so the same tenant-scoped
 * controllers serve both the dashboard and the API. The partner id comes ONLY from the key row.
 * Every credential failure returns the same 401 so keys can't be probed for state.
 */
export const createApiKeyGuard = (repository: B2BIntegrationRepository, limiter: SlidingWindowLimiter) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token || !token.startsWith(API_KEY_PREFIX)) throw new ApiError(401, 'API key required (x-api-key header)');

      const hash = hashApiKey(token);
      const key = await repository.findKeyByHash(hash);
      const now = new Date();
      if (!key || !safeEqualHex(key.keyHash, hash) || !key.isActive || (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) || key.partner.deletedAt) {
        throw new ApiError(401, 'Invalid or expired API key');
      }
      if (key.partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');

      const rl = limiter.hit(key.id, key.rateLimitRpm);
      res.setHeader('X-RateLimit-Limit', String(rl.limit));
      res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetMs / 1000)));
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(Math.max(Math.ceil(rl.resetMs / 1000), 1)));
        throw new ApiError(429, 'Rate limit exceeded for this API key');
      }

      // Best-effort and throttled: never delays or fails the request.
      if (!key.lastUsedAt || now.getTime() - key.lastUsedAt.getTime() > TOUCH_EVERY_MS) void repository.touchKey(key.id, now).catch(() => undefined);

      const user: AuthUserPayload = {
        userId: `apikey:${key.id}`, email: `apikey:${key.keyPrefix}`, role: 'B2B API', isSuperAdmin: false, permissions: [],
        b2bPartnerId: key.partnerId, b2bRole: 'BOOKING_AGENT', b2bPartnerStatus: key.partner.status,
      };
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
