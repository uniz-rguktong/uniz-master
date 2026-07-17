import axios from "axios";
import { enqueueNotificationJob } from "./queue.util";

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

const sendPush = async (
  username: string,
  title: string,
  body: string,
  type = "SYSTEM",
): Promise<number> => {
  if (process.env.SKIP_PUSH === "true") return 0;
  try {
    // Prefer queue so auth HTTP path never waits on web-push fan-out.
    await enqueueNotificationJob("PUSH", {
      username,
      title,
      body,
      type,
      rawBody: true,
      data: { type },
    });
    return 1;
  } catch (e: any) {
    // Fallback to direct HTTP if Redis/queue is unavailable.
    try {
      const url = `${NOTIFICATION_SERVICE_URL}/internal/push`;
      const res = await axios.post(
        url,
        { username, title, body, type },
        {
          headers: { "x-internal-secret": INTERNAL_SECRET },
          timeout: 5000,
        },
      );
      return res.data?.sent || 0;
    } catch (err: any) {
      console.error(
        `[AUTH] Failed to queue/send push to ${username}:`,
        err.message || e.message,
      );
      return 0;
    }
  }
};

export const sendOtpPush = async (
  username: string,
  otp: string,
): Promise<number> => {
  return await sendPush(
    username,
    "UniZ Security Authentication",
    `Your secure verification code is ${otp}. To maintain account security, this code will remain valid for exactly 10 minutes.`,
    "OTP",
  );
};

export async function resolveProfileEmail(username: string): Promise<string> {
  let email = `${username.toLowerCase()}@rguktong.ac.in`;
  try {
    const rawUserUrl = (
      process.env.USER_SERVICE_URL || "http://localhost:3002"
    ).trim();
    const USER_SERVICE = rawUserUrl.endsWith("/health")
      ? rawUserUrl.slice(0, -7)
      : rawUserUrl;

    const endpoints = [
      `student/${username}`,
      `faculty/${username}`,
      `admin/${username}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const userRes = await axios.get(`${USER_SERVICE}/admin/${endpoint}`, {
          headers: { "x-internal-secret": INTERNAL_SECRET },
          timeout: 2000,
        });
        const data =
          userRes.data?.student ||
          userRes.data?.faculty ||
          userRes.data?.data ||
          userRes.data;
        if (data?.email) {
          email = data.email;
          break;
        }
      } catch {
        // try next
      }
    }
  } catch {
    // keep default campus email
  }
  return email;
}

export const sendOtpEmail = async (
  email: string,
  username: string,
  otp: string,
): Promise<boolean> => {
  try {
    await enqueueNotificationJob("OTP_EMAIL", {
      type: "otp",
      to: email,
      email,
      username,
      otp,
      data: { username, otp },
    });
    return true;
  } catch (error: any) {
    console.error(`[AUTH] Failed to queue OTP email for ${username}:`, {
      error: error.message,
    });
    // Fallback to direct mail HTTP
    try {
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
      return Boolean(res.data?.success);
    } catch (err: any) {
      console.error(`[AUTH] OTP email fallback also failed:`, err.message);
      return false;
    }
  }
};

/** Queue push-first OTP delivery with email fallback in the notification worker. */
export const queueOtpDelivery = async (
  username: string,
  otp: string,
  email?: string,
): Promise<boolean> => {
  try {
    await enqueueNotificationJob("OTP_DELIVER", {
      username,
      otp,
      email: email || `${username.toLowerCase()}@rguktong.ac.in`,
    });
    return true;
  } catch (error: any) {
    console.error(`[AUTH] Failed to queue OTP_DELIVER for ${username}:`, error.message);
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
    "Security Alert: New Login Detected",
    `An access attempt has been successfully identified on your UniZ account${deviceStr}. If you did not authorize this login, please take immediate action to secure your account by reviewing your active sessions and updating your password.`,
    "LOGIN",
  );
  return true;
};

export const sendPasswordChangeNotification = async (
  email: string,
  username: string,
): Promise<boolean> => {
  await sendPush(
    username,
    "Account Security: Password Updated",
    "We are writing to confirm that the password for your UniZ account has been successfully modified. If you did not initiate this change, please contact our administrative support team immediately to report unauthorized activity.",
    "PASSWORD",
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
    "Profile Information Updated",
    `This notification is to confirm that adjustments have been made to your professional profile. The modified fields include: ${updatedFields.join(", ")}.`,
    "PROFILE",
  );
  return true;
};
