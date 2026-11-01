import axios from "axios";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "../src/shared/error-codes";
import { authMiddleware } from "../src/middlewares/auth.middleware";
import { redis } from "../src/utils/redis.util";
import { mockRequest, mockResponse } from "./http";

const SECRET = "unit-test-jwt-key";

function token(payload: Record<string, unknown>) {
  return jwt.sign(payload, SECRET);
}

async function run(
  headers: Record<string, string | undefined>,
  redisStatus: string | null = null,
) {
  redis.get.mockResolvedValue(redisStatus);
  const req = mockRequest(headers);
  const res = mockResponse();
  const next = vi.fn();
  await authMiddleware(req as any, res as any, next);
  return { req, res, next };
}

describe("authMiddleware", () => {
  it("rejects a request with no token", async () => {
    const { res, next } = await run({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ code: ErrorCode.AUTH_UNAUTHORIZED });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts the internal secret and normalizes a legacy webmaster role", async () => {
    const { req, next } = await run({
      "x-internal-secret": "unit-test-internal",
      "x-override-username": "hod_cse",
      "x-override-role": "webmaster",
    });
    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user).toMatchObject({
      id: "internal",
      username: "hod_cse",
      role: "webadmin",
    });
  });

  it("rejects a token with the wrong shape or signature", async () => {
    const malformed = await run({
      authorization: `Bearer ${token({ role: "student" })}`,
    });
    expect(malformed.res.statusCode).toBe(401);
    expect(malformed.res.body).toMatchObject({
      message: "Invalid token structure",
    });

    const foreign = jwt.sign({ username: "o210008", role: "student" }, "other");
    const bad = await run({ authorization: `Bearer ${foreign}` });
    expect(bad.res.statusCode).toBe(401);
    expect(bad.res.body).toMatchObject({ code: ErrorCode.AUTH_TOKEN_EXPIRED });
  });

  it("blocks a user whose cached status is suspended", async () => {
    const { res, next } = await run(
      { authorization: `Bearer ${token({ id: "u1", username: "o210008", role: "student" })}` },
      "true",
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ code: "AUTH_SUSPENDED" });
    expect(next).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("allows a cached active user and promotes hod_* faculty", async () => {
    const { req, next } = await run(
      {
        authorization: `Bearer ${token({
          id: "u2",
          username: "hod_cse",
          role: "faculty",
        })}`,
      },
      "false",
    );
    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user.role).toBe("hod");
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("caches a live status check", async () => {
    axios.get.mockResolvedValue({ data: { data: { isDisabled: false } } });
    const { next } = await run({
      authorization: `Bearer ${token({ id: "u3", username: "o210008", role: "student" })}`,
    });
    expect(next).toHaveBeenCalledOnce();
    expect(redis.setex).toHaveBeenCalledWith("user:status:u3", 600, "false");
  });

  it("blocks and caches a suspended user returned by the auth service", async () => {
    axios.get.mockResolvedValue({ data: { data: { isDisabled: true } } });
    const { res } = await run({
      authorization: `Bearer ${token({ id: "u4", username: "o210008", role: "student" })}`,
    });
    expect(res.statusCode).toBe(403);
    expect(redis.setex).toHaveBeenCalledWith("user:status:u4", 600, "true");
  });

  it("rejects a token whose user record is missing", async () => {
    axios.get.mockRejectedValue({ response: { status: 404 }, message: "missing" });
    const { res } = await run({
      authorization: `Bearer ${token({ id: "u5", username: "o210008", role: "student" })}`,
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });

  it("fails open when the status check cannot be reached", async () => {
    axios.get.mockRejectedValue(new Error("offline"));
    const { next } = await run({
      authorization: `Bearer ${token({ id: "u6", username: "o210008", role: "student" })}`,
    });
    expect(next).toHaveBeenCalledOnce();
  });
});
