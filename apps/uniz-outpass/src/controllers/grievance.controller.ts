import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { z } from "zod"; // Assuming zod is available as per package.json
import axios from "axios";

const prisma = new PrismaClient();

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

    return res.json({
      success: true,
      data: grievances,
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
