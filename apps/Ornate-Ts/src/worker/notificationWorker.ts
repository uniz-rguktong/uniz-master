import "dotenv/config";
import { startNotificationWorker } from "../lib/notifications/notification-worker";

const worker = startNotificationWorker();
console.info("[PushWorker] Web push notification worker started");

async function shutdown(signal: string): Promise<void> {
  try {
    console.info("[PushWorker] Shutting down", { signal });
    await worker.close();
    process.exit(0);
  } catch (error) {
    console.error("[PushWorker] Failed to shut down cleanly", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
