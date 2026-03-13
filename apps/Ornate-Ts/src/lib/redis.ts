import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

function createRedisClient() {
    let redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    
    // Support connecting via Upstash TCP if only the REST variants are provided in .env
    if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
            const host = new URL(process.env.UPSTASH_REDIS_REST_URL).hostname;
            const password = process.env.UPSTASH_REDIS_REST_TOKEN;
            redisUrl = `rediss://default:${password}@${host}:6379`;
        } catch (e) {
            console.error('[Redis] Failed to parse UPSTASH_REDIS_REST_URL', e);
        }
    }

    // Support for separate HOST/PASSWORD/PORT env vars
    if (!redisUrl && process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
        const host = process.env.REDIS_HOST;
        const password = process.env.REDIS_PASSWORD;
        const port = process.env.REDIS_PORT || '6379';
        redisUrl = `rediss://default:${password}@${host}:${port}`;
    }

    // If no Redis URL is found, return a mock client to prevent ECONNREFUSED in dev
    if (!redisUrl) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Redis] No REDIS_URL found in .env. Using mock redis client for development.');
            return {
                get: async () => null,
                set: async () => 'OK',
                del: async () => 0,
                on: () => {},
                quit: async () => 'OK',
                ping: async () => 'PONG'
            } as unknown as Redis;
        }
    }

    const client = new Redis(redisUrl ?? 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            if (times > 1) return null; // stop retrying quickly in dev
            return 1000;
        },
        lazyConnect: true,
        connectTimeout: 3000,
    });

    client.on('error', (err: any) => {
        if (err.code === 'ECONNREFUSED') {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[Redis] Connection refused at ${redisUrl ?? '127.0.0.1:6379'}. Redis-dependent features like leaderboards might not reflect real-time data.`);
            } else {
                console.error('[Redis] Connection refused. Check your REDIS_URL or local Redis server.');
            }
            client.disconnect();
        } else {
            console.error('[Redis] Connection error:', err.message);
        }
    });

    return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

// Always persist the singleton — prevents a new connection on every serverless invocation in production
globalForRedis.redis = redis;
