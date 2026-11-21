import { institutionalEmail } from "@uniz/shared";

/** Password-reset codes are issued on this channel only. */
export const OTP_CHANNEL_EMAIL = "email" as const;

/** Codes expire ten minutes after they are issued. */
export const OTP_TTL_MS = 10 * 60 * 1000;

export const OTP_EMAIL_MISSING_MESSAGE =
  "No email address is on file for this account. Codes are sent by email only.";

export const OTP_EMAIL_FAILED_MESSAGE =
  "Could not send the verification code to your email. Please try again.";

export function isDeliverableEmail(value: string | null | undefined): boolean {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain || !domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

/**
 * A stored profile address wins. When that field is blank, the campus mailbox
 * (username@rguktong.ac.in) is the address auth already uses for the account.
 * If neither is deliverable, there is no email on file.
 */
export function chooseOtpEmail(
  profileEmail: string | null | undefined,
  username: string,
): string | null {
  const profile = String(profileEmail ?? "")
    .trim()
    .toLowerCase();
  if (isDeliverableEmail(profile)) return profile;
  const campus = institutionalEmail(username);
  if (isDeliverableEmail(campus)) return campus;
  return null;
}

export function maskEmailAddress(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  const hidden = Math.max(local.length - visible.length, 1);
  return `${visible}${"*".repeat(hidden)}@${domain}`;
}

export type EmailOtpPlan =
  | {
      ok: true;
      email: string;
      maskedEmail: string;
      channel: typeof OTP_CHANNEL_EMAIL;
      message: string;
    }
  | {
      ok: false;
      status: 400;
      code: "OTP_EMAIL_MISSING";
      message: string;
    };

export function planEmailOtp(
  profileEmail: string | null | undefined,
  username: string,
): EmailOtpPlan {
  const email = chooseOtpEmail(profileEmail, username);
  if (!email) {
    return {
      ok: false,
      status: 400,
      code: "OTP_EMAIL_MISSING",
      message: OTP_EMAIL_MISSING_MESSAGE,
    };
  }
  const maskedEmail = maskEmailAddress(email);
  return {
    ok: true,
    email,
    maskedEmail,
    channel: OTP_CHANNEL_EMAIL,
    message: `Security code sent to ${maskedEmail}.`,
  };
}

export type EmailOtpDelivery =
  | {
      ok: true;
      deliveryMethod: "email";
      email: string;
      maskedEmail: string;
      message: string;
    }
  | {
      ok: false;
      status: 400 | 502;
      code: "OTP_EMAIL_MISSING" | "OTP_EMAIL_FAILED";
      message: string;
    };

/**
 * Send a password-reset code to an address already chosen by planEmailOtp.
 * There is no push argument: a missing or failed email send is an error.
 */
export async function deliverEmailOtp(
  input: { email: string | null; username: string; otp: string },
  sendEmail: (
    email: string,
    username: string,
    otp: string,
  ) => Promise<boolean>,
): Promise<EmailOtpDelivery> {
  if (!isDeliverableEmail(input.email)) {
    return {
      ok: false,
      status: 400,
      code: "OTP_EMAIL_MISSING",
      message: OTP_EMAIL_MISSING_MESSAGE,
    };
  }
  const email = String(input.email).trim().toLowerCase();
  const sent = await sendEmail(email, input.username, input.otp);
  if (!sent) {
    return {
      ok: false,
      status: 502,
      code: "OTP_EMAIL_FAILED",
      message: OTP_EMAIL_FAILED_MESSAGE,
    };
  }
  const maskedEmail = maskEmailAddress(email);
  return {
    ok: true,
    deliveryMethod: "email",
    email: maskedEmail,
    maskedEmail,
    message: `Security code sent to ${maskedEmail}.`,
  };
}

export type IssuedOtp = {
  channel?: string | null;
  otp: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

/** Accept only an unconsumed, unexpired code that was issued for email. */
export function isEmailOtpAcceptable(
  row: IssuedOtp | null | undefined,
  submitted: string,
  now: Date,
): boolean {
  if (!row) return false;
  if (row.channel !== OTP_CHANNEL_EMAIL) return false;
  if (row.consumedAt) return false;
  if (
    !(row.expiresAt instanceof Date) ||
    Number.isNaN(row.expiresAt.getTime()) ||
    row.expiresAt.getTime() <= now.getTime()
  ) {
    return false;
  }
  return row.otp === submitted;
}
