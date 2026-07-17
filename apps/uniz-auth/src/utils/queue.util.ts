import { Queue, type ConnectionOptions } from "bullmq";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

const defaultJobOpts = {
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
};

let notificationQueue: Queue | null = null;

function connectionFromEnv(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
  }
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: connectionFromEnv(),
    });
  }
  return notificationQueue;
}

export async function enqueueNotificationJob(
  name: string,
  data: Record<string, unknown>,
  opts: Record<string, unknown> = {},
) {
  return getNotificationQueue().add(name, data, {
    ...defaultJobOpts,
    ...opts,
  });
}
