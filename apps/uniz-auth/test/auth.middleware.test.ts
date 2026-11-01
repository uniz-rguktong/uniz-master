import { beforeEach, describe, expect, it, vi } from "vitest";
import { signToken } from "../src/utils/token.util";

const { prismaMock, redisMock } = vi.hoisted(() => ({
  prismaMock: {
    authCredential: {
      findUnique: vi.fn(),
    },
  },
  redisMock: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

vi.mock("../src/utils/prisma", () => ({ prisma: prismaMock }));
vi.mock("../src/utils/redis.util", () => ({ redis: redisMock }));

import { authMiddleware } from "../src/middlewares/auth.middleware";

function response() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

async function run(headers: Record<string, unknown>) {
  const req = { headers, user: undefined as unknown };
  const res = response();
  const next = vi.fn();
  await authMiddleware(req as never, res as never, next);
  return { req, res, next };
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockResolvedValue("OK");
  });

  it("accepts the internal secret when no user token is present", async () => {
    const { req, next, res } = await run({
      "x-internal-secret": "unit-test-internal",
    });
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(req.user).toMatchObject({
      id: "internal",
      username: "internal-service",
      role: "webadmin",
    });
  });

  it("rejects a missing token", async () => {
    const { next, res } = await run({});
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: "No token provided" });
  });

  it("rejects a wrong internal secret the same way as a missing token", async () => {
    const { res } = await run({ "x-internal-secret": "nope" });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: "No token provided" });
  });

  it("rejects a token that does not verify", async () => {
    const { res } = await run({ authorization: "Bearer not-a-token" });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: "Invalid or expired token" });
  });

  it("rejects a verified token with the wrong shape", async () => {
    const token = signToken({ role: "student" } as never);
    const { res } = await run({ authorization: `Bearer ${token}` });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: "Invalid token structure" });
  });

  it("blocks a user whose suspension is cached", async () => {
    redisMock.get.mockResolvedValue("true");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const token = signToken({
      id: "user-1",
      username: "o210008",
      role: "student",
    });
    const { res, next } = await run({ authorization: `Bearer ${token}` });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "AUTH_SUSPENDED" });
    expect(prismaMock.authCredential.findUnique).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("loads suspension from prisma on a cache miss and caches it", async () => {
    prismaMock.authCredential.findUnique.mockResolvedValue({
      isDisabled: false,
      username: "o210008",
    });
    const token = signToken({
      id: "user-1",
      username: "o210008",
      role: "webmaster",
    });
    const { req, next } = await run({ authorization: `Bearer ${token}` });
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ role: "webadmin", username: "o210008" });
    expect(redisMock.setex).toHaveBeenCalledWith(
      "user:status:user-1",
      600,
      "false",
    );
  });

  it("denies a user prisma marks disabled", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    prismaMock.authCredential.findUnique.mockResolvedValue({
      isDisabled: true,
      username: "o210008",
    });
    const token = signToken({
      id: "user-1",
      username: "o210008",
      role: "student",
    });
    const { res } = await run({ authorization: `Bearer ${token}` });
    expect(res.statusCode).toBe(403);
    expect(redisMock.setex).toHaveBeenCalledWith(
      "user:status:user-1",
      600,
      "true",
    );
    warn.mockRestore();
  });

  it("rejects a token whose user record is gone", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    prismaMock.authCredential.findUnique.mockResolvedValue(null);
    const token = signToken({
      id: "missing",
      username: "o210008",
      role: "student",
    });
    const { res } = await run({ authorization: `Bearer ${token}` });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      message: "Authentication record not found. Please log in again.",
    });
    warn.mockRestore();
  });

  it("lets a cached active user through without a prisma read", async () => {
    redisMock.get.mockResolvedValue("false");
    const token = signToken({
      id: "user-1",
      username: "o210008",
      role: "student",
    });
    const { next } = await run({ authorization: `Bearer ${token}` });
    expect(next).toHaveBeenCalledOnce();
    expect(prismaMock.authCredential.findUnique).not.toHaveBeenCalled();
  });
});
