/*
 * Simple test script to enqueue a single EMAIL job into the
 * `notification-queue` so we can verify that the worker is
 * consuming jobs and sending mail end-to-end.
 *
 * Usage:
 *   REDIS_URL=redis://localhost:6379 \
 *   TEST_EMAIL=you@example.com \
 *   node scripts/test_notification_queue.js
 *
 * Check the `uniz-notifications` worker logs to see dequeue,
 * send attempt, and success/failure details.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Queue } = require("bullmq");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");

dotenv.config();

const REDIS_URL =
  "rediss://default:Ac_yAAIncDI2MzgwNTNjMzEyMmU0MWI3OTNjMzlmYTZkOTIyMzIyOHAyNTMyMzQ@growing-unicorn-53234.upstash.io:6379";
const TEST_EMAIL =
  process.env.TEST_EMAIL || process.env.EMAIL_USER || "test@example.com";

async function main() {
  console.log(
    "[TestNotificationQueue] Using Redis URL:",
    REDIS_URL.replace(/:[^:@/]+@/, ":***@"),
  );
  console.log("[TestNotificationQueue] Target test recipient:", TEST_EMAIL);

  const queue = new Queue("notification-queue", {
    connection: {
      url: REDIS_URL,
      maxRetriesPerRequest: null,
    },
  });

  try {
    const job = await queue.add(
      "EMAIL",
      {
        recipient: TEST_EMAIL,
        subject: "UniZ Notification Service - Test Email",
        body: "This is a test email dispatched via BullMQ notification-queue.",
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 10_000,
        },
      },
    );

    console.log(
      "[TestNotificationQueue] Enqueued EMAIL job",
      JSON.stringify({
        jobId: job.id,
        name: job.name,
        attempts: job.opts.attempts,
      }),
    );
  } catch (err) {
    console.error("[TestNotificationQueue] Failed to enqueue EMAIL job:", err);
  } finally {
    await queue.close();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[TestNotificationQueue] Unhandled error:", err);
  process.exit(1);
});
