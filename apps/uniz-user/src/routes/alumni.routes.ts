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
import * as svc from "../services/alumni.service";

const wrap = makeWrap("Alumni");
const VerifySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});
const ProfileSchema = z.object({
  graduationYear: z.number().int().min(2008).max(2100).nullable().optional(),
  company: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  linkedinUrl: z
    .union([z.literal(""), z.string().trim().url().max(300)])
    .optional(),
  bio: z.string().trim().max(1000).optional(),
  visible: z.boolean().optional(),
});
const JobSchema = z.object({
  company: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(200),
  location: z.string().trim().max(120).optional(),
  kind: z
    .enum(["full-time", "internship", "part-time", "contract"])
    .default("full-time"),
  applyUrl: z.string().trim().url().max(500),
  description: z.string().trim().max(5000).optional(),
  deadline: isoDate.optional(),
});
const DirSchema = z.object({
  q: z.string().trim().max(80).optional(),
  batch: z.string().trim().max(10).optional(),
  branch: z.string().trim().max(20).optional(),
});

export const alumniRouter = Router();
const A = (req: any) => actorOf(req)!;

// Public, opt-in directory. No login needed.
alumniRouter.get(
  "/directory",
  makeLimiter("alumni-dir", 60),
  makeGate("FEATURE_ALUMNI", "Alumni", { auth: false }) as any,
  wrap(async (req, res) => {
    res.json({
      success: true,
      alumni: await svc.directory(DirSchema.parse(req.query)),
    });
  }) as any,
);

alumniRouter.use(
  authenticate,
  makeLimiter("alumni"),
  makeGate("FEATURE_ALUMNI", "Alumni") as any,
);

alumniRouter.get(
  "/status",
  wrap(async (req, res) => {
    res.json({
      success: true,
      enabled: true,
      staff: hasRole(A(req), svc.STAFF),
    });
  }) as any,
);
alumniRouter.post(
  "/claim/start",
  makeLimiter("alumni-otp", 5),
  wrap(async (req, res) => {
    res.json({ success: true, ...(await svc.claimStart(A(req))) });
  }) as any,
);
alumniRouter.post(
  "/claim/verify",
  makeLimiter("alumni-verify", 10),
  wrap(async (req, res) => {
    const { otp } = VerifySchema.parse(req.body);
    res.json({ success: true, profile: await svc.claimVerify(A(req), otp) });
  }) as any,
);
alumniRouter.get(
  "/me",
  wrap(async (req, res) => {
    res.json({ success: true, profile: await svc.me(A(req)) });
  }) as any,
);
alumniRouter.put(
  "/me",
  wrap(async (req, res) => {
    res.json({
      success: true,
      profile: await svc.updateMe(A(req), ProfileSchema.parse(req.body)),
    });
  }) as any,
);
alumniRouter.get(
  "/all",
  wrap(async (req, res) => {
    res.json({ success: true, alumni: await svc.all(A(req)) });
  }) as any,
);
alumniRouter.get(
  "/jobs",
  wrap(async (_req, res) => {
    res.json({ success: true, jobs: await svc.jobs() });
  }) as any,
);
alumniRouter.post(
  "/jobs",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        job: await svc.postJob(A(req), JobSchema.parse(req.body)),
      });
  }) as any,
);
alumniRouter.post(
  "/jobs/:id/close",
  wrap(async (req, res) => {
    res.json({
      success: true,
      job: await svc.closeJob(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
