import prisma from "../utils/prisma";
import { Actor, ModuleError, requireRole } from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
export const CATEGORIES = [
  "circular",
  "calendar",
  "download",
  "form",
  "other",
] as const;
/** Hub categories: own items plus existing notices and tenders. */
export const HUB = [...CATEGORIES, "notice", "tender"] as const;

export type HubItem = {
  id: string;
  source: "info" | "notice" | "tender";
  category: string;
  title: string;
  summary: string;
  url: string;
  date: string;
  deadline?: string | null;
  pinned: boolean;
  tags: string[];
};

const has = (q: string | undefined, ...xs: (string | null | undefined)[]) =>
  !q || xs.some((x) => (x || "").toLowerCase().includes(q.toLowerCase()));

/** Public hub over InfoItem, PublicNotification and Tender. */
export async function hub(opts: { q?: string; category?: string }) {
  const { q, category } = opts;
  const want = (c: string) => !category || category === c;
  const own = CATEGORIES.some(want);
  const [items, notices, tenders] = await Promise.all([
    own
      ? prisma.infoItem.findMany({
          where: { isVisible: true, ...(category ? { category } : {}) },
          orderBy: { createdAt: "desc" },
          take: 300,
        })
      : [],
    want("notice")
      ? prisma.publicNotification.findMany({
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [],
    want("tender")
      ? prisma.tender.findMany({
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [],
  ]);
  const out: HubItem[] = [
    ...(items as any[]).map((i) => ({
      id: i.id,
      source: "info" as const,
      category: i.category,
      title: i.title,
      summary: i.summary,
      url: i.url,
      date: (i.eventDate || i.createdAt).toISOString(),
      pinned: i.pinned,
      tags: i.tags ? i.tags.split(",") : [],
    })),
    ...(notices as any[]).map((n) => ({
      id: n.id,
      source: "notice" as const,
      category: "notice",
      title: n.title,
      summary: n.content,
      url: n.link || "",
      date: n.createdAt.toISOString(),
      pinned: false,
      tags: [],
    })),
    ...(tenders as any[]).map((t) => ({
      id: t.id,
      source: "tender" as const,
      category: "tender",
      title: t.title,
      summary: t.description,
      url: t.pdfUrl || "",
      date: t.createdAt.toISOString(),
      deadline: t.deadline ? t.deadline.toISOString() : null,
      pinned: false,
      tags: [],
    })),
  ].filter((i) => has(q, i.title, i.summary, i.tags.join(" ")));
  out.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date),
  );
  return out.slice(0, 300);
}

const tagCsv = (t?: string[]) =>
  (t || [])
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .join(",");

export async function add(a: Actor, d: any) {
  requireRole(a, STAFF, "add info items");
  return prisma.infoItem.create({
    data: {
      ...d,
      tags: tagCsv(d.tags),
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      createdBy: a.username,
    },
  });
}

export async function update(a: Actor, id: string, d: any) {
  requireRole(a, STAFF, "edit info items");
  const cur = await prisma.infoItem.findUnique({ where: { id } });
  if (!cur) throw new ModuleError(404, "NOT_FOUND", "Item not found");
  const data: any = { ...d };
  if (d.tags) data.tags = tagCsv(d.tags);
  if (d.eventDate !== undefined)
    data.eventDate = d.eventDate ? new Date(d.eventDate) : null;
  return prisma.infoItem.update({ where: { id }, data });
}

export async function list(a: Actor) {
  requireRole(a, STAFF, "manage info items");
  return prisma.infoItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}
