import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create a new Redis instance using Upstash credentials from .env
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiter for the login terminal.
 * Allows 5 attempts per 10 minutes per IP.
 * Uses a Fixed Window algorithm.
 */
export const loginRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.fixedWindow(5, "10 m"),
    analytics: true,
    prefix: "@ornate/ratelimit/login",
});

/**
 * Alternative rate limiter for registration.
 * Allows 3 registrations per hour per IP.
 */
export const registerRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
    prefix: "@ornate/ratelimit/register",
});
