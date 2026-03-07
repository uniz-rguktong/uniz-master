"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidateUsers } from "@/lib/revalidation";
import { UserRole } from "@/lib/generated/client";
import { executeAction } from "@/lib/api-utils";

const ROLE_MAP: Record<string, UserRole> = {
  super_admin: UserRole.SUPER_ADMIN,
  "Super Admin": UserRole.SUPER_ADMIN,
  branch_admin: UserRole.BRANCH_ADMIN,
  "Branch Admin": UserRole.BRANCH_ADMIN,
  club_coordinator: UserRole.CLUB_COORDINATOR,
  Clubs: UserRole.CLUB_COORDINATOR,
  Sports: UserRole.SPORTS_ADMIN,
  "Branch Sports": UserRole.BRANCH_SPORTS_ADMIN,
  hho_coordinator: UserRole.HHO,
  HHO: UserRole.HHO,
  ornate_committee: UserRole.EVENT_COORDINATOR,
  "Event Coordinator": UserRole.EVENT_COORDINATOR,
};

function resolveRole(input: string): UserRole | null {
  return ROLE_MAP[input] ?? null;
}

export interface AdminUpdateInput {
  name?: string;
  email?: string;
  role?: string;
  branch?: string;
  clubId?: string;
}

export interface AdminCreateInput {
  name: string;
  email: string;
  password: string;
  role: string;
  branch?: string;
  clubId?: string;
}

export async function createAdminUser(data: AdminCreateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const { name, email, password, role, branch, clubId } = data;

    if (!email || !password || !role) {
      return { error: "Missing required fields" };
    }

    // Check if user already exists
    const existingUser = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Map role
    const dbRole = resolveRole(role);
    if (!dbRole) {
      return { error: "Invalid role" };
    }

    await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: dbRole,
        branch: branch || null,
        clubId: clubId || null,
      },
    });

    await revalidateUsers();
    return { success: true };
  }, "createAdminUser");
}

export async function updateAdminUser(userId: string, data: AdminUpdateInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const { name, email, role, branch, clubId } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (branch !== undefined) updateData.branch = branch || null;
    if (clubId !== undefined) updateData.clubId = clubId || null;

    // Map role if provided
    if (role) {
      const dbRole = resolveRole(role);
      if (!dbRole) {
        return { error: "Invalid role" };
      }
      updateData.role = dbRole;
    }

    await prisma.admin.update({
      where: { id: userId },
      data: updateData,
    });

    await revalidateUsers();
    return { success: true };
  }, "updateAdminUser");
}

export async function deleteAdminUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    await prisma.admin.delete({
      where: { id: userId },
    });

    await revalidateUsers();
    return { success: true };
  }, "deleteAdminUser");
}

export async function resetAdminPassword(userId: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }, "resetAdminPassword");
}

// ─────────────────────────────────────────────────────────
// Student (User table) Actions
// ─────────────────────────────────────────────────────────

export interface StudentUpdateInput {
  name?: string;
  email?: string;
  branch?: string;
  currentYear?: string;
  phone?: string;
}

export async function updateStudentUser(
  userId: string,
  data: StudentUpdateInput,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const { name, email, branch, currentYear, phone } = data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name || null;
    if (email !== undefined) updateData.email = email;
    if (branch !== undefined) updateData.branch = branch || null;
    if (currentYear !== undefined) updateData.currentYear = currentYear || null;
    if (phone !== undefined) updateData.phone = phone || null;

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await revalidateUsers();
    return { success: true };
  }, "updateStudentUser");
}

export async function deleteStudentUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    // Delete related registrations first to avoid FK constraint violations
    await prisma.registration.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await revalidateUsers();
    return { success: true };
  }, "deleteStudentUser");
}

export async function resetStudentPassword(
  userId: string,
  newPassword: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }, "resetStudentPassword");
}

export async function getStudentDetails(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: true,
        currentYear: true,
        phone: true,
        createdAt: true,
        registrations: {
          select: {
            id: true,
            studentName: true,
            studentId: true,
            status: true,
            createdAt: true,
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                category: true,
                venue: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return { error: "Student not found" };
    }

    return { success: true, data: student };
  }, "getStudentDetails");
}

