import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import * as svc from "../services/fees.service";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const StructureSchema = z.object({
  name: z.string().trim().min(2).max(120),
  academicYear: z.string().trim().min(4).max(20),
  batch: z.string().trim().max(10).optional(),
  branch: z.string().trim().max(20).optional(),
  year: z.string().trim().max(10).optional(),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(2).max(80),
        amountPaise: z.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1)
    .max(30),
  dueDate: isoDate,
});
const RecordSchema = z.object({
  amountPaise: z.number().int().min(1).max(100_000_000),
  method: z.enum(svc.OFFLINE_METHODS),
  reference: z.string().trim().min(3).max(80),
});
const ListQuery = z.object({
  status: z.enum(["due", "partial", "paid"]).optional(),
  structureId: z.string().uuid().optional(),
  username: z.string().trim().max(64).optional(),
});
const IdSchema = z.string().uuid();

function actor(req: AuthenticatedRequest): svc.Actor | null {
  const u = req.user as any;
  if (!u?.username) return null;
  return { id: u.id, username: u.username, role: u.role };
}

/** Flag gate + auth presence, runs before every fees handler. */
export function moduleGate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!svc.feesEnabled()) {
    return res
      .status(503)
      .json({ code: "MODULE_DISABLED", message: "Fees is turned off" });
  }
  if (!actor(req))
    return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
  res.setHeader("Cache-Control", "no-store");
  return next();
}

function wrap(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>,
) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      await fn(req, res);
    } catch (e: any) {
      if (e instanceof svc.FeesError) {
        return res.status(e.status).json({ code: e.code, message: e.message });
      }
      console.error("[Fees]", e?.message);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
    }
  };
}

const bad = (res: Response, err: z.ZodError) =>
  res.status(400).json({
    code: "VALIDATION_ERROR",
    message: err.issues[0]?.message,
    errors: err.issues,
  });

export const status = wrap(async (_req, res) => {
  res.json({ success: true, enabled: true, payments: svc.paymentStatus() });
});

export const createStructure = wrap(async (req, res) => {
  const p = StructureSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({
      success: true,
      structure: await svc.createStructure(actor(req)!, p.data),
    });
});

export const listStructures = wrap(async (req, res) => {
  res.json({
    success: true,
    structures: await svc.listStructures(actor(req)!),
  });
});

export const issue = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({
    success: true,
    ...(await svc.issueInvoices(actor(req)!, id.data)),
  });
});

export const listInvoices = wrap(async (req, res) => {
  const q = ListQuery.safeParse(req.query);
  if (!q.success) return bad(res, q.error);
  res.json({
    success: true,
    invoices: await svc.listInvoices(actor(req)!, q.data),
  });
});

export const mine = wrap(async (req, res) => {
  res.json({
    success: true,
    ...(await svc.myInvoices(actor(req)!)),
    payments_online: svc.paymentStatus(),
  });
});

export const pay = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({
    success: true,
    order: await svc.startPayment(actor(req)!, id.data),
  });
});

export const record = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = RecordSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({
      success: true,
      ...(await svc.recordOffline(actor(req)!, id.data, p.data)),
    });
});
