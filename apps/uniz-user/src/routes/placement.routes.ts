import { Router } from "express";
import { z } from "zod";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  actorOf,
  hasRole,
  isoDate,
  makeGate,
  makeLimiter,
  makeWrap,
  uuid,
} from "../utils/module-kit";
import * as svc from "../services/placement.service";

const wrap = makeWrap("Placement");
const CompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().trim().url().max(300).optional(),
  contact: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});
const DriveSchema = z.object({
  companyId: uuid,
  title: z.string().trim().min(2).max(200),
  jobRole: z.string().trim().min(2).max(120),
  ctcLpa: z.number().min(0).max(500).default(0),
  location: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  branches: z.array(z.string().max(20)).max(20).optional(),
  batches: z.array(z.string().max(10)).max(10).optional(),
  minCgpa: z.number().min(0).max(10).default(0),
  maxBacklogs: z.number().int().min(0).max(99).default(99),
  deadline: isoDate,
});
const ApplySchema = z.object({ resumeUrl: z.string().trim().url().max(500) });
const StatusSchema = z.object({
  status: z.enum(svc.STATUSES),
  note: z.string().trim().max(500).optional(),
});
const RespondSchema = z.object({ action: z.enum(["accepted", "declined"]) });

export const placementRouter = Router();
placementRouter.use(
  authenticate,
  makeLimiter("placement"),
  makeGate("FEATURE_PLACEMENT", "Placement") as any,
);
const A = (req: any) => actorOf(req)!;

placementRouter.get(
  "/status",
  wrap(async (req, res) => {
    res.json({
      success: true,
      enabled: true,
      staff: hasRole(A(req), svc.STAFF),
    });
  }) as any,
);
placementRouter.post(
  "/companies",
  wrap(async (req, res) => {
    res.status(201).json({
      success: true,
      company: await svc.addCompany(A(req), CompanySchema.parse(req.body)),
    });
  }) as any,
);
placementRouter.get(
  "/companies",
  wrap(async (req, res) => {
    res.json({ success: true, companies: await svc.companies(A(req)) });
  }) as any,
);
placementRouter.post(
  "/drives",
  wrap(async (req, res) => {
    res.status(201).json({
      success: true,
      drive: await svc.addDrive(A(req), DriveSchema.parse(req.body)),
    });
  }) as any,
);
placementRouter.get(
  "/drives",
  wrap(async (req, res) => {
    res.json({ success: true, drives: await svc.drives(A(req)) });
  }) as any,
);
placementRouter.post(
  "/drives/:id/close",
  wrap(async (req, res) => {
    res.json({
      success: true,
      drive: await svc.closeDrive(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
placementRouter.post(
  "/drives/:id/apply",
  wrap(async (req, res) => {
    const b = ApplySchema.parse(req.body);
    res.status(201).json({
      success: true,
      application: await svc.apply(
        A(req),
        uuid.parse(req.params.id),
        b.resumeUrl,
      ),
    });
  }) as any,
);
placementRouter.get(
  "/drives/:id/applications",
  wrap(async (req, res) => {
    res.json({
      success: true,
      applications: await svc.applications(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
placementRouter.get(
  "/mine",
  wrap(async (req, res) => {
    res.json({ success: true, ...(await svc.mine(A(req))) });
  }) as any,
);
placementRouter.post(
  "/applications/:id/status",
  wrap(async (req, res) => {
    const b = StatusSchema.parse(req.body);
    res.json({
      success: true,
      ...(await svc.setStatus(
        A(req),
        uuid.parse(req.params.id),
        b.status,
        b.note,
      )),
    });
  }) as any,
);
placementRouter.post(
  "/offers/:id/respond",
  wrap(async (req, res) => {
    const b = RespondSchema.parse(req.body);
    res.json({
      success: true,
      offer: await svc.respond(A(req), uuid.parse(req.params.id), b.action),
    });
  }) as any,
);
placementRouter.get(
  "/stats",
  wrap(async (req, res) => {
    res.json({ success: true, stats: await svc.stats(A(req)) });
  }) as any,
);
