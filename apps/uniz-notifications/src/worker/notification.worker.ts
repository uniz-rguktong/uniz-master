import { Queue, Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { sendWebPush } from "../services/push.service";

export const createNotificationWorker = (connection: IORedis) => {
  const redis = connection as unknown as ConnectionOptions;
  const notificationQueue = new Queue("notification-queue", { connection: redis });

  const worker = new Worker(
    "notification-queue",
    async (job) => {
      const jobType = job.name;
      const data = job.data as Record<string, any>;
      const username = data.username as string | undefined;
      const semesterId = data.semesterId as string | undefined;

      if (!username) {
        throw new Error("Missing username in job data");
      }

      if (jobType === "EMAIL") {
        await sendWebPush(username, {
          title: data.subject || "UniZ Academic Notification",
          body:
            data.body ||
            "A new academic update has been posted. Please review the details on the portal.",
          name: data.name,
          data: { type: "GENERIC" },
        });
        return;
      }

      if (jobType === "RESULTS") {
        await sendWebPush(username, {
          title: "Examination Results Published",
          body: `Results for ${semesterId} are now available on the UniZ portal.`,
          name: data.name,
          data: { type: "RESULTS", semesterId },
        });
        return;
      }

      if (jobType === "ATTENDANCE_REPORT") {
        await sendWebPush(username, {
          title: "Attendance Report Generated",
          body: `Your attendance record for ${semesterId} is ready on the portal.`,
          name: data.name,
          data: { type: "ATTENDANCE", semesterId },
        });
        return;
      }

      console.warn(`[NotificationWorker] Unknown job type: ${jobType}`);
    },
    {
      connection: redis,
      concurrency: 10,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed: ${err.message}`);
  });

  return { worker, notificationQueue };
};
