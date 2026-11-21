import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import {
  JwtPayloadSchema,
  decodeCredentialStatus,
  encodeCredentialStatus,
  rejectStaleSession,
  type CredentialStatusSnapshot,
  type SessionRejection,
} from "@uniz/shared";

const JWT_SECRET = (process.env.JWT_SECURITY_KEY || "default_secret_unsafe").trim();
const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
const STATUS_TTL_SEC = 60;

type StatusReader = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

type StatusFetch = (
  url: string,
  config: { headers: Record<string, string>; timeout: number },
) => Promise<{ status: number; data?: { data?: Record<string, unknown> } }>;

/**
 * Reject revoked session tokens and calls made before a required password
 * change. Requests without a bearer token are left for the upstream service.
 * A status-lookup failure fails open so an auth blip does not blackhole the API.
 */
export async function enforceCredentialSession(
  req: Request,
  res: Response,
  deps: {
    redis: StatusReader;
    fetchStatus: StatusFetch;
    authBase: string;
  },
): Promise<boolean> {
  const header = String(req.headers.authorization || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({
      code: "AUTH_UNAUTHORIZED",
      message: "No token provided",
    });
    return true;
  }

  let payload: unknown;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({
      code: "AUTH_TOKEN_EXPIRED",
      message: "Invalid or expired token",
    });
    return true;
  }

  const parsed = JwtPayloadSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.id) return false;
  if (parsed.data.role === "system_reset_intent") return false;

  const status = await loadStatus(parsed.data.id, deps);
  if (!status) return false;

  const rejection: SessionRejection | null = rejectStaleSession({
    jwtVersion: parsed.data.tokenVersion,
    currentVersion: status.tokenVersion,
    mustChangePassword: status.mustChangePassword,
    method: req.method,
    path: req.originalUrl || req.url,
  });
  if (!rejection) return false;
  res.status(rejection.status).json({
    code: rejection.code,
    message: rejection.message,
  });
  return true;
}

async function loadStatus(
  id: string,
  deps: {
    redis: StatusReader;
    fetchStatus: StatusFetch;
    authBase: string;
  },
): Promise<CredentialStatusSnapshot | null> {
  const cacheKey = `user:status:${id}`;
  try {
    const cached = decodeCredentialStatus(await deps.redis.get(cacheKey));
    if (cached) return cached;
  } catch {
    /* Redis optional */
  }

  try {
    const response = await deps.fetchStatus(
      `${deps.authBase.replace(/\/$/, "")}/internal/user/status/${id}`,
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        timeout: 2000,
      },
    );
    if (response.status !== 200) return null;
    const data = response.data?.data || {};
    const status: CredentialStatusSnapshot = {
      isDisabled: Boolean(data.isDisabled),
      tokenVersion: Number(data.tokenVersion ?? 0),
      mustChangePassword: Boolean(data.mustChangePassword),
    };
    try {
      await deps.redis.setex(cacheKey, STATUS_TTL_SEC, encodeCredentialStatus(status));
    } catch {
      /* Redis optional */
    }
    return status;
  } catch {
    return null;
  }
}
