import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePdf } from "@/lib/pdfGenerator";
import { inlineImages } from "@/lib/pdfHelper";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQRCode } from "@/lib/qrCode";
import { sendCertificateEmail, getWinnerEmailTemplate } from "@/lib/email";
import { cachePdf, invalidateCache } from "@/lib/pdfCache";
import logger from "@/lib/logger";
import { SlidingWindowLimiter } from "@/lib/rateLimiter";
import { redis } from "@/lib/redis";

/**
 * Handler-level rate limiter for winner certificate distribution.
 * 3 requests per 5 minutes per admin — this is a heavy operation
 * (PDF generation + email sending for every winning registration).
 */
const distributionRateLimiter = new SlidingWindowLimiter(
  "ratelimit:cert-distribute",
  3,
  "5 m",
);

export interface DistributeWinnersRequest {
  eventId: string;
}

const ALLOWED_DISTRIBUTION_ROLES = [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "HHO",
  "SPORTS_ADMIN",
  "BRANCH_SPORTS_ADMIN",
];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Role check ──
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, branch: true },
  });
  if (!admin || !ALLOWED_DISTRIBUTION_ROLES.includes(admin.role)) {
    return NextResponse.json(
      { error: "Forbidden: Admin role required" },
      { status: 403 },
    );
  }

  // ── Handler-level rate limit (3 / 5 min per admin) ──
  const rl = await distributionRateLimiter.limit(admin.id);
  if (!rl.success) {
    logger.warn(
      { adminId: admin.id, remaining: rl.remaining },
      "distribute.winners.rate_limited",
    );
    return NextResponse.json(
      { error: "Too many distribution requests. Please wait a few minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    );
  }

  try {
    const body = (await request.json()) as DistributeWinnersRequest;
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // ── Branch scope enforcement ──
    if (admin.role === "BRANCH_ADMIN") {
      const eventOwner = await prisma.event.findUnique({
        where: { id: eventId },
        select: { creator: { select: { branch: true } } },
      });
      if (eventOwner?.creator?.branch !== admin.branch) {
        return NextResponse.json(
          { error: "Forbidden: Event not in your branch" },
          { status: 403 },
        );
      }
    }

    const startMs = performance.now();

    // 1. Fetch Event and Winning Registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: "ATTENDED",
            rank: { not: null },
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Process Winners
    let count = 0;
    let emailCount = 0;
    let errorCount = 0;

    logger.info(
      { eventId, registrationCount: event.registrations.length },
      "distribute.winners.start",
    );

    for (const reg of event.registrations) {
      let templateName = "";
      let type = "";

      if (reg.rank === 1) {
        templateName = "gold.html";
        type = "MERIT_FIRST";
      } else if (reg.rank === 2) {
        templateName = "silver.html";
        type = "MERIT_SECOND";
      } else if (reg.rank === 3) {
        templateName = "bronze.html";
        type = "MERIT_THIRD";
      } else continue;

      try {
        const templatePath = path.join(
          process.cwd(),
          "src",
          "templates",
          templateName,
        );

        if (!fs.existsSync(templatePath)) {
          logger.warn(
            { templateName },
            "distribute.winners: template not found, skipping",
          );
          continue;
        }

        // Invalidate stale cache for re-distribution
        invalidateCache(reg.id);

        let templateHtml = fs.readFileSync(templatePath, "utf8");
        templateHtml = inlineImages(templateHtml);

        // Inject Data
        const html = templateHtml
          .replace(/{{studentName}}/g, reg.studentName)
          .replace(/{{eventName}}/g, event.title)
          .replace(/{{date}}/g, new Date(event.date).toLocaleDateString());

        // Generate QR Code
        const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify/${reg.id}`;
        const qrCodeDataUri = (await generateQRCode(verificationUrl)) || "";
        const htmlWithQr = html.replace(/{{qrCode}}/g, qrCodeDataUri);

        // Generate PDF via shared browser singleton + semaphore
        const pdfBuffer = await generatePdf(htmlWithQr);

        // Pre-warm the filesystem cache
        cachePdf(reg.id, pdfBuffer);

        // Update DB with lazy download URL
        const publicUrl = `/api/certificates/download/${reg.id}`;
        await prisma.registration.update({
          where: { id: reg.id },
          data: {
            certificateUrl: publicUrl,
            certificateType: type,
            certificateIssuedAt: new Date(),
          },
        });

        // Send Email — prefer user relation email, fall back to registration email
        const recipientEmail = reg.user?.email || reg.email;
        if (recipientEmail) {
          const emailHtml = getWinnerEmailTemplate(
            reg.studentName,
            event.title,
            reg.rank!,
            verificationUrl,
            reg.id,
          );
          const emailResult = await sendCertificateEmail(
            recipientEmail,
            `Congratulations! You won ${reg.rank === 1 ? "1st" : reg.rank === 2 ? "2nd" : "3rd"} Prize in ${event.title}`,
            emailHtml,
          );
          if (emailResult.success) {
            emailCount++;
          }
        }

        count++;
      } catch (err) {
        errorCount++;
        logger.error(
          { err, eventId, registrationId: reg.id },
          "distribute.winners.cert.error",
        );
      }
    }

    const durationMs = Math.round(performance.now() - startMs);
    logger.info(
      { eventId, count, emailCount, errorCount, durationMs },
      "distribute.winners.complete",
    );

    // ── Audit log ──
    await prisma.auditLog.create({
      data: {
        action: "DISTRIBUTE_WINNER_CERTIFICATES",
        entityType: "EVENT",
        entityId: eventId,
        performedBy: admin.id,
        metadata: { count, emailCount, errorCount, durationMs },
      },
    });

    return NextResponse.json({
      success: true,
      count,
      emailCount,
      message: `Generated ${count} merit certificates and sent ${emailCount} emails.`,
    });
  } catch (error: any) {
    logger.error({ err: error }, "distribute.winners.error");
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : (error as Error).message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
