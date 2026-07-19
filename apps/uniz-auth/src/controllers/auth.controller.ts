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
  queueOtpDelivery,
  resolveProfileEmail,
} from "../utils/email.util";
import {
  comparePassword,
  comparePasswordForUser,
  hashPassword,
} from "../utils/password.util";
import { ErrorCode } from "../shared/error-codes";
import { UserRole, ADMIN_ROLES } from "../shared/roles.enum";
import { isValidInternalSecret } from "@uniz/shared";
import { UAParser } from "ua-parser-js";
import { verifyTurnstileToken } from "../utils/turnstile.util";

function getUserServiceBase(): string {
  const rawUserUrl = (
    process.env.USER_SERVICE_URL || "http://localhost:3002"
  ).trim();
  return rawUserUrl.endsWith("/health") ? rawUserUrl.slice(0, -7) : rawUserUrl;
}

async function resolveUsernameFromEmail(email: string): Promise<string | null> {
  const USER_SERVICE = getUserServiceBase();
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  try {
    const res = await axios.get(`${USER_SERVICE}/internal/resolve-login`, {
      params: { email: email.trim().toLowerCase() },
      headers: { "x-internal-secret": INTERNAL_SECRET },
      timeout: 3000,
    });
    if (res.data?.username) {
      return String(res.data.username).trim();
    }
  } catch (e) {
    // Fall through — caller treats unresolved email as invalid credentials
  }
  return null;
}

function inferDepartmentFromUsername(uname: string): string {
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
}

const DEPARTMENT_LOOKUP_MS = 500;

