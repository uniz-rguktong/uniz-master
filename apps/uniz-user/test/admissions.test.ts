import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { admissionsRouter } from "../src/routes/admissions.routes";
import * as svc from "../src/services/admissions.service";
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
  app.use("/admissions", admissionsRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

const P = "/admissions";
const now = Date.now();
const cycle = {
  id: ID,
  active: true,
  academicYear: "2027-28",
  programs: "PUC,BTECH",
  feeInr: 0,
  opensAt: new Date(now - 1e6),
  closesAt: new Date(now + 1e8),
};
const form = {
  cycleId: ID,
  name: "Ravi K",
  email: "Ravi@x.in",
  phone: "9876543210",
  program: "PUC",
  percentage: 91,
  captchaToken: "tok-1234567890",
  documents: [{ kind: "photo", url: "https://d.co/p" }],
};
describe("admissions", () => {
  it("public cycles show form state and fee state", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    prismaMock.admissionCycle.findMany.mockResolvedValue([
      { ...cycle, feeInr: 500 },
    ]);
    const r = await call("GET", `${P}/public/cycles`);
    expect(r.status).toBe(200);
    expect(r.body.formReady).toBe(false);
    expect(r.body.cycles[0].payment.enabled).toBe(false);
  });
  it("apply is disabled without turnstile secret", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(
      (await call("POST", `${P}/public/apply`, undefined, form)).status,
    ).toBe(503);
  });
  it("apply checks captcha then saves", async () => {
    process.env.TURNSTILE_SECRET_KEY = "x";
    axiosMock.post.mockResolvedValueOnce({ data: { success: false } });
    expect(
      (await call("POST", `${P}/public/apply`, undefined, form)).status,
    ).toBe(400);
    axiosMock.post.mockResolvedValueOnce({ data: { success: true } });
    prismaMock.admissionCycle.findUnique.mockResolvedValue(cycle);
    prismaMock.application.create.mockResolvedValue({
      id: ID,
      refNo: "ADM2027ABC123",
    });
    prismaMock.applicationDocument.createMany.mockResolvedValue({ count: 1 });
    const r = await call("POST", `${P}/public/apply`, undefined, form);
    expect(r.status).toBe(201);
    expect(r.body.refNo).toBe("ADM2027ABC123");
    expect(prismaMock.application.create.mock.calls.at(-1)[0].data.email).toBe(
      "ravi@x.in",
    );
    axiosMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(
      (
        await call("POST", `${P}/public/apply`, undefined, {
          ...form,
          program: "MBA",
        })
      ).status,
    ).toBe(400);
    delete process.env.TURNSTILE_SECRET_KEY;
  });
  it("status lookup needs matching email", async () => {
    prismaMock.application.findUnique.mockResolvedValue({
      refNo: "ADM2027ABC123",
      email: "ravi@x.in",
      status: "submitted",
    });
    expect(
      (
        await call(
          "GET",
          `${P}/public/status?refNo=ADM2027ABC123&email=ravi@x.in`,
        )
      ).status,
    ).toBe(200);
    expect(
      (await call("GET", `${P}/public/status?refNo=ADM2027ABC123&email=z@x.in`))
        .status,
    ).toBe(404);
  });
  it("staff routes need staff", async () => {
    expect((await call("GET", `${P}/cycles`)).status).toBe(401);
    expect((await call("GET", `${P}/cycles`, STUDENT)).status).toBe(403);
    prismaMock.admissionCycle.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/cycles`, ADMIN)).status).toBe(200);
    expect((await call("GET", `${P}/status`, ADMIN)).body.staff).toBe(true);
  });
  it("cycle create and update", async () => {
    prismaMock.admissionCycle.create.mockResolvedValue(cycle);
    const r = await call("POST", `${P}/cycles`, ADMIN, {
      name: "PUC 2027",
      academicYear: "2027-28",
      programs: ["PUC"],
      opensAt: "2027-04-01",
      closesAt: "2027-05-01",
    });
    expect(r.status).toBe(201);
    prismaMock.admissionCycle.findUnique.mockResolvedValue(cycle);
    prismaMock.admissionCycle.update.mockResolvedValue(cycle);
    expect(
      (await call("PUT", `${P}/cycles/${ID}`, ADMIN, { active: false })).status,
    ).toBe(200);
  });
  it("list, detail, stats, review", async () => {
    prismaMock.application.findMany.mockResolvedValue([
      { status: "accepted", program: "PUC" },
    ]);
    expect(
      (
        await call(
          "GET",
          `${P}/cycles/${ID}/applications?status=submitted`,
          ADMIN,
        )
      ).status,
    ).toBe(200);
    expect(
      (await call("GET", `${P}/cycles/${ID}/stats`, ADMIN)).body.stats.byStatus
        .accepted,
    ).toBe(1);
    prismaMock.application.findUnique.mockResolvedValue({
      id: ID,
      status: "submitted",
      reviewNote: "",
    });
    prismaMock.applicationDocument.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/applications/${ID}`, ADMIN)).status).toBe(
      200,
    );
    prismaMock.application.update.mockResolvedValue({ id: ID });
    expect(
      (
        await call("POST", `${P}/applications/${ID}/review`, ADMIN, {
          status: "accepted",
        })
      ).status,
    ).toBe(200);
    prismaMock.application.findUnique.mockResolvedValue({
      id: ID,
      status: "converted",
    });
    expect(
      (
        await call("POST", `${P}/applications/${ID}/review`, ADMIN, {
          status: "rejected",
        })
      ).status,
    ).toBe(400);
  });
  it("export gives upload csv and marks converted", async () => {
    prismaMock.application.findMany.mockResolvedValue([
      {
        id: ID,
        name: "Ravi",
        email: "r@x.in",
        gender: "M",
        program: "PUC",
        phone: "1",
        category: "BC",
      },
    ]);
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
    const r = await call("POST", `${P}/cycles/${ID}/export`, ADMIN, {
      batch: "o27",
      mark: true,
    });
    expect(r.body.count).toBe(1);
    expect(r.body.csv.split("\n")[0]).toBe(
      "id,name,email,gender,branch,phone,batch,category",
    );
    expect(r.body.csv).toContain('"O27"');
    expect(prismaMock.application.updateMany).toHaveBeenCalled();
  });
});
