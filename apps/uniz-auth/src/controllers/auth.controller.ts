import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../utils/prisma";
import { signToken, verifyToken } from "../utils/token.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { redis } from "../utils/redis.util";
import {
  sendOtpEmail,
  sendOtpPush,
  sendLoginNotification,
  sendPasswordChangeNotification,
} from "../utils/email.util";
import { comparePassword, hashPassword } from "../utils/password.util";
import { ErrorCode } from "../shared/error-codes";
import { UserRole } from "../shared/roles.enum";
import { UAParser } from "ua-parser-js";
import { verifyTurnstileToken } from "../utils/turnstile.util";

export const login = async (req: Request, res: Response) => {
  const username = (req.body.username || "").trim(); // Case-insensitive: handled by Prisma mode:"insensitive" below
  const password = req.body.password;
  const captchaToken = req.body.captchaToken;

  // Cloudflare Turnstile Verification
  let isHuman = false;

  // Local development backend override (allows devs hitting prod to bypass Turnstile)
  const DEV_BYPASS_TOKEN = "uniz_dev_bypass_token_2026";
  if (captchaToken === DEV_BYPASS_TOKEN) {
    isHuman = true;
    console.log(
      "[AUTH-DEBUG] Turnstile bypassed for local development request",
    );
  } else {
    isHuman = await verifyTurnstileToken(captchaToken, req.ip);
  }

  if (!isHuman) {
    return res.status(400).json({
      code: "AUTH_CAPTCHA_FAILED",
      message: "Security verification failed. Please try again.",
    });
  }

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

    const inferDepartment = (uname: string): string => {
      const parts = uname.toUpperCase().split("_");
      const commonBranches = [
        "CSE",
        "ECE",
        "ME",
        "CE",
        "MME",
        "CHEM",
        "EEE",
        "CIVIL",
        "MET",
        "MEC",
      ];
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (commonBranches.includes(lastPart)) return lastPart;
      }
      return "";
    };

    const normalizedUsername = user.username.toUpperCase();
    let department = "";
    try {
      const rawUserUrl = (
        process.env.USER_SERVICE_URL || "http://localhost:3002"
      ).trim();
      const USER_SERVICE = rawUserUrl.endsWith("/health")
        ? rawUserUrl.slice(0, -7)
        : rawUserUrl;
      const INTERNAL_SECRET = (
        process.env.INTERNAL_SECRET || "uniz-core"
      ).trim();

      const userType = user.role === UserRole.STUDENT ? "student" : "faculty";
      // Try faculty first, then admin if faculty fails/returns empty for non-students
      const endpoints =
        user.role === UserRole.STUDENT
          ? [`student/${normalizedUsername}`]
          : [`faculty/${normalizedUsername}`, `admin/${normalizedUsername}`];

      for (const endpoint of endpoints) {
        try {
          const userRes = await axios.get(`${USER_SERVICE}/admin/${endpoint}`, {
            headers: { "x-internal-secret": INTERNAL_SECRET },
            timeout: 3000,
          });
          const data =
            userRes.data?.student ||
            userRes.data?.faculty ||
            userRes.data?.data ||
            userRes.data;
          const foundDept = data?.department || data?.branch;
          if (foundDept) {
            department = foundDept;
            break;
          }
        } catch (e) {}
      }

      console.log(
        `[AUTH-DEBUG] Resolved department from services for ${normalizedUsername}: "${department}"`,
      );
    } catch (e: any) {
      console.warn(
        `[AUTH] Service-based department resolution failed for ${normalizedUsername}: ${e.message}`,
      );
    }

    // Fallback: Infer from username if still empty
    if (!department) {
      department = inferDepartment(normalizedUsername);
      if (department) {
        console.log(
          `[AUTH-DEBUG] Inferred department from username for ${normalizedUsername}: "${department}"`,
        );
      }
    }

    const token = signToken({
      id: user.id,
      username: normalizedUsername,
      role: user.role as UserRole,
      department,
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
    } else {
      // All non-student roles (faculty, hod, dean, webmaster, etc.) get admin_token
      // since they all log in via the admin portal
      response.admin_token = token;
    }

    // Parse User-Agent for device info
    const uaString = req.headers["user-agent"];
    const parser = new UAParser(uaString);
    const result = parser.getResult();
    const osName = result.os.name || "Unknown OS";
    const browserName = result.browser.name || "Unknown Browser";
    const deviceInfo = `${browserName} on ${osName}`;

    // Send login notification (Backgrounded for latency optimization)
    const email = `${normalizedUsername.toLowerCase()}@rguktong.ac.in`;
    sendLoginNotification(
      email,
      normalizedUsername,
      req.ip || "Unknown IP",
      deviceInfo,
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

    await prisma.otpLog.create({
      data: { username, otp, expiresAt },
    });

    // Send OTP via Push (Primary channel) with automatic Email fallback
    const sentCount = await sendOtpPush(username, otp);

    if (sentCount === 0) {
      console.log(
        `[AUTH] No active push channels for ${username}. Deploying email fallback...`,
      );
      // Higher resolution logic for all roles (Student/Faculty/Admin)
      let email = `${username.toLowerCase()}@rguktong.ac.in`;
      try {
        const rawUserUrl = (
          process.env.USER_SERVICE_URL || "http://localhost:3002"
        ).trim();
        const USER_SERVICE = rawUserUrl.endsWith("/health")
          ? rawUserUrl.slice(0, -7)
          : rawUserUrl;
        const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

        // Tiered lookup: start with student, then admin/faculty endpoints if needed
        const endpoints = [
          `student/${username}`,
          `faculty/${username}`,
          `admin/${username}`,
        ];

        for (const endpoint of endpoints) {
          try {
            const userRes = await axios.get(
              `${USER_SERVICE}/admin/${endpoint}`,
              {
                headers: { "x-internal-secret": SECRET },
                timeout: 2000,
              },
            );
            const data =
              userRes.data?.student ||
              userRes.data?.faculty ||
              userRes.data?.data ||
              userRes.data;
            if (data?.email) {
              email = data.email;
              break;
            }
          } catch (e) {}
        }
      } catch (e) {}

      await sendOtpEmail(email, username, otp);
      return res.json({
        success: true,
        deliveryMethod: "email",
        email: email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => {
          return gp2 + "*".repeat(gp3.length);
        }),
        message: `Security code successfully dispatched to your registered email.`,
      });
    }

    console.log(
      `[AUTH] OTP generated and pushed to ${sentCount} devices for ${username}.`,
    );
    return res.json({
      success: true,
      deliveryMethod: "push",
      message: `Security code successfully pushed to ${sentCount} of your active devices.`,
    });
  } catch (error) {
    console.error("[AUTH] Security OTP Request Error:", error);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message:
        "Security infrastructure encountered an error. Please try again.",
    });
  }
};

