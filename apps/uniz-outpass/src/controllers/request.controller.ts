import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import {
  OutpassRequestSchema,
  OutingRequestSchema,
  ApprovalLogEntrySchema,
  ApprovalLogEntry,
} from "../shared/outpass.schema";
import { UserRole } from "../shared/roles.enum";

const prisma = new PrismaClient();

// Helper to append log
const appendLog = (currentLogs: any, entry: ApprovalLogEntry) => {
  const logs = Array.isArray(currentLogs) ? currentLogs : [];
  return [...logs, entry];
};

import axios from "axios";

// Helper: Check if student is in campus
// Helper to trigger notifications via Mail Service
const sendMail = async (type: string, to: string, data: any) => {
  try {
    const rawGateway = (
      (process.env.DOCKER_ENV === "true" ? "http://uniz-gateway-api:3000/api/v1" : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
    ).trim();
    const rawMailUrl = process.env.MAIL_SERVICE_URL;
    const MAIL_SERVICE = rawMailUrl
      ? rawMailUrl.trim().replace(/\/health$/, "")
      : `${rawGateway}/mail`;

    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    await axios.post(
      `${MAIL_SERVICE}/send`,
      {
        type,
        to,
        data,
      },
      {
        headers: { "x-internal-secret": SECRET },
      },
    );
    console.log(
      `[OUTPASS] Successfully sent ${type} mail request to mail service for: ${to}`,
    );
  } catch (e: any) {
    console.error(
      `[OUTPASS] Failed to send mail (${type}) to ${to}:`,
      e.message,
    );
  }
};

const triggerNotification = async (evt: string, payload: any) => {
  // Adapter to map old events to new Mail Service types
  // payload: { recipient, subject, body, ...extra }

  // We need to parse strict data from the loose payload or passed in extra
  // This is a bit hacky, normally we'd refactor the callsites.
  // Let's rely on 'extra details' being passed in payload for specific fields.

  const { recipient, extra } = payload;
  if (!extra) return; // Need structured data

  let mailType = "";
  let mailData: any = {};

  switch (evt) {
    case "OUTPASS_REQUEST":
      mailType = "outpass_request";
      mailData = {
        username: extra.username,
        reason: extra.reason,
        fromDate: extra.fromDate,
        toDate: extra.toDate,
      };
      break;
    case "OUTING_REQUEST":
      mailType = "outing_request";
      mailData = {
        username: extra.username,
        reason: extra.reason,
        fromDate: extra.fromDate,
        toDate: extra.toDate,
      };
      break;
    case "REQUEST_UPDATE":
    case "REQUEST_REJECTED":
      mailType =
        extra.requestType === "outing" ? "outing_approval" : "outpass_approval";
      mailData = {
        username: extra.username, // Student ID/Name
        status: extra.status, // approved, rejected, forwarded
        approver: extra.approver,
        comment: extra.comment,
      };
      break;
    case "CHECK_IN":
    case "CHECK_OUT":
      mailType = "checkpoint";
      mailData = {
        username: extra.username,
        type: evt === "CHECK_IN" ? "check_in" : "check_out",
        time: new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };
      break;
  }

  if (mailType && recipient) {
    // Await to ensure delivery in serverless
    await sendMail(mailType, recipient, mailData);
  }
};

const sendAdminConfirmation = async (
  adminEmail: string,
  action: "approved" | "rejected" | "forwarded",
  studentName: string,
  studentId: string,
  type: "outing" | "outpass",
) => {
  await sendMail("admin_action_confirmation", adminEmail, {
    action,
    studentName,
    studentId,
    type,
  });
};

async function getStudentStatus(token: string) {
  try {
    const GATEWAY = (
      (process.env.DOCKER_ENV === "true" ? "http://uniz-gateway-api:3000/api/v1" : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
    ).trim();
    const res = await axios.get(`${GATEWAY}/profile/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      isInCampus: res.data.student.is_in_campus,
      hasPending: res.data.student.has_pending_requests,
      gender: res.data.student.gender,
    };
  } catch (e) {
    console.error("Profile check failed:", e);
    return { isInCampus: true, hasPending: false, gender: undefined }; // Safe defaults
  }
}

async function updateStudentProfileStatus(
  username: string,
  token: string,
  status: { isPresent?: boolean; isPending?: boolean },
) {
  try {
    const GATEWAY = (
      (process.env.DOCKER_ENV === "true" ? "http://uniz-gateway-api:3000/api/v1" : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
    ).trim();
    await axios.put(
      `${GATEWAY}/profile/student/status`,
      {
        username,
        ...status,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (e: any) {
    console.error("Failed to update student profile status:", e.message);
  }
}

export const createOutpass = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  // Validate Input
  const parse = OutpassRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: ErrorCode.VALIDATION_ERROR, errors: parse.error.errors });
  }
  const { reason, fromDay, toDay } = parse.data;

  // 0. Ensure dates are not in the past
  const now = new Date();
  // Use start of today for fromDay comparison if it's a date only comparison,
  // but here we probably want to ensure it's at least today or later.
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  if (new Date(fromDay) < startOfToday) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "From Date cannot be in the past.",
    });
  }
  if (new Date(toDay) < new Date(fromDay)) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "To Date cannot be before From Date.",
    });
  }

  const fromDateObj = new Date(fromDay);
  const toDateObj = new Date(toDay);

  // Calculate days
  const diffMs = toDateObj.getTime() - fromDateObj.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1; // Default to 1 day if today to today

  try {
    // 1. Check if student is IN CAMPUS and doesn't have PENDING requests
    const { isInCampus, hasPending, gender } = await getStudentStatus(
      req.headers.authorization?.split(" ")[1] || "",
    );

    if (!isInCampus) {
      return res.status(403).json({
        code: ErrorCode.AUTH_FORBIDDEN,
        message: "You are already marked as OUT of campus.",
      });
    }

    if (hasPending) {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message:
          "You already have a pending request (Profile indicates Pending).",
      });
    }

    // 2. Double check local DB for existing pending Outpass AND Outing
    const studentId = user.username.toUpperCase();
    const [existingOutpass, existingOuting] = await Promise.all([
      prisma.outpass.findFirst({
        where: {
          studentId,
          isRejected: false,
          isExpired: false,
          checkedInTime: null,
        },
      }),
      prisma.outing.findFirst({
        where: {
          studentId,
          isRejected: false,
          isExpired: false,
          checkedInTime: null,
        },
      }),
    ]);

    if (existingOutpass || existingOuting) {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: "You already have a pending request (Outpass or Outing).",
      });
    }

    const outpass = await prisma.outpass.create({
      data: {
        studentId: user.username.toUpperCase(),
        studentGender: (gender || String(req.body.studentGender || "M"))
          .toUpperCase()
          .startsWith("F")
          ? "F"
          : "M",
        reason,
        fromDay: fromDateObj,
        toDay: toDateObj,
        days: days,
        approvalLogs: [],
        currentLevel: (gender || req.body.studentGender || "M")
          .toUpperCase()
          .startsWith("F")
          ? UserRole.CARETAKER_FEMALE
          : UserRole.CARETAKER_MALE,
      },
    });

    // 3. Mark Pending in Profile (Atomic-ish)
    await updateStudentProfileStatus(
      user.username,
      req.headers.authorization?.split(" ")[1] || "",
      { isPending: true },
    );

    // Notify Student & Caretaker (Backgrounded for latency optimization)
    triggerNotification("OUTPASS_REQUEST", {
      recipient: user.email || `${user.username}@rguktong.ac.in`,
      subject: "Outpass Request Submitted",
      body: `Your request (ID: ${outpass.id}) has been submitted to your Caretaker.`,
      extra: {
        username: (user as any).name || user.username,
        reason: reason,
        fromDate: fromDateObj.toISOString(),
        toDate: toDateObj.toISOString(),
        requestType: "outpass",
      },
    }).catch((err) => {
      console.error("[OUTPASS] Background outpass notification failed:", err);
    });

    return res.json({ success: true, data: outpass });
  } catch (e: any) {
    console.error("Outpass Creation Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message:
        "There was an issue submitting your outpass request. Please try again.",
    });
  }
};

export const createOuting = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const parse = OutingRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: ErrorCode.VALIDATION_ERROR, errors: parse.error.errors });
  }
  const { reason, fromTime, toTime } = parse.data;

  const now = new Date();
  const fromDateObj = new Date(fromTime);
  const toDateObj = new Date(toTime);

  if (fromDateObj < now) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "From Time cannot be in the past.",
    });
  }
  if (toDateObj < fromDateObj) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "To Time cannot be before From Time.",
    });
  }

  // Ensure it's the same day
  if (fromDateObj.toDateString() !== toDateObj.toDateString()) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message:
        "Outing cannot span multiple days. Please take an Outpass instead.",
    });
  }

  const diffMs = toDateObj.getTime() - fromDateObj.getTime();
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));

  try {
    // 1. Check if student is IN CAMPUS and doesn't have PENDING requests
    const { isInCampus, hasPending, gender } = await getStudentStatus(
      req.headers.authorization?.split(" ")[1] || "",
    );

    if (!isInCampus) {
      return res.status(403).json({
        code: ErrorCode.AUTH_FORBIDDEN,
        message: "You are already marked as OUT of campus.",
      });
    }

    if (hasPending) {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message:
          "You already have a pending request (Profile indicates Pending).",
      });
    }

    // 2. Double check local DB for existing pending Outpass AND Outing
    const studentId = user.username.toUpperCase();
    const [existingOutpass, existingOuting] = await Promise.all([
      prisma.outpass.findFirst({
        where: {
          studentId,
          isRejected: false,
          isExpired: false,
          checkedInTime: null,
        },
      }),
      prisma.outing.findFirst({
        where: {
          studentId,
          isRejected: false,
          isExpired: false,
          checkedInTime: null,
        },
      }),
    ]);

    if (existingOutpass || existingOuting) {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: "You already have a pending request (Outpass or Outing).",
      });
    }

    const outing = await prisma.outing.create({
      data: {
        studentId: user.username.toUpperCase(),
        studentGender: (gender || String(req.body.studentGender || "M"))
          .toUpperCase()
          .startsWith("F")
          ? "F"
          : "M",
        reason,
        fromTime: fromDateObj,
        toTime: toDateObj,
        hours: hours,
        currentLevel: (gender || req.body.studentGender || "M")
          .toUpperCase()
          .startsWith("F")
          ? UserRole.CARETAKER_FEMALE
          : UserRole.CARETAKER_MALE,
        approvalLogs: [],
      },
    });

    // Mark Pending in Profile
    await updateStudentProfileStatus(
      user.username,
      req.headers.authorization?.split(" ")[1] || "",
      { isPending: true },
    );

    // Backgrounded notification for latency optimization
    triggerNotification("OUTING_REQUEST", {
      recipient: user.email || `${user.username}@rguktong.ac.in`,
      subject: "Outing Request Submitted",
      body: `Your outing request (ID: ${outing.id}) has been submitted.`,
      extra: {
        username: (user as any).name || user.username,
        reason: reason,
        fromDate: fromDateObj.toISOString(),
        toDate: toDateObj.toISOString(),
        requestType: "outing",
      },
    }).catch((err) => {
      console.error("[OUTPASS] Background outing notification failed:", err);
    });

    return res.json({ success: true, data: outing });
  } catch (e: any) {
    console.error("Outing Creation Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message:
        "There was an issue submitting your outing request. Please try again.",
    });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const targetId = (req.params.id || user.username).toUpperCase();
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch both and combine. In a real system you might want a unified view/table if scale is huge.
    const [outpasses, outings, totalOutpasses, totalOutings] =
      await Promise.all([
        prisma.outpass.findMany({
          where: { studentId: targetId },
          orderBy: { requestedTime: "desc" },
          take: Number(limit),
        }),
        prisma.outing.findMany({
          where: { studentId: targetId },
          orderBy: { requestedTime: "desc" },
          take: Number(limit),
        }),
        prisma.outpass.count({ where: { studentId: targetId } }),
        prisma.outing.count({ where: { studentId: targetId } }),
      ]);

    // Merge and sort
    const combined = [
      ...outpasses.map((o) => ({ ...o, type: "outpass" })),
      ...outings.map((o) => ({ ...o, type: "outing" })),
    ]
      .sort(
        (a, b) =>
          new Date(b.requestedTime).getTime() -
          new Date(a.requestedTime).getTime(),
      )
      .slice(0, Number(limit));

    // Format keys for frontend compatibility
    const history = combined.map((item) => ({
      _id: item.id,
      ...item,
      is_approved: item.isApproved,
      is_rejected: item.isRejected,
      is_expired: item.isExpired,
      requested_time: item.requestedTime,
      from_time: (item as any).fromTime,
      to_time: (item as any).toTime,
      from_day: (item as any).fromDay,
      to_day: (item as any).toDay,
      checked_out_time: item.checkedOutTime,
      checked_in_time: item.checkedInTime,
    }));

    return res.json({
      success: true,
      history,
      pagination: {
        page: Number(page),
        totalPages: Math.ceil((totalOutpasses + totalOutings) / Number(limit)),
        total: totalOutpasses + totalOutings,
      },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to retrieve your history. Please try again later.",
    });
  }
};

// Helper to determine request type and fetch
const fetchRequest = async (id: string, prisma: any) => {
  const outpass = await prisma.outpass.findUnique({ where: { id } });
  if (outpass) return { type: "outpass", data: outpass };

  const outing = await prisma.outing.findUnique({ where: { id } });
  if (outing) return { type: "outing", data: outing };

  return null;
};

export const approveOutpass = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const superRoles = [
    UserRole.DIRECTOR,
    UserRole.WEBMASTER,
    UserRole.SWO,
    UserRole.DEAN,
  ];
  const isSuper = superRoles.includes(user.role as UserRole);

  try {
    const found = await fetchRequest(id, prisma);
    if (!found)
      return res.status(404).json({ code: ErrorCode.RESOURCE_NOT_FOUND });

    const { type, data: existing } = found;

    if (existing.isApproved || existing.isRejected || existing.isExpired) {
      return res.status(409).json({
        code: ErrorCode.OUTPASS_ALREADY_APPROVED,
        message: "Request already finalized",
      });
    }

    // Gender restriction check
    if (!isSuper) {
      const roleStr = user.role.toLowerCase();
      if (
        (roleStr.includes("female") ||
          roleStr === UserRole.CARETAKER_FEMALE ||
          roleStr === UserRole.WARDEN_FEMALE) &&
        existing.studentGender !== "F"
      ) {
        return res.status(403).json({
          code: ErrorCode.AUTH_FORBIDDEN,
          message: "Female staff can only approve female requests",
        });
      }
      if (
        (roleStr.includes("male") ||
          roleStr === UserRole.CARETAKER_MALE ||
          roleStr === UserRole.WARDEN_MALE) &&
        existing.studentGender !== "M"
      ) {
        return res.status(403).json({
          code: ErrorCode.AUTH_FORBIDDEN,
          message: "Male staff can only approve male requests",
        });
      }
    }

    const currentRole = user.role as string;
    // Auto-detect forward action from URL path (e.g., /requests/:id/forward)
    const isForwardEndpoint = req.originalUrl.endsWith("/forward");
    const requestedAction = isForwardEndpoint
      ? "forward"
      : req.body.action || "approve";

    // --- STRICT HIERARCHY ENFORCEMENT ---
    if (
      !isSuper &&
      existing.currentLevel &&
      currentRole !== (existing.currentLevel as string)
    ) {
      return res.status(403).json({
        code: ErrorCode.AUTH_FORBIDDEN,
        message: `Strict Hierarchy: This request is currently at ${existing.currentLevel} level. You (${currentRole}) cannot process it.`,
      });
    }

    let nextLevel = existing.currentLevel;
    let finalApproval = false;
    let actionMessage = "Processed";

    // --- APPROVAL HIERARCHY LOGIC ---

    if (type === "outing") {
      // Outings: One-step approval by design
      finalApproval = true;
      actionMessage = "Approved";
    } else {
      // Outpass Flow: Multi-step potential
      if (currentRole.includes("caretaker")) {
        if (requestedAction === "forward") {
          nextLevel =
            existing.studentGender === "F"
              ? UserRole.WARDEN_FEMALE
              : UserRole.WARDEN_MALE;
          actionMessage = "Forwarded to Warden";
          finalApproval = false;
        } else {
          // Caretaker chooses to Approve (Final)
          finalApproval = true;
          actionMessage = "Approved";
          nextLevel = existing.currentLevel; // Stays at this level but finalized
        }
      } else if (currentRole.includes("warden")) {
        if (requestedAction === "forward") {
          nextLevel = UserRole.SWO;
          actionMessage = "Forwarded to SWO";
          finalApproval = false;
        } else {
          // Warden chooses to Approve (Final)
          finalApproval = true;
          actionMessage = "Approved";
          nextLevel = existing.currentLevel;
        }
      } else if (currentRole === UserRole.SWO || isSuper) {
        // SWO/Super roles always Finalize
        finalApproval = true;
        actionMessage = "Approved";
      }
    }

    const logEntry: ApprovalLogEntry = {
      level: currentRole,
      approverId: user.id || user.username,
      status: finalApproval ? "approved" : "forwarded",
      timestamp: new Date().toISOString(),
      comment: req.body.comment || actionMessage,
    };

    const updateData: any = {
      currentLevel: nextLevel,
      approvalLogs: appendLog(existing.approvalLogs, logEntry),
    };

    if (finalApproval) {
      updateData.isApproved = true;
      updateData.issuedBy = user.username;
      updateData.issuedTime = new Date();
    }

    let updated;
    if (type === "outpass") {
      updated = await prisma.outpass.update({
        where: { id },
        data: updateData,
      });
    } else {
      updated = await prisma.outing.update({ where: { id }, data: updateData });
    }

    // --- NOTIFICATIONS (Backgrounded for latency optimization) ---
    triggerNotification("REQUEST_UPDATE", {
      recipient: `${existing.studentId}@rguktong.ac.in`,
      subject: `${type === "outing" ? "Outing" : "Outpass"} Update: ${actionMessage}`,
      body: `Your ${type} has been ${actionMessage} by ${user.role}.`,
      extra: {
        username: existing.studentId,
        status: finalApproval ? "approved" : "forwarded",
        approver: user.username, // or Name if available
        comment: req.body.comment || actionMessage,
        requestType: type,
      },
    }).catch((err) => {
      console.error(
        "[OUTPASS] Background status update notification failed:",
        err,
      );
    });

    // Admin Confirmation (Backgrounded)
    if (user.email) {
      sendAdminConfirmation(
        user.email,
        finalApproval ? "approved" : ("forwarded" as any),
        existing.studentId,
        existing.studentId,
        type as "outing" | "outpass",
      ).catch((err) => {
        console.error("[OUTPASS] Background admin confirmation failed:", err);
      });
    }

    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unable to process approval. Please try again.",
    });
  }
};

export const rejectOutpass = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;
  if (!user || user.role === UserRole.STUDENT)
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });

  // Explicitly block Security from rejecting anything
  if (user.role === UserRole.SECURITY) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Security role is limited to Check-In/Check-Out operations.",
    });
  }

  const currentRole = user.role as string;

  try {
    const found = await fetchRequest(id, prisma);
    if (!found)
      return res.status(404).json({ code: ErrorCode.RESOURCE_NOT_FOUND });

    const { type, data: existing } = found;

    if (existing.isApproved || existing.isRejected) {
      return res.status(409).json({ code: ErrorCode.OUTPASS_ALREADY_APPROVED });
    }

    // --- STRICT HIERARCHY ENFORCEMENT ---
    const superRoles = [
      UserRole.DIRECTOR,
      UserRole.WEBMASTER,
      UserRole.SWO,
      UserRole.DEAN,
    ];
    const isSuper = superRoles.includes(user.role as UserRole);

    if (
      !isSuper &&
      existing.currentLevel &&
      currentRole !== (existing.currentLevel as string)
    ) {
      return res.status(403).json({
        code: ErrorCode.AUTH_FORBIDDEN,
        message: `Strict Hierarchy: Rejection must be handled at the current level (${existing.currentLevel}).`,
      });
    }

    const logEntry: ApprovalLogEntry = {
      level: user.role as string,
      approverId: user.id || user.username,
      status: "rejected",
      timestamp: new Date().toISOString(),
      comment: req.body.comment,
    };

    const updateData = {
      isRejected: true,
      rejectedBy: user.username,
      rejectedTime: new Date(),
      approvalLogs: appendLog(existing.approvalLogs, logEntry),
    };

    let updated;
    if (type === "outpass") {
      updated = await prisma.outpass.update({
        where: { id, isRejected: false },
        data: updateData,
      });
    } else {
      updated = await prisma.outing.update({
        where: { id, isRejected: false },
        data: updateData,
      });
    }

    // Notify Student of Rejection
    // Notify Student of Rejection
    // Notify Student of Rejection
    triggerNotification("REQUEST_REJECTED", {
      recipient: `${existing.studentId}@rguktong.ac.in`,
      subject: `${type === "outing" ? "Outing" : "Outpass"} Rejected`,
      body: `Your ${type} was rejected by ${user.role}. Reason: ${req.body.comment || "No comment provided"}`,
      extra: {
        username: existing.studentId,
        status: "rejected",
        approver: user.username,
        comment: req.body.comment,
        requestType: type,
      },
    }).catch((err) => {
      console.error("[OUTPASS] Background rejection notification failed:", err);
    });

    // Admin Confirmation
    if (user.email) {
      await sendAdminConfirmation(
        user.email,
        "rejected",
        existing.studentId,
        existing.studentId,
        type as "outing" | "outpass",
      );
    }

    // Clear Pending in Profile
    await updateStudentProfileStatus(
      existing.studentId,
      req.headers.authorization?.split(" ")[1] || "",
      { isPending: false },
    );

    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unable to process rejection. Please try again.",
    });
  }
};

export const getAllOutings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const { page = 1, limit = 50, search = "" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const superRoles = [
    UserRole.DIRECTOR,
    UserRole.WEBMASTER,
    UserRole.SWO,
    UserRole.DEAN,
  ];
  const isSuper = superRoles.includes(user.role as UserRole);

  let where: any = {};
  if (search) {
    where.studentId = { contains: search as string, mode: "insensitive" };
  }

  // 1. Role-based status filtering for Security
  if (user.role === UserRole.SECURITY) {
    where.isApproved = true;
    where.isExpired = false;
    where.isRejected = false;
  } else {
    // Requirement: Return only PENDING requests for approval views
    where.isApproved = false;
    where.isRejected = false;
    where.isExpired = false;
  }

  // 2. Gender-based filtering for Hostel Staff
  if (!isSuper && user.role !== UserRole.SECURITY) {
    const roleStr = user.role.toLowerCase();
    if (roleStr.includes("female")) {
      where.studentGender = "F";
    } else if (roleStr.includes("male")) {
      where.studentGender = "M";
    }
  }

  try {
    const outings = await prisma.outing.findMany({
      where,
      skip,
      take,
      orderBy: { requestedTime: "desc" },
    });
    const mapped = outings.map((o) => ({
      _id: o.id,
      ...o,
      username: o.studentId,
      is_approved: o.isApproved,
      is_rejected: o.isRejected,
      is_expired: o.isExpired,
      requested_time: o.requestedTime,
      from_time: o.fromTime,
      to_time: o.toTime,
      checked_in_time: o.checkedInTime,
      checked_out_time: o.checkedOutTime,
    }));
    return res.json({
      success: true,
      outings: mapped,
      pagination: { page: Number(page), limit: take },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch outing records.",
    });
  }
};

export const getAllOutpasses = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const { page = 1, limit = 50, search = "" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const superRoles = [
    UserRole.DIRECTOR,
    UserRole.WEBMASTER,
    UserRole.SWO,
    UserRole.DEAN,
  ];
  const isSuper = superRoles.includes(user.role as UserRole);

  let where: any = {};
  if (search) {
    where.studentId = { contains: search as string, mode: "insensitive" };
  }

  // 1. Role-based status filtering
  // Security sees APPROVED requests (for check-out operations)
  // All other roles see PENDING requests only (not approved, not rejected, not expired)
  if (user.role === UserRole.SECURITY) {
    where.isApproved = true;
    where.isExpired = false;
    where.isRejected = false;
  } else {
    // STRICT: Only pending requests for approval workflow
    // Never return approved outpasses to Caretakers/Wardens/Admins
    where.isApproved = false;
    where.isRejected = false;
    where.isExpired = false;
  }

  // 2. Gender-based filtering for Hostel Staff
  if (!isSuper && user.role !== UserRole.SECURITY) {
    const roleStr = user.role.toLowerCase();
    if (roleStr.includes("female")) {
      where.studentGender = "F";
    } else if (roleStr.includes("male")) {
      where.studentGender = "M";
    }
  }

  try {
    const outpasses = await prisma.outpass.findMany({
      where,
      skip,
      take,
      orderBy: { requestedTime: "desc" },
    });
    const mapped = outpasses.map((o) => ({
      _id: o.id,
      ...o,
      username: o.studentId,
      is_approved: o.isApproved,
      is_rejected: o.isRejected,
      is_expired: o.isExpired,
      requested_time: o.requestedTime,
      from_day: o.fromDay,
      to_day: o.toDay,
      checked_in_time: o.checkedInTime,
      checked_out_time: o.checkedOutTime,
    }));
    return res.json({
      success: true,
      outpasses: mapped,
      pagination: { page: Number(page), limit: take },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch outpass records.",
    });
  }
};

export const getSecuritySummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || user.role !== UserRole.SECURITY) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  const { search = "", limit = 50, page = 1 } = req.query;
  const limitNum = Number(limit);
  const skip = (Number(page) - 1) * limitNum;

  // 1. Pending Actions (For Dashboard)
  // Fetch requests that are Approved but NOT yet Checked In (Cycle incomplete)
  const pendingWhere: any = {
    isApproved: true,
    isRejected: false,
    isExpired: false,
    checkedInTime: null,
    studentId: search
      ? { contains: search as string, mode: "insensitive" }
      : undefined,
  };

  // 2. History (Completed) - Paginated
  const historyWhere: any = {
    checkedInTime: { not: null },
    studentId: search
      ? { contains: search as string, mode: "insensitive" }
      : undefined,
  };

  try {
    const [pendingOutings, pendingOutpasses, historyOutings, historyOutpasses] =
      await Promise.all([
        prisma.outing.findMany({
          where: pendingWhere,
          orderBy: { requestedTime: "desc" },
          take: 500,
        }),
        prisma.outpass.findMany({
          where: pendingWhere,
          orderBy: { requestedTime: "desc" },
          take: 500,
        }),
        prisma.outing.findMany({
          where: historyWhere,
          orderBy: { checkedInTime: "desc" },
          take: limitNum,
          skip,
        }),
        prisma.outpass.findMany({
          where: historyWhere,
          orderBy: { checkedInTime: "desc" },
          take: limitNum,
          skip,
        }),
      ]);

    const mapType = (list: any[], type: string) =>
      list.map((o) => ({ ...o, type }));

    const pending = [
      ...mapType(pendingOutings, "outing"),
      ...mapType(pendingOutpasses, "outpass"),
    ].sort(
      (a, b) =>
        new Date(b.requestedTime).getTime() -
        new Date(a.requestedTime).getTime(),
    );

    const history = [
      ...mapType(historyOutings, "outing"),
      ...mapType(historyOutpasses, "outpass"),
    ]
      .sort(
        (a, b) =>
          new Date(b.checkedInTime).getTime() -
          new Date(a.checkedInTime).getTime(),
      )
      .slice(0, limitNum);

    return res.json({
      success: true,
      pending_checkout: pending.filter((r) => !r.checkedOutTime),
      pending_checkin: pending.filter((r) => r.checkedOutTime),
      history,
      pagination: {
        page: Number(page),
        limit: limitNum,
      },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to generate security summary.",
    });
  }
};

// Dedicated Security Endpoints

// CHECK OUT (Exit Campus)
export const securityCheckOut = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;
  if (!user || user.role !== UserRole.SECURITY) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  try {
    const found = await fetchRequest(id, prisma);
    if (!found)
      return res.status(404).json({ code: ErrorCode.RESOURCE_NOT_FOUND });
    const { type, data: existing } = found;

    // Prevent double check-out
    if (existing.checkedOutTime) {
      return res.status(409).json({
        message: "Checkout Denied: Student already checked out.",
      });
    }

    if (!existing.isApproved || existing.isRejected || existing.isExpired) {
      return res.status(400).json({
        message:
          "Request is not valid for checkout (Must be Approved & Active)",
      });
    }

    // 1-Hour Expiration Rule Check
    const now = new Date().getTime();
    const issuedAt = new Date(existing.issuedTime).getTime();
    const oneHour = 60 * 60 * 1000;

    if (now - issuedAt > oneHour) {
      // Auto expire
      if (type === "outpass")
        await prisma.outpass.update({
          where: { id },
          data: { isExpired: true },
        });
      else
        await prisma.outing.update({
          where: { id },
          data: { isExpired: true },
        });

      // CLEAR PENDING in Profile Service
      try {
        await updateStudentProfileStatus(
          existing.studentId,
          req.headers.authorization?.split(" ")[1] || "",
          { isPending: false },
        );
      } catch (e) {
        console.warn("Pending status clear failed on expiry");
      }

      return res.status(400).json({
        message: "Approval expired (User did not check out within 1 hour)",
      });
    }

    // Proceed to Check Out - User is LEAVING campus
    const updateData = { checkedOutTime: new Date() };
    if (type === "outpass")
      await prisma.outpass.update({ where: { id }, data: updateData });
    else await prisma.outing.update({ where: { id }, data: updateData });

    // Mark student as OUTSIDE in Profile Service
    try {
      await updateStudentProfileStatus(
        existing.studentId,
        req.headers.authorization?.split(" ")[1] || "",
        { isPresent: false },
      );
    } catch (e) {
      console.warn("Presence update failed");
    }

    // Notify Student
    triggerNotification("CHECK_OUT", {
      recipient: `${existing.studentId}@rguktong.ac.in`,
      subject: "Checked Out",
      body: `You have successfully checked out at ${new Date().toLocaleTimeString()}. Safe journey!`,
      extra: { username: existing.studentId },
    }).catch((err) => {
      console.error("[OUTPASS] Background check-out notification failed:", err);
    });

    return res.json({ success: true, message: "Student Checked Out" });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to process checkout.",
    });
  }
};

// CHECK IN (Return to Campus)
export const securityCheckIn = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;
  if (!user || user.role !== UserRole.SECURITY) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  try {
    const found = await fetchRequest(id, prisma);
    if (!found)
      return res.status(404).json({ code: ErrorCode.RESOURCE_NOT_FOUND });
    const { type, data: existing } = found;

    // Validate Check-in: Must be checked out, and not checked in already
    if (!existing.checkedOutTime) {
      return res.status(400).json({
        message: "Check-in Denied: Student has not checked out yet.",
      });
    }
    if (existing.checkedInTime) {
      return res
        .status(409)
        .json({ message: "Check-in Denied: Student already checked in." });
    }

    // Mark In Time
    const updateData = { checkedInTime: new Date() };
    if (type === "outpass")
      await prisma.outpass.update({ where: { id }, data: updateData });
    else await prisma.outing.update({ where: { id }, data: updateData });

    // Mark student as INSIDE and CLEAR PENDING in Profile Service
    try {
      await updateStudentProfileStatus(
        existing.studentId,
        req.headers.authorization?.split(" ")[1] || "",
        { isPresent: true, isPending: false },
      );
    } catch (e) {
      console.warn("Presence update failed");
    }

    // Notify Student
    triggerNotification("CHECK_IN", {
      recipient: `${existing.studentId}@rguktong.ac.in`,
      subject: "Checked In",
      body: `Welcome back! You checked in at ${new Date().toLocaleTimeString()}.`,
      extra: { username: existing.studentId },
    }).catch((err) => {
      console.error("[OUTPASS] Background check-in notification failed:", err);
    });

    return res.json({ success: true, message: "Student Checked In" });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to process check-in.",
    });
  }
};
