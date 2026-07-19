import { Worker, type ConnectionOptions } from "bullmq";
import type IORedis from "ioredis";
import { sendWebPush } from "../services/push.service";
import { dispatchEmailByType } from "../mail/services/email-dispatch.service";
import {
  getNotificationQueue,
  NOTIFICATION_QUEUE_NAME,
} from "../utils/queue.util";

export const createNotificationWorker = (connection: IORedis) => {
  const redis = connection as unknown as ConnectionOptions;
  const notificationQueue = getNotificationQueue(connection);

  const worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      const jobType = job.name;
      const data = job.data as Record<string, any>;

      if (jobType === "OTP_EMAIL" || jobType === "EMAIL") {
        const type = String(
          data.type || (jobType === "OTP_EMAIL" ? "otp" : ""),
        );
        const to = String(data.to || data.email || "");
        if (!type || !to) {
          throw new Error("EMAIL job requires type and to");
        }
        const payload = { ...data, ...(data.data || {}) };
        const ok = await dispatchEmailByType(type, to, payload);
        if (!ok)
          throw new Error(`Email delivery failed for type=${type} to=${to}`);
        return { sent: true, type, to };
      }

      if (jobType === "OTP_DELIVER") {
        const username = String(data.username || "");
        const otp = String(data.otp || "");
        const email =
          String(data.email || "") ||
          `${username.toLowerCase()}@rguktong.ac.in`;
        if (!username || !otp) {
          throw new Error("OTP_DELIVER requires username and otp");
        }

        const sent = await sendWebPush(username, {
          title: "UniZ Security Authentication",
          body: `Your secure verification code is ${otp}. To maintain account security, this code will remain valid for exactly 10 minutes.`,
          rawBody: true,
          data: { type: "OTP" },
        });

        if (sent > 0) {
          return { deliveryMethod: "push", sent };
        }

        const ok = await dispatchEmailByType("otp", email, { username, otp });
        if (!ok) throw new Error(`OTP email fallback failed for ${username}`);
        return { deliveryMethod: "email", sent: 0 };
      }

      if (jobType === "PUSH" || jobType === "OTP_PUSH") {
        const username = String(data.username || "");
        if (!username) throw new Error("PUSH job requires username");
        const sent = await sendWebPush(username, {
          title: String(data.title || "UniZ Notification"),
          body: String(data.body || ""),
          rawBody: Boolean(data.rawBody ?? true),
          image: data.image,
          name: data.name,
          data: data.data || { type: String(data.type || "SYSTEM") },
        });
        return { sent };
      }

      if (jobType === "PUSH_BROADCAST") {
        const users: Array<{ username: string; name?: string }> = Array.isArray(
          data.users,
        )
          ? data.users
          : [];
        const title = String(data.title || "");
        const body = String(data.body || "");
        if (!title || !body || users.length === 0) {
          throw new Error("PUSH_BROADCAST requires title, body, and users");
        }

        let sent = 0;
        // Fan out in bounded-concurrency chunks instead of strictly sequential
        // awaits, so a large broadcast isn't O(users) in wall-clock time.
        const BROADCAST_CHUNK = 20;
        for (let i = 0; i < users.length; i += BROADCAST_CHUNK) {
          const chunk = users.slice(i, i + BROADCAST_CHUNK);
          const results = await Promise.allSettled(
            chunk.map((user) => {
              const personalizedBody =
                `Dear ${user.name || user.username},\n\n` +
                body
                  .replace(/{{name}}/g, user.name || user.username)
                  .replace(/{{username}}/g, user.username);
              const personalizedTitle = title
                .replace(/{{name}}/g, user.name || user.username)
                .replace(/{{username}}/g, user.username);

              return sendWebPush(user.username, {
                title: personalizedTitle,
                body: personalizedBody,
                rawBody: true,
                image: data.image,
                data: { type: "BROADCAST" },
              });
            }),
          );
          for (const r of results) {
            if (r.status === "fulfilled") sent += r.value;
          }
        }
        return { sent, total: users.length };
      }

      const username = data.username as string | undefined;
      const semesterId = data.semesterId as string | undefined;
      if (!username) {
        throw new Error("Missing username in job data");
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

      // Legacy EMAIL job name that only pushed — keep push fallback
      if (jobType === "LEGACY_EMAIL_PUSH") {
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

      console.warn(`[NotificationWorker] Unknown job type: ${jobType}`);
    },
    {
      connection: redis,
      concurrency: Number(process.env.NOTIFICATION_WORKER_CONCURRENCY || 8),
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[NotificationWorker] Job ${job?.id} (${job?.name}) failed: ${err.message}`,
    );
  });

  worker.on("ready", () => {
    console.log(
      `[NotificationWorker] Listening on ${NOTIFICATION_QUEUE_NAME} (concurrency=${worker.opts.concurrency})`,
    );
  });

  return { worker, notificationQueue };
};
