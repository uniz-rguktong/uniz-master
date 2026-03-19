import { CronJob } from "cron";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import dotenv from "dotenv";
import { runStorageCleanup } from "./utils/storage";
dotenv.config({ override: true });

const prisma = new PrismaClient();

const clearPendingStatus = async (studentId: string) => {
  try {
    const GATEWAY =
      (process.env.DOCKER_ENV === "true"
        ? "http://uniz-gateway-api:3000/api/v1"
        : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1";
    const SECRET = process.env.INTERNAL_SECRET;
    if (!SECRET && process.env.NODE_ENV === "production")
      throw new Error("INTERNAL_SECRET missing");
    const INTERNAL_SECRET = SECRET || "uniz-core";
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

// Job 1: Expire Outpasses & Outings (Runs every 5 minutes for better security responsiveness)
export const runMaintenance = async () => {
  console.log("Running Maintenance Job (Expiry Checks)...");
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Find all about to expire
    const [
      expiringPastOutpasses,
      expiringPastOutings,
      expiringApprovedOutpasses,
      expiringApprovedOutings,
    ] = await Promise.all([
      prisma.outpass.findMany({
        where: { toDay: { lt: now }, isExpired: false },
        select: { studentId: true },
      }),
      prisma.outing.findMany({
        where: { toTime: { lt: now }, isExpired: false },
        select: { studentId: true },
      }),
      prisma.outpass.findMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: oneHourAgo },
        },
        select: { studentId: true },
      }),
      prisma.outing.findMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: oneHourAgo },
        },
        select: { studentId: true },
      }),
    ]);

    const studentIdsToClear = [
      ...new Set([
        ...expiringPastOutpasses.map((r) => r.studentId),
        ...expiringPastOutings.map((r) => r.studentId),
        ...expiringApprovedOutpasses.map((r) => r.studentId),
        ...expiringApprovedOutings.map((r) => r.studentId),
      ]),
    ];

    // 2. Perform Expiry
    const dateExpiredOutpasses = await prisma.outpass.updateMany({
      where: { toDay: { lt: now }, isExpired: false },
      data: { isExpired: true },
    });
    const dateExpiredOutings = await prisma.outing.updateMany({
      where: { toTime: { lt: now }, isExpired: false },
      data: { isExpired: true },
    });

    const approvalExpiredOutpasses = await prisma.outpass.updateMany({
      where: {
        isApproved: true,
        isExpired: false,
        checkedOutTime: null,
        issuedTime: { lt: oneHourAgo },
      },
      data: { isExpired: true },
    });
    const approvalExpiredOutings = await prisma.outing.updateMany({
      where: {
        isApproved: true,
        isExpired: false,
        checkedOutTime: null,
        issuedTime: { lt: oneHourAgo },
      },
      data: { isExpired: true },
    });

    // 3. Deep Cleanup: Find students stuck in "Pending" status in Profile Service
    try {
      const GATEWAY =
        (process.env.DOCKER_ENV === "true"
          ? "http://uniz-gateway-api:3000/api/v1"
          : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1";
      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

      // Search for all students marked as pending
      const pendingStudentsRes = await axios.post(
        `${GATEWAY}/profile/student/search`,
        { isApplicationPending: true, limit: 1000 },
        { headers: { "x-internal-secret": SECRET } },
      );

      if (
        pendingStudentsRes.data?.success &&
        pendingStudentsRes.data.students?.length > 0
      ) {
        const pendingUsernames = pendingStudentsRes.data.students.map(
          (s: any) => s.username,
        );
        console.log(
          `[CRON] Deep Cleanup: Auditing ${pendingUsernames.length} pending profiles...`,
        );

        for (const username of pendingUsernames) {
          const [activeOutpass, activeOuting] = await Promise.all([
            prisma.outpass.findFirst({
              where: {
                studentId: username,
                isRejected: false,
                isExpired: false,
                checkedInTime: null,
                OR: [
                  { toDay: { gte: now } },
                  { checkedOutTime: { not: null } },
                ],
              },
            }),
            prisma.outing.findFirst({
              where: {
                studentId: username,
                isRejected: false,
                isExpired: false,
                checkedInTime: null,
                OR: [
                  { toTime: { gte: now } },
                  { checkedOutTime: { not: null } },
                ],
              },
            }),
          ]);

          if (!activeOutpass && !activeOuting) {
            console.log(`[CRON] Auto-fixing stuck student: ${username}`);
            await clearPendingStatus(username);
          }
        }
      }
    } catch (cleanupErr: any) {
      console.error("[CRON] Deep cleanup failed:", cleanupErr.message);
    }

    // 4. Clear Pending Flags for newly expired requests (from lists in step 1)
    if (studentIdsToClear.length > 0) {
      console.log(
        `Clearing pending status for ${studentIdsToClear.length} newly expired students...`,
      );
      await Promise.all(
        studentIdsToClear.map((sid) => clearPendingStatus(sid)),
      );
    }

    console.log(
      `Maintenance Complete: Date Expired: ${dateExpiredOutpasses.count + dateExpiredOutings.count}, Approval Expired: ${approvalExpiredOutpasses.count + approvalExpiredOutings.count}`,
    );
  } catch (e) {
    console.error("Maintenance Job Failed", e);
  }
};

// Note: Internal Cron timers have been removed in favor of Kubernetes CronJobs (see infra/core-infra/kubernetes/base/storage-cleanup-job.yaml)
// This prevents redundant execution when the pod is used for both a long-running service and ephemeral jobs.

console.log("Cron Service (API Mode) Started");

import express from "express";
const app = express();

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "uniz-cron-service",
    message: "Use /api/cron to trigger maintenance jobs",
  });
});

// Trigger endpoint for External Schedulers (e.g. Vercel Cron)
app.get("/api/cron", async (req, res) => {
  await runMaintenance();
  res.json({ success: true, message: "Maintenance job executed" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

const server = app.listen(3008, () => {
  console.log("Cron Service Health Server Started on 3008");
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

// Graceful Shutdown Handler
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  try {
    if ((global as any).prisma || require("./utils/db.util").prisma) {
      // generic attempt to close prisma if it exists
    }
  } catch (e) {}
  process.exit(0);
});
// trigger rebuild
