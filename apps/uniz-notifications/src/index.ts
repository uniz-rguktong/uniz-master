/**
 * ==============================================================================
 * UNIZ MICROSERVICES - NOTIFICATION ENGINE & PDF ORCHESTRATOR
 * ==============================================================================
 * Advanced service for asynchronous task delivery. Orchestrates:
 * 1. High-fidelity PDF generation (Results/Attendance reports)
 * 2. Multi-channel targeted Web Push delivery
 * 3. High-througput job queuing via BullMQ & Redis
 * ==============================================================================
 */

import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import * as webpush from "web-push";
import prisma from "./utils/prisma.util";
import { attributionMiddleware } from "./middlewares/attribution.middleware";
import { requireAuth, requireAdmin } from "./middlewares/auth.middleware";
import PDFDocument, { info } from "pdfkit";
import axios from "axios";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://uniz-user-service:3002";

// ------------------------------------------------------------------------------
// 1. PDF DOCUMENT GENERATION UTILITIES
// ------------------------------------------------------------------------------

const PAGE_MARGIN = 40;

const createPdfBuffer = async (
  draw: (doc: InstanceType<typeof PDFDocument>) => void,
): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
    const chunks: any[] = [];

    doc.on("data", (chunk: any) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", (err: Error) => {
      reject(err);
    });

    try {
      draw(doc);
      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
};

