import { beforeEach, describe, expect, it } from "vitest";
import * as svc from "../src/services/fees.service";
import { prismaMock } from "./mocks";

const admin = { username: "web1", role: "webadmin" };
const student = { username: "o240001", role: "student" };
const ID = "11111111-1111-4111-8111-111111111111";
const inv = {
  id: ID,
  username: "O240001",
  amountPaise: 1000,
  paidPaise: 0,
  status: "due",
};

describe("fees service", () => {
  beforeEach(() => {
    prismaMock.payment.findFirst.mockResolvedValue(null);
  });

  it("reports payments as coming soon", () => {
    const s = svc.paymentStatus();
    expect(s.enabled).toBe(false);
    expect(s.reason).toBe("Payments coming soon");
  });

  it("computes invoice status", () => {
    expect(svc.invoiceStatus(100, 0)).toBe("due");
    expect(svc.invoiceStatus(100, 40)).toBe("partial");
    expect(svc.invoiceStatus(100, 100)).toBe("paid");
  });

  it("sums items into the structure total", async () => {
    prismaMock.feeStructure.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const s: any = await svc.createStructure(admin, {
      name: "Tuition",
      academicYear: "2026-27",
      branch: "cse",
      items: [
        { label: "Tuition", amountPaise: 3000000 },
        { label: "Hostel", amountPaise: 1500000 },
      ],
      dueDate: new Date("2026-12-01"),
    });
    expect(s.amountPaise).toBe(4500000);
    expect(s.branch).toBe("CSE");
  });

  it("blocks students from admin actions", async () => {
    await expect(svc.listStructures(student)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("issues invoices to matching students only once", async () => {
    prismaMock.feeStructure.findUnique.mockResolvedValue({
      id: ID,
      active: true,
      batch: "",
      branch: "CSE",
      year: "",
      name: "Tuition",
      amountPaise: 1000,
      dueDate: new Date(),
    });
    prismaMock.studentProfile.findMany.mockResolvedValue([
      { id: "s1", username: "O240001" },
    ]);
    prismaMock.feeInvoice.createMany.mockResolvedValue({ count: 1 });
    const r = await svc.issueInvoices(admin, ID);
    expect(r).toEqual({ matched: 1, created: 1 });
    const call = prismaMock.feeInvoice.createMany.mock.calls.at(-1)![0];
    expect(call.skipDuplicates).toBe(true);
    expect(
      prismaMock.studentProfile.findMany.mock.calls.at(-1)![0].where,
    ).toMatchObject({ branch: "CSE", isSuspended: false });
  });

  it("pay returns payments coming soon without charging", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue(inv);
    await expect(svc.startPayment(student, ID)).rejects.toMatchObject({
      status: 503,
      code: "PAYMENTS_DISABLED",
      message: "Payments coming soon",
    });
  });

  it("students cannot pay someone else's invoice", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue({
      ...inv,
      username: "O249999",
    });
    await expect(svc.startPayment(student, ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("records an offline payment and marks partial", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue(inv);
    prismaMock.payment.create.mockImplementation(async ({ data }: any) => data);
    prismaMock.feeInvoice.update.mockImplementation(
      async ({ data }: any) => data,
    );
    const r: any = await svc.recordOffline(admin, ID, {
      amountPaise: 400,
      method: "cash",
      reference: "RCPT-1",
    });
    expect(r.invoice).toEqual({ paidPaise: 400, status: "partial" });
  });

  it("rejects overpayment and duplicate references", async () => {
    prismaMock.feeInvoice.findUnique.mockResolvedValue(inv);
    await expect(
      svc.recordOffline(admin, ID, {
        amountPaise: 2000,
        method: "cash",
        reference: "R2",
      }),
    ).rejects.toMatchObject({ status: 400 });
    prismaMock.payment.findFirst.mockResolvedValue({ id: "p" });
    await expect(
      svc.recordOffline(admin, ID, {
        amountPaise: 100,
        method: "cash",
        reference: "R2",
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_REFERENCE" });
  });
});
