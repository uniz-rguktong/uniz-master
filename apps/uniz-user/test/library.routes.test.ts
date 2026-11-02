import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { libraryRouter } from "../src/routes/library.routes";
import { axiosMock, prismaMock, redisMock } from "./mocks";

let server: http.Server;
let base = "";
const tok = (role: string, username: string) =>
  `Bearer ${jwt.sign({ id: "x", username, role }, "unit-test-jwt-secret")}`;
const LIB = tok("librarian", "librarian");
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
  app.use("/library", libraryRouter);
  server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(() => server.close());

describe("library routes", () => {
  beforeEach(() => {
    redisMock.incr.mockResolvedValue(1);
    prismaMock.loan.count.mockResolvedValue(0);
    prismaMock.libraryFine.count.mockResolvedValue(0);
    prismaMock.bookCopy.updateMany.mockResolvedValue({ count: 1 });
  });

  it("401 without token", async () => {
    expect((await call("GET", "/library/status")).status).toBe(401);
  });

  it("GET /status", async () => {
    const r = await call("GET", "/library/status", STUDENT);
    expect(r.body.staff).toBe(false);
  });

  it("GET /books", async () => {
    prismaMock.book.findMany.mockResolvedValue([{ id: "b1", title: "OS" }]);
    prismaMock.bookCopy.findMany.mockResolvedValue([
      { bookId: "b1", status: "available" },
    ]);
    const r = await call("GET", "/library/books?q=os", STUDENT);
    expect(r.body.books[0].available).toBe(1);
  });

  it("POST /books staff only", async () => {
    const body = { title: "OS", barcodes: ["B1"] };
    expect((await call("POST", "/library/books", STUDENT, body)).status).toBe(
      403,
    );
    prismaMock.book.findFirst.mockResolvedValue({ id: "b1" });
    prismaMock.bookCopy.createMany.mockResolvedValue({ count: 1 });
    expect((await call("POST", "/library/books", LIB, body)).status).toBe(201);
    expect(
      (await call("POST", "/library/books", LIB, { title: "OS" })).status,
    ).toBe(400);
  });

  it("POST /import", async () => {
    prismaMock.book.findFirst.mockResolvedValue({ id: "b1" });
    prismaMock.bookCopy.createMany.mockResolvedValue({ count: 1 });
    const r = await call("POST", "/library/import", LIB, {
      csv: "title,barcode\nOS,B1\n",
    });
    expect(r.body.copiesAdded).toBe(1);
  });

  it("POST /issue", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({
      id: "c1",
      bookId: "b1",
      status: "available",
    });
    prismaMock.studentProfile.findFirst.mockResolvedValue(null);
    prismaMock.facultyProfile.findFirst.mockResolvedValue({ username: "fac1" });
    prismaMock.loan.create.mockImplementation(async ({ data }: any) => data);
    const r = await call("POST", "/library/issue", LIB, {
      barcode: "B1",
      username: "fac1",
    });
    expect(r.status).toBe(201);
    expect(r.body.loan.borrowerType).toBe("faculty");
  });

  it("POST /return", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({ id: "c1" });
    prismaMock.loan.findFirst.mockResolvedValue({
      id: "l1",
      borrowerUsername: "O240001",
      dueDate: new Date(Date.now() + 86400000),
    });
    prismaMock.loan.update.mockImplementation(async ({ data }: any) => data);
    prismaMock.bookCopy.update.mockResolvedValue({});
    const r = await call("POST", "/library/return", LIB, { barcode: "B1" });
    expect(r.body.fine).toBeNull();
  });

  it("GET /loans", async () => {
    prismaMock.loan.findMany.mockResolvedValue([]);
    expect(
      (await call("GET", "/library/loans?status=overdue", LIB)).status,
    ).toBe(200);
    expect((await call("GET", "/library/loans", STUDENT)).status).toBe(403);
  });

  it("GET /mine", async () => {
    prismaMock.loan.findMany.mockResolvedValue([]);
    prismaMock.libraryFine.findMany.mockResolvedValue([]);
    const r = await call("GET", "/library/mine", STUDENT);
    expect(r.body.finePayment.reason).toBe("Payments coming soon");
  });

  it("GET /fines", async () => {
    prismaMock.libraryFine.findMany.mockResolvedValue([]);
    expect(
      (await call("GET", "/library/fines?status=unpaid", LIB)).status,
    ).toBe(200);
  });

  it("POST /fines/:id/settle", async () => {
    prismaMock.libraryFine.findUnique.mockResolvedValue({
      id: ID,
      status: "unpaid",
      note: "",
    });
    prismaMock.libraryFine.update.mockImplementation(
      async ({ data }: any) => data,
    );
    const r = await call("POST", `/library/fines/${ID}/settle`, LIB, {
      action: "paid",
    });
    expect(r.body.fine.status).toBe("paid");
  });

  it("POST /remind", async () => {
    prismaMock.loan.findMany.mockResolvedValue([]);
    axiosMock.post.mockResolvedValue({});
    const r = await call("POST", "/library/remind", LIB);
    expect(r.body).toMatchObject({ due: 0, sent: 0 });
  });

  it("503 when FEATURE_LIBRARY is off", async () => {
    process.env.FEATURE_LIBRARY = "false";
    expect((await call("GET", "/library/status", STUDENT)).status).toBe(503);
    delete process.env.FEATURE_LIBRARY;
  });
});
