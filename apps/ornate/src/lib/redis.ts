import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

/**
 * Universal Redis Client for Ornate
 * 
 * Supports two modes:
 * 1. Professional Mode: Standard TCP Redis (using ioredis) - for VPS/Hosting
 * 2. Serverless Mode: Upstash REST (using @upstash/redis) - for Local/Vercel
 */
/**
 * A tiny wrapper to unify set() behavior between ioredis and Upstash REST
 */
class UnifiedRedis {
  client: any;
  isUpstash: boolean;

  constructor(client: any, isUpstash: boolean) {
    this.client = client;
    this.isUpstash = isUpstash;
  }

  // Common commands you use
  async get(key: string) {
    return await this.client.get(key);
  }

  async del(key: string) {
    return await this.client.del(key);
  }

  async incr(key: string) {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number) {
    return await this.client.expire(key, seconds);
  }

  /**
   * Unifies SET behavior. 
   * Upstash uses: .set(key, value, { ex: 600 })
   * ioredis uses: .set(key, value, "EX", 600)
   */
  async set(key: string, value: string, options?: { ex?: number }) {
    if (this.isUpstash) {
      return await this.client.set(key, value, options);
    } else {
      if (options?.ex) {
        return await this.client.set(key, value, "EX", options.ex);
      }
      return await this.client.set(key, value);
    }
  }
}

function createUniversalRedisClient(): UnifiedRedis | null {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log("[Redis] Initializing ioredis (TCP mode)");
    try {
      const c = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
      return new UnifiedRedis(c, false);
    } catch (e) {
      console.warn("[Redis] Standard ioredis failed, looking for alternatives...");
    }
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    console.log("[Redis] Initializing Upstash REST fallback");
    const c = new UpstashRedis({ url: upstashUrl, token: upstashToken });
    return new UnifiedRedis(c, true);
  }

  return null;
}

export const redis = createUniversalRedisClient();
