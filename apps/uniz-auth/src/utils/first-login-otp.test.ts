import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OTP_CHANNEL_EMAIL, OTP_TTL_MS } from "./otp-delivery";
import {
  assessFirstLoginPasswordChange,
  firstLoginOtpCooldownSeconds,
} from "./first-login-otp";

const now = new Date("2026-11-21T10:00:00.000Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    channel: OTP_CHANNEL_EMAIL,
    otp: "482910",
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    consumedAt: null,
    ...overrides,
  };
}

describe("first-login password change", () => {
  it("rejects a change that has no email code", () => {
    const decision = assessFirstLoginPasswordChange({
      otp: "",
      row: row(),
      now,
      newPassword: "correct-horse",
      username: "ravi.kumar",
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.code, "OTP_REQUIRED");
  });

  it("rejects a wrong email code", () => {
    const decision = assessFirstLoginPasswordChange({
      otp: "000000",
      row: row(),
      now,
      newPassword: "correct-horse",
      username: "ravi.kumar",
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.code, "OTP_INVALID");
  });

  it("rejects an expired email code", () => {
    const decision = assessFirstLoginPasswordChange({
      otp: "482910",
      row: row({ expiresAt: new Date(now.getTime() - 1000) }),
      now,
      newPassword: "correct-horse",
      username: "ravi.kumar",
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.code, "OTP_EXPIRED");
  });

  it("accepts a current email code with a new password", () => {
    const decision = assessFirstLoginPasswordChange({
      otp: "482910",
      row: row(),
      now,
      newPassword: "correct-horse",
      username: "ravi.kumar",
    });
    assert.equal(decision.ok, true);
  });

  it("rejects the issued campus password even when the code is valid", () => {
    const decision = assessFirstLoginPasswordChange({
      otp: "482910",
      row: row(),
      now,
      newPassword: "ravi.kumar@rguktong",
      username: "ravi.kumar",
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.code, "VALIDATION_ERROR");
  });

  it("waits a minute before another code can be sent", () => {
    const created = new Date(now.getTime() - 20_000);
    assert.equal(firstLoginOtpCooldownSeconds(created, now), 40);
    assert.equal(
      firstLoginOtpCooldownSeconds(new Date(now.getTime() - 60_000), now),
      0,
    );
  });
});
