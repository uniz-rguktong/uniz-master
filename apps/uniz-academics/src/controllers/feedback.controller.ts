import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { setNoStore } from "../utils/http.util";
import * as svc from "../services/feedback.service";

const CreateSchema = z.object({
  semesterId: z.string().trim().min(1).max(64),
  subjectId: z.string().trim().min(1).max(64),
  facultyUsername: z.string().trim().max(64).optional(),
  title: z.string().trim().max(120).optional(),
  questions: z.array(z.string().trim().min(3).max(200)).max(10).optional(),
  closesAt: z.string().min(8).max(40),
});
const SubmitSchema = z.object({
  ratings: z.array(z.number().int().min(1).max(5)).min(1).max(10),
  comment: z.string().trim().max(1000).optional(),
});
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
  if (!svc.feedbackEnabled()) {
    return res
      .status(503)
      .json({ code: "MODULE_DISABLED", message: "Feedback is turned off" });
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
      if (e instanceof svc.FeedbackError)
        return res.status(e.status).json({ code: e.code, message: e.message });
      console.error("[Feedback]", e?.message);
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
    minResponses: svc.MIN_RESPONSES,
    defaultQuestions: svc.DEFAULT_QUESTIONS,
  });
});

export const createForm = wrap(async (req, res) => {
  const p = CreateSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({ success: true, form: await svc.createForm(actor(req)!, p.data) });
});

export const listForms = wrap(async (req, res) => {
  const semesterId =
    typeof req.query.semesterId === "string"
      ? req.query.semesterId.slice(0, 64)
      : undefined;
  res.json({
    success: true,
    forms: await svc.listForms(actor(req)!, semesterId),
  });
});

export const closeForm = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({ success: true, form: await svc.closeForm(actor(req)!, id.data) });
});

export const forStudent = wrap(async (req, res) => {
  res.json({ success: true, forms: await svc.formsForStudent(actor(req)!) });
});

export const submit = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = SubmitSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({
      success: true,
      ...(await svc.submit(actor(req)!, id.data, p.data)),
    });
});

export const results = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({ success: true, ...(await svc.results(actor(req)!, id.data)) });
});

export const mine = wrap(async (req, res) => {
  res.json({ success: true, forms: await svc.myForms(actor(req)!) });
});
