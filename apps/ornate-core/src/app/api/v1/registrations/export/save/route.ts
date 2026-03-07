import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";

export interface SaveExportRequest {
  csvContent: string;
  filename: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Admin role check ──
    const adminCheck = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, branch: true },
    });
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { csvContent, filename } = (await req.json()) as SaveExportRequest;

    if (!csvContent || !filename) {
      return NextResponse.json(
        { error: "Missing content or filename" },
        { status: 400 },
      );
    }

    // ── Size limit: reject CSV payloads larger than 5 MB ──
    const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5 MB
    if (csvContent.length > MAX_CSV_SIZE) {
      return NextResponse.json(
        { error: "CSV content exceeds 5 MB limit" },
        { status: 413 },
      );
    }

    // ── Path traversal prevention ──
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const exportsDir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const safeFilename = path
      .basename(filename)
      .replace(/[:.]/g, "-")
      .replace(/-csv$/, ".csv");

    // ── Branch-prefix the filename for tenant isolation ──
    // Format: "BRANCH__filename.csv" — used by the list route to filter by branch.
    // SUPER_ADMIN exports are prefixed with "SUPER_ADMIN__" so they remain accessible.
    const branchPrefix = adminCheck.branch || adminCheck.role;
    const scopedFilename = `${branchPrefix}__${safeFilename}`;

    const filePath = path.join(exportsDir, scopedFilename);

    fs.writeFileSync(filePath, csvContent);

    // Track in Database using already-fetched admin
    await prisma.auditLog.create({
      data: {
        action: "EXPORT_REGISTRATIONS",
        entityType: "REGISTRATION",
        entityId: "multiple",
        performedBy: adminCheck.id,
        metadata: {
          filename: scopedFilename,
          branch: adminCheck.branch || "SUPER_ADMIN",
          format: "CSV",
          size: (csvContent.length / 1024).toFixed(2) + " KB",
          url: `/exports/${scopedFilename}`,
        },
      },
    });

    return NextResponse.json({ success: true, filename: scopedFilename });
  } catch (error: any) {
    logger.error({ err: error }, "Save Internal Export Error");
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to save export"
        : (error as Error).message || "Failed to save export";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
