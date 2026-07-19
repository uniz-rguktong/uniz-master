import { Response } from "express";

/**
 * Mark a response as non-cacheable end-to-end (browser + any intermediary).
 * Used for personalized / always-fresh reads (progress, per-student records)
 * that must never be served stale from a shared cache.
 */
export function setNoStore(res: Response): void {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}
