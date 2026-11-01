import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import {
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from "../src/middlewares/auth.middleware";
import { INTERNAL_SECRET, JWT_SECRET } from "./auth-token";

function run(mw: Function, reqOverrides: Record<string, unknown> = {}) {
  const req = {
    headers: {},
    ...reqOverrides,
  } as AuthenticatedRequest;
  const res: any = {
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
  let nextCalled = false;
  mw(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts an internal secret when no bearer token is present", () => {
    const { req, nextCalled, res } = run(requireAuth, {
      headers: { "x-internal-secret": INTERNAL_SECRET },
    });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(req.user).toMatchObject({
      id: "internal",
      username: "internal-service",
      role: "webadmin",
    });
    expect(req.user!.exp).toBeGreaterThan(req.user!.iat);
  });

  it("ignores the internal secret when an Authorization header is present", () => {
    const { res, nextCalled } = run(requireAuth, {
      headers: {
        authorization: "Bearer not-a-token",
        "x-internal-secret": INTERNAL_SECRET,
      },
    });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("rejects a missing token and a malformed header", () => {
    expect(run(requireAuth).res.body).toEqual({ error: "No token provided" });
    const malformed = run(requireAuth, { headers: { authorization: "Bearer" } });
    expect(malformed.res.statusCode).toBe(401);
    expect(malformed.res.body).toEqual({
      error: "Malformed Authorization header",
    });
    const scheme = run(requireAuth, { headers: { authorization: "Token abc" } });
    expect(scheme.res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("accepts a valid token and aliases a legacy webmaster role", () => {
    const token = jwt.sign(
      { id: "7", username: "Ada", role: "webmaster" },
      JWT_SECRET,
    );
    const { req, nextCalled } = run(requireAuth, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(nextCalled).toBe(true);
    expect(req.user).toMatchObject({
      id: "7",
      username: "Ada",
      role: "webadmin",
    });
  });

  it("strips quotes around a role before aliasing", () => {
    const token = jwt.sign(
      { id: "7", username: "Ada", role: '"webmaster"' },
      JWT_SECRET,
    );
    const { req } = run(requireAuth, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(req.user?.role).toBe("webadmin");
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ id: "1", role: "student" }, "other-secret");
    const { res, nextCalled } = run(requireAuth, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});

describe("requireAdmin", () => {
  it("requires an authenticated user", () => {
    const { res, nextCalled } = run(requireAdmin);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Not authenticated" });
  });

  it("blocks a student and allows roles in the admin list", () => {
    const student = run(requireAdmin, {
      user: { id: "1", username: "s", role: "student", iat: 1, exp: 2 },
    });
    expect(student.res.statusCode).toBe(403);
    expect(student.res.body).toEqual({
      error: "Forbidden: admin role required",
      yourRole: "student",
    });

    for (const role of ["faculty", "webadmin", "dean", "admin", "hod"]) {
      const allowed = run(requireAdmin, {
        user: { id: "1", username: "s", role, iat: 1, exp: 2 },
      });
      expect(allowed.nextCalled).toBe(true);
    }
  });
});
