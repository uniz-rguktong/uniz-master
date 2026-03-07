/**
 * ─────────────────────────────────────────────────────────
 * Rate Limiting Configuration — Custom ioredis Implementation
 * ─────────────────────────────────────────────────────────
 *
 * WHY CUSTOM:
 *   We moved from Upstash (HTTP) to local Redis (TCP). @upstash/ratelimit
 *   is built for HTTP. This custom implementation uses standard Redis
 *   commands (INCR, EXPIRE) to provide the same sliding window protection.
 */

import { redis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export class SlidingWindowLimiter {
  private prefix: string;
  private max: number;
  private windowSeconds: number;

  constructor(prefix: string, max: number, window: string) {
    this.prefix = prefix;
    this.max = max;
    // Parse "5 m" or "1 m" to seconds
    const match = window.match(/^(\d+)\s*(m|s|h)$/);
    if (!match || !match[1] || !match[2])
      throw new Error(`Invalid window format: ${window}`);
    const value = parseInt(match[1]);
    const unit = match[2];
    this.windowSeconds =
      unit === "m" ? value * 60 : unit === "h" ? value * 3600 : value;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    if (!redis) {
      return {
        success: true,
        limit: this.max,
        remaining: this.max,
        reset: Date.now(),
      };
    }

    const key = `${this.prefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${key}:${Math.floor(now / this.windowSeconds)}`;

    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, this.windowSeconds * 2);
    }

    const remaining = Math.max(0, this.max - count);
    const reset =
      (Math.floor(now / this.windowSeconds) + 1) * this.windowSeconds * 1000;

    return {
      success: count <= this.max,
      limit: this.max,
      remaining,
      reset,
    };
  }
}

/**
 * Auth Rate Limiter — Strict login protection.
 * 5 attempts per 5-minute sliding window per IP.
 */
export const authRateLimiter = new SlidingWindowLimiter(
  "ratelimit:auth",
  5,
  "5 m",
);

/**
 * General API Rate Limiter — Broad protection for all /api/* routes.
 * 100 requests per 1-minute sliding window per IP.
 */
export const apiRateLimiter = new SlidingWindowLimiter(
  "ratelimit:api",
  100,
  "1 m",
);
