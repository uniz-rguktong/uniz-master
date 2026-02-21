import { CronJob } from "cron";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const clearPendingStatus = async (studentId: string) => {
  try {
    const GATEWAY = (process.env.DOCKER_ENV === "true" ? "http://uniz-gateway-api:3000/api/v1" : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1";
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
const runMaintenance = async () => {
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

    // 3. Clear Pending Flags in Profile Service
    if (studentIdsToClear.length > 0) {
      console.log(
        `Clearing pending status for ${studentIdsToClear.length} students...`,
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

// Job 1: Expire Outpasses (Runs every 5 minutes for better security responsiveness)
const maintenanceJob = new CronJob("*/5 * * * *", runMaintenance);
maintenanceJob.start();

console.log("Cron Service Started");

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

app.listen(3008, () => {
  console.log("Cron Service Health Server Started on 3008");
});
