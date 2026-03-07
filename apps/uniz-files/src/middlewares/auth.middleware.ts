import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtPayload, JwtPayloadSchema } from "../shared/jwt.schema";
import { ErrorCode } from "../shared/error-codes";
import axios from "axios";
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

// Construct Auth Service URL
const GATEWAY_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
).replace(/\/$/, "");
const AUTH_SERVICE_URL = (
  process.env.AUTH_SERVICE_URL || `${GATEWAY_URL}/auth`
).replace(/\/$/, "");

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

    // --- INTERNAL API SUSPENSION CHECK (OPTIMIZED WITH REDIS) ---
    const cacheKey = `user:status:${parsed.data.id}`;
    try {
      let isDisabled = false;
      let cachedStatus = await redis.get(cacheKey);

      if (cachedStatus) {
        isDisabled = cachedStatus === "true";
      } else {
        const response = await axios.get(
          `${AUTH_SERVICE_URL}/internal/user/status/${parsed.data.id}`,
          {
            headers: { "x-internal-secret": INTERNAL_SECRET },
            timeout: 5000,
          },
        );

        const data = response.data?.data || {};
        isDisabled = data.isDisabled;
        // Cache for 10 minutes
        await redis.setex(cacheKey, 600, isDisabled ? "true" : "false");
      }

      if (isDisabled) {
        console.warn(
          `[AUTH-CHECK] ⛔ Access denied for suspended user: ${parsed.data.username} (${parsed.data.id})`,
        );
        return res.status(403).json({
          code: "AUTH_SUSPENDED",
          message:
            "Your account is currently suspended. Please contact the administrator for assistance.",
        });
      }
    } catch (apiError: any) {
      if (apiError.response?.status === 404) {
        console.warn(
          `[AUTH-CHECK]  User ${parsed.data.id} not found in auth records.`,
        );
        return res.status(401).json({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: "Authentication record not found. Please log in again.",
        });
      }

      // Fail-open for connectivity issues to ensure availability, but log the failure
      console.error(
        `[AUTH-CHECK] 🔴 Internal status check failed: ${apiError.message}`,
      );
    }
    // --------------------------------------

    (req as AuthenticatedRequest).user = parsed.data;
    next();
  } catch (error) {
    return res.status(401).json({
      code: ErrorCode.AUTH_TOKEN_EXPIRED,
      message: "Invalid or expired token",
    });
  }
};
