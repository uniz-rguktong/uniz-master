import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import * as svc from "../services/leave.service";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const ApplySchema = z
  .object({
    leaveType: z.enum(svc.LEAVE_TYPES),
    fromDate: isoDate,
    toDate: isoDate,
    reason: z.string().trim().min(5).max(1000),
  })
  .refine((v) => v.toDate >= v.fromDate, {
    message: "toDate must be on or after fromDate",
  });

const DecideSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

const DutySchema = z.object({
  facultyUsername: z.string().trim().min(1).max(64),
  dutyType: z.string().trim().min(2).max(40),
  title: z.string().trim().min(2).max(200),
  date: isoDate,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  location: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

const IdSchema = z.string().uuid();

function actor(req: AuthenticatedRequest): svc.Actor | null {
  const u = req.user as any;
  if (!u?.username) return null;
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    department: u.department,
  };
}

/** Flag gate + auth presence, runs before every leave/duty handler. */
export function moduleGate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!svc.leaveModuleEnabled()) {
    return res
      .status(503)
      .json({
        code: "MODULE_DISABLED",
        message: "Faculty leave and duties is turned off",
      });
  }
  if (!actor(req))
    return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
  return next();
}

function wrap(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>,
) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      await fn(req, res);
    } catch (e: any) {
      if (e instanceof svc.LeaveError) {
        return res.status(e.status).json({ code: e.code, message: e.message });
      }
      console.error("[Leave]", e?.message);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
    }
  };
}

function bad(res: Response, err: z.ZodError) {
  return res
    .status(400)
    .json({
      code: "VALIDATION_ERROR",
      message: err.issues[0]?.message,
      errors: err.issues,
    });
}

export const apply = wrap(async (req, res) => {
  const p = ApplySchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const leave = await svc.applyLeave(actor(req)!, p.data);
  res.status(201).json({ success: true, leave });
});

export const mine = wrap(async (req, res) => {
  res.json({ success: true, leaves: await svc.listMine(actor(req)!) });
});

export const balance = wrap(async (req, res) => {
  const faculty = await svc.findFacultyFor(actor(req)!);
  const year = Number(req.query.year) || new Date().getUTCFullYear();
  res.json({
    success: true,
    year,
    balances: await svc.getBalances(faculty.id, year),
  });
});

export const pending = wrap(async (req, res) => {
  res.json({ success: true, leaves: await svc.listPending(actor(req)!) });
});

export const decide = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  const p = DecideSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res.json({
    success: true,
    leave: await svc.decideLeave(
      actor(req)!,
      id.data,
      p.data.action,
      p.data.note,
    ),
  });
});

export const cancel = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({
    success: true,
    leave: await svc.cancelLeave(actor(req)!, id.data),
  });
});

export const status = wrap(async (_req, res) => {
  res.json({
    success: true,
    enabled: true,
    notifications: svc.notificationStatus(),
  });
});

export const assignDuty = wrap(async (req, res) => {
  const p = DutySchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  res
    .status(201)
    .json({ success: true, duty: await svc.assignDuty(actor(req)!, p.data) });
});

export const myDuties = wrap(async (req, res) => {
  res.json({ success: true, duties: await svc.listMyDuties(actor(req)!) });
});

export const roster = wrap(async (req, res) => {
  const from =
    typeof req.query.from === "string"
      ? isoDate.safeParse(req.query.from)
      : null;
  res.json({
    success: true,
    duties: await svc.listRoster(
      actor(req)!,
      from?.success ? from.data : undefined,
    ),
  });
});

export const removeDuty = wrap(async (req, res) => {
  const id = IdSchema.safeParse(req.params.id);
  if (!id.success) return bad(res, id.error);
  res.json({ success: true, ...(await svc.deleteDuty(actor(req)!, id.data)) });
});
