import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

const WINDOW_SEC = 60;
const MAX = 120;

/** Redis-backed per-user limit for feedback routes (gateway limits per IP too). */
export async function feedbackLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const who = (req as any).user?.username || req.ip || "anon";
  const key = `ratelimit:feedback:${who}`;
  try {
    const current = Number(await redis.incr(key));
    if (current === 1) await redis.expire(key, WINDOW_SEC);
    if (current > MAX) {
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Try again in a minute.",
      });
    }
    return next();
  } catch (err) {
    console.error("Feedback rate limiter error:", err);
    return next();
  }
}
