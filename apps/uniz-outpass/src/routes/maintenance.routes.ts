import { Router, Request, Response } from "express";
import { runMaintenance } from "../jobs/maintenance";

const router = Router();

const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

/** Triggered by K8s CronJob or gateway `/api/v1/cron/api/cron`. */
router.get("/api/cron", async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  if (secret !== INTERNAL_SECRET && process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Forbidden" });
  }

  await runMaintenance();
  res.json({ success: true, message: "Maintenance job executed" });
});

export default router;
