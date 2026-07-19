import prisma from "../utils/prisma.util";

export type InboxCreateInput = {
  id?: string;
  title: string;
  body: string;
  type?: string;
  path?: string;
};

export async function createInboxEntry(
  username: string,
  input: InboxCreateInput,
) {
  const normalized = username.toLowerCase();
  const path = input.path || `/notifications?portal=auto`;

  return prisma.notificationInbox.create({
    data: {
      // Callers may pre-generate the id so they can embed it in `path` and avoid
      // a follow-up UPDATE (single write instead of insert+update).
      ...(input.id ? { id: input.id } : {}),
      username: normalized,
      title: input.title,
      body: input.body,
      type: input.type || "GENERIC",
      path,
    },
  });
}

export async function listInbox(
  username: string,
  opts: { page?: number; limit?: number; unreadOnly?: boolean } = {},
) {
  const normalized = username.toLowerCase();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
  const skip = (page - 1) * limit;

  const where = {
    username: normalized,
    ...(opts.unreadOnly ? { readAt: null } : {}),
  };

  const [total, items, unreadCount] = await Promise.all([
    prisma.notificationInbox.count({ where }),
    prisma.notificationInbox.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notificationInbox.count({
      where: { username: normalized, readAt: null },
    }),
  ]);

  return {
    items,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function markInboxRead(username: string, id: string) {
  const normalized = username.toLowerCase();
  const result = await prisma.notificationInbox.updateMany({
    where: { id, username: normalized },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllInboxRead(username: string) {
  const normalized = username.toLowerCase();
  const result = await prisma.notificationInbox.updateMany({
    where: { username: normalized, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function deleteInboxItem(username: string, id: string) {
  const normalized = username.toLowerCase();
  const result = await prisma.notificationInbox.deleteMany({
    where: { id, username: normalized },
  });
  return result.count > 0;
}

export async function clearInbox(
  username: string,
  mode: "read" | "all" = "read",
) {
  const normalized = username.toLowerCase();
  const where =
    mode === "all"
      ? { username: normalized }
      : { username: normalized, readAt: { not: null } };

  const result = await prisma.notificationInbox.deleteMany({ where });
  return result.count;
}
