import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    // Cron jobs are GET requests
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("Running Scheduled Maintenance...");

    // 1. Expire Outpasses
    const now = new Date();
    const expired = await prisma.outpass.updateMany({
      where: {
        toDay: { lt: now },
        isExpired: false,
        isApproved: true,
      },
      data: { isExpired: true },
    });

    // 2. Cleanup OTPs
    const cleaned = await prisma.otpLog.deleteMany({
      where: {
        expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    console.log(
      `Maintenance Complete: Expired ${expired.count} outpasses, Cleaned ${cleaned.count} OTPs.`,
    );

    return res.status(200).json({
      success: true,
      report: {
        expired_outpasses: expired.count,
        cleaned_otps: cleaned.count,
      },
    });
  } catch (error) {
    console.error("Maintenance Failed:", error);
    return res.status(500).json({ error: "Cron Job Failed" });
  }
}
