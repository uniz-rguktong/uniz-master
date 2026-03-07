import jwt from "jsonwebtoken";
import { JwtPayload } from "../shared/jwt.schema";

const SECRET = process.env.JWT_SECURITY_KEY;
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECURITY_KEY is required in production");
}
const JWT_SECRET: string = (SECRET || "default_secret_unsafe").trim();

export const signToken = (payload: JwtPayload): string => {
  if (payload.exp) {
    return jwt.sign(payload, JWT_SECRET);
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (e) {
    return null;
  }
};
