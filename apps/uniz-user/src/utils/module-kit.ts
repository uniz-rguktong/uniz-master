import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  isFeatureEnabled,
  resolveEffectiveRole,
  type ModuleFlag,
} from "@uniz/shared";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { redis } from "./redis.util";

/** Small helpers shared by the module routers (gate, errors, limiter, notify). */
export type Actor = { id?: string; username: string; role?: string };

export class ModuleError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const roleOf = (a: Actor) => resolveEffectiveRole(a);
export const hasRole = (a: Actor, roles: string[]) => roles.includes(roleOf(a));
export function requireRole(a: Actor, roles: string[], what = "do this") {
  if (!hasRole(a, roles))
    throw new ModuleError(403, "FORBIDDEN", `You are not allowed to ${what}`);
}

export function actorOf(req: AuthenticatedRequest): Actor | null {
  const u = req.user as any;
  if (!u?.username) return null;
  return { id: u.id, username: u.username, role: u.role };
}

export function makeGate(
  flag: ModuleFlag,
  label: string,
  opts: { auth?: boolean } = {},
) {
  const needAuth = opts.auth !== false;
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(flag)) {
      return res
        .status(503)
        .json({ code: "MODULE_DISABLED", message: `${label} is turned off` });
    }
    if (needAuth && !actorOf(req))
      return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
    res.setHeader("Cache-Control", "no-store");
    return next();
  };
}

export function makeLimiter(name: string, max = 120, windowSec = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const who = (req as any).user?.username || req.ip || "anon";
    const key = `ratelimit:${name}:${who}`;
    try {
      const r = await redis.multi().incr(key).expire(key, windowSec).exec();
      if (Number(r?.[0]?.[1] ?? 0) > max) {
        return res.status(429).json({
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Try again in a minute.",
        });
      }
    } catch {
      // Redis down: fall through, the gateway still limits per IP.
    }
    return next();
  };
}

export function makeWrap(tag: string) {
  return (fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>) =>
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        await fn(req, res);
      } catch (e: any) {
        if (e instanceof ModuleError)
          return res
            .status(e.status)
            .json({ code: e.code, message: e.message });
        if (e instanceof z.ZodError) return bad(res, e);
        if (e?.code === "P2002")
          return res
            .status(409)
            .json({ code: "DUPLICATE", message: "Already exists" });
        console.error(`[${tag}]`, e?.message);
        return res
          .status(500)
          .json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    };
}

export const bad = (res: Response, err: z.ZodError) =>
  res.status(400).json({
    code: "VALIDATION_ERROR",
    message: err.issues[0]?.message,
    errors: err.issues,
  });

export const uuid = z.string().uuid();
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const NOTIFICATION_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-notification-service:3007"
    : process.env.NOTIFICATION_SERVICE_URL) || "http://localhost:3007"
).replace(/\/$/, "");

/** Push + NotificationInbox entry via the notification service. Never throws. */
export async function notifyUser(
  username: string,
  title: string,
  body: string,
) {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/push/send`,
      { target: "user", username, title, body },
      {
        headers: {
          "x-internal-secret": (
            process.env.INTERNAL_SECRET || "uniz-core"
          ).trim(),
        },
        timeout: 5000,
      },
    );
    return true;
  } catch (e: any) {
    console.error(`[notify] ${username}:`, e?.message);
    return false;
  }
}
