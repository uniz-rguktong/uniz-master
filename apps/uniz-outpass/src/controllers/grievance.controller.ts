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

// Helper for sending mail
const sendMail = async (type: string, to: string, data: any) => {
  try {
    const GATEWAY = process.env.GATEWAY_URL || "http://localhost:3000/api/v1";
    const SECRET = process.env.INTERNAL_SECRET;
    if (!SECRET && process.env.NODE_ENV === "production")
      throw new Error("INTERNAL_SECRET missing");

    await axios.post(
      `${GATEWAY}/mail/send`,
      {
        type,
        to,
        data,
      },
      {
        headers: { "x-internal-secret": SECRET },
      },
    );
  } catch (e: any) {
    console.error(`Failed to send mail (${type}) to ${to}:`, e.message);
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

    // Notify SWO
    await sendMail("admin_alert", "swo@rguktong.ac.in", {
      studentName: isAnonymous
        ? "Anonymous Student"
        : (user as any).name || user.username,
      studentId: isAnonymous ? "HIDDEN" : user.username,
      reason: `Grievance [${category}]: ${description}`,
      type: "grievance",
    });

    // Notify Student (only if not anonymous)
    if (!isAnonymous) {
      await sendMail(
        "grievance_submission",
        user.email || `${user.username}@rguktong.ac.in`,
        {
          category,
          ticketId: grievance.id,
        },
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

  try {
    const grievances = await prisma.grievance.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: grievances });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to retrieve grievances.",
    });
  }
};
