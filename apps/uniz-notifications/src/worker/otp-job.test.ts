import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { isOtpNotificationJob, processOtpJob } from "./otp-job";

describe("OTP notification jobs", () => {
  it("emails an OTP delivery and does not push", async () => {
    const pushes: unknown[] = [];
    const emails: Array<{ type: string; to: string; otp: string }> = [];

    const result = await processOtpJob(
      "OTP_DELIVER",
      {
        username: "O210008",
        otp: "482910",
        email: "o210008@rguktong.ac.in",
      },
      async (type, to, data) => {
        emails.push({ type, to, otp: String(data.otp || "") });
        return true;
      },
    );

    assert.equal(pushes.length, 0);
    assert.equal(result.deliveryMethod, "email");
    assert.equal(result.sent, true);
    assert.deepEqual(emails, [
      { type: "otp", to: "o210008@rguktong.ac.in", otp: "482910" },
    ]);
  });

  it("emails an OTP_EMAIL job and drops a legacy OTP_PUSH job", async () => {
    const emails: string[] = [];
    const pushed: string[] = [];

    const emailed = await processOtpJob(
      "OTP_EMAIL",
      {
        type: "otp",
        to: "ada@rguktong.ac.in",
        username: "ada",
        otp: "123456",
      },
      async (_type, to) => {
        emails.push(to);
        return true;
      },
    );
    const dropped = await processOtpJob(
      "OTP_PUSH",
      {
        username: "ada",
        title: "UniZ Security Authentication",
        body: "Your secure verification code is 123456.",
        type: "OTP",
      },
      async () => {
        emails.push("should-not-send");
        return true;
      },
    );

    assert.equal(pushed.length, 0);
    assert.deepEqual(emails, ["ada@rguktong.ac.in"]);
    assert.equal(emailed.deliveryMethod, "email");
    assert.equal(dropped.deliveryMethod, "dropped");
    assert.equal(dropped.sent, false);
  });

  it("refuses an OTP delivery that has no email instead of pushing", async () => {
    let emails = 0;
    await assert.rejects(
      () =>
        processOtpJob(
          "OTP_DELIVER",
          { username: "O210008", otp: "482910" },
          async () => {
            emails += 1;
            return true;
          },
        ),
      /push is not used for OTP/,
    );
    assert.equal(emails, 0);
  });

  it("leaves ordinary push jobs to the push worker", () => {
    assert.equal(isOtpNotificationJob("PUSH"), false);
    assert.equal(isOtpNotificationJob("PUSH_BROADCAST"), false);
    assert.equal(isOtpNotificationJob("RESULTS"), false);
    assert.equal(isOtpNotificationJob("OTP_DELIVER"), true);

    const worker = fs.readFileSync(
      path.join(__dirname, "../../src/worker/notification.worker.ts"),
      "utf8",
    );
    assert.equal(
      worker.includes('jobType === "PUSH" || jobType === "OTP_PUSH"'),
      false,
    );
    assert.match(worker, /if \(jobType === "PUSH"\)/);
    assert.match(worker, /processOtpJob/);
    assert.match(worker, /PUSH_BROADCAST/);
  });
});
