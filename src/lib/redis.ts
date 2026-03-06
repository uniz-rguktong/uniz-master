/**
 * ─────────────────────────────────────────────────────────
 * Upstash Redis Client — Edge-Compatible
 * ─────────────────────────────────────────────────────────
 *
 * WHY @upstash/redis INSTEAD OF ioredis:
 *   Next.js middleware runs in the Edge Runtime, which does NOT support
 *   raw TCP connections. ioredis requires a persistent TCP socket, making
 *   it incompatible with Vercel's serverless/Edge environment.
 *   @upstash/redis communicates over HTTP (REST API), which works in
 *   ALL runtimes — Edge, serverless, and Node.js.
 *
 * WHY THIS DOES NOT CONFLICT WITH unstable_cache:
 *   Next.js `unstable_cache` uses Vercel's built-in Data Cache (file-based
 *   on disk or Vercel's internal cache layer). It is completely separate
 *   from Redis. This Redis instance is used EXCLUSIVELY for rate limiting
 *   counters. There is zero overlap between the two systems:
 *     - unstable_cache → Vercel Data Cache (tag-based revalidation)
 *     - @upstash/redis → Upstash Redis (rate limit counters only)
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 *   UPSTASH_REDIS_REST_URL  — Your Upstash Redis REST endpoint
 *   UPSTASH_REDIS_REST_TOKEN — Your Upstash Redis REST auth token
 *
 * Both are available from your Upstash Console after creating a database.
 * ─────────────────────────────────────────────────────────
 */

import { Redis } from "@upstash/redis";

/**
 * Singleton Upstash Redis client.
 *
 * Creates a real Redis client when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set. Returns `null` when they aren't
 * (e.g., local development without Upstash). The rate limiter checks
 * for null and gracefully skips rate limiting in that case.
 */
function createRedisClient(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Redis] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limiting disabled in dev.');
        }
        return null;
    }

    return new Redis({ url, token });
}

export const redis = createRedisClient();
