import prisma from "../utils/prisma";
import {
  Actor,
  ModuleError,
  hasRole,
  notifyUser,
  requireRole,
} from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
const csv = (a?: string[]) =>
  (a || [])
    .map((x) => x.trim())
    .filter(Boolean)
    .join(",");
const isCoord = (club: any, a: Actor) =>
  club.coordinators
    .split(",")
    .map((x: string) => x.trim().toUpperCase())
    .includes(a.username.toUpperCase());

async function club(id: string) {
  const c = await prisma.club.findUnique({ where: { id } });
  if (!c) throw new ModuleError(404, "NOT_FOUND", "Club not found");
  return c;
}
async function manage(a: Actor, id: string) {
  const c = await club(id);
  if (!hasRole(a, STAFF) && !isCoord(c, a))
    throw new ModuleError(
      403,
      "FORBIDDEN",
      "Only coordinators or staff can manage this club",
    );
  return c;
}

export async function create(a: Actor, d: any) {
  requireRole(a, STAFF, "create clubs");
  return prisma.club.create({
    data: { ...d, coordinators: csv(d.coordinators), createdBy: a.username },
  });
}
export async function update(a: Actor, id: string, d: any) {
  requireRole(a, STAFF, "edit clubs");
  await club(id);
  const data: any = { ...d };
  if (d.coordinators) data.coordinators = csv(d.coordinators);
  return prisma.club.update({ where: { id }, data });
}

export async function list(a: Actor) {
  const [clubs, mine] = await Promise.all([
    prisma.club.findMany({
      where: hasRole(a, STAFF) ? {} : { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.clubMember.findMany({
      where: { username: a.username.toUpperCase() },
    }),
  ]);
  const by = new Map(mine.map((m: any) => [m.clubId, m.status]));
  return clubs.map((c: any) => ({
    ...c,
    myStatus: by.get(c.id) || null,
    coordinator: isCoord(c, a),
  }));
}

export async function join(a: Actor, id: string) {
  const c = await club(id);
  if (!c.active) throw new ModuleError(400, "CLOSED", "Club is not active");
  return prisma.clubMember.create({
    data: { clubId: id, username: a.username.toUpperCase() },
  });
}
export async function leave(a: Actor, id: string) {
  await prisma.clubMember.deleteMany({
    where: { clubId: id, username: a.username.toUpperCase() },
  });
  return { left: true };
}
export async function members(a: Actor, id: string) {
  await manage(a, id);
  return prisma.clubMember.findMany({
    where: { clubId: id },
    orderBy: { createdAt: "asc" },
  });
}
export async function setMember(
  a: Actor,
  id: string,
  memberId: string,
  status: string,
) {
  await manage(a, id);
  const m = await prisma.clubMember.findUnique({ where: { id: memberId } });
  if (!m || m.clubId !== id)
    throw new ModuleError(404, "NOT_FOUND", "Member not found");
  const out = await prisma.clubMember.update({
    where: { id: memberId },
    data: { status },
  });
  void notifyUser(
    m.username,
    "Club membership",
    `Your membership is ${status}`,
  );
  return out;
}

/** Event goes on the club page and into the information centre feed. */
export async function addEvent(a: Actor, id: string, d: any) {
  const c = await manage(a, id);
  const startsAt = new Date(d.startsAt);
  const info = await prisma.infoItem.create({
    data: {
      category: "calendar",
      title: `${c.name}: ${d.title}`,
      summary: [d.venue, d.description].filter(Boolean).join("\n"),
      tags: "club",
      eventDate: startsAt,
      createdBy: a.username,
    },
  });
  return prisma.clubEvent.create({
    data: {
      ...d,
      startsAt,
      clubId: id,
      infoItemId: info.id,
      createdBy: a.username,
    },
  });
}
export async function events(id?: string) {
  return prisma.clubEvent.findMany({
    where: {
      ...(id ? { clubId: id } : {}),
      startsAt: { gte: new Date(Date.now() - 86400000) },
    },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
}
