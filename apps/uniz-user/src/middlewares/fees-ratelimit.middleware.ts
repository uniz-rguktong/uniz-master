import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

const WINDOW_SEC = 60;
const MAX = 120;

/** Redis-backed per-user limit for fees routes (gateway limits per IP too). */
export async function feesLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const who = (req as any).user?.username || req.ip || "anon";
  const key = `ratelimit:fees:${who}`;
  try {
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, WINDOW_SEC)
      .exec();
    if (Number(results?.[0]?.[1] ?? 0) > MAX) {
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Try again in a minute.",
      });
    }
    return next();
  } catch (err) {
    console.error("Leave rate limiter error:", err);
    return next();
  }
}
