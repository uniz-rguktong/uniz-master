/**
 * ─────────────────────────────────────────────────────────
 * Standard Redis Client (ioredis) — TCP-Based
 * ─────────────────────────────────────────────────────────
 *
 * WHY ioredis:
 *   In your VPS environment, Redis is running as a local K3s service.
 *   ioredis uses standard TCP connections, which are faster and more reliable
 *   within your cluster's internal network than HTTP resets.
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 *   REDIS_URL — e.g. redis://uniz-redis:6379
 * ─────────────────────────────────────────────────────────
 */

import Redis from "ioredis";

function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Redis] REDIS_URL not set — rate limiting might be affected.",
      );
    }
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      reconnectOnError: (err) => {
        console.error("[Redis] Reconnect error:", err.message);
        return true;
      },
    });

    client.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });

    return client;
  } catch (e) {
    console.error("[Redis] Failed to initialize:", e);
    return null;
  }
}

export const redis = createRedisClient();
