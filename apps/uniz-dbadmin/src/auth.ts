import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { isWebadmin, JwtPayloadSchema } from "@uniz/shared";
import { DbAdminError } from "./errors";

export interface Actor {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      actor?: Actor;
    }
  }
}

export function jwtSecret(): string {
  const secret = (process.env.JWT_SECURITY_KEY || "").trim();
  if (!secret) {
    throw new DbAdminError(503, "The database editor is not configured yet.");
  }
  return secret;
}

export function requireWebadmin(req: Request, res: Response, next: NextFunction): void {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ success: false, message: "Sign in again to open the database editor." });
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret());
    const parsed = JwtPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      res.status(401).json({ success: false, message: "Sign in again to open the database editor." });
      return;
    }
    if (!isWebadmin(parsed.data)) {
      res.status(403).json({
        success: false,
        message: "Only the webadmin can open the database editor.",
      });
      return;
    }
    req.actor = {
      id: parsed.data.id || parsed.data.username,
      username: parsed.data.username,
    };
    next();
  } catch (error) {
    if (error instanceof DbAdminError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    res.status(401).json({ success: false, message: "Sign in again to open the database editor." });
  }
}
