import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Cloudflare Turnstile check for the site's public, unauthenticated forms —
 * enquiry/contact (POST /contacts) and booking (POST /bookings,
 * POST /custom-bookings). Same "degrades cleanly when unconfigured" shape as
 * GA4/PACO/SMTP in .env.example: without TURNSTILE_SECRET_KEY the check is
 * skipped entirely so local dev (and any environment mid-rollout, before the
 * client has provisioned a Turnstile site) isn't blocked. Once the secret is
 * set, a missing/invalid/expired token is a hard 400 — this sits in front of
 * the controller, same slot as authenticate/authorize.
 */
export const verifyCaptcha = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      next();
      return;
    }

    const token = req.body?.captchaToken;
    if (!token || typeof token !== 'string') {
      throw new ApiError(400, 'Captcha verification is required');
    }

    const params = new URLSearchParams({ secret, response: token });
    if (req.ip) params.append('remoteip', req.ip);

    const verifyRes = await fetch(VERIFY_URL, { method: 'POST', body: params });
    const result = (await verifyRes.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      throw new ApiError(400, 'Captcha verification failed. Please try again.');
    }

    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(400, 'Captcha verification failed. Please try again.'));
  }
};
