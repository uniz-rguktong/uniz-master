import rateLimit from "express-rate-limit";
import { isLoginRateLimitEnforced } from "@uniz/shared";

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
    attribution: "SreeCharan",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
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
    attribution: "SreeCharan",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
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
    attribution: "SreeCharan",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
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
    attribution: "SreeCharan",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

const FIFTEEN_MIN = 15 * 60 * 1000;

const idOf = (req: any): string =>
  req.body?.username?.toString().trim().toLowerCase() || "anon";

const limitMessage = (code: string) => ({
  success: false,
  message: "Too many attempts. Please try again after 15 minutes.",
  code,
});

// Observe by default: log and let the request through unless
// RATE_LIMIT_MODE=enforce. Many students share campus NAT IPs.
const observeUnlessEnforced =
  (code: string) => (req: any, res: any, next: any, options: any) => {
    if (!isLoginRateLimitEnforced()) {
      console.warn(`[AUTH] rate limit observed: ${code} for ${idOf(req)}`);
      return next();
    }
    res.status(options.statusCode).json(limitMessage(code));
  };

// Failed logins per ID + IP. Successful logins do not count.
export const loginFailureLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  max: 20,
  skipSuccessfulRequests: true,
  keyGenerator: (req: any) => `login_${idOf(req)}_${req.ip}`,
  handler: observeUnlessEnforced("LOGIN_RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

// Per-IP ceiling for login traffic. Generous because a campus NAT IP
// can carry thousands of students at peak.
export const loginIpLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  max: 5000,
  keyGenerator: (req: any) => `login_ip_${req.ip}`,
  handler: observeUnlessEnforced("LOGIN_IP_RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

// Signed-in account actions (password change, admin tools), per ID + IP.
export const accountActionLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  max: 60,
  keyGenerator: (req: any) => `acct_${idOf(req)}_${req.ip}`,
  handler: observeUnlessEnforced("ACCOUNT_RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});
