import type { Request, Response } from "express";

/** Maintenance runs as Kubernetes CronJobs. This body is not an upstream probe. */
export const CRON_HEALTH_BODY = {
  status: "ok",
  maintenance: "CronJob-only",
} as const;

export function handleCronHealth(_req: Request, res: Response): void {
  res.status(200).json(CRON_HEALTH_BODY);
}
