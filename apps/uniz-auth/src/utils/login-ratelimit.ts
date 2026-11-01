import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_LOCKOUT_SECONDS,
  isLoadTestAccount,
  isLoginRateLimitEnforced,
  loginIdLockoutKey,
  loginIpFailureKey,
} from "@uniz/shared";

export type LoginRateRedis = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
};

export async function readLoginLockout(
  redis: LoginRateRedis,
  id: string,
): Promise<{ locked: boolean; failures: number }> {
  const raw = await redis.get(loginIdLockoutKey(id));
  const failures = raw ? Number(raw) : 0;
  const count = Number.isFinite(failures) ? failures : 0;
  return { locked: count >= LOGIN_FAILURE_LIMIT, failures: count };
}

export async function recordLoginFailure(
  redis: LoginRateRedis,
  id: string,
  ip: string,
): Promise<{ idFailures: number; ipFailures: number; locked: boolean }> {
  const idKey = loginIdLockoutKey(id);
  const ipKey = loginIpFailureKey(ip);
  const idFailures = await redis.incr(idKey);
  if (idFailures === 1) {
    await redis.expire(idKey, LOGIN_LOCKOUT_SECONDS);
  }
  const ipFailures = await redis.incr(ipKey);
  if (ipFailures === 1) {
    await redis.expire(ipKey, LOGIN_LOCKOUT_SECONDS);
  }
  return {
    idFailures,
    ipFailures,
    locked: idFailures >= LOGIN_FAILURE_LIMIT,
  };
}

/**
 * Check or record a login failure.
 * Redis down: login continues. Observe mode (the default) never blocks.
 * LOAD_TEST_* accounts are exempt so synthetic runs do not lock or flag them.
 */
export async function guardLoginRateLimit(
  redis: LoginRateRedis,
  id: string,
  ip: string,
  phase: "check" | "fail",
): Promise<"ok" | "locked"> {
  if (!id || isLoadTestAccount(id)) return "ok";
  try {
    const status =
      phase === "fail"
        ? await recordLoginFailure(redis, id, ip)
        : await readLoginLockout(redis, id);
    if (!status.locked) return "ok";
    if (isLoginRateLimitEnforced()) return "locked";
    console.warn(
      `[AUTH] login lockout observed for ${id}; RATE_LIMIT_MODE is not enforce`,
    );
    return "ok";
  } catch (err) {
    const message = err instanceof Error ? err.message : "redis error";
    console.error(
      `[AUTH] Redis unavailable, login rate limit skipped: ${message}`,
    );
    return "ok";
  }
}
