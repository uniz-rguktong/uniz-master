import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const GATEWAY = (process.env.DOCKER_ENV === "true" ? "http://uniz-gateway-api:3000/api/v1" : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1";
const SECRET = process.env.INTERNAL_SECRET;
if (!SECRET && process.env.NODE_ENV === "production")
  throw new Error("INTERNAL_SECRET missing");
const INTERNAL_SECRET = SECRET || "uniz-core";

const clearPendingStatus = async (studentId: string) => {
  try {
    await axios.put(
      `${GATEWAY}/profile/student/status`,
      {
        username: studentId,
        isPending: false,
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
      },
    );
  } catch (e: any) {
    console.error(
      `Failed to clear pending status for ${studentId}:`,
      e.message,
    );
  }
};

const sendExpiryNotification = async (
  studentId: string,
  type: "outing" | "outpass",
  reason: string,
) => {
  try {
    const studentEmail = `${studentId.toLowerCase()}@rguktong.ac.in`;
    await axios.post(
      `${GATEWAY}/mail/send`,
      {
        type: "request_expired", // Ensure mail service handles this or uses a generic template
        to: studentEmail,
        data: {
          username: studentId,
          type: type,
          reason: reason,
          message: `Your ${type} request has expired because the start time passed without approval. You can now apply for a new one or file a grievance if needed.`,
        },
      },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
      },
    );
    console.log(`Sent expiry notification to ${studentId}`);
  } catch (e: any) {
    console.error(
      `Failed to send expiry notification to ${studentId}:`,
      e.message,
    );
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check at root
  if (req.url === "/" || req.url === "/health") {
    return res.status(200).json({
      status: "ok",
      service: "uniz-cron-service",
      message: "Use /api/cron to trigger maintenance jobs",
    });
  }

  // Cron endpoint
  if (req.url?.includes("/api/cron") || req.url?.includes("/cron")) {
    try {
      console.log("Running Scheduled Maintenance...");

      // 0. Handle Timezone Offset (Campus is in IST +5:30)
      const now = new Date();
      // We adjust 'effectiveNow' to match the local campus time for comparison
      // since current data entry is storing local time strings as UTC.
      const indiaOffset = 5.5 * 60 * 60 * 1000;
      const effectiveNow = new Date(now.getTime() + indiaOffset);
      const approvalTimeoutThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour timeout from issuance

      // 1. Find all about to expire
      const [
        expiringPastOutpasses,
        expiringPastOutings,
        expiringApprovedOutpasses,
        expiringApprovedOutings,
      ] = await Promise.all([
        prisma.outpass.findMany({
          where: { toDay: { lt: effectiveNow }, isExpired: false },
          select: { studentId: true },
        }),
        prisma.outing.findMany({
          where: { toTime: { lt: effectiveNow }, isExpired: false },
          select: { studentId: true },
        }),
        prisma.outpass.findMany({
          where: {
            isApproved: true,
            isExpired: false,
            checkedOutTime: null,
            issuedTime: { lt: approvalTimeoutThreshold },
          },
          select: { studentId: true },
        }),
        prisma.outing.findMany({
          where: {
            isApproved: true,
            isExpired: false,
            checkedOutTime: null,
            issuedTime: { lt: approvalTimeoutThreshold },
          },
          select: { studentId: true },
        }),
        // Expiring STALE Pending Requests
        prisma.outing.findMany({
          where: {
            isApproved: false,
            isRejected: false,
            isExpired: false,
            issuedTime: { lt: approvalTimeoutThreshold }, // 1 hour for outings
          },
          select: { studentId: true },
        }),
        prisma.outpass.findMany({
          where: {
            isApproved: false,
            isRejected: false,
            isExpired: false,
            issuedTime: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // 24 hours for outpasses
          },
          select: { studentId: true },
        }),
      ]);

      // Pending Outing Expiry Threshold (Same as approval - 1 hour)
      const expiringPendingOutings = await prisma.outing.findMany({
        where: {
          isApproved: false,
          isRejected: false,
          isExpired: false,
          issuedTime: { lt: approvalTimeoutThreshold },
        },
        select: { studentId: true },
      });

      // Pending Outpass Expiry Threshold (24 hours)
      const pendingOutpassThreshold = new Date(
        now.getTime() - 6 * 60 * 60 * 1000,
      ); // reduced to 6 hours for better responsiveness
      const expiringPendingOutpasses = await prisma.outpass.findMany({
        where: {
          isApproved: false,
          isRejected: false,
          isExpired: false,
          issuedTime: { lt: pendingOutpassThreshold },
        },
        select: { studentId: true },
      });

      const studentIdsToClear = [
        ...new Set([
          ...expiringPastOutpasses.map((r) => r.studentId),
          ...expiringPastOutings.map((r) => r.studentId),
          ...expiringApprovedOutpasses.map((r) => r.studentId),
          ...expiringApprovedOutings.map((r) => r.studentId),
          ...expiringPendingOutings.map((r) => r.studentId),
          ...expiringPendingOutpasses.map((r) => r.studentId),
        ]),
      ];

      // 2. Perform Expiry Updates
      const dateExpiredOutpasses = await prisma.outpass.updateMany({
        where: { toDay: { lt: effectiveNow }, isExpired: false },
        data: { isExpired: true },
      });
      const dateExpiredOutings = await prisma.outing.updateMany({
        where: { toTime: { lt: effectiveNow }, isExpired: false },
        data: { isExpired: true },
      });

      const approvalExpiredOutpasses = await prisma.outpass.updateMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: approvalTimeoutThreshold },
        },
        data: { isExpired: true },
      });
      const approvalExpiredOutings = await prisma.outing.updateMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: approvalTimeoutThreshold },
        },
        data: { isExpired: true },
      });

      // 3. Expire Pending Requests that missed start time (User didn't get approval in time)
      // Or just stale pending requests (older than threshold)

      // Find Pending Outings where fromTime < now (Missed Start)
      const missedStartOutings = await prisma.outing.findMany({
        where: {
          isApproved: false,
          isRejected: false,
          isExpired: false,
          fromTime: { lt: effectiveNow },
        },
        select: { id: true, studentId: true },
      });

      // Find Pending Outpasses where fromDay < now (Missed Start Day)
      // Note: fromDay is usually midnight. If now > fromDay, it means the day has started/passed.
      const missedStartOutpasses = await prisma.outpass.findMany({
        where: {
          isApproved: false,
          isRejected: false,
          isExpired: false,
          fromDay: { lt: effectiveNow },
        },
        select: { id: true, studentId: true },
      });

      // Expire them and Notify
      for (const out of missedStartOutings) {
        await prisma.outing.update({
          where: { id: out.id },
          data: {
            isExpired: true,
            message: "Expired: Start time passed without approval.",
          },
        });
        await sendExpiryNotification(
          out.studentId,
          "outing",
          "Start time passed without approval",
        );
      }

      for (const out of missedStartOutpasses) {
        await prisma.outpass.update({
          where: { id: out.id },
          data: {
            isExpired: true,
            message: "Expired: Start day passed without approval.",
          },
        });
        await sendExpiryNotification(
          out.studentId,
          "outpass",
          "Start day passed without approval",
        );
      }

      // Also expire very old stale pending requests (e.g. created > 24h ago but somehow fromTime is future? Unlikely but good cleanup)
      const stalePendingOutings = await prisma.outing.findMany({
        where: {
          isApproved: false,
          isRejected: false,
          isExpired: false,
          issuedTime: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, studentId: true },
      });

      for (const out of stalePendingOutings) {
        await prisma.outing.update({
          where: { id: out.id },
          data: { isExpired: true, message: "Expired: Request stale (24h+)." },
        });
        // Optional: Notify for stale expiry too
      }

      // 4. Clear Pending Flags for ALL affected students
      const allAffectedStudents = [
        ...studentIdsToClear,
        ...missedStartOutings.map((o) => o.studentId),
        ...missedStartOutpasses.map((o) => o.studentId),
        ...stalePendingOutings.map((o) => o.studentId),
      ];
      const uniqueStudentsToClear = [...new Set(allAffectedStudents)];

      if (uniqueStudentsToClear.length > 0) {
        console.log(
          `Clearing pending status for ${uniqueStudentsToClear.length} students...`,
        );
        await Promise.all(
          uniqueStudentsToClear.map((sid) => clearPendingStatus(sid)),
        );
      }

      console.log(`Maintenance Complete: 
                Date Expired: ${dateExpiredOutpasses.count + dateExpiredOutings.count}, 
                Approval Expired: ${approvalExpiredOutpasses.count + approvalExpiredOutings.count}, 
                Missed Start: ${missedStartOutings.length + missedStartOutpasses.length}
            `);

      return res.status(200).json({
        success: true,
        report: {
          date_expired: dateExpiredOutpasses.count + dateExpiredOutings.count,
          approval_expired:
            approvalExpiredOutpasses.count + approvalExpiredOutings.count,
          missed_start_expired:
            missedStartOutings.length + missedStartOutpasses.length,
          pending_expired: stalePendingOutings.length, // + others if needed
          debug: {
            currentTime: now.toISOString(),
            effectiveTime: effectiveNow.toISOString(),
            threshold: approvalTimeoutThreshold.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Maintenance Failed:", error);
      return res.status(500).json({ error: "Cron Job Failed" });
    }
  }

  return res.status(404).json({ error: "Not Found" });
}
