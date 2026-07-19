import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

/**
 * Redis-backed grievance submission limiter — bounded memory and correct
 * across horizontally-scaled replicas (the previous in-memory Map leaked and
 * only limited per-process).
 */
const WINDOW_SEC = 15 * 60; // 15 minutes
const MAX = 40;

export async function submissionLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const who = `${req.ip || "unknown"}:${(req as any).user?.username || "anon"}`;
  const key = `ratelimit:grievance:${who}`;

  try {
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, WINDOW_SEC)
      .exec();

    const current = Number(results?.[0]?.[1] ?? 0);
    if (current > MAX) {
      return res.status(429).json({
        success: false,
        message:
          "Too many grievance submissions. Please try again after 15 minutes.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }
    return next();
  } catch (err) {
    // Fail open — a Redis blip should not block grievance submission.
    console.error("Grievance rate limiter error:", err);
    return next();
  }
}
