import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

const WINDOW_SEC = 60;
const MAX = 100; // requests per IP per window

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown";
  const key = `ratelimit:mail:${ip}`;

  try {
    // Pipeline incr + expire so the key always gets a TTL (avoids leaks).
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, WINDOW_SEC)
      .exec();

    const current = Number(results?.[0]?.[1] ?? 0);
    if (current > MAX) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again shortly.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }
    return next();
  } catch (err) {
    // Fail open — never let a Redis blip take down mail delivery.
    console.error("Mail rate limiter error:", err);
    return next();
  }
};
