import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { placementRouter } from "../src/routes/placement.routes";
import * as svc from "../src/services/placement.service";
import { axiosMock, prismaMock, redisMock } from "./mocks";

let server: http.Server;
let base = "";
const tok = (role: string, username: string) =>
  `Bearer ${jwt.sign({ id: "x", username, role }, "unit-test-jwt-secret")}`;
const ADMIN = tok("webadmin", "web1");
const STUDENT = tok("student", "O240001");
const ID = "11111111-1111-4111-8111-111111111111";
const future = new Date(Date.now() + 86400000 * 5);
const drive = {
  id: ID,
  companyId: ID,
  status: "open",
  deadline: future,
  branches: "CSE",
  batches: "",
  minCgpa: 7,
  maxBacklogs: 0,
  ctcLpa: 6,
};
const st = {
  id: "s1",
  username: "O240001",
  branch: "CSE",
  batch: "O24",
  cgpa: 8.1,
  totalBacklogs: 0,
  isSuspended: false,
};

async function call(
  method: string,
  path: string,
  auth?: string,
  body?: unknown,
) {
  const r = await fetch(`${base}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: auth } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/placement", placementRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

describe("placement service", () => {
  it("checks branch, cgpa and backlogs", () => {
    expect(svc.eligibility(drive, st).eligible).toBe(true);
    expect(svc.eligibility(drive, { ...st, cgpa: 6.5 }).reasons).toContain(
      "CGPA below 7",
    );
    expect(svc.eligibility(drive, { ...st, branch: "ECE" }).eligible).toBe(
      false,
    );
    expect(svc.eligibility(drive, { ...st, totalBacklogs: 1 }).eligible).toBe(
      false,
    );
  });
});

describe("placement routes", () => {
  it("401 without token", async () => {
    expect((await call("GET", "/placement/status")).status).toBe(401);
  });
  it("GET /status", async () => {
    expect((await call("GET", "/placement/status", ADMIN)).body.staff).toBe(
      true,
    );
  });
  it("POST /companies staff only", async () => {
    prismaMock.company.create.mockImplementation(async ({ data }: any) => data);
    expect(
      (await call("POST", "/placement/companies", STUDENT, { name: "Acme" }))
        .status,
    ).toBe(403);
    expect(
      (await call("POST", "/placement/companies", ADMIN, { name: "Acme" }))
        .status,
    ).toBe(201);
  });
  it("GET /companies", async () => {
    prismaMock.company.findMany.mockResolvedValue([]);
    expect((await call("GET", "/placement/companies", ADMIN)).status).toBe(200);
  });
  it("POST /drives", async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: ID });
    prismaMock.placementDrive.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r = await call("POST", "/placement/drives", ADMIN, {
      companyId: ID,
      title: "SDE",
      jobRole: "SDE",
      branches: ["cse"],
      deadline: "2026-12-01",
    });
    expect(r.status).toBe(201);
    expect(r.body.drive.branches).toBe("CSE");
    expect(
      (await call("POST", "/placement/drives", ADMIN, { title: "x" })).status,
    ).toBe(400);
  });
  it("GET /drives shows eligibility to students", async () => {
    prismaMock.placementDrive.findMany.mockResolvedValue([drive]);
    prismaMock.company.findMany.mockResolvedValue([{ id: ID, name: "Acme" }]);
    prismaMock.studentProfile.findUnique.mockResolvedValue(st);
    const r = await call("GET", "/placement/drives", STUDENT);
    expect(r.body.drives[0]).toMatchObject({ company: "Acme", eligible: true });
  });
  it("POST /drives/:id/close", async () => {
    prismaMock.placementDrive.update.mockResolvedValue({ status: "closed" });
    expect(
      (await call("POST", `/placement/drives/${ID}/close`, ADMIN)).status,
    ).toBe(200);
  });
  it("POST /drives/:id/apply checks eligibility", async () => {
    prismaMock.placementDrive.findUnique.mockResolvedValue(drive);
    prismaMock.studentProfile.findUnique.mockResolvedValue({ ...st, cgpa: 5 });
    const r = await call("POST", `/placement/drives/${ID}/apply`, STUDENT, {
      resumeUrl: "https://x.io/r.pdf",
    });
    expect(r.body.code).toBe("NOT_ELIGIBLE");
    prismaMock.studentProfile.findUnique.mockResolvedValue(st);
    prismaMock.driveApplication.create.mockImplementation(
      async ({ data }: any) => data,
    );
    expect(
      (
        await call("POST", `/placement/drives/${ID}/apply`, STUDENT, {
          resumeUrl: "https://x.io/r.pdf",
        })
      ).status,
    ).toBe(201);
  });
  it("GET /drives/:id/applications", async () => {
    prismaMock.driveApplication.findMany.mockResolvedValue([]);
    expect(
      (await call("GET", `/placement/drives/${ID}/applications`, ADMIN)).status,
    ).toBe(200);
  });
  it("GET /mine", async () => {
    prismaMock.driveApplication.findMany.mockResolvedValue([]);
    prismaMock.offer.findMany.mockResolvedValue([]);
    expect((await call("GET", "/placement/mine", STUDENT)).body.offers).toEqual(
      [],
    );
  });
  it("POST /applications/:id/status selected creates offer", async () => {
    prismaMock.driveApplication.findUnique.mockResolvedValue({
      id: ID,
      driveId: ID,
      username: "O240001",
      note: "",
    });
    prismaMock.driveApplication.update.mockResolvedValue({
      status: "selected",
    });
    prismaMock.placementDrive.findUnique.mockResolvedValue(drive);
    prismaMock.offer.upsert.mockImplementation(
      async ({ create }: any) => create,
    );
    const r = await call(
      "POST",
      `/placement/applications/${ID}/status`,
      ADMIN,
      { status: "selected" },
    );
    expect(r.body.offer.ctcLpa).toBe(6);
  });
  it("POST /offers/:id/respond", async () => {
    prismaMock.offer.findUnique.mockResolvedValue({
      id: ID,
      username: "O240001",
      status: "offered",
    });
    prismaMock.offer.update.mockResolvedValue({ status: "accepted" });
    expect(
      (
        await call("POST", `/placement/offers/${ID}/respond`, STUDENT, {
          action: "accepted",
        })
      ).status,
    ).toBe(200);
  });
  it("GET /stats", async () => {
    prismaMock.offer.findMany.mockResolvedValue([
      { username: "A", companyId: ID, ctcLpa: 6 },
      { username: "B", companyId: ID, ctcLpa: 10 },
    ]);
    prismaMock.company.findMany.mockResolvedValue([{ id: ID, name: "Acme" }]);
    const r = await call("GET", "/placement/stats", ADMIN);
    expect(r.body.stats).toMatchObject({
      placedStudents: 2,
      avgCtcLpa: 8,
      maxCtcLpa: 10,
      byCompany: { Acme: 2 },
    });
  });
  it("503 when off", async () => {
    process.env.FEATURE_PLACEMENT = "false";
    expect((await call("GET", "/placement/status", STUDENT)).status).toBe(503);
    delete process.env.FEATURE_PLACEMENT;
  });
});
