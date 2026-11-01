import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { accessTokenBlacklistKey, readVerifiedJwtPayload } from "@uniz/shared";

const redisStore = new Map<string, string>();

vi.mock("../src/utils/prisma", () => ({
  prisma: {
    authCredential: {
      findUnique: vi.fn(async () => ({
        isDisabled: false,
        username: "o210001",
      })),
    },
  },
}));

vi.mock("../src/utils/redis.util", () => ({
  redis: {
    get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => {
      redisStore.set(key, value);
      return "OK";
    }),
  },
}));

import { authMiddleware } from "../src/middlewares/auth.middleware";

function sign(claims: Record<string, unknown> = {}) {
  const secret = process.env.JWT_SECURITY_KEY || "test-jwt-secret";
  return jwt.sign(
    {
      id: "user-1",
      username: "O210001",
      role: "student",
      ...claims,
    },
    secret,
    { expiresIn: "1h" },
  );
}

async function run(method: string, path: string, token: string) {
  const req = {
    method,
    path,
    originalUrl: path,
    headers: { authorization: `Bearer ${token}` },
  };
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  const next = vi.fn();
  await authMiddleware(req as any, res as any, next);
  return { res, next };
}

describe("auth password-change gate", () => {
  beforeEach(() => {
    redisStore.clear();
    delete process.env.ENFORCE_PASSWORD_CHANGE;
  });

  it("does not change behaviour when the flag is off", async () => {
    const token = sign({ mustChangePassword: true });
    const { res, next } = await run("GET", "/api/v1/academics/grades", token);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("returns PASSWORD_CHANGE_REQUIRED for a flagged token", async () => {
    process.env.ENFORCE_PASSWORD_CHANGE = "true";
    const token = sign({ mustChangePassword: true });
    const verified = readVerifiedJwtPayload(
      token,
      process.env.JWT_SECURITY_KEY || "",
    );
    expect(verified?.mustChangePassword).toBe(true);

    const blocked = await run("GET", "/api/v1/academics/grades", token);
    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.res.statusCode).toBe(403);
    expect(blocked.res.body).toEqual({ code: "PASSWORD_CHANGE_REQUIRED" });

    const allowed = await run("POST", "/password/change", token);
    expect(allowed.next).toHaveBeenCalledOnce();

    const profile = await run("GET", "/api/v1/profile/student/me", token);
    expect(profile.next).toHaveBeenCalledOnce();

    const logout = await run("POST", "/api/v1/auth/logout", token);
    expect(logout.next).toHaveBeenCalledOnce();
  });

  it("rejects a blacklisted token even on password change", async () => {
    process.env.ENFORCE_PASSWORD_CHANGE = "true";
    const token = sign({ mustChangePassword: true });
    redisStore.set(accessTokenBlacklistKey(token), "1");
    const { res, next } = await run("POST", "/password/change", token);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("does not gate a user who is not flagged", async () => {
    process.env.ENFORCE_PASSWORD_CHANGE = "true";
    const { next } = await run("GET", "/api/v1/academics/grades", sign());
    expect(next).toHaveBeenCalledOnce();
  });
});
