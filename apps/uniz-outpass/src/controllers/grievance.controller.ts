import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { z } from "zod"; // Assuming zod is available as per package.json
import axios from "axios";

const GrievanceSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  isAnonymous: z.boolean().default(false),
});

const NOTIFICATION_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-notification-service:3007"
    : process.env.NOTIFICATION_SERVICE_URL) || "http://localhost:3007"
)
  .trim()
  .replace(/\/health$/, "");

const USER_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-user-service:3002"
    : process.env.USER_SERVICE_URL) || "http://localhost:3002"
).replace(/\/$/, "");

const GATEWAY_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

function formatGrievanceStatus(status?: string | null) {
  const raw = String(status || "pending").toLowerCase();
  if (raw === "resolved") return "Resolved";
  if (raw === "in-progress" || raw === "in progress") return "In Progress";
  return "Pending";
}

async function enrichGrievancesWithProfiles(grievances: any[]) {
  const usernames = [
    ...new Set(
      grievances
        .filter((g) => !g.isAnonymous && g.studentId)
        .map((g) => String(g.studentId).trim().toUpperCase()),
    ),
  ];

  const profileByUsername = new Map<string, any>();
  if (usernames.length > 0) {
    try {
      const res = await axios.post(
        `${USER_SERVICE_URL}/internal/bulk-profiles`,
        { usernames },
        {
          headers: { "x-internal-secret": INTERNAL_SECRET },
          timeout: 15000,
        },
      );
      for (const student of res.data?.students || []) {
        profileByUsername.set(String(student.username).toUpperCase(), student);
      }
    } catch (error: any) {
      console.warn(
        "[Grievance] Failed to enrich student profiles:",
        error?.message || error,
      );
    }
  }

  return grievances.map((g) => {
    const username = g.studentId
      ? String(g.studentId).trim().toUpperCase()
      : null;
    const profile = username ? profileByUsername.get(username) : null;

    return {
      ...g,
      username,
      studentName: profile?.name || null,
      studentEmail: g.studentEmail || profile?.email || null,
      studentBranch: profile?.branch || null,
      studentYear: profile?.year || null,
      studentPhone: profile?.phone_number || profile?.phone || null,
      status: formatGrievanceStatus(g.status),
    };
  });
}

// Helper for sending push notification
const sendPush = async (username: string, title: string, body: string) => {
  try {
    const url = `${NOTIFICATION_SERVICE_URL}/push/send`;
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    await axios.post(
      url,
      {
        target: "user",
        username: username,
        title,
        body,
      },
      {
        headers: { "x-internal-secret": SECRET },
        timeout: 5000,
      },
    );
    console.log(
      `[Grievance] Successfully sent push notification to: ${username}`,
    );
  } catch (e: any) {
    console.error(
      `[Grievance][ERROR] Failed to send push notification to ${username}:`,
      e.message,
    );
  }
};

export const submitGrievance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const parse = GrievanceSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: ErrorCode.VALIDATION_ERROR, errors: parse.error.errors });
  }

  const { category, description, isAnonymous } = parse.data;

  try {
    const grievance = await prisma.grievance.create({
      data: {
        studentId: isAnonymous ? null : user.username,
        studentEmail: isAnonymous
          ? null
          : user.email || `${user.username}@rguktong.ac.in`,
        category,
        description,
        isAnonymous,
      },
    });

    // Notify SWO (Assuming username 'swo' or role 'swo' exists, the push service sends by username)
    // We send to 'swo' username as a placeholder for the SWO account
    sendPush(
      "swo",
      "New Grievance Received",
      `A new grievance in category '${category}' has been submitted.`,
    );

    // Notify Student (only if not anonymous)
    if (!isAnonymous) {
      sendPush(
        user.username,
        "Grievance Submitted",
        `Your grievance regarding '${category}' has been received. Ticket ID: ${grievance.id.slice(-8).toUpperCase()}`,
      );
    }

    return res.json({
      success: true,
      message: "Grievance submitted successfully",
    });
  } catch (e: any) {
    console.error("Grievance Submit Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message:
        "We were unable to submit your grievance. Please try again later.",
    });
  }
};

