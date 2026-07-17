import { Request, Response, NextFunction } from "express";

/** Lightweight in-memory limiter (avoids new express-rate-limit dep). */
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 40;

export function submissionLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = `${req.ip || "unknown"}:${(req as any).user?.username || "anon"}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (bucket.count >= MAX) {
    return res.status(429).json({
      success: false,
      message:
        "Too many grievance submissions. Please try again after 15 minutes.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  }
  bucket.count += 1;
  return next();
}
