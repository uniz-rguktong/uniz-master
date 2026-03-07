import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { generatePdf } from "@/lib/pdfGenerator";
import { inlineImages } from "@/lib/pdfHelper";
import { generateQRCode } from "@/lib/qrCode";
import { getCachedPdf, cachePdf } from "@/lib/pdfCache";
import logger from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Certificate ID is required" },
      { status: 400 },
    );
  }

  // ── Auth check ──
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, user: true },
    });

    if (!registration || !registration.event) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 },
      );
    }

    // ── Ownership / admin check: only the certificate owner or an admin can download ──
    const isOwner = registration.user?.email === session.user?.email;
    const isAdmin = session.user?.email
      ? await prisma.admin.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You can only download your own certificates" },
        { status: 403 },
      );
    }

    if (!registration || !registration.event) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 },
      );
    }

    const filename = `${registration.studentName.replace(/\s+/g, "_")}_${registration.event.title.replace(/\s+/g, "_")}.pdf`;

    // ── Cache Check ──────────────────────────────────────
    const cached = getCachedPdf(id);
    if (cached) {
      return new NextResponse(cached as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // ── Cache Miss — Full Render ─────────────────────────
    let templateName = "";
    let rankText = "";

    switch (registration.certificateType) {
      case "PARTICIPATION":
        templateName = "participation.html";
        break;
      case "MERIT_FIRST":
        templateName = "gold.html";
        rankText = "1st";
        break;
      case "MERIT_SECOND":
        templateName = "silver.html";
        rankText = "2nd";
        break;
      case "MERIT_THIRD":
        templateName = "bronze.html";
        rankText = "3rd";
        break;
      default:
        if (registration.rank === 1) {
          templateName = "gold.html";
          rankText = "1st";
        } else if (registration.rank === 2) {
          templateName = "silver.html";
          rankText = "2nd";
        } else if (registration.rank === 3) {
          templateName = "bronze.html";
          rankText = "3rd";
        } else {
          templateName = "participation.html";
        }
    }

    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      templateName,
    );
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Certificate template not found" },
        { status: 500 },
      );
    }

    let html = fs.readFileSync(templatePath, "utf8");
    html = inlineImages(html);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${registration.id}`;
    const qrCodeDataUrl = (await generateQRCode(verificationUrl)) || "";

    html = html
      .replace(/{{name}}/g, registration.studentName)
      .replace(/{{event}}/g, registration.event.title)
      .replace(
        /{{date}}/g,
        new Date(registration.event.date).toLocaleDateString(),
      )
      .replace(/{{qr_code}}/g, qrCodeDataUrl);

    if (rankText) {
      html = html.replace(/{{rank}}/g, rankText);
    }

    const pdfBuffer = await generatePdf(html);

    // Populate cache for future downloads
    cachePdf(id, pdfBuffer);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (error: any) {
    logger.error({ err: error, id }, "certificate.download.error");
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : "Internal Server Error: " + (error as Error).message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
