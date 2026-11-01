import { randomUUID } from "crypto";
import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_LOCKOUT_SECONDS,
  accessTokenBlacklistKey,
  isLoadTestAccount,
  isLoginRateLimitEnforced,
  isPasswordChangeEnforced,
  isPasswordChangeExemptRoute,
  loginIdLockoutKey,
  passwordChangeGateDecision,
  readVerifiedJwtPayload,
} from "../src/password-change";

function signHs256(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

describe("password change gate", () => {
  it("stays off unless ENFORCE_PASSWORD_CHANGE is true", () => {
    expect(isPasswordChangeEnforced(undefined)).toBe(false);
    expect(isPasswordChangeEnforced("false")).toBe(false);
    expect(isPasswordChangeEnforced("true")).toBe(true);
  });

  it("does not block when the flag is off, even if the claim is set", () => {
    expect(
      passwordChangeGateDecision({
        enforce: false,
        method: "GET",
        path: "/api/v1/academics/grades",
        mustChangePassword: true,
      }),
    ).toEqual({ block: false });
  });

  it("blocks flagged tokens on ordinary routes", () => {
    expect(
      passwordChangeGateDecision({
        enforce: true,
        method: "GET",
        path: "/api/v1/academics/grades",
        mustChangePassword: true,
      }),
    ).toEqual({ block: true, code: "PASSWORD_CHANGE_REQUIRED" });
  });

  it("allows password change, logout, and a minimal profile read", () => {
    expect(
      isPasswordChangeExemptRoute("POST", "/api/v1/auth/password/change"),
    ).toBe(true);
    expect(isPasswordChangeExemptRoute("POST", "/password/change")).toBe(true);
    expect(isPasswordChangeExemptRoute("POST", "/api/v1/auth/logout")).toBe(
      true,
    );
    expect(
      isPasswordChangeExemptRoute("GET", "/api/v1/profile/student/me"),
    ).toBe(true);
    expect(isPasswordChangeExemptRoute("GET", "/faculty/me")).toBe(true);
    expect(isPasswordChangeExemptRoute("GET", "/admin/me")).toBe(true);
    expect(
      isPasswordChangeExemptRoute("POST", "/api/v1/profile/student/me"),
    ).toBe(false);
    expect(
      isPasswordChangeExemptRoute("GET", "/api/v1/profile/student/grades"),
    ).toBe(false);
  });

  it("rejects a token whose mustChangePassword claim was edited", () => {
    const secret = "test-" + randomUUID();
    const token = signHs256(
      {
        username: "t000001",
        role: "student",
        exp: Math.floor(Date.now() / 1000) + 60,
        mustChangePassword: true,
      },
      secret,
    );
    const [h, p, s] = token.split(".");
    const tampered = Buffer.from(
      JSON.stringify({
        username: "t000001",
        role: "student",
        exp: Math.floor(Date.now() / 1000) + 60,
        mustChangePassword: false,
      }),
    ).toString("base64url");
    expect(readVerifiedJwtPayload(`${h}.${tampered}.${s}`, secret)).toBeNull();
    expect(readVerifiedJwtPayload(token, secret)?.mustChangePassword).toBe(
      true,
    );
    expect(readVerifiedJwtPayload(token, "other-secret")).toBeNull();
  });
});

describe("login lockout keys", () => {
  it("uses a stable per-id key and a 15 minute window", () => {
    expect(loginIdLockoutKey("T000001")).toBe("auth:login:lockout:id:t000001");
    expect(LOGIN_LOCKOUT_SECONDS).toBe(15 * 60);
    expect(LOGIN_FAILURE_LIMIT).toBeGreaterThan(0);
    expect(isLoginRateLimitEnforced(undefined)).toBe(false);
    expect(isLoginRateLimitEnforced("observe")).toBe(false);
    expect(isLoginRateLimitEnforced("enforce")).toBe(true);
  });

  it("hashes the access token for the blacklist key", () => {
    const a = accessTokenBlacklistKey("aaa.bbb.ccc");
    const b = accessTokenBlacklistKey("aaa.bbb.ddd");
    expect(a).toMatch(/^auth:token:blacklist:[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("aaa");
  });

  it("recognises only the load-test prefix", () => {
    expect(isLoadTestAccount("LOAD_TEST_STU_001")).toBe(true);
    expect(isLoadTestAccount("t000001")).toBe(false);
  });
});
