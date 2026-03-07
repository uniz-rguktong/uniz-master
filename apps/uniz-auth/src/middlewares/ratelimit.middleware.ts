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

// Aggressive OTP Minute Limiter (1 per min)
export const otpMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: {
    success: false,
    message: "Please wait 60 seconds before requesting another OTP.",
    code: "OTP_LIMIT_MINUTE",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aggressive OTP Hour Limiter (3 per hour)
export const otpHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Daily limit reached for OTP requests. Try again per hour.",
    code: "OTP_LIMIT_HOUR",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
