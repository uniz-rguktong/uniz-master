import { Router } from "express";
import { z } from "zod";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  actorOf,
  hasRole,
  makeGate,
  makeLimiter,
  makeWrap,
  uuid,
} from "../utils/module-kit";
import * as svc from "../services/clubs.service";
import { consultancyRouter } from "./consultancy.routes";

const wrap = makeWrap("Clubs");
const ClubSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z
    .enum(["technical", "cultural", "sports", "social", "other"])
    .default("technical"),
  description: z.string().trim().max(3000).optional(),
  coordinators: z.array(z.string().trim().max(40)).max(10).optional(),
  active: z.boolean().optional(),
});
const EventSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(3000).optional(),
  venue: z.string().trim().max(200).optional(),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/)),
});
const MemberSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});
const A = (req: any) => actorOf(req)!;
const id = (req: any) => uuid.parse(req.params.id);

export const clubsRouter = Router();
clubsRouter.use(
  authenticate,
  makeLimiter("clubs"),
  makeGate("FEATURE_CLUBS", "Clubs") as any,
);
clubsRouter.use("/consultancy", consultancyRouter);

clubsRouter.get(
  "/status",
  wrap(async (req, res) => {
    res.json({
      success: true,
      enabled: true,
      staff: hasRole(A(req), svc.STAFF),
    });
  }) as any,
);
clubsRouter.get(
  "/",
  wrap(async (req, res) => {
    res.json({ success: true, clubs: await svc.list(A(req)) });
  }) as any,
);
clubsRouter.post(
  "/",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        club: await svc.create(A(req), ClubSchema.parse(req.body)),
      });
  }) as any,
);
clubsRouter.get(
  "/events",
  wrap(async (_req, res) => {
    res.json({ success: true, events: await svc.events() });
  }) as any,
);
clubsRouter.put(
  "/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      club: await svc.update(
        A(req),
        id(req),
        ClubSchema.partial().parse(req.body),
      ),
    });
  }) as any,
);
clubsRouter.post(
  "/:id/join",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({ success: true, member: await svc.join(A(req), id(req)) });
  }) as any,
);
clubsRouter.post(
  "/:id/leave",
  wrap(async (req, res) => {
    res.json({ success: true, ...(await svc.leave(A(req), id(req))) });
  }) as any,
);
clubsRouter.get(
  "/:id/members",
  wrap(async (req, res) => {
    res.json({ success: true, members: await svc.members(A(req), id(req)) });
  }) as any,
);
clubsRouter.post(
  "/:id/members/:memberId",
  wrap(async (req, res) => {
    const { status } = MemberSchema.parse(req.body);
    res.json({
      success: true,
      member: await svc.setMember(
        A(req),
        id(req),
        uuid.parse(req.params.memberId),
        status,
      ),
    });
  }) as any,
);
clubsRouter.get(
  "/:id/events",
  wrap(async (req, res) => {
    res.json({ success: true, events: await svc.events(id(req)) });
  }) as any,
);
clubsRouter.post(
  "/:id/events",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        event: await svc.addEvent(A(req), id(req), EventSchema.parse(req.body)),
      });
  }) as any,
);
