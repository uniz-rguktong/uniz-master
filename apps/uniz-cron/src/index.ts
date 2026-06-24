import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { runStorageCleanup } from "./utils/storage";

dotenv.config({ override: true });

/**
 * @deprecated Maintenance jobs moved to uniz-outpass (`/api/cron`).
 * This service now only hosts VPS storage cleanup for K8s CronJobs.
 */
const app = express();

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "uniz-cron-service",
    note: "Maintenance moved to uniz-outpass. This pod runs storage cleanup only.",
  });
});

app.get("/api/cron", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Moved",
    message: "Maintenance is now served by uniz-outpass at /api/cron",
  });
});

const server = app.listen(3008, () => {
  console.log("Cron service (storage cleanup utilities) on 3008");
});

export { runStorageCleanup };

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
