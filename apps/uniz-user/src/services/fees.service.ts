import {
  getPaymentProvider,
  isFeatureEnabled,
  resolveEffectiveRole,
} from "@uniz/shared";
import prisma from "../utils/prisma";

export const FEES_ADMIN_ROLES = ["webadmin", "director", "dean"];
export const OFFLINE_METHODS = [
  "cash",
  "dd",
  "bank_transfer",
  "challan",
] as const;

export type Actor = { id?: string; username: string; role?: string };
export type FeeItem = { label: string; amountPaise: number };

export class FeesError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const feesEnabled = () => isFeatureEnabled("FEATURE_FEES");
export const roleOf = (a: Actor) => resolveEffectiveRole(a);
export const isFeesAdmin = (a: Actor) => FEES_ADMIN_ROLES.includes(roleOf(a));
export const isStudent = (a: Actor) => roleOf(a) === "student";

function requireAdmin(a: Actor) {
  if (!isFeesAdmin(a))
    throw new FeesError(403, "FORBIDDEN", "Only fee admins can do this");
}

/** Online payment state from the shared provider. Never calls a gateway today. */
export function paymentStatus() {
  const p = getPaymentProvider();
  return p.enabled
    ? { enabled: true, provider: p.name }
    : {
        enabled: false,
        provider: p.name,
        reason: (p as any).reason || "Payments coming soon",
      };
}

export const invoiceStatus = (amount: number, paid: number) =>
  paid >= amount ? "paid" : paid > 0 ? "partial" : "due";

export async function createStructure(
  actor: Actor,
  input: {
    name: string;
    academicYear: string;
    batch?: string;
    branch?: string;
    year?: string;
    items: FeeItem[];
    dueDate: Date;
  },
) {
  requireAdmin(actor);
  const amountPaise = input.items.reduce((s, i) => s + i.amountPaise, 0);
  if (amountPaise <= 0)
    throw new FeesError(
      400,
      "VALIDATION_ERROR",
      "Total must be more than zero",
    );
  return prisma.feeStructure.create({
    data: {
      name: input.name,
      academicYear: input.academicYear,
      batch: (input.batch || "").toUpperCase(),
      branch: (input.branch || "").toUpperCase(),
      year: (input.year || "").toUpperCase(),
      items: input.items,
      amountPaise,
      dueDate: input.dueDate,
      createdBy: actor.username,
    },
  });
}

export async function listStructures(actor: Actor) {
  requireAdmin(actor);
  return prisma.feeStructure.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Creates one invoice per matching, non-suspended student. Existing ones are skipped. */
export async function issueInvoices(actor: Actor, structureId: string) {
  requireAdmin(actor);
  const s = await prisma.feeStructure.findUnique({
    where: { id: structureId },
  });
  if (!s || !s.active)
    throw new FeesError(404, "NOT_FOUND", "Fee structure not found");
  const where: any = { isSuspended: false };
  if (s.batch) where.batch = s.batch;
  if (s.branch) where.branch = s.branch;
  if (s.year) where.year = s.year;
  const students: any[] = await prisma.studentProfile.findMany({
    where,
    select: { id: true, username: true },
  });
  if (students.length === 0)
    throw new FeesError(404, "NO_STUDENTS", "No students match this structure");
  const r: any = await prisma.feeInvoice.createMany({
    data: students.map((st) => ({
      studentId: String(st.id),
      username: st.username,
      structureId: s.id,
      title: s.name,
      amountPaise: s.amountPaise,
      dueDate: s.dueDate,
      issuedBy: actor.username,
    })),
    skipDuplicates: true,
  });
  return { matched: students.length, created: r?.count ?? 0 };
}

export async function listInvoices(
  actor: Actor,
  q: { status?: string; structureId?: string; username?: string },
) {
  requireAdmin(actor);
  const where: any = {};
  if (q.status) where.status = q.status;
  if (q.structureId) where.structureId = q.structureId;
  if (q.username) where.username = q.username.toUpperCase();
  return prisma.feeInvoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function myInvoices(actor: Actor) {
  if (!isStudent(actor))
    throw new FeesError(403, "FORBIDDEN", "Only students have fee invoices");
  const username = actor.username.toUpperCase();
  const [invoices, payments] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { username },
      orderBy: { dueDate: "asc" },
    }),
    prisma.payment.findMany({
      where: { username },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { invoices, payments };
}

/** Student pay action. Goes through the shared provider, which is coming soon. */
export async function startPayment(actor: Actor, invoiceId: string) {
  if (!isStudent(actor))
    throw new FeesError(403, "FORBIDDEN", "Only students can pay");
  const inv = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv || inv.username !== actor.username.toUpperCase()) {
    throw new FeesError(404, "NOT_FOUND", "Invoice not found");
  }
  if (inv.status === "paid")
    throw new FeesError(409, "ALREADY_PAID", "This invoice is already paid");
  const order = await getPaymentProvider().createOrder({
    amountPaise: inv.amountPaise - inv.paidPaise,
    receipt: inv.id,
  });
  if (order.disabled)
    throw new FeesError(503, "PAYMENTS_DISABLED", order.reason);
  return order;
}

/** Admin records a payment made at the counter or bank. */
export async function recordOffline(
  actor: Actor,
  invoiceId: string,
  input: { amountPaise: number; method: string; reference: string },
) {
  requireAdmin(actor);
  const inv = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv) throw new FeesError(404, "NOT_FOUND", "Invoice not found");
  const due = inv.amountPaise - inv.paidPaise;
  if (due <= 0)
    throw new FeesError(409, "ALREADY_PAID", "This invoice is already paid");
  if (input.amountPaise > due)
    throw new FeesError(
      400,
      "VALIDATION_ERROR",
      "Amount is more than the balance due",
    );
  const dup = await prisma.payment.findFirst({
    where: { method: input.method, reference: input.reference },
  });
  if (dup)
    throw new FeesError(
      409,
      "DUPLICATE_REFERENCE",
      "This reference is already recorded",
    );
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      username: inv.username,
      amountPaise: input.amountPaise,
      method: input.method,
      reference: input.reference,
      recordedBy: actor.username,
    },
  });
  const paidPaise = inv.paidPaise + input.amountPaise;
  const invoice = await prisma.feeInvoice.update({
    where: { id: invoiceId },
    data: { paidPaise, status: invoiceStatus(inv.amountPaise, paidPaise) },
  });
  return { payment, invoice };
}
