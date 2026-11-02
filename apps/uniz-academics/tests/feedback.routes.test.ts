import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/createApp";
import prisma from "../src/utils/prisma.util";

const SECRET = "unit-test-internal";
const as = (role: string, username = "u1") => ({
  "x-internal-secret": SECRET,
  "x-override-role": role,
  "x-override-username": username,
  "x-uniz-service": "feedback",
});
const ID = "11111111-1111-4111-8111-111111111111";
const future = new Date(Date.now() + 86400000);

describe("feedback routes", () => {
  let app: ReturnType<typeof createApp>;
  beforeAll(() => {
    app = createApp();
  });

  it("needs auth", async () => {
    expect((await request(app).get("/feedback/open")).status).toBe(401);
  });

  it("503 when the flag is off", async () => {
    process.env.FEATURE_FEEDBACK = "false";
    const r = await request(app).get("/status").set(as("student"));
    delete process.env.FEATURE_FEEDBACK;
    expect(r.status).toBe(503);
  });

  it("GET /status", async () => {
    const r = await request(app).get("/status").set(as("student"));
    expect(r.status).toBe(200);
    expect(r.body.minResponses).toBe(5);
  });

  it("POST /forms", async () => {
    expect(
      (await request(app).post("/forms").set(as("dean")).send({})).status,
    ).toBe(400);
    const r = await request(app)
      .post("/forms")
      .set(as("student"))
      .send({
        semesterId: "S1",
        subjectId: "sub-1",
        closesAt: future.toISOString(),
      });
    expect(r.status).toBe(403);
  });

  it("GET /forms", async () => {
    expect((await request(app).get("/forms").set(as("faculty"))).status).toBe(
      403,
    );
    vi.mocked(prisma.feedbackForm.findMany).mockResolvedValueOnce([]);
    expect((await request(app).get("/forms").set(as("coe"))).status).toBe(200);
  });

  it("POST /forms/:id/close", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce({ id: ID });
    vi.mocked(prisma.feedbackForm.update).mockResolvedValueOnce({
      id: ID,
      status: "closed",
    });
    expect(
      (await request(app).post(`/forms/${ID}/close`).set(as("webadmin")))
        .status,
    ).toBe(200);
    expect(
      (await request(app).post("/forms/bad/close").set(as("webadmin"))).status,
    ).toBe(400);
  });

  it("GET /open", async () => {
    vi.mocked(prisma.registration.findMany).mockResolvedValueOnce([]);
    const r = await request(app).get("/open").set(as("student", "O210008"));
    expect(r.status).toBe(200);
    expect(r.body.forms).toEqual([]);
    expect((await request(app).get("/open").set(as("faculty"))).status).toBe(
      403,
    );
  });

  it("POST /forms/:id/submit", async () => {
    const bad = await request(app)
      .post(`/forms/${ID}/submit`)
      .set(as("student"))
      .send({ ratings: [9] });
    expect(bad.status).toBe(400);
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce({
      id: ID,
      subjectId: "sub-1",
      semesterId: "S1",
      questions: ["a"],
      closesAt: future,
      status: "open",
    });
    vi.mocked(prisma.registration.findFirst).mockResolvedValueOnce({ id: "r" });
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([]);
    const ok = await request(app)
      .post(`/forms/${ID}/submit`)
      .set(as("student", "O210008"))
      .send({ ratings: [4] });
    expect(ok.status).toBe(201);
  });

  it("GET /forms/:id/results", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce({
      id: ID,
      questions: ["a"],
      facultyUsername: "f1",
    });
    vi.mocked(prisma.feedbackResponse.findMany).mockResolvedValueOnce([]);
    const r = await request(app).get(`/forms/${ID}/results`).set(as("dean"));
    expect(r.status).toBe(200);
    expect(r.body.hidden).toBe(true);
  });

  it("GET /mine", async () => {
    vi.mocked(prisma.feedbackForm.findMany).mockResolvedValueOnce([]);
    expect(
      (await request(app).get("/mine").set(as("faculty", "f1"))).status,
    ).toBe(200);
    expect((await request(app).get("/mine").set(as("student"))).status).toBe(
      403,
    );
  });
});
