import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { alumniRouter } from "../src/routes/alumni.routes";
import * as svc from "../src/services/alumni.service";
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
  app.use("/alumni", alumniRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

const P = "/alumni";
describe("alumni routes", () => {
  it("directory is public and only shows opted-in profiles", async () => {
    prismaMock.alumniProfile.findMany.mockResolvedValue([
      { id: ID, name: "A" },
    ]);
    const r = await call("GET", `${P}/directory?q=goo`);
    expect(r.status).toBe(200);
    const arg = prismaMock.alumniProfile.findMany.mock.calls.at(-1)[0];
    expect(arg.where.visible).toBe(true);
    expect(arg.select.email).toBeUndefined();
  });
  it("needs login elsewhere", async () => {
    expect((await call("GET", `${P}/me`)).status).toBe(401);
  });
  it("status works", async () => {
    expect((await call("GET", `${P}/status`, STUDENT)).body.staff).toBe(false);
  });
  it("claim start sends otp by mail", async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: "s1",
      email: "abc@x.in",
    });
    const r = await call("POST", `${P}/claim/start`, STUDENT);
    expect(r.status).toBe(200);
    expect(r.body.sentTo).toBe("ab***@x.in");
    expect(redisMock.setex).toHaveBeenCalled();
    expect(axiosMock.post.mock.calls.at(-1)[1].type).toBe("otp");
  });
  it("claim start blocks staff", async () => {
    expect((await call("POST", `${P}/claim/start`, ADMIN)).status).toBe(403);
  });
  it("claim verify rejects a wrong code", async () => {
    redisMock.get.mockResolvedValue("nope");
    expect(
      (await call("POST", `${P}/claim/verify`, STUDENT, { otp: "123456" }))
        .status,
    ).toBe(400);
    expect(
      (await call("POST", `${P}/claim/verify`, STUDENT, { otp: "12" })).status,
    ).toBe(400);
  });
  it("claim verify creates the profile", async () => {
    const crypto = await import("crypto");
    redisMock.get.mockResolvedValue(
      crypto.createHash("sha256").update("123456").digest("hex"),
    );
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: "s1",
      name: "N",
      email: "e",
      branch: "CSE",
      batch: "O20",
    });
    prismaMock.alumniProfile.upsert.mockResolvedValue({ id: ID });
    const r = await call("POST", `${P}/claim/verify`, STUDENT, {
      otp: "123456",
    });
    expect(r.status).toBe(200);
    expect(redisMock.del).toHaveBeenCalled();
  });
  it("me returns profile", async () => {
    prismaMock.alumniProfile.findUnique.mockResolvedValue({ id: ID });
    expect((await call("GET", `${P}/me`, STUDENT)).status).toBe(200);
  });
  it("update needs a claimed profile", async () => {
    prismaMock.alumniProfile.findUnique.mockResolvedValue(null);
    expect(
      (await call("PUT", `${P}/me`, STUDENT, { visible: true })).status,
    ).toBe(403);
    prismaMock.alumniProfile.findUnique.mockResolvedValue({
      id: ID,
      verifiedAt: new Date(),
    });
    prismaMock.alumniProfile.update.mockResolvedValue({ id: ID });
    expect(
      (await call("PUT", `${P}/me`, STUDENT, { visible: true })).status,
    ).toBe(200);
  });
  it("all is staff only", async () => {
    prismaMock.alumniProfile.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/all`, STUDENT)).status).toBe(403);
    expect((await call("GET", `${P}/all`, ADMIN)).status).toBe(200);
  });
  it("jobs list and post", async () => {
    prismaMock.alumniJob.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/jobs`, STUDENT)).status).toBe(200);
    prismaMock.alumniJob.create.mockResolvedValue({ id: ID });
    const job = { company: "Acme", title: "SDE", applyUrl: "https://a.co/j" };
    expect((await call("POST", `${P}/jobs`, ADMIN, job)).status).toBe(201);
    prismaMock.alumniProfile.findUnique.mockResolvedValue(null);
    expect((await call("POST", `${P}/jobs`, STUDENT, job)).status).toBe(403);
  });
  it("close job by poster or staff", async () => {
    prismaMock.alumniJob.findUnique.mockResolvedValue({
      id: ID,
      postedBy: "other",
    });
    expect((await call("POST", `${P}/jobs/${ID}/close`, STUDENT)).status).toBe(
      403,
    );
    prismaMock.alumniJob.update.mockResolvedValue({ id: ID });
    expect((await call("POST", `${P}/jobs/${ID}/close`, ADMIN)).status).toBe(
      200,
    );
  });
});
