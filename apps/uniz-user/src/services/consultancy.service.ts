import prisma from "../utils/prisma";
import { Actor, ModuleError, hasRole, requireRole } from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
export const FACULTY = ["faculty", "teacher", "hod"];
export const STATUSES = [
  "proposed",
  "ongoing",
  "completed",
  "cancelled",
] as const;
const all = [...STAFF, ...FACULTY];

export async function list(a: Actor) {
  requireRole(a, all, "see consultancy projects");
  const where = hasRole(a, STAFF)
    ? {}
    : { faculty: { contains: a.username, mode: "insensitive" as const } };
  const projects = await prisma.consultancyProject.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const totals: Record<string, number> = {};
  for (const p of projects as any[])
    totals[p.status] = (totals[p.status] || 0) + p.valueInr;
  return { projects, totals };
}
const dates = (d: any) => ({
  ...d,
  ...(d.startDate !== undefined
    ? { startDate: d.startDate ? new Date(d.startDate) : null }
    : {}),
  ...(d.endDate !== undefined
    ? { endDate: d.endDate ? new Date(d.endDate) : null }
    : {}),
});
export async function add(a: Actor, d: any) {
  requireRole(a, all, "add consultancy projects");
  const faculty = d.faculty || (hasRole(a, FACULTY) ? a.username : "");
  return prisma.consultancyProject.create({
    data: { ...dates(d), faculty, createdBy: a.username },
  });
}
export async function update(a: Actor, id: string, d: any) {
  requireRole(a, all, "edit consultancy projects");
  const p = await prisma.consultancyProject.findUnique({ where: { id } });
  if (!p) throw new ModuleError(404, "NOT_FOUND", "Project not found");
  if (!hasRole(a, STAFF) && p.createdBy !== a.username)
    throw new ModuleError(
      403,
      "FORBIDDEN",
      "You can only edit your own projects",
    );
  return prisma.consultancyProject.update({ where: { id }, data: dates(d) });
}
