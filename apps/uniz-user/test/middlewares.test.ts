import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attributionMiddleware } from "../src/middlewares/attribution.middleware";
import { authMiddleware } from "../src/middlewares/auth.middleware";
import { cmsPublicGuard } from "../src/middlewares/cms-auth.middleware";
import { submissionLimiter } from "../src/middlewares/grievance-ratelimit.middleware";
import { mockReq, mockRes } from "./http";
import { axiosMock, redisMock } from "./mocks";

const SECRET = "unit-test-jwt-secret";

function token(payload: Record<string, unknown>) {
  return jwt.sign(payload, SECRET);
}

describe("attributionMiddleware", () => {
  it("stamps attribution and leaves a successful body alone", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    attributionMiddleware(req, res, next);
    res.json({ status: "ok" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.body).toEqual({
      status: "ok",
      attribution: "SreeCharan",
      meta: { attribution: "SreeCharan" },
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("rewrites a bare validation failure and logs malformed activity", () => {
    const req = mockReq({ ip: "10.0.0.8", originalUrl: "/profile" });
    const res = mockRes();
    res.status(400);
    attributionMiddleware(req, res, vi.fn());
    res.json({ message: "Validation failed", code: "VALIDATION_ERROR" });
    expect(res.body.message).toBe(
      "Request structure or behavior violates system constraints.",
    );
    expect(console.warn).toHaveBeenCalled();
    expect(String((console.warn as any).mock.calls[0][0])).toContain("10.0.0.8");
  });

  it("keeps a specific 400 message and ignores non-objects", () => {
    const res = mockRes();
    res.status(400);
    attributionMiddleware(mockReq(), res, vi.fn());
    res.json({ message: "Student ID is required" });
    expect(res.body.message).toBe("Student ID is required");

    const plain = mockRes();
    attributionMiddleware(mockReq(), plain, vi.fn());
    plain.json("ok");
    expect(plain.body).toBe("ok");
  });
});

describe("cmsPublicGuard", () => {
  it("allows the configured api key", () => {
    const next = vi.fn();
    const res = mockRes();
    cmsPublicGuard(
      mockReq({ headers: { "x-cms-api-key": "unit-test-cms-key" } }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res.body).toBeUndefined();
  });

  it("allows a known landing origin and blocks everything else", () => {
    const next = vi.fn();
    cmsPublicGuard(
      mockReq({ headers: { origin: "https://uniz.rguktong.in" } }),
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalledOnce();

    const res = mockRes();
    cmsPublicGuard(
      mockReq({ headers: { origin: "https://evil.example" } }),
      res,
      vi.fn(),
    );
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain("Invalid API Key or Origin");
  });
});

describe("submissionLimiter", () => {
  it("lets a submission through under the cap", async () => {
    redisMock.incr.mockResolvedValue(3);
    const next = vi.fn();
    const req = mockReq({ ip: "1.2.3.4", user: { username: "O240001" } });
    await submissionLimiter(req, mockRes(), next);
    expect(redisMock.incr).toHaveBeenCalledWith(
      "ratelimit:grievance:1.2.3.4:O240001",
    );
    expect(redisMock.expire).toHaveBeenCalledWith(
      "ratelimit:grievance:1.2.3.4:O240001",
      900,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 429 once the window is exhausted", async () => {
    redisMock.incr.mockResolvedValue(41);
    const res = mockRes();
    const next = vi.fn();
    await submissionLimiter(mockReq(), res, next);
    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(next).not.toHaveBeenCalled();
  });

  it("fails open when redis throws", async () => {
    redisMock.incr.mockRejectedValue(new Error("redis down"));
    const next = vi.fn();
    await submissionLimiter(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalled();
  });
});

describe("authMiddleware", () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
  });

  it("accepts the internal secret when no user token is present", async () => {
    const next = vi.fn();
    const req = mockReq({
      headers: { "x-internal-secret": "unit-test-internal" },
    });
    await authMiddleware(req, mockRes(), next);
    expect(req.user.role).toBe("webadmin");
    expect(req.user.username).toBe("internal-service");
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a missing token", async () => {
    const res = mockRes();
    await authMiddleware(mockReq(), res, vi.fn());
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("rejects a bad signature and a payload that fails the schema", async () => {
    const bad = mockRes();
    await authMiddleware(
      mockReq({ headers: { authorization: "Bearer not-a-jwt" } }),
      bad,
      vi.fn(),
    );
    expect(bad.statusCode).toBe(401);
    expect(bad.body.code).toBe("AUTH_TOKEN_EXPIRED");

    const shape = mockRes();
    await authMiddleware(
      mockReq({
        headers: {
          authorization: `Bearer ${token({ id: "1", role: "student" })}`,
        },
      }),
      shape,
      vi.fn(),
    );
    expect(shape.statusCode).toBe(401);
    expect(shape.body.message).toBe("Invalid token structure");
  });

  it("blocks a suspended user from the redis cache", async () => {
    redisMock.get.mockResolvedValue("true");
    const res = mockRes();
    await authMiddleware(
      mockReq({
        headers: {
          authorization: `Bearer ${token({
            id: "u1",
            username: "O240001",
            role: "student",
          })}`,
        },
      }),
      res,
      vi.fn(),
    );
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("AUTH_SUSPENDED");
    expect(axiosMock.get).not.toHaveBeenCalled();
  });

  it("caches a live status check and aliases webmaster to webadmin", async () => {
    redisMock.get.mockResolvedValue(null);
    axiosMock.get.mockResolvedValue({ data: { data: { isDisabled: false } } });
    const next = vi.fn();
    const req = mockReq({
      headers: {
        authorization: `Bearer ${token({
          id: "u9",
          username: "admin",
          role: "webmaster",
        })}`,
      },
    });
    await authMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.role).toBe("webadmin");
    expect(redisMock.setex).toHaveBeenCalledWith("user:status:u9", 600, "false");
  });

  it("stores a disabled flag from auth and returns 403", async () => {
    redisMock.get.mockResolvedValue(null);
    axiosMock.get.mockResolvedValue({ data: { data: { isDisabled: true } } });
    const res = mockRes();
    await authMiddleware(
      mockReq({
        headers: {
          authorization: `Bearer ${token({
            id: "u2",
            username: "O240002",
            role: "student",
          })}`,
        },
      }),
      res,
      vi.fn(),
    );
    expect(redisMock.setex).toHaveBeenCalledWith("user:status:u2", 600, "true");
    expect(res.statusCode).toBe(403);
  });

  it("treats a missing auth record as unauthorized", async () => {
    redisMock.get.mockResolvedValue(null);
    axiosMock.get.mockRejectedValue({ response: { status: 404 }, message: "missing" });
    const res = mockRes();
    await authMiddleware(
      mockReq({
        headers: {
          authorization: `Bearer ${token({
            id: "gone",
            username: "O240003",
            role: "student",
          })}`,
        },
      }),
      res,
      vi.fn(),
    );
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("fails open when the status service is unreachable", async () => {
    redisMock.get.mockResolvedValue(null);
    axiosMock.get.mockRejectedValue(new Error("timeout"));
    const next = vi.fn();
    const req = mockReq({
      headers: {
        authorization: `Bearer ${token({
          id: "u4",
          username: "O240004",
          role: "student",
        })}`,
      },
    });
    await authMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.username).toBe("O240004");
  });
});
