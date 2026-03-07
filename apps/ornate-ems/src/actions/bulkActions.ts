"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateRegistrations } from "@/lib/revalidation";
import {
  RegistrationStatus,
  PaymentStatus,
  Prisma,
} from "@/lib/generated/client";
import { executeAction } from "@/lib/api-utils";

interface BulkImportRecord {
  studentName?: string;
  rollNumber?: string;
  email: string;
  phone?: string;
  eventName?: string;
  eventId?: string;
  status?: string;
  branch?: string;
  year?: string;
  paymentAmount?: string;
}

interface ExportFilters {
  eventId?: string;
  status?: string;
}

export interface BulkImportResponse {
  success?: boolean;
  error?: string;
  successful?: number;
  failed?: number;
  errors?: Array<{ record: string; error: string }>;
}

export interface BulkExportRow {
  [key: string]: string | number | null;
}

export interface BulkExportResponse {
  success?: boolean;
  error?: string;
  data?: BulkExportRow[];
}

/**
 * Bulk import registrations from an array of data
 */
export async function bulkImportRegistrations(
  data: BulkImportRecord[],
): Promise<BulkImportResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  // Security: Only SUPER_ADMIN and BRANCH_ADMIN can perform bulk imports
  const callerRole = (session.user as { role?: string }).role;
  if (!callerRole || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(callerRole)) {
    return { error: "Unauthorized: Insufficient permissions for bulk import" };
  }

  return executeAction(async () => {
    const results: Required<Omit<BulkImportResponse, "success" | "error">> = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // 1. Get all events for lookup if names are provided instead of IDs
    const events = await prisma.event.findMany({
      select: { id: true, title: true },
    });

    // 2. Process each record
    for (const record of data) {
      try {
        const {
          studentName,
          rollNumber,
          email,
          phone,
          eventName,
          eventId,
          status = "CONFIRMED",
        } = record;

        if (!email || (!eventName && !eventId)) {
          throw new Error(
            "Missing required fields: Email and (Event Name or Event ID)",
          );
        }

        // Find event
        let targetEventId = eventId;
        if (!targetEventId && eventName) {
          const event = events.find(
            (e) => e.title.toLowerCase() === eventName.toLowerCase(),
          );
          if (!event) throw new Error(`Event "${eventName}" not found`);
          targetEventId = event.id;
        }

        // Find or Create User
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: studentName ?? null,
              phone: phone ?? null,
              branch: record.branch || "General",
              currentYear: record.year || "N/A",
              password: "PBKDF2$SHA256$1000$dummy_password", // Placeholder
            },
          });
        }

        // Check if registration already exists
        if (!targetEventId) throw new Error("Event ID could not be resolved");

        const existing = await prisma.registration.findFirst({
          where: {
            eventId: targetEventId,
            OR: [
              { userId: user.id },
              ...(rollNumber ? [{ studentId: rollNumber }] : []),
            ],
          },
          select: { id: true },
        });

        if (existing) {
          throw new Error(`User already registered for this event`);
        }

        // Create Registration
        let validatedStatus: RegistrationStatus = RegistrationStatus.CONFIRMED;
        const recordStatus = String(status).toUpperCase();

        if (
          Object.values(RegistrationStatus).includes(
            recordStatus as RegistrationStatus,
          )
        ) {
          validatedStatus = recordStatus as RegistrationStatus;
        }

        await prisma.registration.create({
          data: {
            eventId: targetEventId,
            userId: user.id,
            studentName: studentName || user.name || "Unknown",
            studentId: rollNumber || "N/A",
            status: validatedStatus,
            amount: record.paymentAmount ? parseFloat(record.paymentAmount) : 0,
            paymentStatus: record.paymentAmount
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING,
          },
        });

        results.successful++;
      } catch (err: unknown) {
        results.failed++;
        results.errors.push({
          record: record.email || "Unknown",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    await revalidateRegistrations();
    return { success: true, ...results };
  }, "bulkImportRegistrations");
}

/**
 * Get data for export with filters
 */
export async function getExportData(
  filters: ExportFilters = {},
): Promise<BulkExportResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };

  return executeAction(async () => {
    const { eventId, status } = filters;

    const where: Prisma.RegistrationWhereInput = {};
    if (eventId && eventId !== "all" && eventId !== "All Events")
      where.eventId = eventId;
    if (status && status !== "all" && status !== "All Statuses") {
      const statusStr = (status.split(" ")[0] ?? "").toUpperCase();
      if (
        Object.values(RegistrationStatus).includes(
          statusStr as RegistrationStatus,
        )
      ) {
        where.status = statusStr as RegistrationStatus;
      }
    }

    // Apply club/branch scope
    const user = session.user as {
      role?: string;
      clubId?: string;
      branch?: string;
    };
    const adminRole = user.role;
    const adminClubId = user.clubId;
    const adminBranch = user.branch;

    if (adminRole === "CLUB_COORDINATOR" && adminClubId) {
      where.event = {
        creator: { clubId: adminClubId },
      } as Prisma.EventWhereInput;
    } else if (adminBranch && adminRole !== "SUPER_ADMIN") {
      where.event = {
        creator: { branch: adminBranch },
      } as Prisma.EventWhereInput;
    }

    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        studentName: true,
        studentId: true,
        createdAt: true,
        status: true,
        amount: true,
        transactionId: true,
        event: { select: { title: true, category: true } },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            branch: true,
            currentYear: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for CSV (flat object)
    const formatData = registrations.map((reg) => ({
      "Registration ID": reg.id.substring(0, 8).toUpperCase(),
      "Student Name": reg.studentName || reg.user?.name || "N/A",
      "Roll Number": reg.studentId || "N/A",
      Email: reg.user?.email || "N/A",
      Phone: reg.user?.phone || "N/A",
      Branch: reg.user?.branch || "N/A",
      Year: reg.user?.currentYear || "N/A",
      "Event Name": reg.event?.title || "N/A",
      Category: reg.event?.category || "N/A",
      "Registration Date": reg.createdAt.toISOString(),
      Status: reg.status,
      "Payment Amount": reg.amount,
      "Transaction ID": reg.transactionId || "N/A",
    }));

    return { success: true, data: formatData };
  }, "getExportData");
}
