import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/createApp";
import prisma from "../src/utils/prisma.util";

const SECRET = "unit-test-internal";
const as = (role: string, username = "u1") => ({
  "x-internal-secret": SECRET,
  "x-override-role": role,
  "x-override-username": username,
  "x-uniz-service": "examduty",
});
const ID = "11111111-1111-4111-8111-111111111111";

describe("examduty routes", () => {
  let app: ReturnType<typeof createApp>;
  beforeAll(() => {
    app = createApp();
  });

  it("needs auth", async () => {
    const r = await request(app).get("/examduty/mine");
    expect(r.status).toBe(401);
  });

  it("returns 503 when the flag is off", async () => {
    process.env.FEATURE_EXAM_DUTIES = "false";
    const r = await request(app).get("/mine").set(as("faculty"));
    delete process.env.FEATURE_EXAM_DUTIES;
    expect(r.status).toBe(503);
  });

  it("GET /status", async () => {
    const r = await request(app).get("/status").set(as("faculty"));
    expect(r.status).toBe(200);
    expect(r.body.notifications.sms).toBe("SMS alerts not configured");
  });

  it("GET /halls admin only", async () => {
    expect(
      (
        await request(app)
          .get("/halls?semesterId=S1&examName=MID-1")
          .set(as("faculty"))
      ).status,
    ).toBe(403);
    vi.mocked(prisma.seatingArrangement.findMany).mockResolvedValueOnce([]);
    expect(
      (
        await request(app)
          .get("/halls?semesterId=S1&examName=MID-1")
          .set(as("coe"))
      ).status,
    ).toBe(200);
  });

  it("POST /generate validates", async () => {
    const r = await request(app)
      .post("/generate")
      .set(as("coe"))
      .send({ semesterId: "S1" });
    expect(r.status).toBe(400);
  });

  it("POST /generate forbids faculty", async () => {
    const r = await request(app)
      .post("/generate")
      .set(as("faculty"))
      .send({ semesterId: "S1", examName: "MID-1", faculty: ["f1"] });
    expect(r.status).toBe(403);
  });

  it("GET /roster", async () => {
    vi.mocked(prisma.examDuty.findMany).mockResolvedValueOnce([]);
    const r = await request(app)
      .get("/roster?semesterId=S1&examName=MID-1")
      .set(as("webadmin"));
    expect(r.status).toBe(200);
    expect(r.body.duties).toEqual([]);
  });

  it("GET /mine", async () => {
    vi.mocked(prisma.examDuty.findMany).mockResolvedValueOnce([{ id: ID }]);
    const r = await request(app).get("/mine").set(as("faculty", "f1"));
    expect(r.status).toBe(200);
    expect(r.body.duties).toHaveLength(1);
  });

  it("POST /:id/swap", async () => {
    vi.mocked(prisma.examDuty.findUnique).mockResolvedValueOnce({
      id: ID,
      facultyUsername: "f1",
    });
    vi.mocked(prisma.examDuty.update).mockResolvedValueOnce({
      id: ID,
      swapStatus: "pending",
    });
    const r = await request(app)
      .post(`/${ID}/swap`)
      .set(as("faculty", "f1"))
      .send({ toUsername: "f2", reason: "family function" });
    expect(r.status).toBe(200);
    expect(
      (await request(app).post("/bad/swap").set(as("faculty", "f1")).send({}))
        .status,
    ).toBe(400);
  });

  it("GET /swaps admin only", async () => {
    expect((await request(app).get("/swaps").set(as("faculty"))).status).toBe(
      403,
    );
    vi.mocked(prisma.examDuty.findMany).mockResolvedValueOnce([]);
    expect((await request(app).get("/swaps").set(as("dean"))).status).toBe(200);
  });

  it("POST /:id/swap/decide", async () => {
    vi.mocked(prisma.examDuty.findUnique).mockResolvedValueOnce({
      id: ID,
      facultyUsername: "f1",
      swapTo: "f2",
      swapStatus: "pending",
    });
    vi.mocked(prisma.examDuty.update).mockResolvedValueOnce({
      id: ID,
      swapStatus: "rejected",
    });
    const r = await request(app)
      .post(`/${ID}/swap/decide`)
      .set(as("coe"))
      .send({ approve: false });
    expect(r.status).toBe(200);
  });
});
