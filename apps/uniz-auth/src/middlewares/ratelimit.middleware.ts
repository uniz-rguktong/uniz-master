import rateLimit from "express-rate-limit";
import { API_ATTRIBUTION } from "@uniz/shared";

// Standard Auth limiter (Username-aware to prevent campus IP collisions)
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req: any) =>
    req.body.username?.toString().toLowerCase() || req.ip,
  message: {
    success: false,
    message: "Security threshold exceeded. Please try again after 15 minutes.",
    code: "RATE_LIMIT_EXCEEDED",
    attribution: API_ATTRIBUTION,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

// New email-code requests: 2 per minute per account.
export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  keyGenerator: (req: any) =>
    `otp_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message:
      "Security check: Please wait 60 seconds before requesting another email code.",
    code: "OTP_REQUEST_LIMIT",
    attribution: API_ATTRIBUTION,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

// Email resend limiter. The active code can be emailed again a few times.
export const otpEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2-minute cycle
  max: 4, // up to 4 email codes or resends
  keyGenerator: (req: any) =>
    `email_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message: "Email dispatch limit temporary reached. Please wait 2 minutes.",
    code: "OTP_EMAIL_LIMIT",
    attribution: API_ATTRIBUTION,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

// Global Hourly Safeguard per User
export const otpHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15, // Total 15 email-code requests per hour
  keyGenerator: (req: any) =>
    `hour_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message: "Maximum hourly security requests reached. Try again later.",
    code: "OTP_LIMIT_HOUR",
    attribution: API_ATTRIBUTION,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});
