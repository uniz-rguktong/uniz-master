import axios from "axios";
import {
  isFeatureEnabled,
  resolveEffectiveRole,
  SmsSender,
} from "@uniz/shared";
import prisma from "../utils/prisma.util";

export const EXAM_ADMIN_ROLES = ["coe", "dean", "director", "webadmin"];
export const FACULTY_ROLES = ["faculty", "teacher", "hod"];
export const STUDENTS_PER_INVIGILATOR = 30;
export const MAX_PER_HALL = 3;

export type Actor = { username: string; role?: string };

export class ExamDutyError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const examDutyEnabled = () => isFeatureEnabled("FEATURE_EXAM_DUTIES");
export const roleOf = (a: Actor) => resolveEffectiveRole(a);
export const isExamAdmin = (a: Actor) => EXAM_ADMIN_ROLES.includes(roleOf(a));
export const isFaculty = (a: Actor) => FACULTY_ROLES.includes(roleOf(a));

function requireAdmin(a: Actor) {
  if (!isExamAdmin(a))
    throw new ExamDutyError(403, "FORBIDDEN", "Only the exam cell can do this");
}

const dayKey = (d: Date | string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export type Hall = {
  room: string;
  date: string;
  time: string | null;
  students: number;
};

/** Halls for an exam, built from SeatingArrangement rows. */
export async function listHalls(
  semesterId: string,
  examName: string,
): Promise<Hall[]> {
  const rows: any[] = await prisma.seatingArrangement.findMany({
    where: { semesterId, examName },
    select: { room: true, date: true, time: true },
  });
  const map = new Map<string, Hall>();
  for (const r of rows) {
    if (!r.date) continue;
    const date = dayKey(r.date);
    const key = `${date}|${r.time || ""}|${r.room}`;
    const h = map.get(key) || {
      room: r.room,
      date,
      time: r.time || null,
      students: 0,
    };
    h.students += 1;
    map.set(key, h);
  }
  return [...map.values()].sort((a, b) =>
    `${a.date}${a.time}${a.room}`.localeCompare(`${b.date}${b.time}${b.room}`),
  );
}

export function invigilatorsFor(students: number): number {
  return Math.min(
    MAX_PER_HALL,
    Math.max(1, Math.ceil(students / STUDENTS_PER_INVIGILATOR)),
  );
}

/**
 * Pure planner: spreads faculty over halls, lowest load first, never the same
 * person twice in one date+time slot. Throws if the pool is too small.
 */
export function planDuties(halls: Hall[], faculty: string[]) {
  const pool = [...new Set(faculty.map((f) => f.trim()).filter(Boolean))];
  const load = new Map(pool.map((f) => [f, 0]));
  const busy = new Map<string, Set<string>>();
  const out: Array<Hall & { facultyUsername: string; role: string }> = [];
  for (const h of halls) {
    const slot = `${h.date}|${h.time || ""}`;
    const taken = busy.get(slot) || new Set<string>();
    busy.set(slot, taken);
    const need = invigilatorsFor(h.students);
    for (let i = 0; i < need; i++) {
      const pick = pool
        .filter((f) => !taken.has(f))
        .sort((a, b) => load.get(a)! - load.get(b)! || a.localeCompare(b))[0];
      if (!pick) {
        throw new ExamDutyError(
          400,
          "NOT_ENOUGH_FACULTY",
          `Not enough faculty for ${h.date} ${h.time || ""}: need more names`,
        );
      }
      taken.add(pick);
      load.set(pick, load.get(pick)! + 1);
      out.push({
        ...h,
        facultyUsername: pick,
        role: i === 0 ? "chief" : "invigilator",
      });
    }
  }
  return out;
}

export async function generate(
  actor: Actor,
  input: {
    semesterId: string;
    examName: string;
    faculty: string[];
    replace?: boolean;
  },
) {
  requireAdmin(actor);
  const halls = await listHalls(input.semesterId, input.examName);
  if (halls.length === 0) {
    throw new ExamDutyError(
      404,
      "NO_SEATING",
      "No seating arrangement with dates for this exam",
    );
  }
  const existing = await prisma.examDuty.count({
    where: { semesterId: input.semesterId, examName: input.examName },
  });
  if (existing > 0 && !input.replace) {
    throw new ExamDutyError(
      409,
      "ALREADY_GENERATED",
      "Duties already exist for this exam. Send replace to rebuild.",
    );
  }
  const plan = planDuties(halls, input.faculty);
  if (existing > 0) {
    await prisma.examDuty.deleteMany({
      where: { semesterId: input.semesterId, examName: input.examName },
    });
  }
  await prisma.examDuty.createMany({
    data: plan.map((p) => ({
      semesterId: input.semesterId,
      examName: input.examName,
      room: p.room,
      date: new Date(`${p.date}T00:00:00.000Z`),
      time: p.time,
      studentCount: p.students,
      facultyUsername: p.facultyUsername,
      role: p.role,
      createdBy: actor.username,
    })),
    skipDuplicates: true,
  });
  for (const f of new Set(plan.map((p) => p.facultyUsername))) {
    const n = plan.filter((p) => p.facultyUsername === f).length;
    await notify(
      f,
      "Exam duties",
      `You have ${n} invigilation duty(s) for ${input.examName}.`,
    );
  }
  return { halls: halls.length, duties: plan.length };
}

export async function roster(
  actor: Actor,
  semesterId: string,
  examName: string,
) {
  requireAdmin(actor);
  return prisma.examDuty.findMany({
    where: { semesterId, examName },
    orderBy: [
      { date: "asc" },
      { time: "asc" },
      { room: "asc" },
      { role: "asc" },
    ],
  });
}

export async function mine(actor: Actor) {
  if (!isFaculty(actor) && !isExamAdmin(actor)) {
    throw new ExamDutyError(403, "FORBIDDEN", "Only faculty have exam duties");
  }
  return prisma.examDuty.findMany({
    where: { facultyUsername: actor.username },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 200,
  });
}

export async function requestSwap(
  actor: Actor,
  id: string,
  toUsername: string,
  reason: string,
) {
  if (!isFaculty(actor))
    throw new ExamDutyError(
      403,
      "FORBIDDEN",
      "Only faculty can request a swap",
    );
  const duty = await prisma.examDuty.findUnique({ where: { id } });
  if (!duty || duty.facultyUsername !== actor.username) {
    throw new ExamDutyError(404, "NOT_FOUND", "Duty not found");
  }
  if (toUsername === actor.username)
    throw new ExamDutyError(400, "VALIDATION_ERROR", "Pick someone else");
  if (duty.swapStatus === "pending")
    throw new ExamDutyError(409, "SWAP_PENDING", "A swap is already pending");
  return prisma.examDuty.update({
    where: { id },
    data: { swapTo: toUsername, swapReason: reason, swapStatus: "pending" },
  });
}

export async function pendingSwaps(actor: Actor) {
  requireAdmin(actor);
  return prisma.examDuty.findMany({
    where: { swapStatus: "pending" },
    orderBy: { date: "asc" },
  });
}

export async function decideSwap(actor: Actor, id: string, approve: boolean) {
  requireAdmin(actor);
  const duty = await prisma.examDuty.findUnique({ where: { id } });
  if (!duty || duty.swapStatus !== "pending" || !duty.swapTo) {
    throw new ExamDutyError(404, "NOT_FOUND", "No pending swap for this duty");
  }
  if (!approve) {
    const updated = await prisma.examDuty.update({
      where: { id },
      data: { swapStatus: "rejected", swapDecidedBy: actor.username },
    });
    await notify(
      duty.facultyUsername,
      "Swap request",
      "Your exam duty swap was rejected.",
    );
    return updated;
  }
  const clash = await prisma.examDuty.findFirst({
    where: { facultyUsername: duty.swapTo, date: duty.date, time: duty.time },
  });
  if (clash)
    throw new ExamDutyError(
      409,
      "SLOT_CLASH",
      `${duty.swapTo} already has a duty in that slot`,
    );
  const updated = await prisma.examDuty.update({
    where: { id },
    data: {
      facultyUsername: duty.swapTo,
      swapStatus: "approved",
      swapDecidedBy: actor.username,
    },
  });
  await notify(
    duty.facultyUsername,
    "Swap request",
    "Your exam duty swap was approved.",
  );
  await notify(
    duty.swapTo,
    "Exam duties",
    `You now have ${duty.room} on ${dayKey(duty.date)} ${duty.time || ""}.`,
  );
  return updated;
}

const sms = new SmsSender();
export const notificationStatus = () => ({
  push: true,
  sms: sms.enabled ? "enabled" : "SMS alerts not configured",
});

async function notify(username: string, title: string, body: string) {
  try {
    const NOTIFY_URL =
      process.env.NOTIFY_URL || "http://uniz-gateway-api:3000/api/v1";
    await axios.post(
      `${NOTIFY_URL}/notifications/push/send`,
      { target: "user", username, title, body },
      {
        headers: {
          "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
        },
        timeout: 5000,
      },
    );
  } catch (e: any) {
    console.warn("[ExamDuty] push failed:", e?.message);
  }
}
