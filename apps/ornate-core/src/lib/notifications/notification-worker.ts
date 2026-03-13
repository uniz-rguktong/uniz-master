import { Queue, Worker, type Job } from "bullmq";
import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import prisma from "../prisma";
import logger from "../logger";

const NOTIFICATION_QUEUE_NAME = "web-push-notifications";

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
};

type SendWebPushJobData = {
  username: string;
  payload: NotificationPayload;
};

type SendWebPushJobName = "send-web-push";

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for web push notifications`);
  }
  return value;
}

function configureVapid(): void {
  const publicKey = assertEnv("VAPID_PUBLIC_KEY");
  const privateKey = assertEnv("VAPID_PRIVATE_KEY");
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function createRedisConnection() {
  const redisUrl = assertEnv("REDIS_URL");
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined;

  if (redisHost && redisPort) {
    return {
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }

  return {
    url: redisUrl,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

const queueConnection = createRedisConnection();

export const notificationQueue = new Queue<SendWebPushJobData, void, SendWebPushJobName>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: queueConnection,
  },
);

export async function sendWebPush(
  username: string,
  payload: NotificationPayload,
): Promise<void> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    throw new Error("username is required");
  }

  await notificationQueue.add(
    "send-web-push",
    { username: normalizedUsername, payload },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
}

async function processSendWebPushJob(
  job: Job<SendWebPushJobData, void, SendWebPushJobName>,
): Promise<void> {
  const { username, payload } = job.data;
  await sendWebPushNow(username, payload);
}

export async function sendWebPushNow(
  username: string,
  payload: NotificationPayload,
): Promise<void> {
  configureVapid();

  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { username: normalizedUsername },
  });

  if (subscriptions.length === 0) {
    logger.info({ username: normalizedUsername }, "No push subscriptions found for user");
    return;
  }

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const target: WebPushSubscription = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime?.getTime() ?? null,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(target, JSON.stringify(payload), {
          TTL: 86400,
          urgency: "high",
        });
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : undefined;

        // Browser has invalidated this token; remove it so future jobs stay fast.
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint },
          });

          logger.info(
            { username: normalizedUsername, endpoint: subscription.endpoint, statusCode },
            "Deleted invalid push subscription",
          );
          return;
        }

        logger.error(
          { err: error, username: normalizedUsername, endpoint: subscription.endpoint },
          "Failed to send web push notification",
        );
      }
    }),
  );
}

let workerInstance: Worker<SendWebPushJobData, void, SendWebPushJobName> | null = null;

export function startNotificationWorker(): Worker<SendWebPushJobData, void, SendWebPushJobName> {
  if (workerInstance) return workerInstance;

  configureVapid();

  const instance = new Worker<SendWebPushJobData, void, SendWebPushJobName>(
    NOTIFICATION_QUEUE_NAME,
    processSendWebPushJob,
    {
      connection: createRedisConnection(),
      concurrency: 20,
    },
  );

  instance.on("failed", (job: Job<SendWebPushJobData, void, SendWebPushJobName> | undefined, error: Error) => {
    logger.error(
      { err: error, jobId: job?.id, data: job?.data },
      "Notification worker job failed",
    );
  });

  instance.on("completed", (job: Job<SendWebPushJobData, void, SendWebPushJobName>) => {
    logger.debug({ jobId: job.id }, "Notification worker job completed");
  });

  workerInstance = instance;
  return instance;
}

export type { NotificationPayload, SendWebPushJobData };