export const getGrievances = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  // Only SWO or specific admins
  const allowedRoles = ["swo", "director", "admin"];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  try {
    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.grievance.count(),
    ]);

    const enriched = await enrichGrievancesWithProfiles(grievances);

    return res.json({
      success: true,
      data: enriched,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to retrieve grievances.",
    });
  }
};

async function sendGrievanceResolvedEmail(
  email: string,
  studentName: string,
  category: string,
) {
  const rawMailUrl = (
    process.env.MAIL_SERVICE_URL || `${GATEWAY_URL}/mail`
  ).trim();
  const MAIL_SERVICE_URL = rawMailUrl.endsWith("/health")
    ? rawMailUrl.slice(0, -7)
    : rawMailUrl;

  await axios.post(
    `${MAIL_SERVICE_URL}/send`,
    {
      type: "grievance_resolved",
      to: email,
      data: { studentName, category },
    },
    {
      headers: { "x-internal-secret": INTERNAL_SECRET },
      timeout: 10000,
    },
  );
}

export const resolveGrievance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowedRoles = ["swo", "director", "admin"];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  const { id } = req.params;
  try {
    const existing = await prisma.grievance.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Grievance not found.",
      });
    }

    if (String(existing.status).toLowerCase() === "resolved") {
      return res.status(400).json({
        code: ErrorCode.VALIDATION_ERROR,
        message: "This grievance is already resolved.",
      });
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedBy: user.username,
        resolvedAt: new Date(),
      },
    });

    let emailSent = false;
    if (!updated.isAnonymous && updated.studentId) {
      let email =
        updated.studentEmail ||
        `${String(updated.studentId).toLowerCase()}@rguktong.ac.in`;
      let studentName = String(updated.studentId).toUpperCase();

      try {
        const profileRes = await axios.post(
          `${USER_SERVICE_URL}/internal/bulk-profiles`,
          { usernames: [String(updated.studentId).toUpperCase()] },
          {
            headers: { "x-internal-secret": INTERNAL_SECRET },
            timeout: 10000,
          },
        );
        const profile = profileRes.data?.students?.[0];
        if (profile?.email) email = profile.email;
        if (profile?.name) studentName = profile.name;
      } catch (profileError: any) {
        console.warn(
          "[Grievance] Profile lookup for resolve email failed:",
          profileError?.message,
        );
      }

      try {
        await sendGrievanceResolvedEmail(
          email,
          studentName,
          updated.category,
        );
        emailSent = true;
      } catch (mailError: any) {
        console.error(
          "[Grievance] Failed to send resolve email:",
          mailError?.message,
        );
      }

      sendPush(
        updated.studentId,
        "Grievance Resolved",
        `Your concern about ${updated.category} has been received and we will resolve it.`,
      );
    }

    const [enriched] = await enrichGrievancesWithProfiles([updated]);

    return res.json({
      success: true,
      message: emailSent
        ? "Grievance resolved and student notified by email."
        : "Grievance resolved.",
      data: enriched,
      emailSent,
    });
  } catch (e) {
    console.error("Resolve Grievance Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to resolve grievance.",
    });
  }
};

export const deleteGrievance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowedRoles = ["swo", "director", "admin"];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  const { id } = req.params;
  try {
    await prisma.grievance.delete({ where: { id } });
    return res.json({ success: true, message: "Grievance deleted." });
  } catch (e) {
    return res.status(500).json({ code: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};

export const deleteAllGrievances = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowedRoles = ["swo", "director", "admin"];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  }

  try {
    await prisma.grievance.deleteMany({});
    return res.json({ success: true, message: "All grievances cleared." });
  } catch (e) {
    return res.status(500).json({ code: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};
