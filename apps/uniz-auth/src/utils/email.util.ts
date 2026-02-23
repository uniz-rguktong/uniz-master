import axios from "axios";

const GATEWAY_URL =
  process.env.GATEWAY_URL ||
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : "http://localhost:3000/api/v1");
// Sanitize MAIL_SERVICE_URL to remove trailing '/health' if present
const rawMailUrl = (
  process.env.MAIL_SERVICE_URL || `${GATEWAY_URL}/mail`
).trim();
const MAIL_SERVICE_URL = rawMailUrl.endsWith("/health")
  ? rawMailUrl.slice(0, -7)
  : rawMailUrl;

const SECRET = (process.env.INTERNAL_SECRET || "").trim();
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("INTERNAL_SECRET is required in production");
}
const INTERNAL_SECRET = SECRET || "uniz-core";

const NOTIFICATION_SERVICE_URL = (
  process.env.NOTIFICATION_SERVICE_URL || `${GATEWAY_URL}/notifications`
)
  .trim()
  .replace(/\/health$/, "");

const sendPush = async (username: string, title: string, body: string) => {
  if (process.env.SKIP_PUSH === "true") return;
  try {
    const url = `${NOTIFICATION_SERVICE_URL}/push/send`;
    await axios.post(
      url,
      {
        target: "user",
        username: username,
        title,
        body,
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        timeout: 5000,
      },
    );
    console.log(`[AUTH] Successfully sent push notification to: ${username}`);
  } catch (e: any) {
    console.error(
      `[AUTH] Failed to send push notification to ${username}:`,
      e.message,
    );
  }
};

export const sendOtpEmail = async (
  email: string,
  username: string,
  otp: string,
): Promise<boolean> => {
  try {
    console.log(`Attempting to send OTP email via: ${MAIL_SERVICE_URL}/send`);
    const res = await axios.post(
      `${MAIL_SERVICE_URL}/send`,
      {
        type: "otp",
        to: email,
        data: { username, otp },
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        timeout: 5000,
      },
    );
    console.log(
      `[AUTH] OTP mail response: status=${res.status}, success=${res.data.success}`,
    );
    return res.data.success;
  } catch (error: any) {
    console.error(`Failed to send OTP email via Mail Service:`, {
      url: `${MAIL_SERVICE_URL}/send`,
      error: error.message,
      code: error.code,
      response: error.response?.data,
    });
    return false;
  }
};

export const sendLoginNotification = async (
  email: string,
  username: string,
  ipAddress?: string,
  deviceInfo?: string,
): Promise<boolean> => {
  const deviceStr =
    deviceInfo && deviceInfo !== "Unknown Browser on Unknown OS"
      ? ` using ${deviceInfo}`
      : "";
  await sendPush(
    username,
    "New Login Detected",
    `A new login was detected${deviceStr}. If this wasn't you, please secure your account immediately.`,
  );
  return true;
};

export const sendPasswordChangeNotification = async (
  email: string,
  username: string,
): Promise<boolean> => {
  await sendPush(
    username,
    "Password Changed",
    "Your account password was successfully updated. If you did not perform this action, contact support immediately.",
  );
  return true;
};

export const sendProfileUpdateNotification = async (
  email: string,
  username: string,
  updatedFields: string[],
): Promise<boolean> => {
  await sendPush(
    username,
    "Profile Updated",
    `Your profile has been updated. Changed fields: ${updatedFields.join(", ")}.`,
  );
  return true;
};
