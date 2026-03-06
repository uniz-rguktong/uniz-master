/**
 * ─────────────────────────────────────────────────────────
 * Rate Limiting Configuration — Upstash Ratelimit
 * ─────────────────────────────────────────────────────────
 *
 * This module defines two rate limiters:
 *
 * 1. AUTH RATE LIMITER (strict):
 *    - Protects: /api/auth/* (login/credential endpoints)
 *    - Policy: 5 requests per 5-minute sliding window per IP
 *    - Purpose: Prevents brute-force login attacks
 *
 * 2. GENERAL API RATE LIMITER:
 *    - Protects: /api/* (all API routes)
 *    - Policy: 100 requests per 1-minute sliding window per IP
 *    - Purpose: Prevents abuse of heavy endpoints (certificates,
 *      exports, bulk operations)
 *
 * WHY SLIDING WINDOW:
 *   The sliding window algorithm provides smoother rate limiting
 *   compared to fixed windows. It prevents burst abuse at window
 *   boundaries (e.g., 100 requests at 0:59 + 100 at 1:01).
 *
 * WHY UPSTASH RATELIMIT:
 *   - Works in Edge Runtime (HTTP-based, no TCP sockets)
 *   - Distributed state: all Vercel serverless instances share
 *     the same Redis counters, so rate limits are enforced globally
 *   - No in-memory state that would reset on cold starts
 *
 * ARCHITECTURAL ISOLATION:
 *   This module has NO dependency on:
 *   - Prisma (database layer)
 *   - unstable_cache (Vercel Data Cache)
 *   - Server Actions
 *   - revalidation.ts
 *   It only depends on the Upstash Redis client (src/lib/redis.ts).
 * ─────────────────────────────────────────────────────────
 */

import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Auth Rate Limiter — Strict login protection.
 *
 * 5 attempts per 5-minute sliding window, keyed by IP.
 * The "ratelimit:auth:" prefix ensures auth counters are
 * stored separately from general API counters in Redis.
 *
 * Returns `null` when Redis is not configured (local dev).
 */
export const authRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "5 m"),
        analytics: true,
        prefix: "ratelimit:auth",
    })
    : null;

/**
 * General API Rate Limiter — Broad protection for all /api/* routes.
 *
 * 100 requests per 1-minute sliding window, keyed by IP.
 * This covers heavy endpoints like certificate distribution,
 * PDF exports, and bulk data operations.
 *
 * Returns `null` when Redis is not configured (local dev).
 */
export const apiRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
    })
    : null;
