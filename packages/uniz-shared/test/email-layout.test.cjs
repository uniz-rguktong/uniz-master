"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { previewCampusEmails } = require("../dist/email-messages.js");
const { UNIZ_EMAIL_LOGO_URL } = require("../dist/email-layout.js");

describe("campus email layout", () => {
  const samples = previewCampusEmails();

  it("renders every outbound template with the wordmark, footer, and a plain alternative", () => {
    const ids = samples.map((sample) => sample.id);
    assert.deepEqual(ids, [
      "otp",
      "login_alert",
      "outpass_request",
      "outing_request",
      "outpass_approval",
      "outing_approval",
      "checkpoint",
      "results",
      "attendance_report",
      "admin_alert",
      "grievance_submission",
      "grievance_resolved",
      "grievance_closed",
      "admin_action_confirmation",
      "password_change",
      "profile_update",
      "plain_notice",
    ]);
    for (const sample of samples) {
      assert.match(sample.html, /alt="uniZ"/);
      assert.match(
        sample.html,
        new RegExp(UNIZ_EMAIL_LOGO_URL.replace(/[.]/g, "\\.")),
      );
      assert.match(sample.html, /#0b1b3a/);
      assert.match(
        sample.html,
        /Rajiv Gandhi University of Knowledge Technologies, Ongole/,
      );
      assert.match(sample.html, /You got this because /);
      assert.match(sample.text, /You got this because /);
      assert.equal(sample.html.includes("<style"), false);
      assert.equal(/api[_-]?key|BEGIN PRIVATE/i.test(sample.html), false);
    }
  });

  it("shows the OTP large and monospaced, with its expiry", () => {
    const otp = samples.find((sample) => sample.id === "otp");
    assert.match(otp.html, /Courier New/);
    assert.match(otp.html, /482910/);
    assert.match(otp.html, /10 minutes/);
    assert.match(otp.subject, /482910/);
    assert.match(otp.text, /482910/);
  });

  it("keeps one primary button and the existing results link", () => {
    const results = samples.find((sample) => sample.id === "results");
    assert.equal((results.html.match(/<a /g) || []).length, 1);
    assert.match(results.html, /https:\/\/uniz\.sreecharandesu\.in/);
    const otp = samples.find((sample) => sample.id === "otp");
    assert.equal(otp.html.includes("<a "), false);
  });
});
