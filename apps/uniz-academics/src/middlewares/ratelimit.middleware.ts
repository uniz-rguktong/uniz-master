import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const key = `ratelimit:${ip}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60); // 1 minute window
    }

    if (current > 10) {
      // Limit to 10 requests per minute
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);
    next(); // Proceed anyway if redis fails
  }
};
