import rateLimit from "express-rate-limit";

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
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Push-First OTP Limiter (2/min per user)
export const otpPushLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  keyGenerator: (req: any) =>
    `push_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message:
      "Security check: Please wait 60 seconds before requesting another push code.",
    code: "OTP_PUSH_LIMIT",
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email-Manual OTP Limiter (More relaxed to allow resends/fallbacks)
export const otpEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2-minute cycle
  max: 4, // up to 4 email codes or resends
  keyGenerator: (req: any) =>
    `email_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message: "Email dispatch limit temporary reached. Please wait 2 minutes.",
    code: "OTP_EMAIL_LIMIT",
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global Hourly Safeguard per User
export const otpHourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15, // Total 15 across any channel per hour
  keyGenerator: (req: any) =>
    `hour_${req.body.username?.toString().toLowerCase() || req.ip}`,
  message: {
    success: false,
    message: "Maximum hourly security requests reached. Try again later.",
    code: "OTP_LIMIT_HOUR",
    attribution: "SABER",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
