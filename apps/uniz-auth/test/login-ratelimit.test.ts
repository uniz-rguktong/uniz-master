import { afterEach, describe, expect, it } from "vitest";
import { LOGIN_FAILURE_LIMIT, LOGIN_LOCKOUT_SECONDS, loginIpFailureKey } from "@uniz/shared";
import {
  guardLoginRateLimit,
  type LoginRateRedis,
} from "../src/utils/login-ratelimit";

class FakeRedis implements LoginRateRedis {
  now = 0;
  private rows = new Map<string, { value: number; expiresAt: number }>();

  async incr(key: string): Promise<number> {
    const row = this.rows.get(key);
    if (!row || row.expiresAt <= this.now) {
      this.rows.set(key, { value: 1, expiresAt: Number.POSITIVE_INFINITY });
      return 1;
    }
    row.value += 1;
    return row.value;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const row = this.rows.get(key);
    if (row) row.expiresAt = this.now + seconds * 1000;
  }

  async get(key: string): Promise<string | null> {
    const row = this.rows.get(key);
    if (!row || row.expiresAt <= this.now) return null;
    return String(row.value);
  }
}

describe("login failure lockout", () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_MODE;
  });

  it("counts failures only", async () => {
    const redis = new FakeRedis();
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.8", "check")).toBe(
      "ok",
    );
    expect(await redis.get("auth:login:lockout:id:o210001")).toBeNull();

    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.8", "fail")).toBe(
      "ok",
    );
    expect(await redis.get("auth:login:lockout:id:o210001")).toBe("1");
    expect(await redis.get(loginIpFailureKey("10.0.0.8"))).toBe("1");

    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.8", "check")).toBe(
      "ok",
    );
    expect(await redis.get("auth:login:lockout:id:o210001")).toBe("1");
  });

  it("locks the id in enforce mode and clears when the window expires", async () => {
    const redis = new FakeRedis();
    process.env.RATE_LIMIT_MODE = "enforce";

    for (let i = 0; i < LOGIN_FAILURE_LIMIT - 1; i += 1) {
      expect(
        await guardLoginRateLimit(redis, "o210001", "10.0.0.9", "fail"),
      ).toBe("ok");
    }
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.9", "fail")).toBe(
      "locked",
    );
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.9", "check")).toBe(
      "locked",
    );

    redis.now += LOGIN_LOCKOUT_SECONDS * 1000 + 1;
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.9", "check")).toBe(
      "ok",
    );
  });

  it("does not block in the default observe mode", async () => {
    const redis = new FakeRedis();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT; i += 1) {
      expect(
        await guardLoginRateLimit(redis, "o210001", "10.0.0.1", "fail"),
      ).toBe("ok");
    }
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.1", "check")).toBe(
      "ok",
    );
  });

  it("lets login continue when redis is down", async () => {
    process.env.RATE_LIMIT_MODE = "enforce";
    const redis: LoginRateRedis = {
      async incr() {
        throw new Error("ECONNREFUSED");
      },
      async expire() {
        throw new Error("ECONNREFUSED");
      },
      async get() {
        throw new Error("ECONNREFUSED");
      },
    };
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.1", "fail")).toBe(
      "ok",
    );
    expect(await guardLoginRateLimit(redis, "o210001", "10.0.0.1", "check")).toBe(
      "ok",
    );
  });

  it("does not lock load-test accounts", async () => {
    process.env.RATE_LIMIT_MODE = "enforce";
    const redis = new FakeRedis();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT + 2; i += 1) {
      expect(
        await guardLoginRateLimit(redis, "LOAD_TEST_STU_001", "10.0.0.1", "fail"),
      ).toBe("ok");
    }
    expect(await redis.get("auth:login:lockout:id:load_test_stu_001")).toBeNull();
  });
});
