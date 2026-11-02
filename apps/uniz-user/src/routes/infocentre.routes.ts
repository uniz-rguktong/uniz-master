import { Router } from "express";
import { z } from "zod";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  actorOf,
  isoDate,
  makeGate,
  makeLimiter,
  makeWrap,
  uuid,
} from "../utils/module-kit";
import * as svc from "../services/infocentre.service";

const wrap = makeWrap("InfoCentre");
const ItemSchema = z.object({
  category: z.enum(svc.CATEGORIES),
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(5000).optional(),
  url: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  eventDate: isoDate.nullable().optional(),
  pinned: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});
const HubSchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.enum(svc.HUB).optional(),
});

export const infocentreRouter = Router();
const A = (req: any) => actorOf(req)!;
const gate = makeGate("FEATURE_INFO_CENTRE", "Information centre", {
  auth: false,
}) as any;

// Public hub, no login.
infocentreRouter.get(
  "/hub",
  makeLimiter("infocentre-hub", 120),
  gate,
  wrap(async (req, res) => {
    res.json({
      success: true,
      items: await svc.hub(HubSchema.parse(req.query)),
    });
  }) as any,
);
infocentreRouter.get(
  "/categories",
  gate,
  wrap(async (_req, res) => {
    res.json({ success: true, categories: svc.HUB });
  }) as any,
);

infocentreRouter.use(
  authenticate,
  makeLimiter("infocentre"),
  makeGate("FEATURE_INFO_CENTRE", "Information centre") as any,
);
infocentreRouter.get(
  "/items",
  wrap(async (req, res) => {
    res.json({ success: true, items: await svc.list(A(req)) });
  }) as any,
);
infocentreRouter.post(
  "/items",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        item: await svc.add(A(req), ItemSchema.parse(req.body)),
      });
  }) as any,
);
infocentreRouter.put(
  "/items/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      item: await svc.update(
        A(req),
        uuid.parse(req.params.id),
        ItemSchema.partial().parse(req.body),
      ),
    });
  }) as any,
);