/** Cap user-service lookup so login is not blocked on slow profile fetches. */
async function resolveDepartmentForLogin(
  normalizedUsername: string,
  role: UserRole,
): Promise<string> {
  const inferred = inferDepartmentFromUsername(normalizedUsername);
  const USER_SERVICE = getUserServiceBase();
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  // Department rarely changes per user — cache it so we don't hit user-service
  // on every login. Cache non-empty results for 1h, unknowns briefly.
  const cacheKey = `login:dept:${normalizedUsername}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {
    /* Redis optional */
  }

  const endpoints =
    role === UserRole.STUDENT
      ? [`student/${normalizedUsername}`]
      : [`faculty/${normalizedUsername}`, `admin/${normalizedUsername}`];

  const lookup = async (): Promise<string> => {
    for (const endpoint of endpoints) {
      try {
        const userRes = await axios.get(`${USER_SERVICE}/admin/${endpoint}`, {
          headers: { "x-internal-secret": INTERNAL_SECRET },
          timeout: DEPARTMENT_LOOKUP_MS,
        });
        const data =
          userRes.data?.student ||
          userRes.data?.faculty ||
          userRes.data?.data ||
          userRes.data;
        const foundDept = data?.department || data?.branch;
        if (foundDept) return foundDept;
      } catch {
        /* try next endpoint */
      }
    }
    return "";
  };

  const fromService = await Promise.race([
    lookup(),
    new Promise<string>((resolve) =>
      setTimeout(() => resolve(""), DEPARTMENT_LOOKUP_MS),
    ),
  ]);

  const resolved = fromService || inferred;
  try {
    // Only cache a resolved department from the service; don't pin a fallback
    // guess for long in case the profile lookup was just slow.
    if (fromService) await redis.setex(cacheKey, 3600, resolved);
  } catch {
    /* Redis optional */
  }
  return resolved;
}

async function resolveLoginIdentifier(
  identifier: string,
  allowEmailLogin: boolean,
): Promise<string> {
  const trimmed = identifier.trim();
  if (!allowEmailLogin || !trimmed.includes("@")) {
    return trimmed;
  }
  const resolved = await resolveUsernameFromEmail(trimmed);
  return resolved || trimmed;
}

export const login = async (req: Request, res: Response) => {
  const allowEmailLogin = Boolean((req as any).allowEmailLogin);
  const loginPortal = (req as any).loginPortal as string | undefined;
  const password = req.body.password;
  const captchaToken = req.body.captchaToken;

  const invalidCredentialsMessage = allowEmailLogin
    ? loginPortal === "student"
      ? "Invalid university ID, email, or password"
      : "Invalid staff ID, email, or password"
    : "Invalid username or password";

  // Verify captcha and resolve username in parallel (Turnstile is the slow step).
  const [isHuman, username] = await Promise.all([
    verifyTurnstileToken(captchaToken, req.ip),
    resolveLoginIdentifier(req.body.username || "", allowEmailLogin),
  ]);

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
        message: invalidCredentialsMessage,
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

    const normalizedUsername = user.username.toUpperCase();

    const [isValid, department] = await Promise.all([
      comparePasswordForUser(password, user.passwordHash, user.username),
      resolveDepartmentForLogin(normalizedUsername, user.role as UserRole),
    ]);
    if (!isValid) {
      return res.status(401).json({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: invalidCredentialsMessage,
      });
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
      // All non-student roles (faculty, hod, dean, webadmin, etc.) get admin_token
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

export const studentLogin = async (req: Request, res: Response) => {
  (req as any).allowEmailLogin = true;
  (req as any).loginPortal = "student";
  return login(req, res);
};
export const adminLogin = async (req: Request, res: Response) => {
  (req as any).allowEmailLogin = true;
  (req as any).loginPortal = "admin";
  return login(req, res);
};

export const requestOtp = async (req: Request, res: Response) => {
  const rawIdentifier = String(req.body.username || "").trim();
  const allowEmail = rawIdentifier.includes("@");
  let username = allowEmail
    ? (await resolveUsernameFromEmail(rawIdentifier)) || rawIdentifier
    : rawIdentifier.toUpperCase();
  const captchaToken = req.body.captchaToken;

  // Cloudflare Turnstile Verification
  const isHuman = await verifyTurnstileToken(captchaToken, req.ip);

  if (!isHuman) {
    return res.status(400).json({
      code: "AUTH_CAPTCHA_FAILED",
      message: "Security verification failed. Please try again.",
    });
  }

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

    // Queue push-first delivery with email fallback in the notification worker.
    const email = await resolveProfileEmail(username);
    const queued = await queueOtpDelivery(username, otp, email);
    if (!queued) {
      // Last-resort inline path if Redis/queue is down.
      const sentCount = await sendOtpPush(username, otp);
      if (sentCount === 0) {
        await sendOtpEmail(email, username, otp);
        return res.json({
          success: true,
          deliveryMethod: "email",
          email: email.replace(
            /(.{2})(.*)(?=@)/,
            (_m, a, b) => a + "*".repeat(b.length),
          ),
          message:
            "Security code successfully dispatched to your registered email.",
        });
      }
      return res.json({
        success: true,
        deliveryMethod: "push",
        message: `Security code successfully pushed to ${sentCount} of your active devices.`,
      });
    }

    console.log(`[AUTH] OTP queued for ${username} (push→email fallback).`);
    return res.json({
      success: true,
      deliveryMethod: "queued",
      queued: true,
      message:
        "Security code is being delivered to your devices (or email if push is unavailable).",
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
  const rawIdentifier = String(req.body.username || "").trim();
  const allowEmail = rawIdentifier.includes("@");
  let username = allowEmail
    ? (await resolveUsernameFromEmail(rawIdentifier)) || rawIdentifier
    : rawIdentifier.toUpperCase();

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
        // username stored already-normalized → exact match uses the index.
        username,
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

    // Active OTP session means the user already passed Turnstile on /otp/request.
    // Email resend is rate-limited separately and does not need a fresh captcha.
    const email = await resolveProfileEmail(username);
    await sendOtpEmail(email, username, lastOtp.otp);

    return res.json({
      success: true,
      deliveryMethod: "email",
      queued: true,
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
  const rawIdentifier = String(req.body.username || "").trim();
  const allowEmail = rawIdentifier.includes("@");
  const username = allowEmail
    ? (await resolveUsernameFromEmail(rawIdentifier)) || rawIdentifier
    : rawIdentifier.toUpperCase();

  try {
    const validOtp = await prisma.otpLog.findFirst({
      where: {
        // username is stored already-normalized (uppercase id / resolved email),
        // so exact match uses @@index([username, createdAt]).
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
  const { newPassword, resetToken } = req.body;
  const rawIdentifier = String(req.body.username || "").trim();
  const allowEmail = rawIdentifier.includes("@");
  const username = allowEmail
    ? (await resolveUsernameFromEmail(rawIdentifier)) || rawIdentifier
    : rawIdentifier;

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
export const toggleSuspension = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { username, suspended } = req.body;
  const requester = req.user;

  if (
    !requester ||
    (requester.id !== "internal" &&
      !ADMIN_ROLES.includes(String(requester.role)))
  ) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Access denied. Administrative clearance required.",
    });
  }

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
  const isInternal = isValidInternalSecret(req.headers["x-internal-secret"]);

  if (!isInternal) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Account registration is restricted to internal services.",
    });
  }

  try {
    const existing = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

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

    // Only hash the password if we are actually creating a new credential
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
        role === "faculty" || role === "teacher" || role === "hod"
          ? axios.post(
              `${userServiceUrl}/faculty/create`,
              {
                username: user.username,
                name: user.username,
                email: email || `${user.username}@rguktong.ac.in`,
                department: "GENERAL",
                designation: "Faculty",
              },
              { headers: { "x-internal-secret": SECRET }, timeout: 5000 },
            )
          : role === "student"
            ? axios.put(
                `${userServiceUrl}/admin/student/${user.username}`,
                {
                  email: email || `${user.username}@rguktong.ac.in`,
                },
                { headers: { "x-internal-secret": SECRET }, timeout: 5000 },
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

export const globalAdminResetPassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { targetUsername, newPassword } = req.body;
  const requester = req.user;

  // Security Check: Strictly WEBADMIN (and maybe DEAN/DIRECTOR) for this level of access
  const allowedRoles = [UserRole.WEBADMIN, UserRole.DEAN];
  if (!requester || !allowedRoles.includes(requester.role as UserRole)) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Access denied. High-level administrative clearance required.",
    });
  }

  if (!targetUsername || !newPassword) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Target username and new password are required.",
    });
  }

  try {
    const targetUser = await prisma.authCredential.findFirst({
      where: { username: { equals: targetUsername, mode: "insensitive" } },
    });

    if (!targetUser) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "User not found in authentication registry.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.authCredential.update({
      where: { id: targetUser.id },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate status cache to be safe
    await redis.del(`user:status:${targetUser.id}`);

    // Send password change notification email (Silent failure if mail service unavailable)
    const email = `${targetUser.username.toLowerCase()}@rguktong.ac.in`;
    sendPasswordChangeNotification(email, targetUser.username).catch((err) => {
      console.error(
        `[AUTH] Background notification failed for ${targetUser.username}:`,
        err.message,
      );
    });

    console.log(
      `[AUTH] [ADMIN-RESET] Webadmin (${requester.username}) reset password for: ${targetUser.username}`,
    );

    return res.json({
      success: true,
      message: `Password for ${targetUser.username} has been successfully reset.`,
    });
  } catch (error: any) {
    console.error("[AUTH] Global Admin Reset Error:", error.message);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to perform reset operation.",
    });
  }
};

export const getUserStatus = async (req: Request, res: Response) => {
  if (!isValidInternalSecret(req.headers["x-internal-secret"])) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

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

export const deleteUserByUsername = async (req: Request, res: Response) => {
  const internalSecret = req.headers["x-internal-secret"];
  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  if (internalSecret !== SECRET) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const username = String(req.params.username || "").trim();
  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Username required" });
  }

  try {
    const existing = await prisma.authCredential.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!existing) {
      return res.json({
        success: true,
        message: "No auth record found",
        deleted: false,
      });
    }

    await prisma.otpLog.deleteMany({
      where: { username: { equals: existing.username, mode: "insensitive" } },
    });
    await prisma.authCredential.delete({ where: { id: existing.id } });

    return res.json({
      success: true,
      message: "Auth credential deleted",
      deleted: true,
      username: existing.username,
    });
  } catch (error: any) {
    console.error(
      `[AUTH-INTERNAL] Delete user failed for ${username}:`,
      error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Failed to delete auth credential",
    });
  }
};
