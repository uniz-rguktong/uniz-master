import { z } from "zod";
import { JwtPayloadSchema, type JwtPayload } from "./jwt.schema";
import { ErrorCode } from "./error-codes";

/**
 * Shared JWT shape check (no crypto). Services still verify signatures with
 * their own jsonwebtoken + JWT_SECURITY_KEY from the VPS vault / local secrets.env.
 * Keeps payload validation consistent across uniz-api modules.
 */
export function parseJwtPayload(payload: unknown):
  | { ok: true; data: JwtPayload }
  | { ok: false; code: ErrorCode; message: string } {
  const parsed = JwtPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message: "Invalid token structure",
    };
  }
  return { ok: true, data: parsed.data };
}

export type { JwtPayload };
export { z };
