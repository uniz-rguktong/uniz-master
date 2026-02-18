import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtPayload, JwtPayloadSchema } from "../shared/jwt.schema";
import { ErrorCode } from "../shared/error-codes";
import { PrismaClient } from "@prisma/client";
import { redis } from "../utils/redis.util";

const prisma = new PrismaClient();

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
      role: "webmaster" as any,
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
    const cacheKey = `user:status:${parsed.data.id}`;
    let userStatus = await redis.get(cacheKey);
    let isDisabled = false;
    let username = parsed.data.username;

    if (userStatus) {
      isDisabled = userStatus === "true";
    } else {
      const user = await prisma.authCredential.findUnique({
        where: { id: parsed.data.id },
        select: { isDisabled: true, username: true },
      });

      if (!user) {
        console.warn(
          `[AUTH-CHECK] ⚠️ User ${parsed.data.id} not found in database.`,
        );
        return res.status(401).json({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: "Authentication record not found. Please log in again.",
        });
      }
      isDisabled = user.isDisabled;
      username = user.username;
      // Cache for 10 minutes to reduce DB load
      await redis.setex(cacheKey, 600, isDisabled ? "true" : "false");
    }

    if (isDisabled) {
      console.warn(
        `[AUTH-CHECK] ⛔ Access denied for suspended user: ${username} (${parsed.data.id})`,
      );
      return res.status(403).json({
        code: "AUTH_SUSPENDED",
        message:
          "Your account is currently suspended. Please contact the administrator for assistance.",
      });
    }
    // ------------------------

    (req as AuthenticatedRequest).user = parsed.data;
    next();
  } catch (error) {
    return res.status(401).json({
      code: ErrorCode.AUTH_TOKEN_EXPIRED,
      message: "Invalid or expired token",
    });
  }
};
