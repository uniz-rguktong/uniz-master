import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { runStorageCleanup } from "./utils/storage";

dotenv.config({ override: true });

const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
let cleanupRunning = false;

/**
 * @deprecated Maintenance jobs moved to uniz-outpass (`/api/cron`).
 * This service hosts VPS storage cleanup for K8s CronJobs and manual triggers.
 */
const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "uniz-cron-service",
    note: "Maintenance moved to uniz-outpass. Storage cleanup via CronJob or POST /internal/storage-cleanup.",
  });
});

app.get("/api/cron", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Moved",
    message: "Maintenance is now served by uniz-outpass at /api/cron",
  });
});

app.post("/internal/storage-cleanup", async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  if (secret !== INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (cleanupRunning) {
    return res.status(409).json({ error: "Storage cleanup already in progress" });
  }
  cleanupRunning = true;
  try {
    await runStorageCleanup();
    return res.json({ success: true, message: "Storage cleanup completed" });
  } catch (error: any) {
    console.error("[STORAGE] Manual cleanup failed:", error);
    return res.status(500).json({ error: error.message || "Cleanup failed" });
  } finally {
    cleanupRunning = false;
  }
});

const server = app.listen(3008, () => {
  console.log("Cron service (storage cleanup utilities) on 3008");
});

export { runStorageCleanup };

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
