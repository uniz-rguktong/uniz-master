import { createHash, createHmac, timingSafeEqual } from "crypto";
import { parseJwtPayload } from "./jwt-verify";
import type { JwtPayload } from "./jwt.schema";

export const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

/** Failures inside this window lock the ID when RATE_LIMIT_MODE=enforce. */
export const LOGIN_LOCKOUT_SECONDS = 15 * 60;
export const LOGIN_FAILURE_LIMIT = 5;

/** Synthetic load-test accounts. Real campus IDs are not this prefix. */
export const LOAD_TEST_USERNAME_PREFIX = "load_test_";

export function isPasswordChangeEnforced(
  value: string | undefined = process.env.ENFORCE_PASSWORD_CHANGE,
): boolean {
  return value === "true";
}

/** Default is observe: count failures, do not block. */
export function isLoginRateLimitEnforced(
  value: string | undefined = process.env.RATE_LIMIT_MODE,
): boolean {
  return value === "enforce";
}

export function isLoadTestAccount(username: string): boolean {
  return username.trim().toLowerCase().startsWith(LOAD_TEST_USERNAME_PREFIX);
}

export function loginIdLockoutKey(id: string): string {
  return `auth:login:lockout:id:${id.trim().toLowerCase()}`;
}

export function loginIpFailureKey(ip: string): string {
  return `auth:login:fail:ip:${ip.trim()}`;
}

export function accessTokenBlacklistKey(token: string): string {
  const digest = createHash("sha256").update(token).digest("hex");
  return `auth:token:blacklist:${digest}`;
}

export function isPasswordChangeExemptRoute(
  method: string,
  rawPath: string,
): boolean {
  let path = rawPath.split("?")[0];
  let end = path.length;
  while (end > 0 && path.charCodeAt(end - 1) === 47) end--;
  path = path.slice(0, end).toLowerCase();
  const verb = method.toUpperCase();

  if (
    verb === "POST" &&
    (path === "/password/change" || path.endsWith("/auth/password/change"))
  ) {
    return true;
  }
  if (
    verb === "POST" &&
    (path === "/logout" || path.endsWith("/auth/logout"))
  ) {
    return true;
  }
  if (verb === "GET" && /\/(student|faculty|admin)\/me$/.test(path)) {
    return true;
  }
  return false;
}

export function passwordChangeGateDecision(input: {
  enforce: boolean;
  method: string;
  path: string;
  mustChangePassword?: boolean;
}): { block: boolean; code?: typeof PASSWORD_CHANGE_REQUIRED } {
  if (!input.enforce || input.mustChangePassword !== true) {
    return { block: false };
  }
  if (isPasswordChangeExemptRoute(input.method, input.path)) {
    return { block: false };
  }
  return { block: true, code: PASSWORD_CHANGE_REQUIRED };
}

/**
 * Verify an HS256 access token and return its payload.
 * Invalid, expired, or non-HS256 tokens return null so callers can leave
 * the existing 401 path alone.
 */
export function readVerifiedJwtPayload(
  token: string,
  secret: string,
): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  const expected = createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signaturePart, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }
  const parsed = parseJwtPayload(payload);
  if (!parsed.ok) return null;
  if (
    typeof parsed.data.exp === "number" &&
    parsed.data.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return parsed.data;
}
