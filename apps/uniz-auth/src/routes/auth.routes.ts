import { Router, Request, Response } from "express";
import {
  login,
  studentLogin,
  adminLogin,
  requestOtp,
  requestOtpEmail,
  resetPassword,
  verifyOtp,
  signup,
  toggleSuspension,
  getUserStatus,
  changePassword,
} from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/ratelimit.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { z } from "zod";

const router = Router();

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const OtpRequestSchema = z.object({
  username: z.string(),
});

const OtpVerifySchema = z.object({
  username: z.string(),
  otp: z.string().length(6),
});

const PasswordResetSchema = z.object({
  username: z.string(),
  resetToken: z.string(),
  newPassword: z.string().min(6),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

const SignupSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
  role: z.string().default("student"),
  email: z.string().email().optional(),
});

router.post("/login", rateLimiter, validateRequest(LoginSchema), login); // Keep for compatibility if needed, but better to use specific ones
router.post(
  "/login/student",
  rateLimiter,
  validateRequest(LoginSchema),
  studentLogin,
);
router.post(
  "/login/admin",
  rateLimiter,
  validateRequest(LoginSchema),
  adminLogin,
);
router.post("/signup", validateRequest(SignupSchema), signup);
router.post(
  "/otp/request",
  rateLimiter,
  validateRequest(OtpRequestSchema),
  requestOtp,
);
router.post(
  "/otp/request-email",
  rateLimiter,
  validateRequest(OtpRequestSchema),
  requestOtpEmail,
);
router.post(
  "/otp/verify",
  rateLimiter,
  validateRequest(OtpVerifySchema),
  verifyOtp,
);
router.post(
  "/password/reset",
  rateLimiter,
  validateRequest(PasswordResetSchema),
  resetPassword,
);
router.post(
  "/password/change",
  authMiddleware,
  validateRequest(PasswordChangeSchema),
  changePassword,
);
router.post("/admin/suspend", toggleSuspension);

router.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/internal/user/status/:id", getUserStatus);

export default router;
