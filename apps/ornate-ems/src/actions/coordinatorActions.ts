"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { executeAction } from "@/lib/api-utils";
import { revalidateUsers } from "@/lib/revalidation";
import { withPrismaPoolRetry } from "@/lib/prismaPoolRetry";
import { Prisma } from "@/lib/generated/client";

// Roles authorized to invite coordinators
const INVITE_AUTHORIZED_ROLES = [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "HHO",
  "CLUB_COORDINATOR",
] as const;

/**
 * Invites a new Event Coordinator.
 * Creates an Admin record (EVENT_COORDINATOR) and returns a unique invite token.
 *
 * Security: Requires authenticated session with an authorized role.
 */
export async function inviteCoordinator(
  eventId: string,
  { name, email, phone }: { name: string; email: string; phone?: string },
) {
  // ── AUTH GUARD ──────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Unauthorized: Not authenticated" };
  }
  const callerRole = (session.user as { role?: string }).role;
  const callerContext = session.user as {
    role?: string;
    branch?: string | null;
    clubId?: string | null;
  };
  if (
    !callerRole ||
    !(INVITE_AUTHORIZED_ROLES as readonly string[]).includes(callerRole)
  ) {
    return {
      error: "Unauthorized: Insufficient permissions to invite coordinators",
    };
  }

  const normalizedName = (name || "").trim();
  const normalizedEmail = (email || "").trim().toLowerCase();
  const normalizedPhone = phone?.trim() || null;
  const normalizedEventId = (eventId || "").trim();

  if (!normalizedEventId || !normalizedEmail || !normalizedName) {
    return { error: "Missing required fields" };
  }

  return executeAction(async () => {
    const targetEvent = await prisma.event.findUnique({
      where: { id: normalizedEventId },
      select: {
        id: true,
        title: true,
        creator: { select: { branch: true, clubId: true } },
      },
    });

    if (!targetEvent) {
      return { error: "Event not found" };
    }

    if (
      callerRole === "BRANCH_ADMIN" &&
      callerContext.branch &&
      targetEvent.creator?.branch &&
      callerContext.branch !== targetEvent.creator.branch
    ) {
      return {
        error:
          "Unauthorized: You can only invite coordinators for your branch events",
      };
    }

    if (
      callerRole === "CLUB_COORDINATOR" &&
      callerContext.clubId &&
      targetEvent.creator?.clubId &&
      callerContext.clubId !== targetEvent.creator.clubId
    ) {
      return {
        error:
          "Unauthorized: You can only invite coordinators for your club events",
      };
    }

    const targetName = targetEvent.title;

    // 1. Check if user already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true },
    });

    if (existingAdmin) {
      if (
        existingAdmin.role === "EVENT_COORDINATOR" ||
        existingAdmin.role === "BRANCH_ADMIN" ||
        existingAdmin.role === "CLUB_COORDINATOR"
      ) {
        const alreadyAssigned = await prisma.event.findFirst({
          where: {
            id: normalizedEventId,
            assignedCoordinators: { some: { id: existingAdmin.id } },
          },
          select: { id: true },
        });

        if (alreadyAssigned) {
          return {
            success: true,
            message: "Coordinator already assigned to this event",
          };
        }

        // Fetch name for the email
        const existingDetails = await prisma.admin.findUnique({
          where: { id: existingAdmin.id },
          select: { name: true, email: true },
        });

        await prisma.event.update({
          where: { id: normalizedEventId },
          data: {
            assignedCoordinators: {
              connect: { id: existingAdmin.id },
            },
          },
        });

        // Notify existing coordinator about the new assignment
        const dashboardUrl = `${process.env.NEXTAUTH_URL}/coordinator`;
        const resolvedName =
          existingDetails?.name ||
          normalizedName ||
          normalizedEmail.split("@")[0];
        await sendEmail({
          to: existingDetails?.email || normalizedEmail,
          subject: `You've been assigned to: ${targetName || "a new event"}`,
          html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #1a1a1a;">Event Assignment Notification</h2>
                            <p>Hello <strong>${resolvedName}</strong>,</p>
                            <p>You have been assigned as a coordinator for the event: <strong>${targetName || "a new event"}</strong>.</p>
                            <p>You can view the event and manage registrations from your coordinator dashboard:</p>
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Open Dashboard</a>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #888;">Ornate Event Management System</p>
                        </div>
                    `,
        });

        return { success: true, message: "Coordinator added (existing user)" };
      } else {
        return { error: "User exists with a different incompatible role" };
      }
    }

    // 2. Create New Coordinator with token
    const token = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    const tempPasswordHash = await bcrypt.hash(
      randomBytes(16).toString("hex"),
      10,
    );

    const newCoordinator = await prisma.admin.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: "EVENT_COORDINATOR",
        password: tempPasswordHash,
        coordinatorToken: token,
        coordinatorTokenExpiry: tokenExpiry,
        assignedEvents: {
          connect: { id: normalizedEventId },
        },
      },
    });

    // 3. Generate Invite Link and Send Email
    const inviteLink = `${process.env.NEXTAUTH_URL}/verify/coordinator?token=${token}`;

    const targetLabel = "event";
    const resolvedTargetName = targetName || `an upcoming ${targetLabel}`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Invitation to Coordinate: ${resolvedTargetName}`,
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1a1a1a;">Event Coordinator Invitation</h2>
                    <p>Hello <strong>${normalizedName}</strong>,</p>
                    <p>You have been invited to be a coordinator for the ${targetLabel}: <strong>${resolvedTargetName}</strong>.</p>
                    <p>Please click the button below to accept the invitation and set up your account password:</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
                    <p style="font-size: 14px; color: #666;">This link will expire in 7 days.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Ornate Event Management System</p>
                </div>
            `,
    });

    return {
      success: true,
      message: "Coordinator invited successfully",
      inviteLink,
    };
  }, "inviteCoordinator");
}

/**
 * Verify token and let the coordinator set their password
 */
export async function verifyCoordinatorToken(token: string) {
  const normalizedToken = (token || "").trim();
  if (!normalizedToken) return { error: "Token missing" };

  return executeAction(async () => {
    const coordinator = await prisma.admin.findUnique({
      where: { coordinatorToken: normalizedToken },
      select: {
        id: true,
        email: true,
        name: true,
        coordinatorTokenExpiry: true,
      },
    });

    if (!coordinator) {
      return { error: "Invalid invitation token" };
    }

    if (
      !coordinator.coordinatorTokenExpiry ||
      coordinator.coordinatorTokenExpiry < new Date()
    ) {
      return { error: "Invitation token has expired" };
    }

    return { success: true, email: coordinator.email, name: coordinator.name };
  }, "verifyCoordinatorToken");
}

/**
 * Set Password for the coordinator
 */
export async function setCoordinatorPassword(token: string, password: string) {
  const normalizedToken = (token || "").trim();
  if (!normalizedToken || !password) return { error: "Missing fields" };

  // Security: Enforce password policy
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { error: "Password must be at most 128 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { error: "Password must contain at least one number" };
  }

  return executeAction(async () => {
    // Re-verify token validity inside strictly
    const coordinator = await prisma.admin.findUnique({
      where: { coordinatorToken: normalizedToken },
      select: { id: true, coordinatorTokenExpiry: true },
    });

    if (
      !coordinator ||
      !coordinator.coordinatorTokenExpiry ||
      coordinator.coordinatorTokenExpiry < new Date()
    ) {
      return { error: "Invalid or expired token" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.update({
      where: { id: coordinator.id },
      data: {
        password: hashedPassword,
        coordinatorToken: null, // Invalidate token
        coordinatorTokenExpiry: null,
      },
    });

    return { success: true };
  }, "setCoordinatorPassword");
}

// ────────────────────────────────────────────────────────────
// Management actions (for CoordinatorManagementPage)
// ────────────────────────────────────────────────────────────

const MANAGE_AUTHORIZED_ROLES = [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "HHO",
  "CLUB_COORDINATOR",
] as const;

async function requireManageAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  const { role } = session.user as { id: string; role: string };
  if (!(MANAGE_AUTHORIZED_ROLES as readonly string[]).includes(role)) {
    throw new Error("Insufficient permissions");
  }
  return session.user as {
    id: string;
    role: string;
    branch?: string | null;
    clubId?: string | null;
  };
}

/**
 * Delete a coordinator (Admin record with EVENT_COORDINATOR role).
 * Only allowed for the same roles that may invite coordinators.
 */
export async function deleteCoordinator(coordinatorId: string) {
  return executeAction(async () => {
    await requireManageAuth();

    const coordinator = await prisma.admin.findUnique({
      where: { id: coordinatorId },
      select: { id: true, role: true },
    });

    if (!coordinator) return { error: "Coordinator not found" };
    if (coordinator.role !== "EVENT_COORDINATOR") {
      return { error: "Target is not a coordinator" };
    }

    await prisma.admin.delete({ where: { id: coordinatorId } });

    return { success: true, message: "Coordinator removed" };
  }, "deleteCoordinator");
}

/**
 * Update a coordinator's basic profile fields.
 */
export async function updateCoordinatorDetails(
  coordinatorId: string,
  data: { name?: string; email?: string; phone?: string },
) {
  return executeAction(async () => {
    await requireManageAuth();

    const coordinator = await prisma.admin.findUnique({
      where: { id: coordinatorId },
      select: { id: true, role: true },
    });

    if (!coordinator) return { error: "Coordinator not found" };
    if (coordinator.role !== "EVENT_COORDINATOR") {
      return { error: "Target is not a coordinator" };
    }

    const updateData: Record<string, string> = {};
    if (data.name?.trim()) updateData.name = data.name.trim();
    if (data.email?.trim()) updateData.email = data.email.trim().toLowerCase();
    if (data.phone?.trim()) updateData.phone = data.phone.trim();

    if (Object.keys(updateData).length === 0) {
      return { error: "No fields to update" };
    }

    await prisma.admin.update({
      where: { id: coordinatorId },
      data: updateData,
    });

    return { success: true, message: "Coordinator updated" };
  }, "updateCoordinatorDetails");
}

/**
 * Quick-add a coordinator (creates an unlinked Admin record).
 * For the full invite-with-email flow, use inviteCoordinator.
 */
export async function addCoordinatorQuick(data: {
  name: string;
  email: string;
  phone?: string;
}) {
  return executeAction(async () => {
    await requireManageAuth();

    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedName = data.name.trim();

    if (!normalizedName || !normalizedEmail) {
      return { error: "Name and email are required" };
    }

    const existing = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) return { error: "A user with this email already exists" };

    const tempPasswordHash = await bcrypt.hash(
      randomBytes(16).toString("hex"),
      10,
    );
    const token = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const created = await prisma.admin.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        role: "EVENT_COORDINATOR",
        password: tempPasswordHash,
        coordinatorToken: token,
        coordinatorTokenExpiry: tokenExpiry,
      },
    });

    // Send invite email
    const inviteLink = `${process.env.NEXTAUTH_URL}/verify/coordinator?token=${token}`;
    await sendEmail({
      to: normalizedEmail,
      subject: "Coordinator Account Invitation",
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1a1a1a;">Coordinator Invitation</h2>
                    <p>Hello <strong>${normalizedName}</strong>,</p>
                    <p>You have been added as a coordinator. Please click the button below to set up your account password:</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Set Up Account</a>
                    <p style="font-size: 14px; color: #666;">This link will expire in 7 days.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Ornate Event Management System</p>
                </div>
            `,
    });

    return {
      success: true,
      message: "Coordinator added and invite sent",
      id: created.id,
    };
  }, "addCoordinatorQuick");
}
