import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePdf } from "@/lib/pdfGenerator";
import { inlineImages } from "@/lib/pdfHelper";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQRCode } from "@/lib/qrCode";
import {
  sendCertificateEmail,
  getParticipationEmailTemplate,
} from "@/lib/email";
import { cachePdf, invalidateCache } from "@/lib/pdfCache";
import logger from "@/lib/logger";
import { SlidingWindowLimiter } from "@/lib/rateLimiter";
import { redis } from "@/lib/redis";

/**
 * Handler-level rate limiter for participation certificate distribution.
 * 3 requests per 5 minutes per admin — this is a heavy operation
 * (PDF generation + email sending for every registration).
 */
const distributionRateLimiter = new SlidingWindowLimiter(
  "ratelimit:cert-distribute",
  3,
  "5 m",
);

export interface DistributeRequest {
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
      "distribute.participation.rate_limited",
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
    const body = (await request.json()) as DistributeRequest;
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

    // 1. Fetch Event and Registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: "ATTENDED" },
          include: { user: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Read Template (once, reuse for all registrations)
    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "participation.html",
    );
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Participation template not found" },
        { status: 500 },
      );
    }
    let templateHtml = fs.readFileSync(templatePath, "utf8");
    templateHtml = inlineImages(templateHtml);

    // 3. Process Registrations
    let count = 0;
    let emailCount = 0;
    let errorCount = 0;

    logger.info(
      { eventId, registrationCount: event.registrations.length },
      "distribute.participation.start",
    );

    for (const reg of event.registrations) {
      try {
        // Invalidate any stale cache for re-distribution
        invalidateCache(reg.id);

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

        // Pre-warm the filesystem cache (replaces fs.writeFileSync to public/)
        cachePdf(reg.id, pdfBuffer);

        // Update DB with lazy download URL (not filesystem path)
        const publicUrl = `/api/certificates/download/${reg.id}`;
        await prisma.registration.update({
          where: { id: reg.id },
          data: {
            certificateUrl: publicUrl,
            certificateType: "PARTICIPATION",
            certificateIssuedAt: new Date(),
          },
        });

        // Send Email
        if (reg.user && reg.user.email) {
          const emailHtml = getParticipationEmailTemplate(
            reg.studentName,
            event.title,
            verificationUrl,
            reg.id,
          );
          const emailResult = await sendCertificateEmail(
            reg.user.email,
            `Participation Certificate for ${event.title}`,
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
          "distribute.participation.cert.error",
        );
      }
    }

    const durationMs = Math.round(performance.now() - startMs);
    logger.info(
      { eventId, count, emailCount, errorCount, durationMs },
      "distribute.participation.complete",
    );

    // ── Audit log ──
    await prisma.auditLog.create({
      data: {
        action: "DISTRIBUTE_PARTICIPATION_CERTIFICATES",
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
      message: `Generated ${count} participation certificates and sent ${emailCount} emails.`,
    });
  } catch (error: any) {
    logger.error({ err: error }, "distribute.participation.error");
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : (error as Error).message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
