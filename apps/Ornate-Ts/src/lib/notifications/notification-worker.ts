import { Queue, Worker, type Job } from "bullmq";
import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { prisma } from "../prisma";

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
  const redisUrl = process.env.REDIS_URL;
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

  if (!redisUrl) {
    throw new Error("REDIS_URL (or REDIS_HOST/REDIS_PORT) is required for notification worker");
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
      backoff: { type: "exponential", delay: 2000 },
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
    console.info("[PushWorker] No subscriptions for user", normalizedUsername);
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

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint },
          });
          console.info("[PushWorker] Deleted invalid subscription", subscription.endpoint);
          return;
        }

        console.error("[PushWorker] Failed to send push", {
          username: normalizedUsername,
          endpoint: subscription.endpoint,
          error,
        });
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

  instance.on("failed", (job, error) => {
    console.error("[PushWorker] Job failed", {
      error,
      jobId: job?.id,
      data: job?.data,
    });
  });

  instance.on("completed", (job) => {
    console.debug("[PushWorker] Job completed", { jobId: job.id });
  });

  workerInstance = instance;
  return instance;
}

export type { NotificationPayload, SendWebPushJobData };
