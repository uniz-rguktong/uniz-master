import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../src/utils/token.util";

describe("signToken / verifyToken", () => {
  it("signs a 7 day token when exp is omitted and verifies it", () => {
    const token = signToken({ username: "o210008", role: "student" });
    const payload = verifyToken(token);
    expect(payload?.username).toBe("o210008");
    expect(payload?.role).toBe("student");
    expect(typeof payload?.exp).toBe("number");
  });

  it("keeps a caller supplied exp", () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = signToken({
      username: "o210008",
      role: "student",
      exp,
    });
    expect(verifyToken(token)?.exp).toBe(exp);
  });

  it("returns null for a bad token", () => {
    expect(verifyToken("not-a-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
});
