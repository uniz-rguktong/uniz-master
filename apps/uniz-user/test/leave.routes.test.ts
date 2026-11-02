import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { leaveRouter, dutyRouter } from "../src/routes/leave.routes";
import { prismaMock } from "./mocks";

let server: http.Server;
let base = "";
const tok = (role: string, username: string) =>
  `Bearer ${jwt.sign({ id: "x", username, role }, "unit-test-jwt-secret")}`;
const FAC = tok("faculty", "fac1");
const HOD = tok("faculty", "hod_cse");
const DEAN = tok("dean", "dean1");
const STUDENT = tok("student", "O240001");
const ID = "11111111-1111-4111-8111-111111111111";

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
  app.use("/leave", leaveRouter);
  app.use("/duty", dutyRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const a = server.address() as any;
  base = `http://127.0.0.1:${a.port}`;
});
afterAll(() => server.close());

const faculty = { id: "f1", username: "fac1", name: "Ravi", department: "CSE" };

describe("leave routes", () => {
  it("401 without token", async () => {
    expect((await call("GET", "/leave/mine")).status).toBe(401);
  });

  it("503 when the flag is off", async () => {
    process.env.FEATURE_FACULTY = "false";
    expect((await call("GET", "/leave/mine", FAC)).status).toBe(503);
    delete process.env.FEATURE_FACULTY;
  });

  it("GET /leave/status reports sms disabled", async () => {
    const r = await call("GET", "/leave/status", FAC);
    expect(r.status).toBe(200);
    expect(r.body.notifications.sms).toBe("SMS alerts not configured");
  });

  it("POST /leave/apply validates and creates", async () => {
    expect(
      (await call("POST", "/leave/apply", FAC, { leaveType: "XX" })).status,
    ).toBe(400);
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveBalance.findMany.mockResolvedValue([]);
    prismaMock.leaveRequest.create.mockImplementation(
      async ({ data }: any) => ({ id: ID, ...data }),
    );
    const r = await call("POST", "/leave/apply", FAC, {
      leaveType: "CL",
      fromDate: "2026-11-10",
      toDate: "2026-11-11",
      reason: "family function",
    });
    expect(r.status).toBe(201);
    expect(r.body.leave.status).toBe("pending_hod");
  });

  it("POST /leave/apply is 403 for students", async () => {
    const r = await call("POST", "/leave/apply", STUDENT, {
      leaveType: "CL",
      fromDate: "2026-11-10",
      toDate: "2026-11-11",
      reason: "family function",
    });
    expect(r.status).toBe(403);
  });

  it("GET /leave/mine", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveRequest.findMany.mockResolvedValue([{ id: ID }]);
    const r = await call("GET", "/leave/mine", FAC);
    expect(r.status).toBe(200);
    expect(r.body.leaves).toHaveLength(1);
  });

  it("GET /leave/balance", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveBalance.findMany.mockResolvedValue([]);
    const r = await call("GET", "/leave/balance?year=2026", FAC);
    expect(r.status).toBe(200);
    expect(r.body.balances[0]).toMatchObject({
      leaveType: "CL",
      remaining: 12,
    });
  });

  it("GET /leave/pending is 403 for plain faculty, 200 for HOD", async () => {
    expect((await call("GET", "/leave/pending", FAC)).status).toBe(403);
    prismaMock.leaveRequest.findMany.mockResolvedValue([]);
    expect((await call("GET", "/leave/pending", HOD)).status).toBe(200);
  });

  it("POST /leave/:id/decide", async () => {
    expect(
      (
        await call("POST", "/leave/not-a-uuid/decide", DEAN, {
          action: "approve",
        })
      ).status,
    ).toBe(400);
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: ID,
      status: "pending_hod",
      department: "CSE",
      username: "fac1",
    });
    prismaMock.leaveRequest.update.mockImplementation(
      async ({ data }: any) => data,
    );
    const r = await call("POST", `/leave/${ID}/decide`, HOD, {
      action: "reject",
      note: "exam week",
    });
    expect(r.status).toBe(200);
    expect(r.body.leave.status).toBe("rejected");
  });

  it("POST /leave/:id/cancel", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: ID,
      facultyId: "f1",
      status: "pending_hod",
    });
    prismaMock.leaveRequest.update.mockResolvedValue({
      id: ID,
      status: "cancelled",
    });
    expect((await call("POST", `/leave/${ID}/cancel`, FAC)).status).toBe(200);
  });
});

describe("duty routes", () => {
  it("POST /duty/assign", async () => {
    expect(
      (
        await call("POST", "/duty/assign", FAC, {
          facultyUsername: "fac1",
          dutyType: "exam",
          title: "Mid",
          date: "2026-11-20",
        })
      ).status,
    ).toBe(403);
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.dutyAssignment.create.mockImplementation(
      async ({ data }: any) => ({ id: ID, ...data }),
    );
    const r = await call("POST", "/duty/assign", HOD, {
      facultyUsername: "fac1",
      dutyType: "exam",
      title: "Mid",
      date: "2026-11-20",
    });
    expect(r.status).toBe(201);
  });

  it("GET /duty/mine", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.dutyAssignment.findMany.mockResolvedValue([]);
    expect((await call("GET", "/duty/mine", FAC)).status).toBe(200);
  });

  it("GET /duty/roster", async () => {
    expect((await call("GET", "/duty/roster", FAC)).status).toBe(403);
    prismaMock.dutyAssignment.findMany.mockResolvedValue([]);
    expect(
      (await call("GET", "/duty/roster?from=2026-11-01", DEAN)).status,
    ).toBe(200);
  });

  it("DELETE /duty/:id", async () => {
    prismaMock.dutyAssignment.findUnique.mockResolvedValue({
      id: ID,
      department: "CSE",
    });
    prismaMock.dutyAssignment.delete.mockResolvedValue({});
    expect((await call("DELETE", `/duty/${ID}`, HOD)).status).toBe(200);
  });
});
