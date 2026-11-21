import { OTP_CHANNEL_EMAIL, type IssuedOtp } from "./otp-delivery";
import { isIssuedPasswordTemplate } from "./password.util";

export const FIRST_LOGIN_OTP_COOLDOWN_MS = 60 * 1000;

export const FIRST_LOGIN_EMAIL_MISSING_MESSAGE =
  "No email address is on file for this account. Contact webadmin to add one before you can set a password.";

export type FirstLoginDecision = {
  ok: boolean;
  code?: string;
  message?: string;
};

/**
 * The forced password change checks the email code in the same request.
 * A missing, wrong, or expired code never updates the password.
 */
export function assessFirstLoginPasswordChange(input: {
  otp: string | null | undefined;
  row: IssuedOtp | null | undefined;
  now: Date;
  newPassword: string;
  username: string;
}): FirstLoginDecision {
  if (isIssuedPasswordTemplate(input.newPassword, input.username)) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Choose a password that is not the issued campus password.",
    };
  }
  const submitted = String(input.otp ?? "").trim();
  if (!/^\d{6}$/.test(submitted)) {
    return {
      ok: false,
      code: "OTP_REQUIRED",
      message: "Enter the code sent to your email.",
    };
  }
  const row = input.row;
  if (
    !row ||
    row.otp !== submitted ||
    row.channel !== OTP_CHANNEL_EMAIL ||
    row.consumedAt
  ) {
    return {
      ok: false,
      code: "OTP_INVALID",
      message: "That code is not valid.",
    };
  }
  if (
    !(row.expiresAt instanceof Date) ||
    Number.isNaN(row.expiresAt.getTime()) ||
    row.expiresAt.getTime() <= input.now.getTime()
  ) {
    return {
      ok: false,
      code: "OTP_EXPIRED",
      message: "That code has expired. Request a new one.",
    };
  }
  return { ok: true };
}

/** Seconds remaining before another first-login code may be sent. */
export function firstLoginOtpCooldownSeconds(
  createdAt: Date | null | undefined,
  now: Date,
  cooldownMs = FIRST_LOGIN_OTP_COOLDOWN_MS,
): number {
  if (!createdAt || Number.isNaN(createdAt.getTime())) return 0;
  const remain = createdAt.getTime() + cooldownMs - now.getTime();
  if (remain <= 0) return 0;
  return Math.ceil(remain / 1000);
}
