import rateLimit from "express-rate-limit";

// Strict limiter for Auth endpoints (Login, OTP)
// 10 attempts per 15 minutes window
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    success: false,
    message: "Too many login/OTP attempts, please try again after 15 minutes",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
