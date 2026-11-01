import { Request, Response, NextFunction } from "express";
import {
  PASSWORD_CHANGE_REQUIRED,
  accessTokenBlacklistKey,
  isPasswordChangeEnforced,
  passwordChangeGateDecision,
  readVerifiedJwtPayload,
} from "@uniz/shared";

type RedisGet = {
  get(key: string): Promise<string | null>;
};

function bearerToken(req: Request): string | null {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * When ENFORCE_PASSWORD_CHANGE=true, flagged access tokens may only call
 * password change, logout, and a minimal profile read. Off by default.
 */
export function passwordChangeGate(redis: RedisGet) {
  const secret = (
    process.env.JWT_SECURITY_KEY || "default_secret_unsafe"
  ).trim();

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isPasswordChangeEnforced()) return next();
    if (!req.path.startsWith("/api/")) return next();

    const token = bearerToken(req);
    if (!token) return next();

    const payload = readVerifiedJwtPayload(token, secret);
    if (!payload) return next();

    try {
      const blacklisted = await redis.get(accessTokenBlacklistKey(token));
      if (blacklisted) {
        return res.status(401).json({
          code: "AUTH_TOKEN_EXPIRED",
          message: "Invalid or expired token",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "redis error";
      console.error(
        `[gateway] Redis unavailable, skipped token blacklist check: ${message}`,
      );
    }

    const decision = passwordChangeGateDecision({
      enforce: true,
      method: req.method,
      path: req.originalUrl || req.path,
      mustChangePassword: payload.mustChangePassword,
    });
    if (decision.block) {
      return res.status(403).json({ code: PASSWORD_CHANGE_REQUIRED });
    }
    return next();
  };
}
