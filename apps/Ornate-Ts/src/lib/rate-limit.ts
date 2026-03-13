import { redis } from './redis';

interface RateLimitConfig {
    /** Unique key prefix (e.g., 'login', 'register', 'action') */
    prefix: string;
    /** Maximum requests allowed in the window */
    limit: number;
    /** Window duration in seconds */
    windowSeconds: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Sliding-window rate limiter backed by Redis.
 * Uses a sorted set with timestamps as scores.
 */
export async function rateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const key = `rl:${config.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current entries
    pipeline.zcard(key);
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    // Set TTL
    pipeline.expire(key, config.windowSeconds);

    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) ?? 0;

    const success = currentCount < config.limit;
    const remaining = Math.max(0, config.limit - currentCount - 1);
    const resetAt = now + config.windowSeconds * 1000;

    // If over limit, remove the entry we just added
    if (!success) {
        await redis.zremrangebyscore(key, now, now);
    }

    return { success, remaining, resetAt };
}

/** Pre-configured rate limiters */
export const rateLimiters = {
    /** General API: 100 req/min per IP */
    general: (ip: string) =>
        rateLimit(ip, { prefix: 'general', limit: 100, windowSeconds: 60 }),

    /** Login attempts: 5 req/5min per IP */
    login: (ip: string) =>
        rateLimit(ip, { prefix: 'login', limit: 5, windowSeconds: 300 }),

    /** Write actions: 10 req/min per user */
    action: (userId: string) =>
        rateLimit(userId, { prefix: 'action', limit: 10, windowSeconds: 60 }),
};
