import jwt from "jsonwebtoken";

export const JWT_SECRET = "unit-test-jwt-secret";
export const INTERNAL_SECRET = "unit-test-internal";

export function bearer(overrides: Record<string, unknown> = {}) {
  const token = jwt.sign(
    {
      id: "user-1",
      username: "O210001",
      role: "student",
      ...overrides,
    },
    JWT_SECRET,
  );
  return { authorization: `Bearer ${token}` };
}
