import prisma from "../utils/prisma";
import {
  Actor,
  ModuleError,
  hasRole,
  notifyUser,
  requireRole,
} from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
export const STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
] as const;
const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
const csv = (a?: string[]) =>
  (a || [])
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .join(",");

export function eligibility(
  drive: any,
  st: any,
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const br = list(drive.branches);
  const bt = list(drive.batches);
  if (br.length && !br.includes(String(st.branch || "").toUpperCase()))
    reasons.push("Branch not eligible");
  if (bt.length && !bt.includes(String(st.batch || "").toUpperCase()))
    reasons.push("Batch not eligible");
  if (Number(st.cgpa || 0) < drive.minCgpa)
    reasons.push(`CGPA below ${drive.minCgpa}`);
  if (Number(st.totalBacklogs || 0) > drive.maxBacklogs)
    reasons.push(`More than ${drive.maxBacklogs} backlogs`);
  return { eligible: reasons.length === 0, reasons };
}

export async function addCompany(
  a: Actor,
  d: { name: string; website?: string; contact?: string; notes?: string },
) {
  requireRole(a, STAFF, "manage placements");
  return prisma.company.create({
    data: { ...d, createdBy: a.username } as any,
  });
}

export async function companies(a: Actor) {
  requireRole(a, STAFF, "manage placements");
  return prisma.company.findMany({ orderBy: { name: "asc" } });
}

export async function addDrive(a: Actor, d: any) {
  requireRole(a, STAFF, "manage placements");
  const c = await prisma.company.findUnique({ where: { id: d.companyId } });
  if (!c) throw new ModuleError(404, "NOT_FOUND", "Company not found");
  return prisma.placementDrive.create({
    data: {
      ...d,
      branches: csv(d.branches),
      batches: csv(d.batches),
      createdBy: a.username,
    },
  });
}

async function student(username: string) {
  const st: any = await prisma.studentProfile.findUnique({
    where: { username: username.toUpperCase() },
    select: {
      id: true,
      username: true,
      branch: true,
      batch: true,
      cgpa: true,
      totalBacklogs: true,
      isSuspended: true,
    },
  });
  if (!st) throw new ModuleError(404, "NOT_FOUND", "Student profile not found");
  return st;
}

/** Staff see every drive; students see open drives with their eligibility. */
export async function drives(a: Actor) {
  const staff = hasRole(a, STAFF);
  const rows: any[] = await prisma.placementDrive.findMany({
    where: staff ? {} : { status: "open", deadline: { gte: new Date() } },
    orderBy: { deadline: "asc" },
    take: 200,
  });
  const cs: any[] = await prisma.company.findMany({
    where: { id: { in: rows.map((r) => r.companyId) } },
  });
  const name = new Map(cs.map((c) => [c.id, c.name]));
  if (staff)
    return rows.map((r) => ({ ...r, company: name.get(r.companyId) || "" }));
  if (roleOfStudent(a)) {
    const st = await student(a.username);
    return rows.map((r) => ({
      ...r,
      company: name.get(r.companyId) || "",
      ...eligibility(r, st),
    }));
  }
  throw new ModuleError(
    403,
    "FORBIDDEN",
    "Only students and placement staff can view drives",
  );
}
const roleOfStudent = (a: Actor) => hasRole(a, ["student"]);

export async function closeDrive(a: Actor, id: string) {
  requireRole(a, STAFF, "manage placements");
  return prisma.placementDrive.update({
    where: { id },
    data: { status: "closed" },
  });
}

export async function apply(a: Actor, driveId: string, resumeUrl: string) {
  requireRole(a, ["student"], "apply");
  const d: any = await prisma.placementDrive.findUnique({
    where: { id: driveId },
  });
  if (!d || d.status !== "open" || new Date(d.deadline) < new Date()) {
    throw new ModuleError(409, "CLOSED", "This drive is not open");
  }
  const st = await student(a.username);
  if (st.isSuspended)
    throw new ModuleError(409, "SUSPENDED", "Suspended students cannot apply");
  const e = eligibility(d, st);
  if (!e.eligible)
    throw new ModuleError(409, "NOT_ELIGIBLE", e.reasons.join(", "));
  return prisma.driveApplication.create({
    data: {
      driveId,
      studentId: String(st.id),
      username: st.username,
      resumeUrl,
    },
  });
}

export async function mine(a: Actor) {
  const username = a.username.toUpperCase();
  const [applications, offers] = await Promise.all([
    prisma.driveApplication.findMany({
      where: { username },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { username },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { applications, offers };
}

export async function applications(a: Actor, driveId: string) {
  requireRole(a, STAFF, "manage placements");
  return prisma.driveApplication.findMany({
    where: { driveId },
    orderBy: { createdAt: "asc" },
    take: 2000,
  });
}

/** Moves an application along the pipeline. "selected" creates the offer. */
export async function setStatus(
  a: Actor,
  id: string,
  status: (typeof STATUSES)[number],
  note?: string,
) {
  requireRole(a, STAFF, "manage placements");
  const app: any = await prisma.driveApplication.findUnique({ where: { id } });
  if (!app) throw new ModuleError(404, "NOT_FOUND", "Application not found");
  const updated = await prisma.driveApplication.update({
    where: { id },
    data: { status, note: note || app.note },
  });
  let offer = null;
  if (status === "selected") {
    const d: any = await prisma.placementDrive.findUnique({
      where: { id: app.driveId },
    });
    offer = await prisma.offer.upsert({
      where: { applicationId: id },
      create: {
        applicationId: id,
        driveId: app.driveId,
        companyId: d.companyId,
        username: app.username,
        ctcLpa: d.ctcLpa,
      },
      update: {},
    });
  }
  await notifyUser(
    app.username,
    "Placement update",
    `Your application status is now: ${status}.`,
  );
  return { application: updated, offer };
}

export async function respond(
  a: Actor,
  offerId: string,
  action: "accepted" | "declined",
) {
  const o: any = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!o || o.username !== a.username.toUpperCase())
    throw new ModuleError(404, "NOT_FOUND", "Offer not found");
  if (o.status !== "offered")
    throw new ModuleError(409, "ALREADY_DONE", `Offer already ${o.status}`);
  return prisma.offer.update({
    where: { id: offerId },
    data: { status: action },
  });
}

export async function stats(a: Actor) {
  requireRole(a, STAFF, "view placement stats");
  const offers: any[] = await prisma.offer.findMany({
    where: { status: { not: "declined" } },
  });
  const cs: any[] = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  const name = new Map(cs.map((c) => [c.id, c.name]));
  const placed = new Set(offers.map((o) => o.username)).size;
  const ctcs = offers.map((o) => o.ctcLpa).filter((x) => x > 0);
  const byCompany: Record<string, number> = {};
  for (const o of offers) {
    const n = name.get(o.companyId) || "Unknown";
    byCompany[n] = (byCompany[n] || 0) + 1;
  }
  return {
    offers: offers.length,
    placedStudents: placed,
    avgCtcLpa: ctcs.length
      ? Math.round((ctcs.reduce((s, x) => s + x, 0) / ctcs.length) * 100) / 100
      : 0,
    maxCtcLpa: ctcs.length ? Math.max(...ctcs) : 0,
    byCompany,
  };
}
