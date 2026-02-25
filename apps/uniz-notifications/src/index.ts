import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import * as webpush from "web-push";
import prisma from "./utils/prisma.util";
import { attributionMiddleware } from "./middlewares/attribution.middleware";
import { requireAuth, requireAdmin } from "./middlewares/auth.middleware";
import PDFDocument, { info } from "pdfkit";

// --- PDF UTILS (pure Node, styled like official result sheets) ---
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
// --- END PDF UTILS ---

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", (err) => console.error("Redis connection error:", err));

const emailPoolStr = process.env.EMAIL_POOL || "";
const accounts = emailPoolStr
  ? emailPoolStr
      .split(",")
      .map((a) => a.split(":"))
      .filter((a) => a.length === 2)
  : [
      [
        process.env.EMAIL_USER || "noreply.uniz@gmail.com",
        process.env.EMAIL_PASS || "pdke hcfz fltp qagc",
      ],
    ];

let currentTransporterIndex = 0;
const transporters = accounts.map(([user, pass]) =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  }),
);

const getTransporter = () => {
  const transporter = transporters[currentTransporterIndex];
  currentTransporterIndex = (currentTransporterIndex + 1) % transporters.length;
  return transporter;
};

// --- RESEND SETUP ---
const resendKeys = (process.env.RESEND_POOL || "").split(",").filter(Boolean);
let currentResendIndex = 0;

const getResendKey = () => {
  if (resendKeys.length === 0) return null;
  const key = resendKeys[currentResendIndex];
  currentResendIndex = (currentResendIndex + 1) % resendKeys.length;
  return key;
};

const sendEmailUnified = async (
  options: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
  },
  highPriority: boolean = false,
): Promise<{ success: boolean; id?: string }> => {
  // 1. Try Resend ONLY for high priority (Manual OTP fallback only)
  // Per user request: "we only use email delivery for otp delivery only no other service"
  const apiKey = getResendKey();
  if (highPriority && apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from.replace("<", "").replace(">", ""),
          to: options.to,
          subject: options.subject,
          html: options.html,
          attachments: options.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content.toString("base64"),
          })),
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        console.log(
          `[NotificationWorker] Sent via Resend: ID=${data.id}, To=${options.to}`,
        );
        return { success: true, id: data.id };
      }
    } catch (err: any) {
      console.error(
        `[NotificationWorker] Resend failed, falling back:`,
        err.message,
      );
    }
  }

  // 2. Fallback or Direct to Gmail Pool
  try {
    const info = await getTransporter().sendMail(options);
    console.log(
      `[NotificationWorker] Sent via Gmail Pool: ID=${info.messageId}, To=${options.to}`,
    );
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(
      `[NotificationWorker] All email providers failed for ${options.to}:`,
      err.message,
    );
    return { success: false };
  }
};
// --- END RESEND SETUP ---

// --- WEB PUSH SETUP ---
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
  payload: { title: string; body: string; data?: any },
) => {
  try {
    // Only send to the 3 most recently active devices to prevent "noise" on old devices
    // and focus on the devices the user is currently using.
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { username },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions found for user: ${username}`);
      return;
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
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
            await prisma.pushSubscription
              .delete({ where: { endpoint: sub.endpoint } })
              .catch((e: any) =>
                console.error(
                  `[Push] Failed to delete stale sub: ${e.message}`,
                ),
              );
          } else {
            console.error(
              `[Push] Push failed for user ${username} (status=${statusCode}): ${pushErr.message}`,
            );
            throw pushErr;
          }
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[Push] Sent to ${subscriptions.length} device(s) for user: ${username} (ok=${succeeded} fail=${failed})`,
    );
  } catch (err: any) {
    console.error(`[Push] Error in sendWebPush: ${err.message}`);
  }
};
// --- END WEB PUSH SETUP ---

// Verify transporter pool at startup (non-blocking)
console.log(
  `[NotificationWorker] Verifying SMTP pool with ${transporters.length} accounts...`,
);
transporters[0]
  .verify()
  .then(() => {
    console.log("[NotificationWorker] Primary transporter is ready");
  })
  .catch((err) => {
    console.error(
      "[NotificationWorker] Primary transporter verification failed:",
      err.message,
    );
  });

// Queue handle used by HTTP test endpoint to enqueue test jobs
const notificationQueue = new Queue("notification-queue", {
  connection,
});

