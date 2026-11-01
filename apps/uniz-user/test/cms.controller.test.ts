import { describe, expect, it } from "vitest";
import {
  createBanner,
  createUpdate,
  deleteBanner,
  getAdminBanners,
  getPublicBanners,
  getPublicNotifications,
  toggleVisibility,
} from "../src/controllers/cms.controller";
import { mockReq, mockRes } from "./http";
import { prismaMock, redisMock } from "./mocks";

const webadmin = { username: "web", role: "webadmin" };

describe("public CMS", () => {
  it("returns cached banners without querying prisma", async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({ success: true, banners: [{ id: "b1" }] }),
    );
    const res = mockRes();
    await getPublicBanners(mockReq(), res);
    expect(res.body.banners).toEqual([{ id: "b1" }]);
    expect(prismaMock.banner.findMany).not.toHaveBeenCalled();
    expect(res.headers["Cache-Control"]).toContain("stale-while-revalidate");
  });

  it("loads visible banners and caches them for 45 seconds", async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.banner.findMany.mockResolvedValue([{ id: "b2", isVisible: true }]);
    const res = mockRes();
    await getPublicBanners(mockReq(), res);
    expect(res.body.banners).toHaveLength(1);
    expect(redisMock.setex).toHaveBeenCalledWith(
      "cms:public:banners:v1",
      45,
      expect.any(String),
    );
  });

  it("returns an empty banner list when the database throws", async () => {
    redisMock.get.mockRejectedValue(new Error("redis"));
    const res = mockRes();
    await getPublicBanners(mockReq(), res);
    expect(res.body).toEqual({ success: true, banners: [] });
  });

  it("caches public notifications and fails soft", async () => {
    redisMock.get.mockResolvedValueOnce(null);
    prismaMock.publicNotification.findMany.mockResolvedValue([{ id: "n1" }]);
    const fresh = mockRes();
    await getPublicNotifications(mockReq(), fresh);
    expect(fresh.body.notifications).toEqual({
      updates: [{ id: "n1" }],
      tenders: [],
    });
    expect(redisMock.setex).toHaveBeenCalledWith(
      "cms:public:notifications:v1",
      45,
      expect.any(String),
    );

    redisMock.get.mockRejectedValue(new Error("down"));
    const failed = mockRes();
    await getPublicNotifications(mockReq(), failed);
    expect(failed.body.notifications.updates).toEqual([]);
  });
});

describe("admin CMS", () => {
  it("blocks students from banner admin", async () => {
    const res = mockRes();
    await getAdminBanners(
      mockReq({ user: { username: "O240001", role: "student" } }),
      res,
    );
    expect(res.statusCode).toBe(403);
  });

  it("lists, creates, and deletes banners for webadmin", async () => {
    prismaMock.banner.findMany.mockResolvedValue([{ id: "b1" }]);
    const listed = mockRes();
    await getAdminBanners(mockReq({ user: webadmin }), listed);
    expect(listed.body.banners).toEqual([{ id: "b1" }]);

    prismaMock.banner.create.mockResolvedValue({ id: "b3", isVisible: true });
    const created = mockRes();
    await createBanner(
      mockReq({ user: webadmin, body: { title: "Welcome", text: "Hi" } }),
      created,
    );
    expect(prismaMock.banner.create.mock.calls[0][0].data.isVisible).toBe(true);

    prismaMock.banner.delete.mockResolvedValue({});
    const removed = mockRes();
    await deleteBanner(mockReq({ user: webadmin, params: { id: "b3" } }), removed);
    expect(removed.body.success).toBe(true);
  });

  it("creates an update and rejects an unknown visibility type", async () => {
    prismaMock.publicNotification.create.mockResolvedValue({ id: "u1" });
    const res = mockRes();
    await createUpdate(
      mockReq({
        user: { username: "dean", role: "dean" },
        body: { title: "Exam", content: "Monday" },
      }),
      res,
    );
    expect(res.body.update.id).toBe("u1");

    const bad = mockRes();
    await toggleVisibility(
      mockReq({
        user: webadmin,
        params: { type: "poster", id: "x" },
        body: { isVisible: false },
      }),
      bad,
    );
    expect(bad.statusCode).toBe(400);

    prismaMock.tender.update.mockResolvedValue({ id: "t1", isVisible: false });
    const ok = mockRes();
    await toggleVisibility(
      mockReq({
        user: { username: "dir", role: "director" },
        params: { type: "tender", id: "t1" },
        body: { isVisible: false },
      }),
      ok,
    );
    expect(ok.body.data.isVisible).toBe(false);
  });

  it("returns 500 when a banner write fails", async () => {
    prismaMock.banner.findMany.mockRejectedValue(new Error("db"));
    const res = mockRes();
    await getAdminBanners(mockReq({ user: webadmin }), res);
    expect(res.statusCode).toBe(500);
  });
});
