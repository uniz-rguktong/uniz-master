import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const src = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src",
);

function read(rel) {
  return fs.readFileSync(path.join(src, rel), "utf8");
}

const banned = [
  "push notification",
  "registered device",
  "registered devices",
  "Resend via Email",
  "Send OTP to my Device",
  "OTP sent to your devices",
  'deliveryMethod === "push"',
  "mail or notifications",
];

describe("password-reset OTP copy", () => {
  const signin = read("pages/auth/CommonSignin.tsx");
  const faculty = read("pages/faculty/dashboard.tsx");

  it("tells the signer the code went to their email", () => {
    for (const phrase of banned) {
      assert.equal(
        signin.toLowerCase().includes(phrase.toLowerCase()),
        false,
        phrase,
      );
    }
    assert.match(signin, /We'll send a 6-digit code to your email\./);
    assert.match(signin, /We sent a 6-digit code to/);
    assert.match(signin, /\{otpEmail\}/);
    assert.match(
      signin,
      /Didn&apos;t get the email\? We can send the code again\./,
    );
    assert.match(signin, /Resend code/);
  });

  it("tells faculty the code went to their email", () => {
    for (const phrase of banned) {
      assert.equal(
        faculty.toLowerCase().includes(phrase.toLowerCase()),
        false,
        phrase,
      );
    }
    assert.match(faculty, /We&apos;ll email a one-time password/);
    assert.match(faculty, /Email me a code/);
    assert.match(
      faculty,
      /Enter the 6-digit code sent to \$\{otpEmail\}\./,
    );
    assert.match(faculty, /We sent a 6-digit code to/);
    assert.match(faculty, /Resend code/);
  });
});

describe("direct publish verification", () => {
  const modal = read("pages/admin/Webadmin/DirectPublishModal.tsx");

  it("already sends the webadmin code by email", () => {
    assert.match(modal, /registered\s+email/i);
    assert.match(modal, /Code sent to/);
    assert.equal(modal.toLowerCase().includes("push"), false);
    assert.equal(modal.toLowerCase().includes("device"), false);
  });
});
