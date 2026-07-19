import { Response } from "express";
import { redis } from "../utils/redis.util";

function minuteKey(username: string, semesterId: string) {
  return `publish-otp:min:${username.toLowerCase()}:${semesterId}`;
}

function hourKey(username: string) {
  return `publish-otp:hour:${username.toLowerCase()}`;
}

/**
 * Rate limits publish verification emails: 2/min per semester, 10/hour per webadmin.
 * Returns false when the response has already been sent (429).
 */
export async function enforcePublishOtpRateLimit(
  username: string,
  semesterId: string,
  res: Response,
): Promise<boolean> {
  try {
    const minK = minuteKey(username, semesterId);
    const minCount = await redis.incr(minK);
    if (minCount === 1) await redis.expire(minK, 60);
    if (minCount > 2) {
      res.status(429).json({
        error:
          "Please wait 60 seconds before requesting another verification code.",
        code: "PUBLISH_OTP_MINUTE_LIMIT",
        retryAfterSeconds: 60,
      });
      return false;
    }

    const hourK = hourKey(username);
    const hourCount = await redis.incr(hourK);
    if (hourCount === 1) await redis.expire(hourK, 3600);
    if (hourCount > 10) {
      res.status(429).json({
        error: "Maximum verification codes per hour reached. Try again later.",
        code: "PUBLISH_OTP_HOUR_LIMIT",
        retryAfterSeconds: 3600,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Publish OTP] Rate limit check failed:", err);
    return true;
  }
}
