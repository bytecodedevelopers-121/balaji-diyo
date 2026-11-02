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