import crypto from "crypto";
import axios from "axios";
import { getPaymentProvider } from "@uniz/shared";
import prisma from "../utils/prisma";
import { Actor, ModuleError, requireRole } from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
export const STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "rejected",
] as const;
const DOC_KINDS = [
  "photo",
  "marks_memo",
  "id_proof",
  "caste_certificate",
  "other",
] as const;
export { DOC_KINDS };

/** Public form needs Turnstile. With no secret set the form shows a disabled state. */
export function formReady() {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyCaptcha(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    });
    const r = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      body,
      { timeout: 5000 },
    );
    return r.data?.success === true;
  } catch {
    return false;
  }
}

export function paymentState(feeInr: number) {
  const p = getPaymentProvider();
  if (!feeInr)
    return { required: false, enabled: false, reason: "No application fee" };
  return p.enabled
    ? { required: true, enabled: true, reason: "" }
    : {
        required: true,
        enabled: false,
        reason: (p as any).reason || "Payments coming soon",
      };
}

const isOpen = (c: any, now = new Date()) =>
  c.active && c.opensAt <= now && c.closesAt >= now;

export async function openCycles() {
  const now = new Date();
  const cycles = await prisma.admissionCycle.findMany({
    where: { active: true, opensAt: { lte: now }, closesAt: { gte: now } },
    orderBy: { closesAt: "asc" },
  });
  return cycles.map((c: any) => ({
    id: c.id,
    name: c.name,
    academicYear: c.academicYear,
    programs: c.programs ? c.programs.split(",") : [],
    closesAt: c.closesAt,
    feeInr: c.feeInr,
    instructions: c.instructions,
    payment: paymentState(c.feeInr),
  }));
}

const refNo = (year: string) =>
  `ADM${year.replace(/\D/g, "").slice(0, 4)}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export async function apply(d: any) {
  const c = await prisma.admissionCycle.findUnique({
    where: { id: d.cycleId },
  });
  if (!c || !isOpen(c))
    throw new ModuleError(
      400,
      "CLOSED",
      "Admissions are not open for this cycle",
    );
  const programs = c.programs ? c.programs.split(",") : [];
  if (programs.length && !programs.includes(d.program))
    throw new ModuleError(400, "BAD_PROGRAM", "Pick a program from the list");
  const { documents = [], cycleId, ...rest } = d;
  const app = await prisma.application.create({
    data: {
      ...rest,
      cycleId,
      email: d.email.toLowerCase(),
      refNo: refNo(c.academicYear),
      feeStatus: c.feeInr ? "pending" : "not_required",
    },
  });
  if (documents.length)
    await prisma.applicationDocument.createMany({
      data: documents.map((x: any) => ({
        applicationId: app.id,
        kind: x.kind,
        url: x.url,
      })),
    });
  return { refNo: app.refNo, payment: paymentState(c.feeInr) };
}

/** Public status lookup needs both the reference number and the email. */
export async function status(ref: string, email: string) {
  const a = await prisma.application.findUnique({
    where: { refNo: ref.toUpperCase() },
  });
  if (!a || a.email !== email.toLowerCase())
    throw new ModuleError(
      404,
      "NOT_FOUND",
      "No application with these details",
    );
  return {
    refNo: a.refNo,
    name: a.name,
    program: a.program,
    status: a.status,
    feeStatus: a.feeStatus,
    note:
      a.status === "rejected" || a.status === "waitlisted" ? a.reviewNote : "",
  };
}

export async function cycles(a: Actor) {
  requireRole(a, STAFF, "manage admissions");
  return prisma.admissionCycle.findMany({ orderBy: { createdAt: "desc" } });
}
const cycleData = (d: any) => ({
  ...d,
  ...(d.programs
    ? {
        programs: d.programs
          .map((p: string) => p.trim())
          .filter(Boolean)
          .join(","),
      }
    : {}),
  ...(d.opensAt ? { opensAt: new Date(d.opensAt) } : {}),
  ...(d.closesAt ? { closesAt: new Date(d.closesAt) } : {}),
});
export async function addCycle(a: Actor, d: any) {
  requireRole(a, STAFF, "manage admissions");
  return prisma.admissionCycle.create({
    data: { ...cycleData(d), createdBy: a.username },
  });
}
export async function updateCycle(a: Actor, id: string, d: any) {
  requireRole(a, STAFF, "manage admissions");
  const c = await prisma.admissionCycle.findUnique({ where: { id } });
  if (!c) throw new ModuleError(404, "NOT_FOUND", "Cycle not found");
  return prisma.admissionCycle.update({ where: { id }, data: cycleData(d) });
}

export async function applications(
  a: Actor,
  q: { cycleId: string; status?: string; q?: string },
) {
  requireRole(a, STAFF, "review applications");
  return prisma.application.findMany({
    where: {
      cycleId: q.cycleId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? {
            OR: ["name", "email", "refNo", "phone"].map((k) => ({
              [k]: { contains: q.q, mode: "insensitive" },
            })),
          }
        : {}),
    },
    orderBy: [{ percentage: "desc" }, { createdAt: "asc" }],
    take: 2000,
  });
}

export async function application(a: Actor, id: string) {
  requireRole(a, STAFF, "review applications");
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw new ModuleError(404, "NOT_FOUND", "Application not found");
  const documents = await prisma.applicationDocument.findMany({
    where: { applicationId: id },
  });
  return { ...app, documents };
}

export async function review(
  a: Actor,
  id: string,
  d: { status: string; note?: string; feeStatus?: string },
) {
  requireRole(a, STAFF, "review applications");
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw new ModuleError(404, "NOT_FOUND", "Application not found");
  if (app.status === "converted")
    throw new ModuleError(400, "CONVERTED", "Already converted to a student");
  return prisma.application.update({
    where: { id },
    data: {
      status: d.status,
      reviewNote: d.note ?? app.reviewNote,
      reviewedBy: a.username,
      ...(d.feeStatus ? { feeStatus: d.feeStatus } : {}),
    },
  });
}

const CSV_COLS = [
  "id",
  "name",
  "email",
  "gender",
  "branch",
  "phone",
  "batch",
  "category",
];
const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/**
 * Accepted applications as a CSV in the Add Students upload format.
 * The id column is left blank for the office to assign IDs, then the file goes through the existing upload.
 * With mark=true the rows are marked converted so they are not exported twice.
 */
export async function exportAccepted(
  a: Actor,
  cycleId: string,
  batch: string,
  mark: boolean,
) {
  requireRole(a, STAFF, "convert applications");
  const rows = await prisma.application.findMany({
    where: { cycleId, status: "accepted" },
    orderBy: { name: "asc" },
  });
  const csv = [CSV_COLS.join(",")]
    .concat(
      rows.map((r: any) =>
        ["", r.name, r.email, r.gender, r.program, r.phone, batch, r.category]
          .map(cell)
          .join(","),
      ),
    )
    .join("\n");
  if (mark && rows.length)
    await prisma.application.updateMany({
      where: { id: { in: rows.map((r: any) => r.id) } },
      data: { status: "converted", reviewedBy: a.username },
    });
  return { count: rows.length, csv };
}

export async function stats(a: Actor, cycleId: string) {
  requireRole(a, STAFF, "see admission stats");
  const rows = await prisma.application.findMany({
    where: { cycleId },
    select: { status: true, program: true },
  });
  const byStatus: Record<string, number> = {};
  const byProgram: Record<string, number> = {};
  for (const r of rows as any[]) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byProgram[r.program] = (byProgram[r.program] || 0) + 1;
  }
  return { total: rows.length, byStatus, byProgram };
}
