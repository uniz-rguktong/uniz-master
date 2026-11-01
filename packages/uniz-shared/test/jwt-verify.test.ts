import { describe, expect, it } from "vitest";
import { parseJwtPayload } from "../src/jwt-verify";
import { ErrorCode } from "../src/error-codes";

describe("parseJwtPayload", () => {
  it("accepts a minimal valid payload", () => {
    const res = parseJwtPayload({
      username: "o210008",
      role: "student",
      iat: 1,
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.username).toBe("o210008");
  });

  it("accepts roles outside the enum", () => {
    expect(parseJwtPayload({ username: "x", role: "admin" }).ok).toBe(true);
  });

  it("rejects payloads without a username", () => {
    const res = parseJwtPayload({ role: "student" });
    expect(res).toEqual({
      ok: false,
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message: "Invalid token structure",
    });
  });

  it("rejects non objects and wrong types", () => {
    expect(parseJwtPayload(null).ok).toBe(false);
    expect(parseJwtPayload("token").ok).toBe(false);
    expect(
      parseJwtPayload({ username: "x", role: "student", exp: "soon" }).ok,
    ).toBe(false);
  });
});
