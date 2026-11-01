import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../src/utils/token.util";

const SECRET = "unit-test-jwt-key";

describe("signToken and verifyToken", () => {
  const payload = { username: "o210008", role: "student" };

  it("round-trips a payload and expires it in seven days", () => {
    const token = signToken(payload);
    const decoded = jwt.decode(token) as { iat: number; exp: number; username: string };
    expect(verifyToken(token)).toMatchObject(payload);
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("rejects a bad signature, an expired token, and garbage", () => {
    const foreign = jwt.sign(payload, "some-other-key");
    const expired = jwt.sign(payload, SECRET, { expiresIn: -10 });
    expect(verifyToken(foreign)).toBeNull();
    expect(verifyToken(expired)).toBeNull();
    expect(verifyToken("not-a-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
});
