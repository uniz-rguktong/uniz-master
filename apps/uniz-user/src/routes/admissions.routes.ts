import { Router } from "express";
import { z } from "zod";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  ModuleError,
  actorOf,
  hasRole,
  isoDate,
  makeGate,
  makeLimiter,
  makeWrap,
  uuid,
} from "../utils/module-kit";
import * as svc from "../services/admissions.service";

const wrap = makeWrap("Admissions");
const s = (max: number) => z.string().trim().max(max);
const ApplySchema = z.object({
  cycleId: uuid,
  name: s(120).min(2),
  email: z.string().trim().email().max(200),
  phone: s(15).regex(/^[0-9+ -]{10,15}$/),
  dob: s(10).optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  category: s(20).optional(),
  program: s(40).min(2),
  board: s(80).optional(),
  percentage: z.number().min(0).max(100).default(0),
  guardian: s(120).optional(),
  address: s(500).optional(),
  documents: z
    .array(
      z.object({
        kind: z.enum(svc.DOC_KINDS),
        url: z.string().trim().url().max(500),
      }),
    )
    .max(8)
    .optional(),
  captchaToken: s(4000).min(10),
});
const CycleSchema = z.object({
  name: s(120).min(2),
  academicYear: s(20).min(4),
  programs: z.array(s(40)).max(30).optional(),
  opensAt: isoDate,
  closesAt: isoDate,
  feeInr: z.number().min(0).max(100000).default(0),
  instructions: s(5000).optional(),
  active: z.boolean().optional(),
});
const ReviewSchema = z.object({
  status: z.enum(svc.STATUSES),
  note: s(1000).optional(),
  feeStatus: z.enum(["pending", "paid", "waived", "not_required"]).optional(),
});
const A = (req: any) => actorOf(req)!;

export const admissionsRouter = Router();
const publicGate = makeGate("FEATURE_ADMISSIONS", "Admissions", {
  auth: false,
}) as any;

// Public: open cycles, apply, status lookup.
admissionsRouter.get(
  "/public/cycles",
  makeLimiter("adm-pub", 60),
  publicGate,
  wrap(async (_req, res) => {
    res.json({
      success: true,
      formReady: svc.formReady(),
      reason: svc.formReady() ? "" : "Online form not configured",
      cycles: await svc.openCycles(),
    });
  }) as any,
);
admissionsRouter.post(
  "/public/apply",
  makeLimiter("adm-apply", 5),
  publicGate,
  wrap(async (req, res) => {
    if (!svc.formReady())
      throw new ModuleError(503, "FORM_DISABLED", "Online form not configured");
    const { captchaToken, ...d } = ApplySchema.parse(req.body);
    if (!(await svc.verifyCaptcha(captchaToken, req.ip)))
      throw new ModuleError(400, "CAPTCHA", "Captcha check failed, try again");
    res.status(201).json({ success: true, ...(await svc.apply(d)) });
  }) as any,
);
admissionsRouter.get(
  "/public/status",
  makeLimiter("adm-status", 20),
  publicGate,
  wrap(async (req, res) => {
    const q = z
      .object({ refNo: s(20).min(6), email: z.string().trim().email() })
      .parse(req.query);
    res.json({
      success: true,
      application: await svc.status(q.refNo, q.email),
    });
  }) as any,
);

admissionsRouter.use(
  authenticate,
  makeLimiter("admissions"),
  makeGate("FEATURE_ADMISSIONS", "Admissions") as any,
);
admissionsRouter.get(
  "/status",
  wrap(async (req, res) => {
    res.json({
      success: true,
      enabled: true,
      formReady: svc.formReady(),
      staff: hasRole(A(req), svc.STAFF),
    });
  }) as any,
);
admissionsRouter.get(
  "/cycles",
  wrap(async (req, res) => {
    res.json({ success: true, cycles: await svc.cycles(A(req)) });
  }) as any,
);
admissionsRouter.post(
  "/cycles",
  wrap(async (req, res) => {
    res.status(201).json({
      success: true,
      cycle: await svc.addCycle(A(req), CycleSchema.parse(req.body)),
    });
  }) as any,
);
admissionsRouter.put(
  "/cycles/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      cycle: await svc.updateCycle(
        A(req),
        uuid.parse(req.params.id),
        CycleSchema.partial().parse(req.body),
      ),
    });
  }) as any,
);
admissionsRouter.get(
  "/cycles/:id/applications",
  wrap(async (req, res) => {
    const q = z
      .object({ status: s(20).optional(), q: s(80).optional() })
      .parse(req.query);
    res.json({
      success: true,
      applications: await svc.applications(A(req), {
        cycleId: uuid.parse(req.params.id),
        ...q,
      }),
    });
  }) as any,
);
admissionsRouter.get(
  "/cycles/:id/stats",
  wrap(async (req, res) => {
    res.json({
      success: true,
      stats: await svc.stats(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
admissionsRouter.post(
  "/cycles/:id/export",
  wrap(async (req, res) => {
    const b = z
      .object({ batch: s(10).min(2), mark: z.boolean().default(false) })
      .parse(req.body);
    res.json({
      success: true,
      ...(await svc.exportAccepted(
        A(req),
        uuid.parse(req.params.id),
        b.batch.toUpperCase(),
        b.mark,
      )),
    });
  }) as any,
);
admissionsRouter.get(
  "/applications/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      application: await svc.application(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
admissionsRouter.post(
  "/applications/:id/review",
  wrap(async (req, res) => {
    res.json({
      success: true,
      application: await svc.review(
        A(req),
        uuid.parse(req.params.id),
        ReviewSchema.parse(req.body),
      ),
    });
  }) as any,
);
