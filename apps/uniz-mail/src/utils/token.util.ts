import jwt from "jsonwebtoken";
import { JwtPayload } from "../shared/jwt.schema";

const SECRET = process.env.JWT_SECURITY_KEY || "default_secret_unsafe";

export const signToken = (payload: JwtPayload): string => {
  if (payload.exp) {
    return jwt.sign(payload, SECRET);
  }
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (e) {
    return null;
  }
};
