import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import jwt from "jsonwebtoken";
import { axiosMock, redisMock } from "./mocks";
import { mockRes } from "./http";
import { authMiddleware } from "../src/middlewares/auth.middleware";
import { ErrorCode } from "../src/shared/error-codes";

vi.mock("jsonwebtoken", () => ({
  default: { verify: vi.fn() },
}));

const payload = {
  id: "user-1",
  username: "o190001",
  role: "student",
  iat: 1,
  exp: 2,
};

function req(headers: Record<string, string> = {}) {
  return { headers } as any;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.mocked(jwt.verify).mockReset();
    vi.mocked(jwt.verify).mockReturnValue(payload as any);
  });

  it("accepts an internal caller when no user token is present", async () => {
    const res = mockRes();
    const next = vi.fn();
    const request = req({ "x-internal-secret": "test-internal" });
    await authMiddleware(request, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(request.user).toMatchObject({
      id: "internal",
      username: "internal-service",
      role: "webadmin",
    });
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it("rejects a request with no token", async () => {
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ "x-internal-secret": "nope" }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message: "No token provided",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token whose payload does not match the jwt schema", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ nope: true } as any);
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(jwt.verify).toHaveBeenCalledWith("abc", "test-jwt-key");
    expect(res.json.mock.calls[0][0].message).toBe("Invalid token structure");
    expect(redisMock.get).not.toHaveBeenCalled();
  });

  it("blocks a user cached as suspended", async () => {
    redisMock.get.mockResolvedValue("true");
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(redisMock.get).toHaveBeenCalledWith("user:status:user-1");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].code).toBe("AUTH_SUSPENDED");
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a user cached as active and aliases webmaster to webadmin", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ ...payload, role: "webmaster" } as any);
    redisMock.get.mockResolvedValue("false");
    const res = mockRes();
    const next = vi.fn();
    const request = req({ authorization: "Bearer abc" });
    await authMiddleware(request, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(request.user.role).toBe("webadmin");
    expect(axiosMock.get).not.toHaveBeenCalled();
  });

  it("loads status on a cache miss and stores it for ten minutes", async () => {
    axiosMock.get.mockResolvedValue({ data: { data: { isDisabled: false } } });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(axiosMock.get).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/auth/internal/user/status/user-1",
      expect.objectContaining({
        headers: { "x-internal-secret": "test-internal" },
        timeout: 5000,
      }),
    );
    expect(redisMock.setex).toHaveBeenCalledWith("user:status:user-1", 600, "false");
    expect(next).toHaveBeenCalledOnce();
  });

  it("caches a disabled flag and refuses the user", async () => {
    axiosMock.get.mockResolvedValue({ data: { data: { isDisabled: true } } });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(redisMock.setex).toHaveBeenCalledWith("user:status:user-1", 600, "true");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("treats a missing auth record as an invalid login", async () => {
    axiosMock.get.mockRejectedValue({
      response: { status: 404 },
      message: "missing",
    });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS);
    expect(next).not.toHaveBeenCalled();
  });

  it("fails open when the status service cannot be reached", async () => {
    axiosMock.get.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = mockRes();
    const next = vi.fn();
    const request = req({ authorization: "Bearer abc" });
    await authMiddleware(request, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(request.user.username).toBe("o190001");
  });

  it("rejects an invalid or expired token", async () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("jwt expired");
    });
    const res = mockRes();
    const next = vi.fn();
    await authMiddleware(req({ authorization: "Bearer abc" }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      code: ErrorCode.AUTH_TOKEN_EXPIRED,
      message: "Invalid or expired token",
    });
  });
});