// Explicitly request OTP via email (Manual fallback)
export const requestOtpEmail = async (req: Request, res: Response) => {
  const username = String(req.body.username || "").toUpperCase();

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

    // Get the most recent unconsumed OTP
    const lastOtp = await prisma.otpLog.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastOtp) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "No active OTP found. Please request a new one first.",
      });
    }

    // Higher resolution logic for all roles (Student/Faculty/Admin)
    let email = `${username.toLowerCase()}@rguktong.ac.in`;
    try {
      const rawUserUrl = (
        process.env.USER_SERVICE_URL || "http://localhost:3002"
      ).trim();
      const USER_SERVICE = rawUserUrl.endsWith("/health")
        ? rawUserUrl.slice(0, -7)
        : rawUserUrl;
      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

      const endpoints = [
        `student/${username}`,
        `faculty/${username}`,
        `admin/${username}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const userRes = await axios.get(`${USER_SERVICE}/admin/${endpoint}`, {
            headers: { "x-internal-secret": SECRET },
            timeout: 2000,
          });
          const data =
            userRes.data?.student ||
            userRes.data?.faculty ||
            userRes.data?.data ||
            userRes.data;
          if (data?.email) {
            email = data.email;
            break;
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Send via Resend (High priority on-demand)
    sendOtpEmail(email, username, lastOtp.otp).catch((err: any) => {
      console.error(
        `[AUTH] Manual email OTP fallback failed for ${username}:`,
        err,
      );
    });

    return res.json({
      success: true,
      deliveryMethod: "email",
      message:
        "Security code successfully dispatched to your registered email.",
    });
  } catch (error) {
    console.error("[AUTH] OTP Email Request Error:", error);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unable to send email. Please try again later.",
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

export const adminResetPassword = async (req: Request, res: Response) => {
  const { username, password, new_password } = req.body;

  try {
    const user = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!user) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Account not found.",
      });
    }

    // Verify current password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: "Incorrect current password.",
      });
    }

    const hashedPassword = await hashPassword(new_password);
    await prisma.authCredential.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Send password change notification email as a courtesy
    if (!username.startsWith("O") && !username.startsWith("o")) {
      const email = `${user.username.toLowerCase()}@rguktong.ac.in`;
      sendPasswordChangeNotification(email, user.username).catch(() => {});
    }

    return res.json({
      success: true,
      message: "Admin password updated successfully",
    });
  } catch (e) {
    console.error("[AUTH] Admin Reset Password Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to reset password. Please try again.",
    });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { username, password, role, email } = req.body;
  const internalSecret = req.headers["x-internal-secret"];
  const isInternal =
    internalSecret === (process.env.INTERNAL_SECRET || "uniz-core").trim();

  try {
    const existing = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    const hashedPassword = await hashPassword(password);

    if (existing) {
      if (isInternal) {
        // For internal bulk-upload calls: NEVER reset the password of an
        // existing user. Only update the role if it changed.
        // Resetting the password would lock out students who already changed theirs.
        if (role && role !== existing.role) {
          await prisma.authCredential.update({
            where: { id: existing.id },
            data: { role },
          });
        }
        return res.json({
          success: true,
          message: "Credential already exists (skipped password reset)",
          id: existing.id,
        });
      }

      return res.status(409).json({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Username already exists",
      });
    }

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
