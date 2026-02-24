import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis.util";

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const key = `ratelimit:${ip}`;

  // Temporary bypass for Redis 'NaN' error causing crashes
  next();
  /*
    try {
        let current;
        try {
            current = await redis.incr(key);
        } catch (incrError: any) {
            // ...
        }
        // ...
    } catch (err) {
        console.error('Rate limiter error:', err);
        next();
    }
    */
};
