import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/prisma", () => ({ prisma: {} }));
vi.mock("../src/utils/redis.util", () => ({
  redis: { get: vi.fn(), setex: vi.fn(), del: vi.fn() },
}));
vi.mock("../src/utils/queue.util", () => ({
  enqueueNotificationJob: vi.fn(),
}));
vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe("production startup guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("refuses to sign tokens in production without a jwt key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECURITY_KEY", "");
    await expect(import("../src/utils/token.util")).rejects.toThrow(
      "JWT_SECURITY_KEY is required in production",
    );
  });

  it("refuses to boot auth middleware in production without its secrets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECURITY_KEY", "");
    vi.stubEnv("INTERNAL_SECRET", "unit-test-internal");
    await expect(import("../src/middlewares/auth.middleware")).rejects.toThrow(
      "JWT_SECURITY_KEY is required in production",
    );

    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECURITY_KEY", "unit-test-jwt-key");
    vi.stubEnv("INTERNAL_SECRET", "");
    await expect(import("../src/middlewares/auth.middleware")).rejects.toThrow(
      "INTERNAL_SECRET is required in production",
    );
  });

  it("refuses to load mail helpers in production without an internal secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INTERNAL_SECRET", "");
    await expect(import("../src/utils/email.util")).rejects.toThrow(
      "INTERNAL_SECRET is required in production",
    );
  });
});
