import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { routerLimiterOptions } from "@uniz/shared";

/** Generous per-router flood backstop. Keying and exemptions live in @uniz/shared. */
export const routerRateLimiter = rateLimit(
  routerLimiterOptions,
) as unknown as RequestHandler;
