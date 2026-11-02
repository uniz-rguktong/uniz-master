import prisma from "../utils/prisma";
import { Actor, ModuleError, requireRole } from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
export const PERSON_TYPES = ["faculty", "admin"] as const;
export const EVENT_KINDS = [
  "joined",
  "promotion",
  "transfer",
  "increment",
  "deputation",
  "retired",
  "other",
] as const;

type RecordInput = {
  personType: (typeof PERSON_TYPES)[number];
  personId: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  cadre?: string;
  employmentType?: string;
  joinedOn?: Date | null;
  status?: string;
  notes?: string;
};

const profileOf = (type: string, username: string) =>
  type === "faculty"
    ? prisma.facultyProfile.findUnique({ where: { username } })
    : prisma.adminProfile.findUnique({ where: { username } });

/** Staff master: every faculty and admin profile with its record, if any. */
export async function list(
  a: Actor,
  opts: { q?: string; department?: string },
) {
  requireRole(a, STAFF, "view the staff master");
  const [fac, adm, recs] = await Promise.all([
    prisma.facultyProfile.findMany({ orderBy: { name: "asc" }, take: 2000 }),
    prisma.adminProfile.findMany({ orderBy: { username: "asc" }, take: 500 }),
    prisma.staffRecord.findMany({ take: 3000 }),
  ]);
  const byKey = new Map(
    (recs as any[]).map((r) => [`${r.personType}:${r.personId}`, r]),
  );
  const rows = [
    ...(fac as any[]).map((p) => ({ type: "faculty", p })),
    ...(adm as any[]).map((p) => ({ type: "admin", p })),
  ].map(({ type, p }) => {
    const r: any = byKey.get(`${type}:${p.username}`);
    return {
      personType: type,
      personId: p.username,
      name: p.name || p.username,
      email: p.email,
      department: r?.department || p.department || "",
      designation: r?.designation || p.designation || "",
      record: r || null,
    };
  });
  const q = opts.q?.toLowerCase();
  return rows.filter(
    (r) =>
      (!opts.department || r.department === opts.department) &&
      (!q ||
        [r.name, r.personId, r.email, r.designation].some((x) =>
          (x || "").toLowerCase().includes(q),
        )),
  );
}

/** Designation counts across the staff master. */
export async function designations(a: Actor) {
  const rows = await list(a, {});
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = r.designation || "unassigned";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

/** Create or update the record for a faculty or admin profile. */
export async function upsert(a: Actor, d: RecordInput) {
  requireRole(a, STAFF, "edit staff records");
  const p = await profileOf(d.personType, d.personId);
  if (!p) throw new ModuleError(404, "NOT_FOUND", "Profile not found");
  const { personType, personId, joinedOn, ...rest } = d;
  const data: any = { ...rest };
  if (joinedOn !== undefined)
    data.joinedOn = joinedOn ? new Date(joinedOn) : null;
  return prisma.staffRecord.upsert({
    where: { personType_personId: { personType, personId } },
    create: { personType, personId, ...data },
    update: data,
  });
}

/** One record with service events and leave balances from the leave module. */
export async function get(a: Actor, id: string) {
  requireRole(a, STAFF, "view staff records");
  const r: any = await prisma.staffRecord.findUnique({
    where: { id },
    include: { events: { orderBy: { date: "desc" } } },
  });
  if (!r) throw new ModuleError(404, "NOT_FOUND", "Record not found");
  const profile = await profileOf(r.personType, r.personId);
  const leave =
    r.personType === "faculty"
      ? await prisma.leaveBalance.findMany({
          where: { facultyId: r.personId, year: new Date().getFullYear() },
        })
      : [];
  return { ...r, profile, leave };
}

/** Add a service event; promotions and transfers update the record. */
export async function addEvent(
  a: Actor,
  staffId: string,
  d: {
    kind: (typeof EVENT_KINDS)[number];
    date: Date;
    fromValue?: string;
    toValue?: string;
    details?: string;
  },
) {
  requireRole(a, STAFF, "add service events");
  const r: any = await prisma.staffRecord.findUnique({
    where: { id: staffId },
  });
  if (!r) throw new ModuleError(404, "NOT_FOUND", "Record not found");
  const ev = await prisma.serviceEvent.create({
    data: {
      staffId,
      kind: d.kind,
      date: new Date(d.date),
      fromValue: d.fromValue || "",
      toValue: d.toValue || "",
      details: d.details || "",
      createdBy: a.username,
    },
  });
  const patch: any = {};
  if (d.kind === "promotion" && d.toValue) patch.designation = d.toValue;
  if (d.kind === "transfer" && d.toValue) patch.department = d.toValue;
  if (d.kind === "retired") patch.status = "retired";
  if (d.kind === "joined") patch.joinedOn = new Date(d.date);
  if (Object.keys(patch).length)
    await prisma.staffRecord.update({ where: { id: staffId }, data: patch });
  return ev;
}