const generateResultPdf = async (data: any): Promise<Buffer> => {
  const { name, username, branch, semesterId, grades, campus } = data;

  // Calculate GPA/Credits
  let totalCredits = 0;
  let earnedPoints = 0;
  grades.forEach((g: any) => {
    const credit = Number(g.subject.credits);
    const gradePoint = Number(g.grade);
    totalCredits += credit;
    if (credit > 0) {
      earnedPoints += credit * (gradePoint > 0 ? gradePoint : 0);
    }
  });

  const sgpa =
    totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";

  let titleText = `${semesterId.toUpperCase()} RESULTS`;

  /* 
    Title Logic:
    1. Try to parse E#S# or P#S# from semesterId (e.g., "E2S1", "AY24-E3-S2")
    2. Try to extract Semester (S1-S3)
    3. Fallback: Infer Year from Subject Code if missing
  */

  let yearStr = "";
  let semStr = "";

  const yearMatch = semesterId.match(/([EP])[-_ ]?([1-4])/i);
  if (yearMatch) yearStr = `${yearMatch[1].toUpperCase()}${yearMatch[2]}`;

  const semMatch = semesterId.match(/S(?:em(?:ester)?)?[-_ ]?([1-3])/i);
  if (semMatch) semStr = semMatch[1];

  if (
    !yearStr &&
    grades.length > 0 &&
    grades[0].subject &&
    grades[0].subject.code
  ) {
    const codeMatch = grades[0].subject.code.match(/^[a-zA-Z]+[-_ ]?([1-4])/);
    if (codeMatch) yearStr = `E${codeMatch[1]}`;
  }

  if (yearStr && semStr) {
    titleText = `${yearStr} SEMESTER-${semStr} RESULTS`;
  } else {
    titleText = `${semesterId.toUpperCase()} RESULTS`.replace(
      " RESULTS RESULTS",
      " RESULTS",
    );
  }

  const getGradeLetter = (point: number) => {
    if (point >= 10) return "EX";
    if (point >= 9) return "A";
    if (point >= 8) return "B";
    if (point >= 7) return "C";
    if (point >= 6) return "D";
    if (point >= 5) return "E";
    return "R";
  };

  const rows = grades.map((g: any) => ({
    title: g.subject.name,
    credits: Number(g.subject.credits).toFixed(1),
    gradeLetter: getGradeLetter(g.grade),
  }));

  return createPdfBuffer((doc) => {
    const { width } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;
    const tableStartX = PAGE_MARGIN;

    // Professional Colors
    const NAVY = "#1e293b";
    const RED = "#cc0000";
    const LIGHT_GRAY = "#f8fafc";
    const BORDER_COLOR = "#e2e8f0";

    // Header - University Name
    doc
      .fillColor(RED)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE", { align: "center" });
    doc.text("TECHNOLOGIES - ANDHRA PRADESH", { align: "center" });

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "(Established by the Govt. of Andhra Pradesh and recognized as per Section 2(f), 12(B) of UGC Act, 1956)",
        { align: "center" },
      );

    doc.moveDown(0.5);
    doc
      .lineWidth(1.5)
      .strokeColor("#fbbf24")
      .moveTo(tableStartX, doc.y)
      .lineTo(tableStartX + usableWidth, doc.y)
      .stroke();
    doc.moveDown(1.2);

    // Document Title
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`GRADE REPORT - ${semesterId.toUpperCase()}`, {
        align: "center",
        underline: true,
      });
    doc.moveDown(1.5);

    // Student Info Box
    const infoY = doc.y;
    doc
      .rect(tableStartX, infoY, usableWidth, 45)
      .fill(LIGHT_GRAY)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
    doc.text("ID NO:", tableStartX + 10, infoY + 10);
    doc.text("NAME:", tableStartX + 10, infoY + 25);
    doc.text("BRANCH:", tableStartX + usableWidth / 2 + 10, infoY + 10);
    doc.text("CAMPUS:", tableStartX + usableWidth / 2 + 10, infoY + 25);

    doc.font("Helvetica").fillColor("#334155");
    doc.text(username, tableStartX + 60, infoY + 10);
    doc.text(name, tableStartX + 60, infoY + 25);
    doc.text(branch, tableStartX + usableWidth / 2 + 65, infoY + 10);
    doc.text(campus, tableStartX + usableWidth / 2 + 65, infoY + 25);

    doc.moveDown(3);

    // Table Setup
    const colTitleWidth = usableWidth * 0.7;
    const colCreditsWidth = usableWidth * 0.15;
    const colGradeWidth = usableWidth * 0.15;

    let tableY = doc.y;

    // Header
    doc.rect(tableStartX, tableY, usableWidth, 22).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    doc.text("COURSE TITLE", tableStartX + 10, tableY + 7);
    doc.text("CREDITS", tableStartX + colTitleWidth, tableY + 7, {
      width: colCreditsWidth,
      align: "center",
    });
    doc.text(
      "GRADE",
      tableStartX + colTitleWidth + colCreditsWidth,
      tableY + 7,
      { width: colGradeWidth, align: "center" },
    );

    tableY += 22;
    doc.font("Helvetica").fontSize(9).fillColor("#1e293b");

    rows.forEach(
      (
        r: { title: string; credits: string; gradeLetter: string },
        index: number,
      ) => {
        const textHeight = doc.heightOfString(r.title, {
          width: colTitleWidth - 20,
        });
        const rowHeight = Math.max(20, textHeight + 10);

        if (tableY + rowHeight > doc.page.height - 100) {
          doc.addPage();
          tableY = 50;
        }

        if (index % 2 === 0) {
          doc.rect(tableStartX, tableY, usableWidth, rowHeight).fill("#f1f5f9");
        }

        doc.fillColor("#1e293b");
        doc.text(r.title, tableStartX + 10, tableY + 6, {
          width: colTitleWidth - 20,
        });
        doc.text(r.credits, tableStartX + colTitleWidth, tableY + 6, {
          width: colCreditsWidth,
          align: "center",
        });
        doc.text(
          r.gradeLetter,
          tableStartX + colTitleWidth + colCreditsWidth,
          tableY + 6,
          { width: colGradeWidth, align: "center" },
        );

        tableY += rowHeight;
        doc
          .strokeColor(BORDER_COLOR)
          .lineWidth(0.2)
          .moveTo(tableStartX, tableY)
          .lineTo(tableStartX + usableWidth, tableY)
          .stroke();
      },
    );

    // Summary Box
    doc.moveDown(1);
    const summaryY = tableY + 10;
    doc
      .rect(tableStartX + usableWidth * 0.6, summaryY, usableWidth * 0.4, 40)
      .fill(LIGHT_GRAY)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10);
    doc.text(
      "TOTAL CREDITS:",
      tableStartX + usableWidth * 0.6 + 10,
      summaryY + 8,
    );
    doc.text("SGPA:", tableStartX + usableWidth * 0.6 + 10, summaryY + 22);

    doc
      .font("Helvetica")
      .text(
        totalCredits.toFixed(1),
        tableStartX + usableWidth - 50,
        summaryY + 8,
        { align: "right" },
      );
    doc.text(sgpa, tableStartX + usableWidth - 50, summaryY + 22, {
      align: "right",
    });

    // Footer
    doc
      .fontSize(7)
      .fillColor("#64748b")
      .text(
        `This is a computer-generated grade report and does not require a physical signature. Issued on ${new Date().toLocaleString()}`,
        tableStartX,
        doc.page.height - 40,
        { align: "center" },
      );
  });
};
const generateAttendancePdf = async (data: any): Promise<Buffer> => {
  const { name, username, branch, semesterId, records, campus } = data;

  let totalAttended = 0;
  let totalClasses = 0;
  records.forEach((r: any) => {
    totalAttended += r.attendedClasses;
    totalClasses += r.totalClasses;
  });

  const overallPercent =
    totalClasses > 0
      ? ((totalAttended / totalClasses) * 100).toFixed(2)
      : "0.00";

  const rows = records.map((r: any) => {
    const percent =
      r.totalClasses > 0
        ? ((r.attendedClasses / r.totalClasses) * 100).toFixed(1)
        : "0.0";
    return {
      title: `${r.subject.name} (${r.subject.code})`,
      attended: r.attendedClasses,
      total: r.totalClasses,
      percent,
    };
  });

  return createPdfBuffer((doc) => {
    const { width } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;
    const tableStartX = PAGE_MARGIN;

    // Professional Colors
    const NAVY = "#0f172a";
    const RED = "#cc0000";
    const LIGHT_GRAY = "#f8fafc";
    const BORDER_COLOR = "#cbd5e1";

    // Header
    doc
      .fillColor(RED)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE", { align: "center" });
    doc.text("TECHNOLOGIES - ANDHRA PRADESH", { align: "center" });

    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "(Established by the Govt. of Andhra Pradesh and recognized as per Section 2(f), 12(B) of UGC Act, 1956)",
        { align: "center" },
      );

    doc.moveDown(0.5);
    doc
      .lineWidth(1.5)
      .strokeColor("#f59e0b")
      .moveTo(tableStartX, doc.y)
      .lineTo(tableStartX + usableWidth, doc.y)
      .stroke();
    doc.moveDown(1.2);

    // Title
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`ATTENDANCE REPORT - ${semesterId.toUpperCase()}`, {
        align: "center",
        underline: true,
      });
    doc.moveDown(1.5);

    // Student Info
    const infoY = doc.y;
    doc
      .rect(tableStartX, infoY, usableWidth, 40)
      .fill(LIGHT_GRAY)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
    doc.text("STUDENT ID:", tableStartX + 10, infoY + 10);
    doc.text("NAME:", tableStartX + 10, infoY + 22);
    doc.text("BRANCH:", tableStartX + usableWidth / 2, infoY + 10);
    doc.text("CAMPUS:", tableStartX + usableWidth / 2, infoY + 22);

    doc.font("Helvetica").fillColor("#334155");
    doc.text(username, tableStartX + 75, infoY + 10);
    doc.text(name, tableStartX + 75, infoY + 22);
    doc.text(branch, tableStartX + usableWidth / 2 + 55, infoY + 10);
    doc.text(campus, tableStartX + usableWidth / 2 + 55, infoY + 22);

    doc.moveDown(3);

    // Table
    const colTitleWidth = usableWidth * 0.6;
    const colAttendedWidth = usableWidth * 0.2;
    const colPercentWidth = usableWidth * 0.2;

    let tableY = doc.y;
    const tableHeaderY = tableY;

    // Header
    doc.rect(tableStartX, tableY, usableWidth, 20).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    doc.text("COURSE TITLE", tableStartX + 10, tableY + 6);
    doc.text("ATT/TOTAL", tableStartX + colTitleWidth, tableY + 6, {
      width: colAttendedWidth,
      align: "center",
    });
    doc.text("%", tableStartX + colTitleWidth + colAttendedWidth, tableY + 6, {
      width: colPercentWidth,
      align: "center",
    });

    tableY += 20;
    doc.font("Helvetica").fontSize(9).fillColor("#1e293b");

    rows.forEach(
      (
        r: { title: string; attended: number; total: number; percent: string },
        idx: number,
      ) => {
        const textHeight = doc.heightOfString(r.title, {
          width: colTitleWidth - 20,
        });
        const rowHeight = Math.max(20, textHeight + 6);

        if (tableY + rowHeight > doc.page.height - 80) {
          doc.addPage();
          tableY = 50;
        }

        if (idx % 2 === 0) {
          doc.rect(tableStartX, tableY, usableWidth, rowHeight).fill("#f8fafc");
        }

        doc.fillColor("#1e293b");
        doc.text(r.title, tableStartX + 10, tableY + 5, {
          width: colTitleWidth - 20,
        });
        doc.text(
          `${r.attended} / ${r.total}`,
          tableStartX + colTitleWidth,
          tableY + 5,
          { width: colAttendedWidth, align: "center" },
        );
        doc.text(
          `${r.percent}%`,
          tableStartX + colTitleWidth + colAttendedWidth,
          tableY + 5,
          { width: colPercentWidth, align: "center" },
        );

        tableY += rowHeight;
        doc
          .strokeColor("#e2e8f0")
          .lineWidth(0.2)
          .moveTo(tableStartX, tableY)
          .lineTo(tableStartX + usableWidth, tableY)
          .stroke();
      },
    );

    // Summary
    const summaryY = tableY + 10;
    doc
      .rect(tableStartX + usableWidth * 0.5, summaryY, usableWidth * 0.5, 35)
      .fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
    doc.text(
      "OVERALL PERCENTAGE:",
      tableStartX + usableWidth * 0.5 + 10,
      summaryY + 12,
    );
    doc.text(
      `${overallPercent}%`,
      tableStartX + usableWidth - 50,
      summaryY + 12,
      { align: "right" },
    );

    // Footer
    doc.y = summaryY + 60; // Ensure enough spacing
    doc.fillColor("#64748b").fontSize(8).font("Helvetica-Oblique");
    doc.text(
      "* Minimum 75% attendance is required to appear for Semester End Examinations.",
      tableStartX,
      doc.y,
      { width: usableWidth },
    );

    doc.moveDown(0.5);
    doc
      .fontSize(7)
      .font("Helvetica")
      .text(
        `Generated on: ${new Date().toLocaleString()}`,
        tableStartX,
        doc.y,
        { width: usableWidth, align: "right" },
      );
  });
};
// ------------------------------------------------------------------------------
// 2. DISPATCHER & CONNECTION INITIALIZATION
// ------------------------------------------------------------------------------

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", (err) => console.error("Redis connection error:", err));

