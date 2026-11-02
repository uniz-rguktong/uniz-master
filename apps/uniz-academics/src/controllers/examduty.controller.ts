import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { setNoStore } from "../utils/http.util";
import * as svc from "../services/examduty.service";

const ExamQuery = z.object({
  semesterId: z.string().trim().min(1).max(64),
  examName: z.string().trim().min(1).max(40),
});
const GenerateSchema = ExamQuery.extend({
  faculty: z.array(z.string().trim().min(1).max(64)).min(1).max(500),
  replace: z.boolean().optional(),
});
const SwapSchema = z.object({
  toUsername: z.string().trim().min(1).max(64),
  reason: z.string().trim().min(5).max(500),
});
const DecideSchema = z.object({ approve: z.boolean() });
const IdSchema = z.string().uuid();

const actor = (req: AuthenticatedRequest): svc.Actor | null =>
  req.user?.username
    ? { username: req.user.username, role: req.user.role as string }
    : null;

export function moduleGate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!svc.examDutyEnabled()) {
    return res
      .status(503)
      .json({ code: "MODULE_DISABLED", message: "Exam duties is turned off" });
  }
  if (!actor(req))
    return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
  setNoStore(res);
  return next();
}

function wrap(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>,
) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      await fn(req, res);
    } catch (e: any) {
      if (e instanceof svc.ExamDutyError)
        return res.status(e.status).json({ code: e.code, message: e.message });
      console.error("[ExamDuty]", e?.message);
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

export const status = wrap(async (_req, res) => {
  res.json({
    success: true,
    enabled: true,
    notifications: svc.notificationStatus(),
  });
});

export const halls = wrap(async (req, res) => {
  if (!svc.isExamAdmin(actor(req)!))
    return res
      .status(403)
      .json({ code: "FORBIDDEN", message: "Only the exam cell can do this" });
  const q = ExamQuery.safeParse(req.query);
  if (!q.success) return bad(res, q.error);
  res.json({
    success: true,
    halls: await svc.listHalls(q.data.semesterId, q.data.examName),
  });
});

export const generate = wrap(async (req, res) => {
  const p = GenerateSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({ success: true, ...(await svc.generate(actor(req)!, p.data)) });
});

export const roster = wrap(async (req, res) => {
  const q = ExamQuery.safeParse(req.query);
  if (!q.success) return bad(res, q.error);
  res.json({
    success: true,
    duties: await svc.roster(actor(req)!, q.data.semesterId, q.data.examName),
  });
});

export const mine = wrap(async (req, res) => {
  res.json({ success: true, duties: await svc.mine(actor(req)!) });
});

export const requestSwap = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = SwapSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    duty: await svc.requestSwap(
      actor(req)!,
      id.data,
      p.data.toUsername,
      p.data.reason,
    ),
  });
});

export const swaps = wrap(async (req, res) => {
  res.json({ success: true, duties: await svc.pendingSwaps(actor(req)!) });
});

export const decideSwap = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = DecideSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    duty: await svc.decideSwap(actor(req)!, id.data, p.data.approve),
  });
});
