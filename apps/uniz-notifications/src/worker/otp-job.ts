export type OtpEmailSender = (
  type: string,
  to: string,
  data: Record<string, unknown>,
) => Promise<boolean>;

export type OtpJobResult = {
  deliveryMethod: "email" | "dropped";
  sent: boolean;
  to?: string;
};

function readOtp(data: Record<string, unknown>): string {
  const nested = data.data;
  const fromNested =
    nested && typeof nested === "object"
      ? String((nested as Record<string, unknown>).otp || "")
      : "";
  return String(data.otp || fromNested || "");
}

function readEmail(data: Record<string, unknown>): string {
  return String(data.to || data.email || "").trim();
}

/**
 * OTP queue jobs. Push is not a delivery option: OTP_PUSH is dropped, and
 * OTP_DELIVER / OTP_EMAIL go to the mail provider only.
 */
export async function processOtpJob(
  jobType: string,
  data: Record<string, unknown>,
  dispatchEmailByType: OtpEmailSender,
): Promise<OtpJobResult> {
  if (jobType === "OTP_PUSH") {
    return { deliveryMethod: "dropped", sent: false };
  }

  if (jobType !== "OTP_DELIVER" && jobType !== "OTP_EMAIL") {
    throw new Error(`processOtpJob received a non-OTP job: ${jobType}`);
  }

  const username = String(data.username || "");
  const otp = readOtp(data);
  const email = readEmail(data);
  if (!email || !email.includes("@")) {
    throw new Error(
      `${jobType} requires an email address; push is not used for OTP`,
    );
  }
  if (jobType === "OTP_DELIVER" && (!username || !otp)) {
    throw new Error("OTP_DELIVER requires username and otp");
  }
  if (jobType === "OTP_EMAIL" && !otp) {
    throw new Error("OTP_EMAIL requires otp");
  }

  const ok = await dispatchEmailByType("otp", email, {
    ...data,
    username,
    otp,
    type: "otp",
  });
  if (!ok) {
    throw new Error(`OTP email failed for ${email}`);
  }
  return { deliveryMethod: "email", sent: true, to: email };
}

export function isOtpNotificationJob(jobType: string): boolean {
  return (
    jobType === "OTP_EMAIL" ||
    jobType === "OTP_DELIVER" ||
    jobType === "OTP_PUSH"
  );
}
