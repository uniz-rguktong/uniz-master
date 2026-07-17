import { Queue, type ConnectionOptions } from "bullmq";
import type IORedis from "ioredis";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

const defaultJobOpts = {
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
};

let notificationQueue: Queue | null = null;

export function getNotificationQueue(connection?: IORedis): Queue {
  if (notificationQueue) return notificationQueue;

  const redisUrl = process.env.REDIS_URL;
  const conn: ConnectionOptions = connection
    ? (connection as unknown as ConnectionOptions)
    : redisUrl
      ? {
          host: new URL(redisUrl).hostname,
          port: Number(new URL(redisUrl).port) || 6379,
          password: new URL(redisUrl).password || undefined,
          maxRetriesPerRequest: null,
        }
      : { host: "localhost", port: 6379, maxRetriesPerRequest: null };

  notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, { connection: conn });
  return notificationQueue;
}

export async function enqueueNotificationJob(
  name: string,
  data: Record<string, unknown>,
  opts: Record<string, unknown> = {},
) {
  const queue = getNotificationQueue();
  return queue.add(name, data, { ...defaultJobOpts, ...opts });
}
