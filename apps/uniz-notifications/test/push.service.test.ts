import { afterEach, describe, expect, it, vi } from "vitest";

const webpush = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

const prisma = vi.hoisted(() => ({
  pushSubscription: {
    findMany: vi.fn(),
    delete: vi.fn(),
  },
}));

const createInboxEntry = vi.hoisted(() => vi.fn());

vi.mock("web-push", () => ({
  setVapidDetails: webpush.setVapidDetails,
  sendNotification: webpush.sendNotification,
  default: webpush,
}));

vi.mock("../src/utils/prisma.util", () => ({ default: prisma }));
vi.mock("../src/services/inbox.service", () => ({ createInboxEntry }));

const sub = (endpoint: string) => ({
  endpoint,
  p256dh: `${endpoint}-p256`,
  auth: `${endpoint}-auth`,
});

async function loadPush() {
  vi.resetModules();
  return import("../src/services/push.service");
}

describe("push.service", () => {
  afterEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it("refuses to load in production without VAPID keys", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    await expect(loadPush()).rejects.toThrow(
      "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required",
    );
  });

  it("returns zero without calling Prisma when VAPID keys are missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendWebPush, publicVapidKey } = await loadPush();
    expect(publicVapidKey).toBeUndefined();
    await expect(
      sendWebPush("ada", { title: "Hi", body: "There" }),
    ).resolves.toBe(0);
    expect(prisma.pushSubscription.findMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("sends to the latest subscriptions and drops expired endpoints", async () => {
    process.env.VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    createInboxEntry.mockImplementation(async (_user: string, input: { id: string }) => ({
      id: input.id,
    }));
    prisma.pushSubscription.findMany.mockResolvedValue([
      sub("https://push.example/1"),
      sub("https://push.example/2"),
    ]);
    prisma.pushSubscription.delete.mockResolvedValue({});
    webpush.sendNotification
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ statusCode: 410 });

    const { sendWebPush } = await loadPush();
    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      "mailto:admin@uniz.rguktong.in",
      "public-key",
      "private-key",
    );

    const sent = await sendWebPush("Ada", {
      title: "Results",
      body: "Published",
      name: "Ada Lovelace",
      image: "https://example.test/pic.png",
      data: { type: "RESULTS", tag: "results-tag" },
    });

    expect(sent).toBe(2);
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      where: { username: { equals: "Ada", mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });
    expect(createInboxEntry).toHaveBeenCalledWith(
      "Ada",
      expect.objectContaining({
        title: "Results",
        body: "Dear Ada Lovelace,\n\nPublished",
        type: "RESULTS",
      }),
    );
    const inboxId = createInboxEntry.mock.calls[0][1].id as string;
    expect(createInboxEntry.mock.calls[0][1].path).toBe(
      `/notifications?n=${inboxId}`,
    );

    const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
    expect(payload).toMatchObject({
      title: "Results",
      body: "Dear Ada Lovelace,\n\nPublished",
      image: "https://example.test/pic.png",
      tag: "results-tag",
      data: {
        type: "RESULTS",
        notificationId: inboxId,
        path: `/notifications?n=${inboxId}`,
      },
    });
    expect(webpush.sendNotification.mock.calls[0][2]).toEqual({
      TTL: 86400,
      urgency: "high",
    });
    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example/2" },
    });
  });

  it("keeps a raw body, removes a 404 subscription, and survives an inbox failure", async () => {
    process.env.VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    createInboxEntry.mockRejectedValueOnce(new Error("db down"));
    prisma.pushSubscription.findMany.mockResolvedValue([
      sub("https://push.example/gone"),
    ]);
    prisma.pushSubscription.delete.mockResolvedValue({});
    webpush.sendNotification.mockRejectedValueOnce({ status: 404 });

    const { sendWebPush } = await loadPush();
    const sent = await sendWebPush("ada", {
      title: "OTP",
      body: "Code 123456",
      rawBody: true,
    });
    expect(sent).toBe(1);
    const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
    expect(payload.body).toBe("Code 123456");
    expect(payload.data.path).toBe("/notifications");
    expect(payload.data.notificationId).toBeUndefined();
    expect(payload.data.type).toBe("GENERIC");
    expect(payload.tag).toMatch(/^uniz-ada-/);
    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example/gone" },
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns zero when nobody is subscribed or the lookup throws", async () => {
    process.env.VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.pushSubscription.findMany.mockResolvedValueOnce([]);
    const { sendWebPush } = await loadPush();
    await expect(
      sendWebPush("ada", { title: "Hi", body: "There" }),
    ).resolves.toBe(0);
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    prisma.pushSubscription.findMany.mockRejectedValueOnce(new Error("down"));
    await expect(
      sendWebPush("ada", { title: "Hi", body: "There" }),
    ).resolves.toBe(0);

    prisma.pushSubscription.findMany.mockResolvedValueOnce([
      sub("https://push.example/boom"),
    ]);
    createInboxEntry.mockResolvedValueOnce({ id: "inbox-1" });
    webpush.sendNotification.mockRejectedValueOnce({ statusCode: 500 });
    await expect(
      sendWebPush("ada", { title: "Hi", body: "There" }),
    ).resolves.toBe(0);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
