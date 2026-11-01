import { beforeEach, describe, expect, it, vi } from "vitest";
import { bearer } from "./auth-token";
import { mount } from "./http";

const prisma = vi.hoisted(() => ({
  pushSubscription: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
}));
const axiosPost = vi.hoisted(() => vi.fn());
const sendWebPush = vi.hoisted(() => vi.fn());
const enqueueNotificationJob = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({ default: { post: axiosPost } }));
vi.mock("../src/utils/prisma.util", () => ({ default: prisma }));
vi.mock("../src/services/push.service", () => ({
  sendWebPush,
  publicVapidKey: "test-key",
}));
vi.mock("../src/utils/queue.util", () => ({ enqueueNotificationJob }));

import router from "../src/routes/push.routes";

const api = mount(router);
const student = bearer();
const admin = bearer({ role: "faculty", username: "hod_cse" });
const subscription = {
  endpoint: "https://push.example/device",
  keys: { p256dh: "p256", auth: "auth" },
};

describe("push routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.pushSubscription.upsert.mockResolvedValue({});
    prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 2 });
    prisma.pushSubscription.count.mockResolvedValue(0);
    prisma.pushSubscription.findMany.mockResolvedValue([]);
    sendWebPush.mockResolvedValue(1);
    enqueueNotificationJob.mockResolvedValue({ id: "job-1" });
    axiosPost.mockResolvedValue({ data: { success: true, users: [] } });
  });

  it("stores a subscription for an authenticated user", async () => {
    expect((await api.post("/subscribe", { username: "ada" })).status).toBe(401);
    const missing = await api.post("/subscribe", { username: "ada" }, student);
    expect(missing.status).toBe(400);

    const ok = await api.post(
      "/subscribe",
      { username: "Ada", subscription },
      student,
    );
    expect(ok.status).toBe(201);
    expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: subscription.endpoint },
      update: {
        username: "ada",
        p256dh: "p256",
        auth: "auth",
      },
      create: {
        username: "ada",
        endpoint: subscription.endpoint,
        p256dh: "p256",
        auth: "auth",
      },
    });

    prisma.pushSubscription.upsert.mockRejectedValueOnce(new Error("dup"));
    const failed = await api.post(
      "/subscribe",
      { username: "ada", subscription },
      student,
    );
    expect(failed.status).toBe(500);
    expect(failed.body.error).toBe("dup");
  });

  it("sends an internal push and swallows sender failures", async () => {
    const missing = await api.post("/internal/push", { username: "ada" }, student);
    expect(missing.status).toBe(400);

    const ok = await api.post(
      "/internal/push",
      { username: "ada", title: "Hi", body: "There", type: "OTP" },
      student,
    );
    expect(ok.body).toEqual({ success: true, sent: 1 });
    expect(sendWebPush).toHaveBeenCalledWith("ada", {
      title: "Hi",
      body: "There",
      rawBody: true,
      data: { type: "OTP" },
    });

    sendWebPush.mockRejectedValueOnce(new Error("push down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const skipped = await api.post(
      "/internal/push",
      { username: "ada", title: "Hi", body: "There" },
      student,
    );
    expect(skipped.status).toBe(200);
    expect(skipped.body).toEqual({ success: true, sent: 0, status: "skipped" });
    error.mockRestore();
  });

  it("deletes subscriptions for a username", async () => {
    const ok = await api.del("/internal/subscriptions/Ada", student);
    expect(ok.body).toEqual({
      success: true,
      deleted: 2,
      message: "Removed 2 push subscription(s)",
    });
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { username: { equals: "ada", mode: "insensitive" } },
    });

    prisma.pushSubscription.deleteMany.mockRejectedValueOnce(new Error("db"));
    expect((await api.del("/internal/subscriptions/ada", student)).status).toBe(500);
  });

  it("sends a direct admin push and validates the target", async () => {
    expect((await api.post("/push/send", { title: "T", body: "B" }, student)).status).toBe(
      403,
    );
    expect(
      (await api.post("/push/send", { title: "T" }, admin)).status,
    ).toBe(400);

    const missingUser = await api.post(
      "/push/send",
      { target: "user", title: "T", body: "B" },
      admin,
    );
    expect(missingUser.status).toBe(400);

    sendWebPush.mockResolvedValueOnce(2);
    const done = await api.post(
      "/push/send",
      { target: "user", username: "ada", title: "T", body: "B", image: "pic" },
      admin,
    );
    expect(done.body).toEqual({ success: true, status: "done", sent: 2 });

    sendWebPush.mockResolvedValueOnce(0);
    const none = await api.post(
      "/push/send",
      { target: "USER", username: "ada", title: "T", body: "B" },
      admin,
    );
    expect(none.body.status).toBe("no_subscribers");

    expect(
      (await api.post("/push/send", { target: "batch", title: "T", body: "B" }, admin))
        .status,
    ).toBe(400);
    expect(
      (await api.post("/push/send", { target: "year", title: "T", body: "B" }, admin))
        .status,
    ).toBe(400);
    expect(
      (await api.post("/push/send", { target: "campus", title: "T", body: "B" }, admin))
        .body.error,
    ).toContain("target must be one of");
  });

  it("filters a batch, looks up a year or role, and fans out chunks", async () => {
    axiosPost.mockResolvedValueOnce({
      data: {
        success: true,
        users: [{ username: "O21ABC" }, { username: "N21XYZ" }],
      },
    });
    const batch = await api.post(
      "/push/send",
      { target: "batch", batch: "o21", title: "Hello", body: "Batch" },
      admin,
    );
    expect(batch.status).toBe(202);
    expect(batch.body).toMatchObject({ targets: 1, jobs: 1, status: "queued" });
    expect(axiosPost).toHaveBeenCalledWith(
      "http://uniz-user-service:3002/internal/targeting",
      { target: "students", branch: "all", year: "all" },
      expect.objectContaining({
        headers: { "x-internal-secret": "unit-test-internal" },
        timeout: 10000,
      }),
    );
    expect(enqueueNotificationJob).toHaveBeenCalledWith(
      "PUSH_BROADCAST",
      expect.objectContaining({
        users: [{ username: "O21ABC" }],
        title: "Hello",
        body: "Batch",
      }),
    );

    axiosPost.mockResolvedValueOnce({
      data: { success: true, users: [{ username: "e3" }] },
    });
    await api.post(
      "/push/send",
      { target: "year", year: "E3", title: "T", body: "B" },
      admin,
    );
    expect(axiosPost).toHaveBeenLastCalledWith(
      expect.stringContaining("/internal/targeting"),
      { target: "students", branch: "all", year: "E3" },
      expect.any(Object),
    );

    axiosPost.mockResolvedValueOnce({
      data: { success: true, users: [{ username: "hod1" }] },
    });
    await api.post(
      "/push/send",
      { target: "hod", branch: "CSE", year: "E3", title: "T", body: "B" },
      admin,
    );
    expect(axiosPost).toHaveBeenLastCalledWith(
      expect.any(String),
      { target: "hod", branch: "CSE", year: "E3" },
      expect.any(Object),
    );

    axiosPost.mockResolvedValueOnce({
      data: { success: false, users: [{ username: "ignored" }] },
    });
    const empty = await api.post(
      "/push/send",
      { target: "students", title: "T", body: "B" },
      admin,
    );
    expect(empty.body).toEqual({ success: true, status: "no_targets", sent: 0 });

    const many = Array.from({ length: 101 }, (_, i) => ({
      username: `user${i}`,
    }));
    axiosPost.mockResolvedValueOnce({ data: { success: true, users: many } });
    enqueueNotificationJob.mockClear();
    let n = 0;
    enqueueNotificationJob.mockImplementation(async () => ({ id: `job-${++n}` }));
    const queued = await api.post(
      "/push/send",
      { target: "dean", title: "T", body: "B", image: "banner" },
      admin,
    );
    expect(queued.body).toEqual({
      success: true,
      status: "queued",
      queued: true,
      targets: 101,
      jobs: 2,
      jobIds: ["job-1", "job-2"],
    });
    expect(enqueueNotificationJob.mock.calls[0][1].users).toHaveLength(100);
    expect(enqueueNotificationJob.mock.calls[1][1].users).toHaveLength(1);
    expect(enqueueNotificationJob.mock.calls[0][1].image).toBe("banner");
  });

  it("merges every audience for target=all and reports targeting failures", async () => {
    axiosPost
      .mockResolvedValueOnce({
        data: { success: true, users: [{ username: "s1" }] },
      })
      .mockRejectedValueOnce(new Error("hod down"))
      .mockResolvedValueOnce({
        data: { success: true, users: [{ username: "d1" }] },
      });
    const all = await api.post(
      "/push/send",
      { target: "all", title: "T", body: "B" },
      admin,
    );
    expect(all.body.targets).toBe(2);
    expect(axiosPost).toHaveBeenCalledTimes(3);

    axiosPost.mockRejectedValueOnce(new Error("down"));
    const failed = await api.post(
      "/push/send",
      { target: "batch", batch: "o21", title: "T", body: "B" },
      admin,
    );
    expect(failed.status).toBe(500);
    expect(failed.body.error).toBe("down");
  });

  it("lists subscribers with search, name matches, and profile enrichment", async () => {
    expect((await api.get("/push/subscribers", student)).status).toBe(403);

    prisma.pushSubscription.count.mockResolvedValueOnce(25);
    prisma.pushSubscription.findMany.mockResolvedValueOnce([
      {
        username: "ada",
        endpoint: "https://push.example/ada",
        createdAt: "2026-01-01",
      },
      {
        username: "ada",
        endpoint: "https://push.example/ada-2",
        createdAt: "2026-01-02",
      },
    ]);
    axiosPost
      .mockResolvedValueOnce({
        data: { students: [{ username: "Ada" }, { username: "Lovelace" }] },
      })
      .mockResolvedValueOnce({
        data: {
          students: [
            {
              username: "ada",
              name: "Ada Lovelace",
              branch: "CSE",
              year: "E3",
              batch: "O21",
              email: "ada@example.com",
            },
          ],
        },
      });

    const page = await api.get("/push/subscribers?search=Ada&page=2&limit=10", admin);
    expect(page.body).toMatchObject({
      success: true,
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
    expect(page.body.subscribers[0]).toMatchObject({
      displayName: "Ada Lovelace",
      branch: "CSE",
      email: "ada@example.com",
    });
    expect(page.body.subscribers[1].displayName).toBe("Ada Lovelace");
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    const where = prisma.pushSubscription.findMany.mock.calls[0][0].where;
    expect(where.OR[1].username.in).toEqual(["ada", "lovelace"]);
    expect(axiosPost.mock.calls[1][0]).toContain("/internal/bulk-profiles");
    expect(axiosPost.mock.calls[1][1]).toEqual({ usernames: ["ADA"] });

    prisma.pushSubscription.count.mockResolvedValueOnce(0);
    prisma.pushSubscription.findMany.mockResolvedValueOnce([]);
    axiosPost.mockRejectedValueOnce(new Error("search down"));
    const fallback = await api.get("/push/subscribers?prefix=zz", admin);
    expect(fallback.body.totalPages).toBe(1);
    expect(prisma.pushSubscription.findMany.mock.calls.at(-1)[0].where.OR).toHaveLength(
      2,
    );

    prisma.pushSubscription.count.mockResolvedValueOnce(1);
    prisma.pushSubscription.findMany.mockResolvedValueOnce([
      { username: "sam", endpoint: "https://push.example/sam" },
    ]);
    axiosPost.mockClear();
    axiosPost.mockResolvedValueOnce({ data: { students: [] } });
    const noNames = await api.get("/push/subscribers?search=sam", admin);
    expect(noNames.body.subscribers).toHaveLength(1);
    expect(
      prisma.pushSubscription.findMany.mock.calls.at(-1)[0].where.OR,
    ).toHaveLength(2);

    prisma.pushSubscription.count.mockResolvedValueOnce(1);
    prisma.pushSubscription.findMany.mockResolvedValueOnce([
      { username: "sam", endpoint: "https://push.example/sam" },
    ]);
    axiosPost.mockClear();
    axiosPost.mockRejectedValueOnce(new Error("profiles down"));
    const plain = await api.get(
      "/push/subscribers?search=s&limit=10000&page=0",
      admin,
    );
    expect(plain.body.limit).toBe(500);
    expect(plain.body.page).toBe(1);
    expect(plain.body.subscribers[0]).toMatchObject({
      displayName: null,
      branch: null,
      year: null,
      batch: null,
      email: null,
    });
    expect(
      axiosPost.mock.calls.some((call) =>
        String(call[0]).includes("/student/search"),
      ),
    ).toBe(false);

    prisma.pushSubscription.count.mockRejectedValueOnce(new Error("count failed"));
    expect((await api.get("/push/subscribers", admin)).status).toBe(500);
  });
});