const emailTemplate = (title: string, content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1a1a1b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #eeeeee; border-radius: 8px;">
    <!-- Minimal Header -->
    <div style="margin-bottom: 30px; border-bottom: 2px solid #cc0000; padding-bottom: 15px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #cc0000; letter-spacing: -0.5px;">UniZ Academics</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 10px 0;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #000000;">${title}</h2>
      <div style="font-size: 15px; color: #374151;">
        ${content}
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
      <p style="font-size: 13px; color: #6b7280; margin: 0;">
        Regards,<br>
        <strong>Office of Academic Affairs</strong><br>
        Rajiv Gandhi University of Knowledge Technologies - AP
      </p>
      <p style="font-size: 11px; color: #9ca3af; margin-top: 20px;">
        This is an official automated notification. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;

// NOTE: Jobs are enqueued with their BullMQ job name used as the "type"
// (e.g. "EMAIL", "RESULTS", "ATTENDANCE_REPORT"). The original implementation
// looked at job.data.type instead, so RESULTS/ATTENDANCE_REPORT jobs were never
// processed and no emails were sent. The worker now switches on job.name and
// derives the recipient from job.data.recipient or job.data.username.
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
        console.log(
          `${logPrefix} Attempting EMAIL send`,
          JSON.stringify({
            to: rawRecipient,
            subject,
          }),
        );

        // Generic EMAIL jobs are disabled per user policy
        console.log(
          `[NotificationWorker] Generic email suppressed for ${rawRecipient}`,
        );
        /*
        const emailResult = await sendEmailUnified(
          {
            from: '"UniZ Campus" <noreply@uniz.rguktong.in>',
            to: rawRecipient,
            subject: subject || "UniZ Notification",
            html:
              html ||
              emailTemplate(subject || "Notification", `<p>${body}</p>`),
          },
          false,
        ); // Notification worker jobs are never high priority for Resend
        */
        const emailResult = { success: true, id: "SUPPRESSED" }; // Mock result for suppressed email

        // Trigger Targeted Web Push for outpass/outing/profile notifications
        const pushSubjects = [
          "outpass",
          "outing",
          "profile",
          "security alert",
          "login",
        ];
        const subjectLower = (subject || "").toLowerCase();
        const shouldPush = pushSubjects.some((k) => subjectLower.includes(k));
        if (shouldPush) {
          const pushUsername =
            (job.data as any).username || rawRecipient.split("@")[0];
          await sendWebPush(pushUsername, {
            title: subject || "UniZ Notification",
            body: body || "You have a new update on UniZ.",
            data: { type: "GENERIC" },
          });
        }

        console.log(
          `${logPrefix} EMAIL send result`,
          JSON.stringify({
            to: rawRecipient,
            success: emailResult.success,
            id: emailResult.id,
          }),
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

        console.log(
          `${logPrefix} Sending RESULTS email`,
          JSON.stringify({
            to: rawRecipient,
            semesterId,
            withAttachment: !!pdfBuffer,
          }),
        );

        // RESULTS email jobs are disabled per user policy
        console.log(
          `[NotificationWorker] Results email suppressed for ${rawRecipient}`,
        );
        /*
        const emailResult = await sendEmailUnified(
          {
            from: '"UniZ Academics" <noreply@uniz.rguktong.in>',
            to: rawRecipient,
            subject: `Result Declaration: ${semesterId}`,
            html: emailTemplate(
              `Result Declaration: ${semesterId}`,
              `<p>Dear Student,<br><br>The results for <strong>${semesterId}</strong> have been published.${
                pdfBuffer
                  ? "<br>Please find the detailed grade report attached."
                  : "<br>(Note: PDF generation is currently unavailable; this email has no attachment.)"
              }</p>`,
            ),
            attachments: pdfBuffer
              ? [
                  {
                    filename: `ACADEMIC_REPORT_${(job.data as any).username}_${semesterId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              : [],
          },
          false,
        ); // Results are NOT high priority for Resend
        */
        const emailResult = { success: true, id: "SUPPRESSED" }; // Mock result for suppressed email

        console.log(
          `${logPrefix} RESULTS email sent`,
          JSON.stringify({
            to: rawRecipient,
            success: emailResult.success,
            id: emailResult.id,
          }),
        );
        // Results are email-only, no push notification
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

        console.log(
          `${logPrefix} Sending ATTENDANCE_REPORT email`,
          JSON.stringify({
            to: rawRecipient,
            semesterId,
            withAttachment: !!pdfBuffer,
          }),
        );

        // ATTENDANCE email jobs are disabled per user policy
        console.log(
          `[NotificationWorker] Attendance email suppressed for ${rawRecipient}`,
        );
        /*
        const emailResult = await sendEmailUnified(
          {
            from: '"UniZ Academics" <noreply@uniz.rguktong.in>',
            to: rawRecipient,
            subject: `Attendance Report: ${semesterId}`,
            html: emailTemplate(
              `Attendance Report: ${semesterId}`,
              `<p>Dear Student,<br><br>The attendance report for <strong>${semesterId}</strong> is now available.${
                pdfBuffer
                  ? "<br>Please find your detailed attendance record attached."
                  : "<br>(Note: PDF generation is currently unavailable; this email has no attachment.)"
              }</p>`,
            ),
            attachments: pdfBuffer
              ? [
                  {
                    filename: `${(job.data as any).username.toUpperCase()}_Attendance_${semesterId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              : [],
          },
          false,
        ); // Attendance is NOT high priority for Resend
        */
        const emailResult = { success: true, id: "SUPPRESSED" }; // Mock result for suppressed email

        console.log(
          `${logPrefix} ATTENDANCE_REPORT email sent`,
          JSON.stringify({
            to: rawRecipient,
            success: emailResult.success,
            id: emailResult.id,
          }),
        );
        // Attendance is email-only, no push notification
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
  { connection, concurrency: 5 }, // Process 5 jobs at once for throughput
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

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        username,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        username,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res
      .status(201)
      .json({ status: "success", message: "Subscribed successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    const { target, username, batch, year, title, body, image } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    let subscriptions: {
      endpoint: string;
      p256dh: string;
      auth: string;
      username: string;
    }[] = [];

    if (target === "user") {
      if (!username)
        return res
          .status(400)
          .json({ error: "username required for target=user" });
      subscriptions = await prisma.pushSubscription.findMany({
        where: { username },
      });
    } else if (target === "batch") {
      if (!batch)
        return res
          .status(400)
          .json({ error: "batch required for target=batch (e.g. o21, o22)" });
      subscriptions = await prisma.pushSubscription.findMany({
        where: { username: { startsWith: batch, mode: "insensitive" } },
      });
    } else if (target === "year") {
      if (!year)
        return res.status(400).json({
          error: "year required for target=year (e.g. E1,E2,E3,E4,P1...)",
        });
      // Match usernames that contain the year pattern — stored in profile, filter by batch prefix
      // e.g year=o21 sends to all o21* users
      subscriptions = await prisma.pushSubscription.findMany({
        where: { username: { startsWith: year, mode: "insensitive" } },
      });
    } else if (target === "all") {
      subscriptions = await prisma.pushSubscription.findMany();
    } else {
      return res
        .status(400)
        .json({ error: "target must be one of: user, batch, year, all" });
    }

    if (subscriptions.length === 0) {
      return res.status(200).json({ status: "no_subscribers", sent: 0 });
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      image,
      icon: "/assets/ongole_logo.png",
      badge: "/assets/ongole_logo.png",
      tag: `uniz-broadcast-${Date.now()}`,
      data: { type: "BROADCAST" },
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
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Push][Broadcast] target=${target} sent=${succeeded} failed=${failed}`,
    );
    res.json({
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
      parseInt((req.query.limit as string) || "100", 10),
    );
    const skip = (page - 1) * limit;

    const where = prefix
      ? {
          OR: [
            { username: { startsWith: prefix.toLowerCase() } },
            { username: { startsWith: prefix.toUpperCase() } },
            { username: { startsWith: prefix, mode: "insensitive" as any } },
          ],
        }
      : {};

    // Get unique usernames matching the filter
    const allMatching = await prisma.pushSubscription.findMany({
      where,
      select: { username: true },
      distinct: ["username"],
    });

    const total_users = allMatching.length;

    // Get paginated results
    const paginatedUsernames = allMatching
      .slice(skip, skip + limit)
      .map((u) => u.username);

    const counts = await prisma.pushSubscription.groupBy({
      by: ["username"],
      where: { username: { in: paginatedUsernames } },
      _count: { endpoint: true },
    });

    const subscribers = paginatedUsernames.map((uname) => {
      const c = counts.find((g) => g.username === uname);
      return {
        username: uname,
        devices: c?._count.endpoint || 0,
      };
    });

    res.json({
      status: "ok",
      total_users,
      page,
      limit,
      subscribers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
