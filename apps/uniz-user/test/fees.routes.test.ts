import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { feesRouter } from "../src/routes/fees.routes";
import { prismaMock, redisMock } from "./mocks";

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
  app.use("/fees", feesRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const a = server.address() as any;
  base = `http://127.0.0.1:${a.port}`;
});
afterAll(() => server.close());

const inv = {
  id: ID,
  username: "O240001",
  amountPaise: 1000,
  paidPaise: 0,
  status: "due",
};

describe("fees routes", () => {
  beforeEach(() => {
    redisMock.incr.mockResolvedValue(1);
    prismaMock.payment.findFirst.mockResolvedValue(null);
  });

  it("401 without token", async () => {
    expect((await call("GET", "/fees/status")).status).toBe(401);
  });

  it("GET /status says payments coming soon", async () => {
    const r = await call("GET", "/fees/status", STUDENT);
    expect(r.status).toBe(200);
    expect(r.body.payments.reason).toBe("Payments coming soon");
  });

  it("POST /structures validates and creates", async () => {
    expect(
      (await call("POST", "/fees/structures", ADMIN, { name: "x" })).status,
    ).toBe(400);
    prismaMock.feeStructure.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r = await call("POST", "/fees/structures", ADMIN, {
      name: "Tuition",
      academicYear: "2026-27",
      items: [{ label: "Tuition", amountPaise: 1000 }],
      dueDate: "2026-12-01",
    });
    expect(r.status).toBe(201);
    expect(
      (
        await call("POST", "/fees/structures", STUDENT, {
          name: "Tuition",
          academicYear: "2026-27",
          items: [{ label: "Tuition", amountPaise: 1000 }],
          dueDate: "2026-12-01",
        })
      ).status,
    ).toBe(403);
  });

  it("GET /structures", async () => {
    prismaMock.feeStructure.findMany.mockResolvedValue([]);
    expect((await call("GET", "/fees/structures", ADMIN)).status).toBe(200);
  });

  it("POST /structures/:id/issue", async () => {
    prismaMock.feeStructure.findUnique.mockResolvedValue({
      id: ID,
      active: true,
      batch: "",
      branch: "",
      year: "",
      name: "T",
      amountPaise: 1,
      dueDate: new Date(),
    });
    prismaMock.studentProfile.findMany.mockResolvedValue([
      { id: "s1", username: "O240001" },
    ]);
    prismaMock.feeInvoice.createMany.mockResolvedValue({ count: 1 });
    const r = await call("POST", `/fees/structures/${ID}/issue`, ADMIN);
    expect(r.body.created).toBe(1);
  });

  it("GET /invoices", async () => {
    prismaMock.feeInvoice.findMany.mockResolvedValue([inv]);
    expect((await call("GET", "/fees/invoices?status=due", ADMIN)).status).toBe(
      200,
    );
    expect(
      (await call("GET", "/fees/invoices?status=bogus", ADMIN)).status,
    ).toBe(400);
  });

  it("GET /mine", async () => {
    prismaMock.feeInvoice.findMany.mockResolvedValue([inv]);
    prismaMock.payment.findMany.mockResolvedValue([]);
    const r = await call("GET", "/fees/mine", STUDENT);
    expect(r.body.invoices).toHaveLength(1);
  });

  it("POST /invoices/:id/pay returns 503 payments coming soon", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue(inv);
    const r = await call("POST", `/fees/invoices/${ID}/pay`, STUDENT);
    expect(r.status).toBe(503);
    expect(r.body.message).toBe("Payments coming soon");
  });

  it("POST /invoices/:id/record", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue(inv);
    prismaMock.payment.create.mockImplementation(async ({ data }: any) => data);
    prismaMock.feeInvoice.update.mockImplementation(
      async ({ data }: any) => data,
    );
    const r = await call("POST", `/fees/invoices/${ID}/record`, ADMIN, {
      amountPaise: 1000,
      method: "dd",
      reference: "DD-123",
    });
    expect(r.status).toBe(201);
    expect(r.body.invoice.status).toBe("paid");
  });

  it("503 when FEATURE_FEES is off", async () => {
    process.env.FEATURE_FEES = "false";
    expect((await call("GET", "/fees/status", STUDENT)).status).toBe(503);
    delete process.env.FEATURE_FEES;
  });
});
