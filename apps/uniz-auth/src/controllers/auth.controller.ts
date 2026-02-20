import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { signToken, verifyToken } from "../utils/token.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { redis } from "../utils/redis.util";
import {
  sendOtpEmail,
  sendLoginNotification,
  sendPasswordChangeNotification,
} from "../utils/email.util";
import { comparePassword, hashPassword } from "../utils/password.util";
import { ErrorCode } from "../shared/error-codes";
import { UserRole } from "../shared/roles.enum";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});


export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!user) {
      return res.status(401).json({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: "Invalid username or password",
      });
    }

    if (user.isDisabled) {
      console.warn(
        `[AUTH-LOGIN] ⛔ Login blocked for suspended user: ${user.username}`,
      );
      return res.status(403).json({
        code: "AUTH_SUSPENDED",
        message:
          "Your account is currently suspended. Please contact the administrator for assistance.",
      });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: "Invalid username or password",
      });
    }

    const normalizedUsername = user.username.toUpperCase();

    const token = signToken({
      id: user.id,
      username: normalizedUsername,
      role: user.role as UserRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });

    const response: any = {
      success: true,
      token,
      role: user.role,
      username: normalizedUsername,
    };

    if (user.role === UserRole.STUDENT) {
      response.student_token = token;
    } else if (user.role !== UserRole.HOD && user.role !== UserRole.TEACHER) {
      response.admin_token = token;
    }

    // Send login notification (Backgrounded for latency optimization)
    const email = `${normalizedUsername.toLowerCase()}@rguktong.ac.in`;
    sendLoginNotification(
      email,
      normalizedUsername,
      req.ip || "Unknown IP",
    ).catch((err) => {
      console.error("[AUTH] Background login notification failed:", err);
    });

    return res.json(response);
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unable to login at the moment. Please try again later.",
    });
  }
};

export const studentLogin = login;
export const adminLogin = login;

