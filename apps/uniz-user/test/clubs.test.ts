import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clubsRouter } from "../src/routes/clubs.routes";
import * as svc from "../src/services/clubs.service";
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
  app.use("/clubs", clubsRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

const P = "/clubs";
const FAC = tok("faculty", "F100");
const club = { id: ID, name: "Code", coordinators: "O240001", active: true };
describe("clubs", () => {
  it("needs login", async () => {
    expect((await call("GET", P)).status).toBe(401);
  });
  it("status", async () => {
    expect((await call("GET", `${P}/status`, ADMIN)).body.staff).toBe(true);
  });
  it("lists clubs with my status", async () => {
    prismaMock.club.findMany.mockResolvedValue([club]);
    prismaMock.clubMember.findMany.mockResolvedValue([
      { clubId: ID, status: "approved" },
    ]);
    const r = await call("GET", P, STUDENT);
    expect(r.body.clubs[0].myStatus).toBe("approved");
    expect(r.body.clubs[0].coordinator).toBe(true);
  });
  it("create is staff only", async () => {
    prismaMock.club.create.mockResolvedValue(club);
    expect((await call("POST", P, STUDENT, { name: "Code" })).status).toBe(403);
    expect(
      (
        await call("POST", P, ADMIN, {
          name: "Code",
          coordinators: ["O240001"],
        })
      ).status,
    ).toBe(201);
    prismaMock.club.findUnique.mockResolvedValue(club);
    prismaMock.club.update.mockResolvedValue(club);
    expect(
      (await call("PUT", `${P}/${ID}`, ADMIN, { active: false })).status,
    ).toBe(200);
  });
  it("join and leave", async () => {
    prismaMock.club.findUnique.mockResolvedValue(club);
    prismaMock.clubMember.create.mockResolvedValue({ id: ID });
    expect((await call("POST", `${P}/${ID}/join`, STUDENT)).status).toBe(201);
    prismaMock.clubMember.deleteMany.mockResolvedValue({ count: 1 });
    expect((await call("POST", `${P}/${ID}/leave`, STUDENT)).status).toBe(200);
  });
  it("coordinator manages members", async () => {
    prismaMock.club.findUnique.mockResolvedValue(club);
    prismaMock.clubMember.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/${ID}/members`, STUDENT)).status).toBe(200);
    expect(
      (await call("GET", `${P}/${ID}/members`, tok("student", "O249999")))
        .status,
    ).toBe(403);
    prismaMock.clubMember.findUnique.mockResolvedValue({
      id: ID,
      clubId: ID,
      username: "O240002",
    });
    prismaMock.clubMember.update.mockResolvedValue({ id: ID });
    expect(
      (
        await call("POST", `${P}/${ID}/members/${ID}`, STUDENT, {
          status: "approved",
        })
      ).status,
    ).toBe(200);
  });
  it("event also goes to the info centre", async () => {
    prismaMock.club.findUnique.mockResolvedValue(club);
    prismaMock.infoItem.create.mockResolvedValue({ id: "info1" });
    prismaMock.clubEvent.create.mockResolvedValue({ id: ID });
    const r = await call("POST", `${P}/${ID}/events`, STUDENT, {
      title: "Hackathon",
      startsAt: "2026-12-01T10:00",
    });
    expect(r.status).toBe(201);
    expect(
      prismaMock.clubEvent.create.mock.calls.at(-1)[0].data.infoItemId,
    ).toBe("info1");
    prismaMock.clubEvent.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/events`, STUDENT)).status).toBe(200);
    expect((await call("GET", `${P}/${ID}/events`, STUDENT)).status).toBe(200);
  });
  it("consultancy: faculty and staff only", async () => {
    prismaMock.consultancyProject.findMany.mockResolvedValue([
      { status: "ongoing", valueInr: 5 },
    ]);
    expect((await call("GET", `${P}/consultancy`, STUDENT)).status).toBe(403);
    expect(
      (await call("GET", `${P}/consultancy`, FAC)).body.totals.ongoing,
    ).toBe(5);
    prismaMock.consultancyProject.create.mockResolvedValue({ id: ID });
    const r = await call("POST", `${P}/consultancy`, FAC, {
      title: "Soil test",
      client: "APSIDC",
      valueInr: 100000,
    });
    expect(r.status).toBe(201);
    expect(
      prismaMock.consultancyProject.create.mock.calls.at(-1)[0].data.faculty,
    ).toBe("F100");
    prismaMock.consultancyProject.findUnique.mockResolvedValue({
      id: ID,
      createdBy: "other",
    });
    expect(
      (await call("PUT", `${P}/consultancy/${ID}`, FAC, { status: "ongoing" }))
        .status,
    ).toBe(403);
    prismaMock.consultancyProject.update.mockResolvedValue({ id: ID });
    expect(
      (
        await call("PUT", `${P}/consultancy/${ID}`, ADMIN, {
          status: "ongoing",
        })
      ).status,
    ).toBe(200);
  });
});
