import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  OTP_CHANNEL_EMAIL,
  OTP_EMAIL_MISSING_MESSAGE,
  OTP_TTL_MS,
  chooseOtpEmail,
  deliverEmailOtp,
  isEmailOtpAcceptable,
  maskEmailAddress,
  planEmailOtp,
} from "./otp-delivery";

describe("email OTP delivery", () => {
  it("sends the code to the profile email and does not push", async () => {
    const pushes: string[] = [];
    const emails: Array<{ email: string; username: string; otp: string }> =
      [];
    const address = chooseOtpEmail(
      "Student.Name@rguktong.ac.in",
      "O210008",
    );

    const result = await deliverEmailOtp(
      { email: address, username: "O210008", otp: "482910" },
      async (email, username, otp) => {
        emails.push({ email, username, otp });
        return true;
      },
    );

    assert.equal(pushes.length, 0);
    assert.equal(emails.length, 1);
    assert.deepEqual(emails[0], {
      email: "student.name@rguktong.ac.in",
      username: "O210008",
      otp: "482910",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.deliveryMethod, "email");
    assert.equal(result.email, "st**********@rguktong.ac.in");
    assert.match(
      result.message,
      /sent to st\*\*\*\*\*\*\*\*\*\*@rguktong\.ac\.in/,
    );
    assert.equal(result.message.toLowerCase().includes("push"), false);
    assert.equal(result.message.toLowerCase().includes("device"), false);
  });

  it("uses the campus mailbox when the profile email is blank", async () => {
    let called = 0;
    const address = chooseOtpEmail("  ", "O210008");
    const result = await deliverEmailOtp(
      { email: address, username: "O210008", otp: "111111" },
      async (email) => {
        called += 1;
        assert.equal(email, "o210008@rguktong.ac.in");
        return true;
      },
    );
    assert.equal(called, 1);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.maskedEmail, "o2*****@rguktong.ac.in");
  });

  it("returns a clear error and sends nothing when no email is on file", async () => {
    let emails = 0;
    const pushes: string[] = [];
    const address = chooseOtpEmail("", "   ");
    const result = await deliverEmailOtp(
      { email: address, username: "   ", otp: "111111" },
      async () => {
        emails += 1;
        return true;
      },
    );
    assert.equal(emails, 0);
    assert.equal(pushes.length, 0);
    assert.deepEqual(result, {
      ok: false,
      status: 400,
      code: "OTP_EMAIL_MISSING",
      message: OTP_EMAIL_MISSING_MESSAGE,
    });
  });

  it("does not fall back to another channel when email sending fails", async () => {
    const result = await deliverEmailOtp(
      { email: "ada@rguktong.ac.in", username: "ada", otp: "222222" },
      async () => false,
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 502);
    assert.equal(result.code, "OTP_EMAIL_FAILED");
    assert.match(result.message, /email/i);
    assert.equal(result.message.toLowerCase().includes("push"), false);
  });

  it("masks the local part and keeps the domain", () => {
    assert.equal(
      maskEmailAddress("ab@rguktong.ac.in"),
      "ab*@rguktong.ac.in",
    );
    assert.equal(chooseOtpEmail("not-an-email", ""), null);
    const plan = planEmailOtp("webadmin@rguktong.ac.in", "webadmin");
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.channel, OTP_CHANNEL_EMAIL);
    assert.equal(plan.email, "webadmin@rguktong.ac.in");
  });
});

describe("email OTP verification", () => {
  const now = new Date("2026-11-21T07:50:00.000Z");

  function row(
    overrides: Partial<{
      channel: string | null;
      otp: string;
      expiresAt: Date;
      consumedAt: Date | null;
    }> = {},
  ) {
    return {
      channel: OTP_CHANNEL_EMAIL,
      otp: "482910",
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      consumedAt: null,
      ...overrides,
    };
  }

  it("accepts a matching unexpired email code", () => {
    assert.equal(isEmailOtpAcceptable(row(), "482910", now), true);
  });

  it("rejects push-issued, expired, consumed, and wrong codes", () => {
    assert.equal(
      isEmailOtpAcceptable(row({ channel: "push" }), "482910", now),
      false,
    );
    assert.equal(
      isEmailOtpAcceptable(row({ channel: null }), "482910", now),
      false,
    );
    assert.equal(
      isEmailOtpAcceptable(
        row({ expiresAt: new Date(now.getTime() - 1) }),
        "482910",
        now,
      ),
      false,
    );
    assert.equal(
      isEmailOtpAcceptable(row({ consumedAt: now }), "482910", now),
      false,
    );
    assert.equal(isEmailOtpAcceptable(row(), "000000", now), false);
    assert.equal(isEmailOtpAcceptable(null, "482910", now), false);
  });

  it("keeps the ten-minute expiry", () => {
    assert.equal(OTP_TTL_MS, 10 * 60 * 1000);
    assert.equal(
      isEmailOtpAcceptable(
        row({ expiresAt: new Date(now.getTime() + OTP_TTL_MS) }),
        "482910",
        now,
      ),
      true,
    );
    assert.equal(
      isEmailOtpAcceptable(
        row({ expiresAt: new Date(now.getTime()) }),
        "482910",
        now,
      ),
      false,
    );
  });
});

describe("OTP push removal", () => {
  const srcRoot = path.join(__dirname, "../../src");

  it("auth no longer queues or sends an OTP push", () => {
    const emailUtil = fs.readFileSync(
      path.join(srcRoot, "utils/email.util.ts"),
      "utf8",
    );
    const controller = fs.readFileSync(
      path.join(srcRoot, "controllers/auth.controller.ts"),
      "utf8",
    );
    const routes = fs.readFileSync(
      path.join(srcRoot, "routes/auth.routes.ts"),
      "utf8",
    );
    assert.equal(emailUtil.includes("sendOtpPush"), false);
    assert.equal(emailUtil.includes("OTP_DELIVER"), false);
    assert.equal(emailUtil.includes('enqueueNotificationJob("OTP_EMAIL"'), true);
    assert.equal(controller.includes("sendOtpPush"), false);
    assert.equal(controller.includes("queueOtpDelivery"), false);
    assert.equal(controller.includes("deliverEmailOtp"), true);
    assert.equal(controller.includes("OTP_CHANNEL_EMAIL"), true);
    assert.equal(controller.includes("isEmailOtpAcceptable"), true);
    assert.equal(routes.includes("otpPushLimiter"), false);
    assert.equal(routes.includes("otpRequestLimiter"), true);
  });
});
