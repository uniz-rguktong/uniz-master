import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { establishmentRouter } from "../src/routes/establishment.routes";
import * as svc from "../src/services/establishment.service";
import { axiosMock, prismaMock, redisMock } from "./mocks";

let server: http.Server;
let base = "";
const tok = (role: string, username: string) =>
  `Bearer ${jwt.sign({ id: "x", username, role }, "unit-test-jwt-secret")}`;
const ADMIN = tok("webadmin", "web1");
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
  app.use("/establishment", establishmentRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

const P = "/establishment";
describe("establishment", () => {
  beforeEach(() => {
    prismaMock.facultyProfile.findMany.mockResolvedValue([
      {
        username: "f1",
        name: "Asha",
        email: "a@x",
        department: "CSE",
        designation: "Assistant Professor",
      },
    ]);
    prismaMock.adminProfile.findMany.mockResolvedValue([
      {
        username: "web1",
        name: "",
        email: "",
        department: "",
        designation: "",
      },
    ]);
    prismaMock.staffRecord.findMany.mockResolvedValue([
      {
        id: ID,
        personType: "faculty",
        personId: "f1",
        designation: "Associate Professor",
        department: "CSE",
      },
    ]);
  });
  it("lists staff master merged with records", async () => {
    const r = await call("GET", `${P}/staff`, ADMIN);
    expect(r.status).toBe(200);
    expect(r.body.staff).toHaveLength(2);
    expect(r.body.staff[0].designation).toBe("Associate Professor");
    const q = await call("GET", `${P}/staff?q=asha`, ADMIN);
    expect(q.body.staff).toHaveLength(1);
  });
  it("blocks students and anonymous users", async () => {
    expect((await call("GET", `${P}/staff`, STUDENT)).status).toBe(403);
    expect((await call("GET", `${P}/staff`)).status).toBe(401);
  });
  it("counts designations", async () => {
    const r = await call("GET", `${P}/designations`, ADMIN);
    expect(r.body.designations["Associate Professor"]).toBe(1);
    expect(r.body.designations.unassigned).toBe(1);
  });
  it("upserts a record for an existing profile only", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(null);
    expect(
      (
        await call("PUT", `${P}/staff`, ADMIN, {
          personType: "faculty",
          personId: "nope",
        })
      ).status,
    ).toBe(404);
    prismaMock.facultyProfile.findUnique.mockResolvedValue({ username: "f1" });
    prismaMock.staffRecord.upsert.mockResolvedValue({ id: ID });
    const r = await call("PUT", `${P}/staff`, ADMIN, {
      personType: "faculty",
      personId: "f1",
      designation: "Professor",
      joinedOn: "2020-07-01",
    });
    expect(r.status).toBe(200);
    expect(
      prismaMock.staffRecord.upsert.mock.calls.at(-1)[0].update.joinedOn,
    ).toBeInstanceOf(Date);
    expect(
      (
        await call("PUT", `${P}/staff`, ADMIN, {
          personType: "x",
          personId: "f1",
        })
      ).status,
    ).toBe(400);
  });
  it("returns a record with events and leave balances", async () => {
    prismaMock.staffRecord.findUnique.mockResolvedValue({
      id: ID,
      personType: "faculty",
      personId: "f1",
      events: [],
    });
    prismaMock.facultyProfile.findUnique.mockResolvedValue({ username: "f1" });
    prismaMock.leaveBalance.findMany.mockResolvedValue([
      { leaveType: "CL", total: 12, used: 2 },
    ]);
    const r = await call("GET", `${P}/staff/${ID}`, ADMIN);
    expect(r.status).toBe(200);
    expect(r.body.record.leave[0].leaveType).toBe("CL");
  });
  it("adds a promotion and updates designation", async () => {
    prismaMock.staffRecord.findUnique.mockResolvedValue({ id: ID });
    prismaMock.serviceEvent.create.mockResolvedValue({ id: "e" });
    prismaMock.staffRecord.update.mockResolvedValue({});
    const r = await call("POST", `${P}/staff/${ID}/events`, ADMIN, {
      kind: "promotion",
      date: "2026-10-01",
      toValue: "Professor",
    });
    expect(r.status).toBe(201);
    expect(
      prismaMock.staffRecord.update.mock.calls.at(-1)[0].data.designation,
    ).toBe("Professor");
    expect(svc.EVENT_KINDS).toContain("retired");
  });
});
