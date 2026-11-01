import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  notificationInbox: {
    create: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../src/utils/prisma.util", () => ({ default: prisma }));

import {
  clearInbox,
  createInboxEntry,
  deleteInboxItem,
  listInbox,
  markAllInboxRead,
  markInboxRead,
} from "../src/services/inbox.service";

describe("inbox.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an entry with a normalized username and defaults", async () => {
    prisma.notificationInbox.create.mockResolvedValue({ id: "n1" });
    const created = await createInboxEntry("O21ABC", {
      title: "Hello",
      body: "There",
    });
    expect(created).toEqual({ id: "n1" });
    expect(prisma.notificationInbox.create).toHaveBeenCalledWith({
      data: {
        username: "o21abc",
        title: "Hello",
        body: "There",
        type: "GENERIC",
        path: "/notifications?portal=auto",
      },
    });
  });

  it("keeps a caller-supplied id, type, and path", async () => {
    prisma.notificationInbox.create.mockResolvedValue({ id: "fixed" });
    await createInboxEntry("Ada", {
      id: "fixed",
      title: "T",
      body: "B",
      type: "OTP",
      path: "/notifications?n=fixed",
    });
    expect(prisma.notificationInbox.create).toHaveBeenCalledWith({
      data: {
        id: "fixed",
        username: "ada",
        title: "T",
        body: "B",
        type: "OTP",
        path: "/notifications?n=fixed",
      },
    });
  });

  it("clamps paging, filters unread rows, and reports page counts", async () => {
    prisma.notificationInbox.count
      .mockResolvedValueOnce(45)
      .mockResolvedValueOnce(3);
    prisma.notificationInbox.findMany.mockResolvedValue([{ id: "a" }]);

    const page = await listInbox("MiXeD", {
      page: 0,
      limit: 500,
      unreadOnly: true,
    });

    expect(prisma.notificationInbox.count).toHaveBeenNthCalledWith(1, {
      where: { username: "mixed", readAt: null },
    });
    expect(prisma.notificationInbox.findMany).toHaveBeenCalledWith({
      where: { username: "mixed", readAt: null },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 100,
    });
    expect(prisma.notificationInbox.count).toHaveBeenNthCalledWith(2, {
      where: { username: "mixed", readAt: null },
    });
    expect(page).toEqual({
      items: [{ id: "a" }],
      total: 45,
      unreadCount: 3,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
  });

  it("uses the default page size for an unfiltered inbox", async () => {
    prisma.notificationInbox.count.mockResolvedValue(31);
    prisma.notificationInbox.findMany.mockResolvedValue([]);
    const page = await listInbox("ada");
    expect(prisma.notificationInbox.findMany).toHaveBeenCalledWith({
      where: { username: "ada" },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 30,
    });
    expect(page.totalPages).toBe(2);
    expect(page.limit).toBe(30);
  });

  it("clamps a zero limit to one row and offsets later pages", async () => {
    prisma.notificationInbox.count.mockResolvedValue(0);
    prisma.notificationInbox.findMany.mockResolvedValue([]);
    const page = await listInbox("ada", { page: 2, limit: 0 });
    expect(prisma.notificationInbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { username: "ada" },
        skip: 1,
        take: 1,
      }),
    );
    expect(page.totalPages).toBe(1);
    expect(page.page).toBe(2);
    expect(page.limit).toBe(1);
  });

  it("marks one item or every unread item read", async () => {
    prisma.notificationInbox.updateMany.mockResolvedValueOnce({ count: 1 });
    await expect(markInboxRead("Ada", "id-1")).resolves.toBe(true);
    expect(prisma.notificationInbox.updateMany).toHaveBeenCalledWith({
      where: { id: "id-1", username: "ada" },
      data: { readAt: expect.any(Date) },
    });

    prisma.notificationInbox.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(markInboxRead("Ada", "missing")).resolves.toBe(false);

    prisma.notificationInbox.updateMany.mockResolvedValueOnce({ count: 4 });
    await expect(markAllInboxRead("Ada")).resolves.toBe(4);
    expect(prisma.notificationInbox.updateMany).toHaveBeenLastCalledWith({
      where: { username: "ada", readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("deletes one item and clears read or all rows", async () => {
    prisma.notificationInbox.deleteMany.mockResolvedValueOnce({ count: 1 });
    await expect(deleteInboxItem("Ada", "id-1")).resolves.toBe(true);
    prisma.notificationInbox.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(deleteInboxItem("Ada", "missing")).resolves.toBe(false);

    prisma.notificationInbox.deleteMany.mockResolvedValueOnce({ count: 2 });
    await expect(clearInbox("Ada")).resolves.toBe(2);
    expect(prisma.notificationInbox.deleteMany).toHaveBeenLastCalledWith({
      where: { username: "ada", readAt: { not: null } },
    });

    prisma.notificationInbox.deleteMany.mockResolvedValueOnce({ count: 5 });
    await expect(clearInbox("Ada", "all")).resolves.toBe(5);
    expect(prisma.notificationInbox.deleteMany).toHaveBeenLastCalledWith({
      where: { username: "ada" },
    });
  });
});
