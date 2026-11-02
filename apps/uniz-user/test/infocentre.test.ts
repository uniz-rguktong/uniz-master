import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { infocentreRouter } from "../src/routes/infocentre.routes";
import * as svc from "../src/services/infocentre.service";
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
  app.use("/infocentre", infocentreRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());
beforeEach(() => {
  redisMock.incr.mockResolvedValue(1);
  axiosMock.post.mockResolvedValue({});
});

const P = "/infocentre";
const d = new Date("2026-10-01");
describe("infocentre", () => {
  it("hub is public and merges sources, pinned first", async () => {
    prismaMock.infoItem.findMany.mockResolvedValue([
      {
        id: "a",
        category: "circular",
        title: "Exam circular",
        summary: "",
        url: "",
        tags: "exam",
        createdAt: d,
        pinned: true,
      },
    ]);
    prismaMock.publicNotification.findMany.mockResolvedValue([
      {
        id: "b",
        title: "Holiday",
        content: "Diwali",
        link: null,
        createdAt: new Date("2026-10-20"),
      },
    ]);
    prismaMock.tender.findMany.mockResolvedValue([
      {
        id: "c",
        title: "Lab tender",
        description: "x",
        pdfUrl: "u",
        deadline: null,
        createdAt: d,
      },
    ]);
    const r = await call("GET", `${P}/hub`);
    expect(r.status).toBe(200);
    expect(r.body.items.map((i: any) => i.id)).toEqual(["a", "b", "c"]);
    const s = await call("GET", `${P}/hub?q=exam`);
    expect(s.body.items.map((i: any) => i.id)).toEqual(["a"]);
  });
  it("hub filters by category", async () => {
    prismaMock.tender.findMany.mockResolvedValue([]);
    prismaMock.infoItem.findMany.mockClear();
    const r = await call("GET", `${P}/hub?category=tender`);
    expect(r.status).toBe(200);
    expect(prismaMock.infoItem.findMany).not.toHaveBeenCalled();
    expect((await call("GET", `${P}/hub?category=bad`)).status).toBe(400);
  });
  it("categories is public", async () => {
    expect((await call("GET", `${P}/categories`)).body.categories).toContain(
      "tender",
    );
  });
  it("manage routes need login and staff", async () => {
    expect((await call("GET", `${P}/items`)).status).toBe(401);
    expect((await call("GET", `${P}/items`, STUDENT)).status).toBe(403);
    prismaMock.infoItem.findMany.mockResolvedValue([]);
    expect((await call("GET", `${P}/items`, ADMIN)).status).toBe(200);
  });
  it("add and update", async () => {
    prismaMock.infoItem.create.mockResolvedValue({ id: ID });
    const r = await call("POST", `${P}/items`, ADMIN, {
      category: "calendar",
      title: "Academic calendar",
      tags: ["Sem1"],
    });
    expect(r.status).toBe(201);
    expect(prismaMock.infoItem.create.mock.calls.at(-1)[0].data.tags).toBe(
      "sem1",
    );
    expect(
      (
        await call("POST", `${P}/items`, STUDENT, {
          category: "calendar",
          title: "x1",
        })
      ).status,
    ).toBe(403);
    prismaMock.infoItem.findUnique.mockResolvedValue(null);
    expect(
      (await call("PUT", `${P}/items/${ID}`, ADMIN, { pinned: true })).status,
    ).toBe(404);
    prismaMock.infoItem.findUnique.mockResolvedValue({ id: ID });
    prismaMock.infoItem.update.mockResolvedValue({ id: ID });
    expect(
      (await call("PUT", `${P}/items/${ID}`, ADMIN, { isVisible: false }))
        .status,
    ).toBe(200);
  });
});