// ------------------------------------------------------------------------------
// 3. TARGETED WEB PUSH INFRASTRUCTURE
// ------------------------------------------------------------------------------
const publicVapidKey =
  process.env.VAPID_PUBLIC_KEY ||
  "BBUDnL9QZfs1W_wmn1kCW7U81ISk0isqNro00JEIamFsQaMGqC3AO8nnK32jY94o3zCg0Thuz-Le1o3mH3Z8Thc";
const privateVapidKey =
  process.env.VAPID_PRIVATE_KEY ||
  "oWMk2dkJanNgjqhOAmcJ9cf4dLFaFQSmsvPyD1AlMzw";

webpush.setVapidDetails(
  "mailto:admin@uniz.rguktong.in",
  publicVapidKey,
  privateVapidKey,
);

const sendWebPush = async (
  username: string,
  payload: { title: string; body: string; data?: any; name?: string },
): Promise<number> => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { username: { equals: username, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions found for user: ${username}`);
      return 0;
    }

    const recipientName = payload.name || username;
    const professionalBody = `Dear ${recipientName},\n\n${payload.body}`;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: professionalBody,
      icon: "/assets/ongole_logo.png",
      badge: "/assets/ongole_logo.png",
      tag: payload.data?.tag || `uniz-${username}-${Date.now()}`,
      data: payload.data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload,
            { TTL: 86400, urgency: "high" }, // 24h window + High urgency to wake up background devices
          );
          console.log(`[Push] ✅ Sent to endpoint: ${sub.endpoint.slice(-30)}`);
        } catch (pushErr: any) {
          const statusCode = pushErr.statusCode || pushErr.status;
          // 410 Gone = subscription expired/unsubscribed; 404 Not Found = invalid endpoint
          // Both mean we must delete the subscription from DB — it will NEVER work again
          if (statusCode === 410 || statusCode === 404) {
            console.warn(
              `[Push] Subscription expired (${statusCode}) for user ${username}. Deleting endpoint: ${sub.endpoint.slice(-30)}`,
            );
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
          } else {
            console.error(
              `[Push] Push failed for user ${username} (status=${statusCode}): ${pushErr.message}`,
            );
            throw pushErr;
          }
        }
      }),
    );

    const succeededCount = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    console.log(
      `[Push] User=${username}: reached ${succeededCount}/${subscriptions.length} devices.`,
    );
    return succeededCount;
  } catch (err: any) {
    console.error(`[Push] Error in sendWebPush: ${err.message}`);
    return 0;
  }
};
// --- END WEB PUSH SETUP ---

// Email transporter logic removed.
// Policy: No active emails from notification service.
// Primary email provider (SES) is in uniz-mail for OTPs.

// ------------------------------------------------------------------------------
// 4. BULLMQ JOB WORKER ORCHESTRATION
// ------------------------------------------------------------------------------

console.log(
  "[NotificationWorker] Initializing Worker for notification-queue...",
);
const worker = new Worker(
  "notification-queue",
  async (job) => {
    const jobType = job.name as string;
    const logPrefix = `[NotificationWorker][${jobType}][jobId=${job.id}]`;

    console.log(
      `${logPrefix} Received job`,
      JSON.stringify({
        attemptsMade: job.attemptsMade,
        timestamp: new Date().toISOString(),
      }),
    );

    // Resolve recipient:
    // 1. Explicit recipient field (generic EMAIL jobs)
    // 2. Derived from username for RESULTS/ATTENDANCE_REPORT jobs
    const rawRecipient =
      (job.data as any).recipient ||
      ((job.data as any).username
        ? `${String((job.data as any).username).toLowerCase()}@rguktong.ac.in`
        : undefined);

    if (!rawRecipient) {
      console.error(
        `${logPrefix} Missing recipient/username in job data; cannot send email.`,
      );
      console.error(`${logPrefix} Payload snapshot:`, job.data);
      throw new Error("Recipient email could not be resolved from job data");
    }

    const subject: string | undefined = (job.data as any).subject;
    const body: string | undefined = (job.data as any).body;
    const html: string | undefined = (job.data as any).html;

    try {
      if (jobType === "EMAIL") {
        // Targeted Web Push Only
        const pushUsername =
          (job.data as any).username || rawRecipient.split("@")[0];
        const pushSentCount = await sendWebPush(pushUsername, {
          title: subject || "UniZ Academic Notification",
          body:
            body ||
            "A new academic update has been posted. Please review the details at your earliest convenience.",
          name: (job.data as any).name,
          data: { type: "GENERIC" },
        });

        console.log(
          `${logPrefix} Targeted push reached ${pushSentCount} devices. Email suppressed per policy.`,
        );
      } else if (jobType === "RESULTS") {
        const { semesterId } = job.data as any;
        console.log(
          `${logPrefix} Generating results PDF`,
          JSON.stringify({
            username: (job.data as any).username,
            semesterId,
          }),
        );

        let pdfBuffer: Buffer | null = null;
        try {
          pdfBuffer = await generateResultPdf(job.data);
        } catch (e: any) {
          console.error(
            `${logPrefix} Failed to generate Result PDF, will send email without attachment: ${e.message}`,
          );
        }

        // Targeted Push Notice Only
        const pushUsername = (job.data as any).username;
        const pushSentCount = await sendWebPush(pushUsername, {
          title: "Examination Results Published",
          body: `We are pleased to inform you that the official academic results for ${semesterId} have been published and are now available for your review on the UniZ portal.`,
          name: (job.data as any).name,
          data: { type: "RESULTS", semesterId },
        });

        console.log(
          `${logPrefix} Targeted push reached ${pushSentCount} devices. Results email suppressed.`,
        );

        console.log(
          `${logPrefix} RESULTS processing complete for ${rawRecipient}`,
        );
      } else if (jobType === "ATTENDANCE_REPORT") {
        const { semesterId } = job.data as any;
        console.log(
          `${logPrefix} Generating attendance PDF`,
          JSON.stringify({
            username: (job.data as any).username,
            semesterId,
          }),
        );

        let pdfBuffer: Buffer | null = null;
        try {
          pdfBuffer = await generateAttendancePdf(job.data);
        } catch (e: any) {
          console.error(
            `${logPrefix} Failed to generate Attendance PDF, will send email without attachment: ${e.message}`,
          );
        }

        // PRIORITY 1: Push Notice
        const pushUsername = (job.data as any).username;
        const pushSentCount = await sendWebPush(pushUsername, {
          title: "Attendance Report Generated",
          body: `Your comprehensive attendance record for the ${semesterId} academic term has been generated. Please log in to the portal to verify your attendance status.`,
          name: (job.data as any).name,
          data: { type: "ATTENDANCE", semesterId },
        });

        console.log(
          `${logPrefix} Targeted push reached ${pushSentCount} devices. Attendance email suppressed.`,
        );

        console.log(
          `${logPrefix} ATTENDANCE_REPORT processing complete for ${rawRecipient}`,
        );
      } else {
        console.warn(
          `${logPrefix} Unknown job type; skipping processing.`,
          JSON.stringify({ jobName: job.name }),
        );
      }
    } catch (err: any) {
      console.error(
        `${logPrefix} Error while processing job: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  },
  {
    connection,
    concurrency: 10,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

worker.on("completed", (job) => {
  const logPrefix = `[NotificationWorker][${job.name}][jobId=${job.id}]`;
  console.log(
    `${logPrefix} Job completed`,
    JSON.stringify({
      attemptsMade: job.attemptsMade,
      timestamp: new Date().toISOString(),
    }),
  );
});

worker.on("failed", (job, err) => {
  const logPrefix = `[NotificationWorker][${
    job?.name ?? "UNKNOWN"
  }][jobId=${job?.id ?? "unknown"}]`;
  console.error(
    `${logPrefix} Job failed`,
    JSON.stringify({
      attemptsMade: job?.attemptsMade,
      errorMessage: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  );
});

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json());

if (attributionMiddleware) app.use(attributionMiddleware);

app.get("/", (req, res) => {
  res.json({
    service: "uniz-notification-service",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      subscribe: "/subscribe",
    },
    buildTimestamp: "2026-02-21T07:42:00Z",
    vapidPublicKey: publicVapidKey,
  });
});

app.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const { username, subscription } = req.body;
    if (!username || !subscription) {
      return res
        .status(400)
        .json({ error: "Missing username or subscription" });
    }

    const targetUsername = username.toLowerCase();

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        username: targetUsername,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        username: targetUsername,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /push/send
 * Webmaster-triggered targeted push notification.
 * Body: { target: "user"|"batch"|"year"|"all", username?, batch?, year?, title, body }
 *   target=user   → send to specific username
 *   target=batch  → send to all users whose username starts with batch (e.g. "o21")
 *   target=year   → send to users in a specific academic year (stored as username prefix year digit)
 *   target=all    → send to all subscribed users
 */
app.post("/push/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { target, username, batch, year, branch, title, body, image } =
      req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const t = target?.toLowerCase();
    let targetUsers: Array<{ username: string; name?: string }> = [];

    if (t === "user") {
      if (!username)
        return res
          .status(400)
          .json({ error: "username required for target=user" });
      targetUsers = [{ username }];
    } else if (t === "batch") {
      if (!batch)
        return res
          .status(400)
          .json({ error: "batch required for target=batch (e.g. o21, o22)" });
      try {
        const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
        const response = await axios.post(
          `${USER_SERVICE_URL}/internal/targeting`,
          { target: "students", branch: "all", year: "all" },
          { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
        );
        if (response.data.success) {
          targetUsers = response.data.users.filter((u: any) =>
            u.username.toLowerCase().startsWith(batch.toLowerCase()),
          );
        }
      } catch (e: any) {
        console.error(`[Push] User Service fetch failed: ${e.message}`);
      }
    } else if (t === "year") {
      if (!year)
        return res.status(400).json({
          error: "year required for target=year (e.g. E1,E2,E3,E4,P1...)",
        });
      try {
        const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
        const response = await axios.post(
          `${USER_SERVICE_URL}/internal/targeting`,
          { target: "students", branch: "all", year: year },
          { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
        );
        if (response.data.success) {
          targetUsers = response.data.users;
        }
      } catch (e: any) {
        console.error(`[Push] User Service fetch failed: ${e.message}`);
      }
    } else if (t === "dean" || t === "hod" || t === "students") {
      try {
        const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
        const response = await axios.post(
          `${USER_SERVICE_URL}/internal/targeting`,
          { target: t, branch, year },
          { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
        );
        if (response.data.success) {
          targetUsers = response.data.users;
        }
      } catch (e: any) {
        console.error(`[Push] User Service fetch failed: ${e.message}`);
      }
    } else if (t === "all") {
      // Fetch all for personalization
      try {
        const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
        const [students, faculty, deans] = await Promise.all([
          axios
            .post(
              `${USER_SERVICE_URL}/internal/targeting`,
              { target: "students" },
              { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
            )
            .catch(() => ({ data: { users: [] } })),
          axios
            .post(
              `${USER_SERVICE_URL}/internal/targeting`,
              { target: "hod" },
              { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
            )
            .catch(() => ({ data: { users: [] } })),
          axios
            .post(
              `${USER_SERVICE_URL}/internal/targeting`,
              { target: "dean" },
              { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
            )
            .catch(() => ({ data: { users: [] } })),
        ]);
        targetUsers = [
          ...students.data.users,
          ...faculty.data.users,
          ...deans.data.users,
        ];
      } catch (e: any) {
        console.warn("[Push] Global fetch partially failed");
      }
    } else {
      return res.status(400).json({
        error:
          "target must be one of: user, batch, year, all, dean, hod, students",
      });
    }

    const targetUsernames = targetUsers.map((u) => u.username.toLowerCase());
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        username: {
          in: targetUsernames,
        },
      },
    });

    console.log(
      `[Push] TargetUsers: ${targetUsers.length}, Subscriptions: ${subscriptions.length} for target=${t}`,
    );

    if (subscriptions.length === 0) {
      return res
        .status(200)
        .json({ success: true, status: "no_subscribers", sent: 0 });
    }

    const results = await Promise.allSettled(
      targetUsers.flatMap((u) => {
        const userSubs = subscriptions.filter(
          (s) => s.username.toUpperCase() === u.username.toUpperCase(),
        );
        const personalizedBody =
          `Dear ${u.name || u.username},\n\n` +
          body
            .replace(/{{name}}/g, u.name || u.username)
            .replace(/{{username}}/g, u.username);
        const personalizedTitle = title
          .replace(/{{name}}/g, u.name || u.username)
          .replace(/{{username}}/g, u.username);

        const pushPayload = JSON.stringify({
          title: personalizedTitle,
          body: personalizedBody,
          image,
          icon: "/assets/ongole_logo.png",
          badge: "/assets/ongole_logo.png",
          tag: `uniz-broadcast-${Date.now()}`,
          data: { type: "BROADCAST" },
        });

        return userSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              pushPayload,
              { TTL: 86400, urgency: "high" },
            );
          } catch (pushErr: any) {
            const statusCode = pushErr.statusCode || pushErr.status;
            if (statusCode === 410 || statusCode === 404) {
              await prisma.pushSubscription
                .delete({ where: { endpoint: sub.endpoint } })
                .catch(() => {});
            } else {
              throw pushErr;
            }
          }
        });
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Push][Broadcast] target=${target} sent=${succeeded} failed=${failed}`,
    );
    res.json({
      success: true,
      status: "done",
      sent: succeeded,
      failed,
      total: subscriptions.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /push/subscribers
 * Returns all users who have at least one active push subscription.
 * Optional query params:
 *   ?prefix=o21   → filter by username prefix (e.g. batch)
 *   ?page=1&limit=100 → paginate results
 */
app.get("/push/subscribers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const prefix = req.query.prefix as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(
      500,
      parseInt((req.query.limit as string) || "50", 10),
    );
    const skip = (page - 1) * limit;

    const where: any = {};
    if (prefix) {
      where.username = { startsWith: prefix, mode: "insensitive" };
    }

    const [total, subscribers] = await Promise.all([
      prisma.pushSubscription.count({ where }),
      prisma.pushSubscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      total,
      page,
      limit,
      subscribers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "uniz-notification-service" });
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

const port = process.env.PORT ? Number(process.env.PORT) : 3007;

// In local/dev we want an HTTP health server on a port.
const server = app.listen(port, () => {
  console.log(`Notification Service Worker & Health Server Started on ${port}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

console.log("Notification Service Worker Started");

export default app;

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
