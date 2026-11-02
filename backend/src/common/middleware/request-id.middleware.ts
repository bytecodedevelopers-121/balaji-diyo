import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Attaches a unique X-Request-ID to every request and response.
 * Reuses the client-supplied header if present (useful for distributed tracing).
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers["x-request-id"] as string) ?? randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);
  next();
};