export const requestOtp = async (req: Request, res: Response) => {
  const username = String(req.body.username || "").toUpperCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    const user = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "User not found",
      });
    }

    // Rate Limiting
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for last OTP request time (for 60s delay)
    const lastOtp = await prisma.otpLog.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    });

    if (lastOtp && lastOtp.createdAt > oneMinuteAgo) {
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    // Check for hourly limit
    const hourlyRequests = await prisma.otpLog.count({
      where: {
        username: { equals: username, mode: "insensitive" },
        createdAt: { gt: oneHourAgo },
      },
    });

    if (hourlyRequests >= 100) {
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many OTP requests. Please try again later.",
      });
    }

    await prisma.otpLog.create({
      data: { username, otp, expiresAt },
    });

    // Try to get email from user service first
    let email = `${username.toLowerCase()}@rguktong.ac.in`;
    try {
      const rawUserUrl = (
        process.env.USER_SERVICE_URL || "http://localhost:3002"
      ).trim();
      const USER_SERVICE = rawUserUrl.endsWith("/health")
        ? rawUserUrl.slice(0, -7)
        : rawUserUrl;

      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
      const userRes = await axios.get(
        `${USER_SERVICE}/admin/student/${username}`,
        {
          headers: { "x-internal-secret": SECRET },
        },
      );
      if (userRes.data?.student?.email) {
        email = userRes.data.student.email;
        console.log(`Using registered email: ${email}`);
      }
    } catch (e: any) {
      console.warn(
        `Failed to fetch user profile for email, falling back: ${e.message}`,
      );
    }

    // Send OTP (Backgrounded for latency optimization)
    sendOtpEmail(email, username, otp).catch((err) => {
      console.error(`[AUTH] Background OTP email failed for ${username}:`, err);
    });

    console.log(`[AUTH] OTP generated for ${username}: ${otp}`);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("[AUTH] OTP Request Error:", error);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unable to send OTP. Please try again later.",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { otp } = req.body;
  const username = String(req.body.username || "").toUpperCase();

  try {
    const validOtp = await prisma.otpLog.findFirst({
      where: {
        username,
        otp,
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validOtp) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid or expired OTP",
      });
    }

    await prisma.otpLog.update({
      where: { id: validOtp.id },
      data: { consumedAt: new Date() },
    });

    // Generate a short-lived reset token (5 minutes)
    const resetToken = signToken({
      username: validOtp.username,
      role: "system_reset_intent",
      jti: validOtp.id,
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes validity
    });

    return res.json({ success: true, message: "OTP Verified", resetToken });
  } catch (error) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Verification failed due to a server error.",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { username, newPassword, resetToken } = req.body;

  // Validate Reset Token First
  if (!resetToken) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Reset token missing. Please verify OTP first.",
    });
  }

  // Verify Token
  const decoded = verifyToken(resetToken);

  if (!username) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", message: "Username is required." });
  }

  if (
    !decoded ||
    decoded.username.toLowerCase() !== username.toLowerCase() ||
    decoded.role !== "system_reset_intent"
  ) {
    return res.status(403).json({
      code: "AUTH_FORBIDDEN",
      message: "Invalid or expired reset token.",
    });
  }

  // Check if token was already used (Redis Blacklist)
  const jti = decoded.jti;
  if (jti) {
    const isUsed = await redis.get(`blacklist:reset:${jti}`);
    if (isUsed) {
      return res.status(403).json({
        code: "AUTH_FORBIDDEN",
        message: "Reset token has already been used.",
      });
    }
  }

  try {
    // Fetch canonical user to ensure update works with correct casing
    const targetUser = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!targetUser) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "User not found.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.authCredential.update({
      where: { id: targetUser.id },
      data: { passwordHash: hashedPassword },
    });

    // Mark token as used in Redis
    if (jti) {
      const now = Math.floor(Date.now() / 1000);
      const ttl = (decoded.exp || now + 300) - now;
      if (ttl > 0) {
        await redis.setex(`blacklist:reset:${jti}`, ttl, "true");
      }
    }

    // Send password change notification email (Backgrounded for latency optimization)
    const email = `${targetUser.username}@rguktong.ac.in`;
    sendPasswordChangeNotification(email, targetUser.username).catch((err) => {
      console.error(
        "[AUTH] Background password change notification failed:",
        err,
      );
    });

    return res.json({ success: true, message: "Password updated" });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to reset password. Please try again.",
    });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!user || user.id === "internal") {
    return res.status(401).json({
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message: "Please login to change your password.",
    });
  }

  try {
    const targetUser = await prisma.authCredential.findUnique({
      where: { id: user.id },
    });

    if (!targetUser) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "User account not found.",
      });
    }

    // Verify current password
    const isValid = await comparePassword(
      currentPassword,
      targetUser.passwordHash,
    );
    if (!isValid) {
      return res.status(401).json({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: "Incorrect current password.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.authCredential.update({
      where: { id: targetUser.id },
      data: { passwordHash: hashedPassword },
    });

    // Send password change notification email
    const email = `${targetUser.username.toLowerCase()}@rguktong.ac.in`;
    sendPasswordChangeNotification(email, targetUser.username).catch((err) => {
      console.error(
        "[AUTH] Background password change notification failed:",
        err,
      );
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (e) {
    console.error("[AUTH] Change Password Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update password. Please try again.",
    });
  }
};
export const toggleSuspension = async (req: Request, res: Response) => {
  const { username, suspended } = req.body;
  // Note: In a real system, the auth middleware would verify the requester is an admin
  try {
    const targetUser = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!targetUser) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "User not found",
      });
    }

    await prisma.authCredential.update({
      where: { id: targetUser.id },
      data: { isDisabled: suspended },
    });

    // Invalidate/Update Redis cache for immediate effect
    const cacheKey = `user:status:${targetUser.id}`;
    await redis.setex(cacheKey, 600, suspended ? "true" : "false");

    // Log notification (Actual email util could be called here)
    console.log(
      `[AUTH] Student ${targetUser.username} suspension status set to: ${suspended}`,
    );

    return res.json({
      success: true,
      message: `Suspension status updated to ${suspended}`,
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Operation failed. Please try again later.",
    });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { username, password, role, email } = req.body;

  try {
    const existing = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (existing) {
      return res.status(409).json({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Username already exists",
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.authCredential.create({
      data: {
        username,
        passwordHash: hashedPassword,
        role: role || UserRole.STUDENT,
      },
    });

    // Call User Service to create profile (Backgrounded for latency optimization)
    const userServiceUrl = process.env.USER_SERVICE_URL;
    if (userServiceUrl) {
      const axios = require("axios");
      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

      const profilePromise =
        role === "faculty" || role === "teacher"
          ? axios.post(
              `${userServiceUrl}/api/v1/users/faculty`,
              {
                username: user.username,
                name: user.username,
                email: email || `${user.username}@uniz.com`,
                department: "CSE",
                designation: "Lecture",
              },
              { headers: { "x-internal-secret": SECRET } },
            )
          : role === "student"
            ? axios.post(
                `${userServiceUrl}/api/v1/users/students`,
                {
                  id: user.username,
                  username: user.username,
                  name: user.username,
                  email: email || `${user.username}@rguktong.ac.in`,
                },
                { headers: { "x-internal-secret": SECRET } },
              )
            : Promise.resolve();

      profilePromise.catch((profileErr: any) => {
        console.error(
          "[AUTH] Background profile creation failed:",
          profileErr.message,
        );
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: "This username is already taken.",
      });
    }
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Account creation failed. Please try again later.",
    });
  }
};

export const getUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.authCredential.findUnique({
      where: { id },
      select: { isDisabled: true, role: true, username: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found in auth records.",
      });
    }

    console.log(
      `[AUTH-INTERNAL] Providing status for ${user.username} (Disabled: ${user.isDisabled})`,
    );

    return res.json({
      success: true,
      data: {
        id,
        username: user.username,
        role: user.role,
        isDisabled: user.isDisabled,
      },
    });
  } catch (error: any) {
    console.error(
      `[AUTH-INTERNAL] Error fetching user status for ${id}:`,
      error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error during status verification.",
    });
  }
};
