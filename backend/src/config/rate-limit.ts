import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

const rateLimitResponse = (message: string) => ({
  status: 429,
  message,
});

/** Applied to every route */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitResponse("Too many requests, please try again later."),
});

/** Applied only to /api/auth — tighter cap, skips successful requests */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitResponse("Too many auth attempts, please try again later."),
  skipSuccessfulRequests: true,
});

/** Progressive slow-down before the hard block kicks in */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: (hits) => hits * 100,
});

/** Anonymous B2B partner registration (creates accounts + stores uploads) — tight per-IP cap */
export const b2bRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitResponse("Too many registration attempts, please try again later."),
});

/**
 * Throttles repeated invalid API keys per IP. Only 401s count, so a legitimate client that
 * hits its own per-key limit (429) is never locked out here.
 */
export const apiKeyFailureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitResponse("Too many invalid API key attempts, please try again later."),
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
});
