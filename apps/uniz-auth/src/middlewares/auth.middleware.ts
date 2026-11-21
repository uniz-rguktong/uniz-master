import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtPayload, JwtPayloadSchema } from "../shared/jwt.schema";
import { ErrorCode } from "../shared/error-codes";
import {
  accessRole,
  decodeCredentialStatus,
  encodeCredentialStatus,
  rejectStaleSession,
} from "@uniz/shared";
import { prisma } from "../utils/prisma";
import { redis } from "../utils/redis.util";

const SECRET = process.env.JWT_SECURITY_KEY;
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECURITY_KEY is required in production");
}
const JWT_SECRET: string = (SECRET || "default_secret_unsafe").trim();

const I_SECRET = process.env.INTERNAL_SECRET;
if (!I_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("INTERNAL_SECRET is required in production");
}
const INTERNAL_SECRET = (I_SECRET || "uniz-core").trim();

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  // Check for internal secret ONLY if no user token is provided
  // or if explicitly intended for service-to-service communication
  const internalSecret = req.headers["x-internal-secret"];

  if (!authHeader && internalSecret && internalSecret === INTERNAL_SECRET) {
    (req as AuthenticatedRequest).user = {
      id: "internal",
      username: "internal-service",
      role: "webadmin" as any,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    return next();
  }

  if (!authHeader) {
    return res.status(401).json({
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Validate shape
    const parsed = JwtPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return res.status(401).json({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: "Invalid token structure",
      });
    }

    // --- SUSPENSION CHECK (OPTIMIZED WITH REDIS) ---
    // Suspension, token generation, and the forced password change.
    const cacheKey = `user:status:${parsed.data.id}`;
    let status = decodeCredentialStatus(await redis.get(cacheKey).catch(() => null));
    let username = parsed.data.username;

    if (!status) {
      const user = await prisma.authCredential.findUnique({
        where: { id: parsed.data.id },
        select: {
          isDisabled: true,
          username: true,
          tokenVersion: true,
          mustChangePassword: true,
        },
      });

      if (!user) {
        console.warn(
          `[AUTH-CHECK]  User ${parsed.data.id} not found in database.`,
        );
        return res.status(401).json({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: "Authentication record not found. Please log in again.",
        });
      }
      status = {
        isDisabled: user.isDisabled,
        tokenVersion: user.tokenVersion,
        mustChangePassword: user.mustChangePassword,
      };
      username = user.username;
      // Cache for 10 minutes to reduce DB load (now 60 seconds, so a sign-out or forced password change lands fast)
      await redis.setex(cacheKey, 60, encodeCredentialStatus(status));
    }

    if (status.isDisabled) {
      console.warn(
        `[AUTH-CHECK] ⛔ Access denied for suspended user: ${username} (${parsed.data.id})`,
      );
      return res.status(403).json({
        code: "AUTH_SUSPENDED",
        message:
          "Your account is currently suspended. Please contact the administrator for assistance.",
      });
    }

    const rejection = rejectStaleSession({
      jwtVersion: parsed.data.tokenVersion,
      currentVersion: status.tokenVersion,
      mustChangePassword: status.mustChangePassword,
      method: req.method,
      path: req.originalUrl || req.path,
    });
    if (rejection) {
      return res.status(rejection.status).json({
        code: rejection.code,
        message: rejection.message,
      });
    }
    // ------------------------

    (req as AuthenticatedRequest).user = {
      ...parsed.data,
      role: accessRole(parsed.data) as JwtPayload["role"],
    };
    next();
  } catch (error) {
    return res.status(401).json({
      code: ErrorCode.AUTH_TOKEN_EXPIRED,
      message: "Invalid or expired token",
    });
  }
};
