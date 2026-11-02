import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import * as svc from "../services/library.service";

const code = z.string().trim().min(1).max(64);
const BookSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().max(200).optional(),
  isbn: z.string().trim().max(20).optional(),
  publisher: z.string().trim().max(200).optional(),
  year: z.string().trim().max(10).optional(),
  category: z.string().trim().max(80).optional(),
  shelf: z.string().trim().max(40).optional(),
  barcodes: z.array(code).min(1).max(200),
});
const ImportSchema = z.object({ csv: z.string().min(1).max(90_000) });
const IssueSchema = z.object({ barcode: code, username: code });
const ReturnSchema = z.object({ barcode: code });
const LoansQuery = z.object({
  status: z.enum(["active", "overdue", "returned"]).optional(),
});
const FinesQuery = z.object({
  status: z.enum(["unpaid", "paid", "waived"]).optional(),
});
const SettleSchema = z.object({
  action: z.enum(["paid", "waived"]),
  note: z.string().trim().max(200).optional(),
});
const IdSchema = z.string().uuid();

function actor(req: AuthenticatedRequest): svc.Actor | null {
  const u = req.user as any;
  if (!u?.username) return null;
  return { id: u.id, username: u.username, role: u.role };
}

/** Flag gate + auth presence, runs before every library handler. */
export function moduleGate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!svc.libraryEnabled()) {
    return res
      .status(503)
      .json({ code: "MODULE_DISABLED", message: "Library is turned off" });
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
      if (e instanceof svc.LibraryError) {
        return res.status(e.status).json({ code: e.code, message: e.message });
      }
      if (e?.code === "P2002") {
        return res
          .status(409)
          .json({ code: "DUPLICATE", message: "Already exists" });
      }
      console.error("[Library]", e?.message);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
    }
  };
}

const bad = (res: Response, err: z.ZodError) =>
  res
    .status(400)
    .json({
      code: "VALIDATION_ERROR",
      message: err.issues[0]?.message,
      errors: err.issues,
    });

export const status = wrap(async (req, res) => {
  res.json({
    success: true,
    enabled: true,
    staff: svc.isStaff(actor(req)!),
    policy: svc.POLICY,
  });
});

export const books = wrap(async (req, res) => {
  const q =
    typeof req.query.q === "string"
      ? req.query.q.trim().slice(0, 100)
      : undefined;
  res.json({ success: true, books: await svc.searchBooks(q || undefined) });
});

export const addBook = wrap(async (req, res) => {
  const p = BookSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({ success: true, ...(await svc.addBook(actor(req)!, p.data)) });
});

export const importCsv = wrap(async (req, res) => {
  const p = ImportSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    ...(await svc.importCsv(actor(req)!, p.data.csv)),
  });
});

export const issue = wrap(async (req, res) => {
  const p = IssueSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({ success: true, loan: await svc.issue(actor(req)!, p.data) });
});

export const giveBack = wrap(async (req, res) => {
  const p = ReturnSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    ...(await svc.returnCopy(actor(req)!, p.data.barcode)),
  });
});

export const loans = wrap(async (req, res) => {
  const q = LoansQuery.safeParse(req.query);
  if (!q.success) return bad(res, q.error);
  res.json({
    success: true,
    loans: await svc.listLoans(actor(req)!, q.data.status),
  });
});

export const mine = wrap(async (req, res) => {
  res.json({ success: true, ...(await svc.myLibrary(actor(req)!)) });
});

export const fines = wrap(async (req, res) => {
  const q = FinesQuery.safeParse(req.query);
  if (!q.success) return bad(res, q.error);
  res.json({
    success: true,
    fines: await svc.listFines(actor(req)!, q.data.status),
  });
});

export const settle = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = SettleSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    fine: await svc.settleFine(
      actor(req)!,
      id.data,
      p.data.action,
      p.data.note,
    ),
  });
});

export const remind = wrap(async (req, res) => {
  res.json({ success: true, ...(await svc.sendReminders(actor(req)!)) });
});
