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
): Promise<boolean> => {
  try {
    console.log(
      `Attempting to send Login notification via: ${MAIL_SERVICE_URL}/send`,
    );
    const res = await axios.post(
      `${MAIL_SERVICE_URL}/send`,
      {
        type: "login_alert",
        to: email,
        data: { username, ip: ipAddress },
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        timeout: 5000,
      },
    );
    console.log(
      `[AUTH] Login notification response: status=${res.status}, success=${res.data.success}`,
    );
    return res.data.success;
  } catch (error: any) {
    console.error(`Failed to send login notification via Mail Service:`, {
      url: `${MAIL_SERVICE_URL}/send`,
      error: error.message,
      code: error.code,
      response: error.response?.data,
    });
    return false;
  }
};

export const sendPasswordChangeNotification = async (
  email: string,
  username: string,
): Promise<boolean> => {
  try {
    console.log(
      `Attempting to send Password Change notification via: ${MAIL_SERVICE_URL}/send`,
    );
    const res = await axios.post(
      `${MAIL_SERVICE_URL}/send`,
      {
        type: "password_change",
        to: email,
        data: { username },
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
      },
    );
    return res.data.success;
  } catch (error: any) {
    console.error(
      `Failed to send password change notification via Mail Service:`,
      {
        url: `${MAIL_SERVICE_URL}/send`,
        error: error.message,
        response: error.response?.data,
      },
    );
    return false;
  }
};

export const sendProfileUpdateNotification = async (
  email: string,
  username: string,
  updatedFields: string[],
): Promise<boolean> => {
  try {
    console.log(
      `Attempting to send Profile Update notification via: ${MAIL_SERVICE_URL}/send`,
    );
    const res = await axios.post(
      `${MAIL_SERVICE_URL}/send`,
      {
        type: "profile_update",
        to: email,
        data: { username, updatedFields },
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
      },
    );
    return res.data.success;
  } catch (error: any) {
    console.error(
      `Failed to send profile update notification via Mail Service:`,
      {
        url: `${MAIL_SERVICE_URL}/send`,
        error: error.message,
        response: error.response?.data,
      },
    );
    return false;
  }
};
