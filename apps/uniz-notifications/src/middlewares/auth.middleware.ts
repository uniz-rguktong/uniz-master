import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET: string = (
  process.env.JWT_SECURITY_KEY || "default_secret_unsafe"
).trim();

const INTERNAL_SECRET: string = (
  process.env.INTERNAL_SECRET || "uniz-core"
).trim();

const ADMIN_ROLES = [
  "admin",
  "webmaster",
  "dean",
  "director",
  "caretaker",
  "warden",
  "dsw",
  "hod",
  "faculty",
  "teacher",
];

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
  };
}

/**
 * requireAuth — verifies a valid JWT from Authorization: Bearer <token>
 * Also accepts x-internal-secret header for service-to-service calls.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Allow internal service-to-service calls
  const internalSecret = req.headers["x-internal-secret"];
  if (!req.headers.authorization && internalSecret === INTERNAL_SECRET) {
    (req as AuthenticatedRequest).user = {
      id: "internal",
      username: "internal-service",
      role: "webmaster",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Malformed Authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * requireAdmin — must be used after requireAuth.
 * Only allows admin/webmaster/director/dean/etc. roles.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!ADMIN_ROLES.includes(user.role)) {
    return res.status(403).json({
      error: "Forbidden: admin role required",
      yourRole: user.role,
    });
  }
  next();
};
