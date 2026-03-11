import rateLimit from "express-rate-limit";

// Standard Auth limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // More reasonable limit
  message: {
    success: false,
    message: "Too many login/OTP attempts, please try again after 15 minutes",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Balanced OTP Minute Limiter (2 per min to allow quick retry)
export const otpMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: {
    success: false,
    message:
      "Security check: Please wait 60 seconds before requesting another code.",
    code: "OTP_LIMIT_MINUTE",
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Balanced OTP Hour Limiter (10 per hour)
export const otpHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Security threshold reached. Please try again after an hour.",
    code: "OTP_LIMIT_HOUR",
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
