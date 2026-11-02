import { beforeEach, describe, expect, it } from "vitest";
import * as svc from "../src/services/library.service";
import { axiosMock, prismaMock } from "./mocks";

const lib = { username: "librarian", role: "librarian" };
const student = { username: "O240001", role: "student" };
const DAY = 86400000;

describe("library service", () => {
  beforeEach(() => {
    prismaMock.libraryFine.count.mockResolvedValue(0);
    prismaMock.loan.count.mockResolvedValue(0);
    prismaMock.bookCopy.updateMany.mockResolvedValue({ count: 1 });
  });

  it("parses quoted CSV", () => {
    expect(svc.parseCsv('title,barcode\n"A, B",X1\r\nC,"X""2"\n')).toEqual([
      ["title", "barcode"],
      ["A, B", "X1"],
      ["C", 'X"2'],
    ]);
  });

  it("computes fines per day late", () => {
    const due = new Date("2026-11-01T00:00:00Z");
    expect(svc.fineFor(due, new Date("2026-10-31T00:00:00Z"))).toBe(0);
    expect(svc.fineFor(due, new Date("2026-11-04T01:00:00Z"))).toBe(300);
  });

  it("imports CSV grouped by isbn", async () => {
    prismaMock.book.findFirst.mockResolvedValue(null);
    prismaMock.book.create.mockImplementation(async ({ data }: any) => ({
      id: "b1",
      ...data,
    }));
    prismaMock.bookCopy.createMany.mockImplementation(
      async ({ data }: any) => ({ count: data.length }),
    );
    const r = await svc.importCsv(
      lib,
      "title,author,isbn,barcode\nOS,Galvin,111,B1\nOS,Galvin,111,B2\nDBMS,Navathe,,B3\n,,,B4\n",
    );
    expect(r).toMatchObject({ rows: 4, books: 2, copiesAdded: 3 });
    expect(r.errors).toHaveLength(1);
  });

  it("rejects CSV without required columns", async () => {
    await expect(svc.importCsv(lib, "name,code\na,b\n")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("students cannot issue", async () => {
    await expect(
      svc.issue(student, { barcode: "B1", username: "O240001" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("issues to a student with a 14 day due date", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({
      id: "c1",
      bookId: "b1",
      status: "available",
    });
    prismaMock.studentProfile.findFirst.mockResolvedValue({
      username: "O240001",
      isSuspended: false,
    });
    prismaMock.loan.create.mockImplementation(async ({ data }: any) => data);
    const l: any = await svc.issue(lib, { barcode: "B1", username: "o240001" });
    expect(l.borrowerType).toBe("student");
    expect(Math.round((l.dueDate.getTime() - Date.now()) / DAY)).toBe(14);
  });

  it("blocks issue past the limit or with unpaid fines", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({
      id: "c1",
      bookId: "b1",
      status: "available",
    });
    prismaMock.studentProfile.findFirst.mockResolvedValue({
      username: "O240001",
      isSuspended: false,
    });
    prismaMock.loan.count.mockResolvedValue(3);
    await expect(
      svc.issue(lib, { barcode: "B1", username: "O240001" }),
    ).rejects.toMatchObject({ code: "LIMIT_REACHED" });
    prismaMock.loan.count.mockResolvedValue(0);
    prismaMock.libraryFine.count.mockResolvedValue(1);
    await expect(
      svc.issue(lib, { barcode: "B1", username: "O240001" }),
    ).rejects.toMatchObject({ code: "FINE_DUE" });
  });

  it("refuses an already issued copy", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({
      id: "c1",
      bookId: "b1",
      status: "issued",
    });
    await expect(
      svc.issue(lib, { barcode: "B1", username: "O240001" }),
    ).rejects.toMatchObject({ code: "NOT_AVAILABLE" });
  });

  it("return creates a fine when late", async () => {
    prismaMock.bookCopy.findUnique.mockResolvedValue({
      id: "c1",
      bookId: "b1",
      status: "issued",
    });
    prismaMock.loan.findFirst.mockResolvedValue({
      id: "l1",
      borrowerUsername: "O240001",
      dueDate: new Date(Date.now() - 2.5 * DAY),
    });
    prismaMock.loan.update.mockImplementation(async ({ data }: any) => data);
    prismaMock.bookCopy.update.mockResolvedValue({});
    prismaMock.libraryFine.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r: any = await svc.returnCopy(lib, "B1");
    expect(r.fine.amountPaise).toBe(200);
  });

  it("my library shows fines as payments coming soon", async () => {
    prismaMock.loan.findMany.mockResolvedValue([
      { id: "l1", bookId: "b1", dueDate: new Date(), returnedAt: null },
    ]);
    prismaMock.libraryFine.findMany.mockResolvedValue([]);
    prismaMock.book.findMany.mockResolvedValue([{ id: "b1", title: "OS" }]);
    const r = await svc.myLibrary(student);
    expect(r.loans[0].book.title).toBe("OS");
    expect(r.finePayment.reason).toBe("Payments coming soon");
  });

  it("reminders push and stamp remindedAt", async () => {
    prismaMock.loan.findMany.mockResolvedValue([
      {
        id: "l1",
        borrowerUsername: "O240001",
        dueDate: new Date(Date.now() - DAY),
      },
    ]);
    axiosMock.post.mockResolvedValue({ data: {} });
    prismaMock.loan.update.mockResolvedValue({});
    const r = await svc.sendReminders(lib);
    expect(r).toEqual({ due: 1, sent: 1 });
    expect(axiosMock.post.mock.calls.at(-1)![0]).toContain("/push/send");
  });

  it("settles a fine once", async () => {
    prismaMock.libraryFine.findUnique.mockResolvedValue({
      id: "f",
      status: "paid",
      note: "",
    });
    await expect(svc.settleFine(lib, "f", "waived")).rejects.toMatchObject({
      status: 409,
    });
  });
});
