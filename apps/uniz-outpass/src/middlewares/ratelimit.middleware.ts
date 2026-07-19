import rateLimit from "express-rate-limit";

export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // realistic per-IP cap for outpass/outing submissions
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
