import axios from "axios";
import {
  SmsSender,
  isFeatureEnabled,
  resolveEffectiveRole,
  resolveHodBranch,
} from "@uniz/shared";
import prisma from "../utils/prisma";

export const LEAVE_TYPES = ["CL", "EL", "ML", "OD", "SCL"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

/** Default yearly balance per type until Establishment shares the policy. */
export const DEFAULT_BALANCES: Record<LeaveType, number> = {
  CL: 12,
  EL: 15,
  ML: 10,
  OD: 30,
  SCL: 7,
};

export const APPLICANT_ROLES = ["faculty", "teacher", "hod"];
export const DEAN_ROLES = ["dean", "director", "webadmin"];
export const DUTY_ASSIGNER_ROLES = ["hod", "dean", "director", "webadmin"];

export type Actor = {
  id?: string;
  username: string;
  role?: string;
  department?: string;
};

export class LeaveError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function leaveModuleEnabled(): boolean {
  return isFeatureEnabled("FEATURE_FACULTY");
}

export function roleOf(actor: Actor): string {
  return resolveEffectiveRole(actor);
}

export function departmentOf(actor: Actor): string {
  return resolveHodBranch(actor);
}

/** Inclusive day count between two dates (UTC dates). */
export function countDays(from: Date, to: Date): number {
  const ms =
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.floor(ms / 86400000) + 1;
}

export async function findFacultyFor(actor: Actor) {
  const profile = await prisma.facultyProfile.findUnique({
    where: { username: actor.username },
  });
  if (!profile) {
    throw new LeaveError(
      403,
      "NO_FACULTY_PROFILE",
      "No faculty profile for this account",
    );
  }
  return profile;
}

export async function getBalances(facultyId: string, year: number) {
  const rows = await prisma.leaveBalance.findMany({
    where: { facultyId, year },
  });
  return LEAVE_TYPES.map((t) => {
    const row = rows.find((r: any) => r.leaveType === t);
    const total = row?.total ?? DEFAULT_BALANCES[t];
    const used = row?.used ?? 0;
    return { leaveType: t, total, used, remaining: total - used };
  });
}

export async function applyLeave(
  actor: Actor,
  input: { leaveType: LeaveType; fromDate: Date; toDate: Date; reason: string },
) {
  const role = roleOf(actor);
  if (!APPLICANT_ROLES.includes(role)) {
    throw new LeaveError(403, "FORBIDDEN", "Only faculty can apply for leave");
  }
  const days = countDays(input.fromDate, input.toDate);
  if (days < 1 || days > 60) {
    throw new LeaveError(400, "VALIDATION_ERROR", "Leave must be 1 to 60 days");
  }
  const faculty = await findFacultyFor(actor);
  const year = input.fromDate.getUTCFullYear();
  const balance = (await getBalances(faculty.id, year)).find(
    (b) => b.leaveType === input.leaveType,
  )!;
  if (balance.remaining < days) {
    throw new LeaveError(
      400,
      "INSUFFICIENT_BALANCE",
      `Only ${balance.remaining} ${input.leaveType} days left`,
    );
  }
  const department = String(faculty.department || "").toUpperCase();
  const status = role === "hod" ? "pending_dean" : "pending_hod";
  const created = await prisma.leaveRequest.create({
    data: {
      facultyId: faculty.id,
      username: faculty.username,
      department,
      leaveType: input.leaveType,
      fromDate: input.fromDate,
      toDate: input.toDate,
      days,
      reason: input.reason,
      status,
    },
  });
  await notify(
    status === "pending_hod" ? `hod_${department.toLowerCase()}` : null,
    "Leave request",
    `${faculty.name} applied for ${days} day(s) of ${input.leaveType}.`,
  );
  return created;
}

export async function listMine(actor: Actor) {
  const faculty = await findFacultyFor(actor);
  return prisma.leaveRequest.findMany({
    where: { facultyId: faculty.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listPending(actor: Actor) {
  const role = roleOf(actor);
  if (role === "hod") {
    return prisma.leaveRequest.findMany({
      where: { status: "pending_hod", department: departmentOf(actor) },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }
  if (DEAN_ROLES.includes(role)) {
    return prisma.leaveRequest.findMany({
      where: { status: "pending_dean" },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }
  throw new LeaveError(403, "FORBIDDEN", "Only HOD or Dean can review leave");
}

export async function decideLeave(
  actor: Actor,
  id: string,
  action: "approve" | "reject",
  note?: string,
) {
  const role = roleOf(actor);
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave) throw new LeaveError(404, "NOT_FOUND", "Leave request not found");
  const now = new Date();

  if (leave.status === "pending_hod") {
    if (role !== "hod" || departmentOf(actor) !== leave.department) {
      throw new LeaveError(
        403,
        "FORBIDDEN",
        "Only the HOD of this department can review this",
      );
    }
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "pending_dean" : "rejected",
        hodBy: actor.username,
        hodAt: now,
        hodNote: note ?? null,
      },
    });
    await notify(
      leave.username,
      "Leave update",
      action === "approve"
        ? "Your leave was approved by HOD and sent to the Dean."
        : "Your leave was rejected by HOD.",
    );
    return updated;
  }

  if (leave.status === "pending_dean") {
    if (!DEAN_ROLES.includes(role)) {
      throw new LeaveError(
        403,
        "FORBIDDEN",
        "Only the Dean can give final approval",
      );
    }
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        deanBy: actor.username,
        deanAt: now,
        deanNote: note ?? null,
      },
    });
    if (action === "approve") {
      const year = new Date(leave.fromDate).getUTCFullYear();
      await prisma.leaveBalance.upsert({
        where: {
          facultyId_year_leaveType: {
            facultyId: leave.facultyId,
            year,
            leaveType: leave.leaveType,
          },
        },
        create: {
          facultyId: leave.facultyId,
          year,
          leaveType: leave.leaveType,
          total: DEFAULT_BALANCES[leave.leaveType as LeaveType] ?? 0,
          used: leave.days,
        },
        update: { used: { increment: leave.days } },
      });
    }
    await notify(
      leave.username,
      "Leave update",
      action === "approve"
        ? "Your leave was approved."
        : "Your leave was rejected by the Dean.",
    );
    return updated;
  }

  throw new LeaveError(
    409,
    "ALREADY_DECIDED",
    "This leave request is already closed",
  );
}

export async function cancelLeave(actor: Actor, id: string) {
  const faculty = await findFacultyFor(actor);
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.facultyId !== faculty.id) {
    throw new LeaveError(404, "NOT_FOUND", "Leave request not found");
  }
  if (!["pending_hod", "pending_dean"].includes(leave.status)) {
    throw new LeaveError(
      409,
      "ALREADY_DECIDED",
      "Only pending leave can be cancelled",
    );
  }
  return prisma.leaveRequest.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

// ---------- duties ----------

export async function assignDuty(
  actor: Actor,
  input: {
    facultyUsername: string;
    dutyType: string;
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
  },
) {
  const role = roleOf(actor);
  if (!DUTY_ASSIGNER_ROLES.includes(role)) {
    throw new LeaveError(
      403,
      "FORBIDDEN",
      "Only HOD or Dean can assign duties",
    );
  }
  const faculty = await prisma.facultyProfile.findUnique({
    where: { username: input.facultyUsername },
  });
  if (!faculty) throw new LeaveError(404, "NOT_FOUND", "Faculty not found");
  const department = String(faculty.department || "").toUpperCase();
  if (role === "hod" && departmentOf(actor) !== department) {
    throw new LeaveError(
      403,
      "FORBIDDEN",
      "HOD can assign duties only in their department",
    );
  }
  const { facultyUsername: _u, ...rest } = input;
  const created = await prisma.dutyAssignment.create({
    data: {
      ...rest,
      facultyId: faculty.id,
      department,
      assignedBy: actor.username,
    },
  });
  await notify(
    faculty.username,
    "New duty",
    `${input.title} on ${input.date.toISOString().slice(0, 10)}`,
  );
  return created;
}

export async function listMyDuties(actor: Actor) {
  const faculty = await findFacultyFor(actor);
  return prisma.dutyAssignment.findMany({
    where: { facultyId: faculty.id },
    orderBy: { date: "asc" },
    take: 200,
  });
}

export async function listRoster(actor: Actor, from?: Date) {
  const role = roleOf(actor);
  if (!DUTY_ASSIGNER_ROLES.includes(role)) {
    throw new LeaveError(
      403,
      "FORBIDDEN",
      "Only HOD or Dean can view the roster",
    );
  }
  return prisma.dutyAssignment.findMany({
    where: {
      ...(role === "hod" ? { department: departmentOf(actor) } : {}),
      ...(from ? { date: { gte: from } } : {}),
    },
    orderBy: { date: "asc" },
    take: 500,
  });
}

export async function deleteDuty(actor: Actor, id: string) {
  const role = roleOf(actor);
  if (!DUTY_ASSIGNER_ROLES.includes(role)) {
    throw new LeaveError(
      403,
      "FORBIDDEN",
      "Only HOD or Dean can remove duties",
    );
  }
  const duty = await prisma.dutyAssignment.findUnique({ where: { id } });
  if (!duty) throw new LeaveError(404, "NOT_FOUND", "Duty not found");
  if (role === "hod" && departmentOf(actor) !== duty.department) {
    throw new LeaveError(
      403,
      "FORBIDDEN",
      "HOD can remove duties only in their department",
    );
  }
  await prisma.dutyAssignment.delete({ where: { id } });
  return { id };
}

// ---------- notify (existing push + inbox, SMS via foundation sender) ----------

const NOTIFICATION_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-notification-service:3007"
    : process.env.NOTIFICATION_SERVICE_URL) || "http://localhost:3007"
)
  .trim()
  .replace(/\/health$/, "");

const sms = new SmsSender();

export function notificationStatus() {
  return {
    push: true,
    sms: sms.enabled ? "enabled" : "SMS alerts not configured",
  };
}

async function notify(username: string | null, title: string, body: string) {
  if (!username) return;
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/push/send`,
      { target: "user", username, title, body },
      {
        headers: {
          "x-internal-secret": (
            process.env.INTERNAL_SECRET || "uniz-core"
          ).trim(),
        },
        timeout: 5000,
      },
    );
  } catch (e: any) {
    console.error(`[Leave] push to ${username} failed:`, e?.message);
  }
}
