import "dotenv/config";
import { startNotificationWorker } from "../lib/notifications/notification-worker";
import logger from "../lib/logger";

const worker = startNotificationWorker();
logger.info("Web push notification worker started");

async function shutdown(signal: string): Promise<void> {
  try {
    logger.info({ signal }, "Shutting down notification worker");
    await worker.close();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Failed to shut down notification worker cleanly");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