export async function getEventsForAssignment() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const events = await prisma.event.findMany({
      where: {
        registrationOpen: true,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        date: true,
        category: true,
        venue: true,
        maxCapacity: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        category: e.category,
        venue: e.venue,
        maxCapacity: e.maxCapacity,
        registrationCount: e._count.registrations,
        isFull: e._count.registrations >= e.maxCapacity,
      })),
    };
  }, "getEventsForAssignment");
}

export async function getEventRegistrations(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        date: true,
        venue: true,
        category: true,
        maxCapacity: true,
        fee: true,
        status: true,
        description: true,
        registrationOpen: true,
        creator: { select: { name: true, branch: true } },
      },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentName: true,
        studentId: true,
        email: true,
        phone: true,
        branch: true,
        year: true,
        section: true,
        status: true,
        paymentStatus: true,
        amount: true,
        transactionId: true,
        createdAt: true,
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
    });

    return {
      success: true,
      data: {
        event: {
          ...event,
          date: event.date.toISOString(),
          organizer: event.creator?.name || event.creator?.branch || "System",
        },
        registrations: registrations.map((r) => ({
          id: r.id,
          studentName: r.studentName || r.user?.name || "Unknown",
          studentId: r.studentId,
          email: r.email || r.user?.email || "—",
          phone: r.phone || r.user?.phone || "—",
          branch: r.branch || r.user?.branch || "—",
          year: r.year || r.user?.currentYear || "—",
          section: r.section || "—",
          status: r.status,
          paymentStatus: r.paymentStatus,
          amount: r.amount,
          transactionId: r.transactionId || "—",
          registeredAt: r.createdAt.toISOString(),
        })),
        totalRegistrations: registrations.length,
      },
    };
  }, "getEventRegistrations");
}

export async function getSportRegistrations(sportId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: {
        id: true,
        name: true,
        gender: true,
        category: true,
        status: true,
        description: true,
        maxTeamsPerBranch: true,
        isActive: true,
        matches: {
          select: { date: true, time: true, venue: true },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          take: 1,
        },
      },
    });

    if (!sport) {
      return { error: "Sport not found" };
    }

    const registrations = await prisma.sportRegistration.findMany({
      where: { sportId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentName: true,
        studentId: true,
        email: true,
        phone: true,
        branch: true,
        year: true,
        section: true,
        status: true,
        createdAt: true,
      },
    });

    const firstMatch = sport.matches[0] || null;

    return {
      success: true,
      data: {
        sport: {
          id: sport.id,
          name: sport.name,
          gender: sport.gender,
          category: sport.category,
          status: sport.status,
          description: sport.description,
          venue: firstMatch?.venue || "TBD",
          date: firstMatch?.date ? firstMatch.date.toISOString() : null,
          time: firstMatch?.time || null,
        },
        registrations: registrations.map((r) => ({
          id: r.id,
          studentName: r.studentName || "Unknown",
          studentId: r.studentId,
          email: r.email || "—",
          phone: r.phone || "—",
          branch: r.branch || "—",
          year: r.year || "—",
          section: r.section || "—",
          status: r.status,
          paymentStatus: "—",
          amount: 0,
          transactionId: "—",
          registeredAt: r.createdAt.toISOString(),
        })),
        totalRegistrations: registrations.length,
      },
    };
  }, "getSportRegistrations");
}

export async function assignEventToStudent(studentId: string, eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    // Fetch student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      return { error: "Student not found" };
    }

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        maxCapacity: true,
        registrationOpen: true,
        price: true,
      },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    if (!event.registrationOpen) {
      return { error: "Registrations are closed for this event" };
    }

    // Check if already registered
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        userId: studentId,
      },
    });

    if (existing) {
      return { error: "Student is already registered for this event" };
    }

    // Check capacity
    const activeCount = await prisma.registration.count({
      where: {
        eventId,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    const registrationStatus =
      activeCount >= event.maxCapacity ? "WAITLISTED" : "CONFIRMED";

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId: studentId,
        studentName: student.name || "Unknown",
        studentId: student.id,
        email: student.email,
        status: registrationStatus as any,
        amount: event.price || 0,
        paymentStatus: "PAID", // Admin-assigned = auto-paid
      },
    });

    await revalidateUsers();
    return {
      success: true,
      status: registrationStatus,
      eventTitle: event.title,
    };
  }, "assignEventToStudent");
}
