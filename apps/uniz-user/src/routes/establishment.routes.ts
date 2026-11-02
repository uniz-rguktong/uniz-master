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
import * as svc from "../services/establishment.service";

const wrap = makeWrap("Establishment");
const s = (n: number) => z.string().trim().max(n);
const RecordSchema = z.object({
  personType: z.enum(svc.PERSON_TYPES),
  personId: z.string().trim().min(1).max(60),
  employeeId: s(40).optional(),
  designation: s(100).optional(),
  department: s(100).optional(),
  cadre: s(60).optional(),
  employmentType: z
    .enum(["regular", "contract", "guest", "outsourced"])
    .optional(),
  joinedOn: isoDate.nullable().optional(),
  status: z.enum(["active", "on-leave", "retired", "relieved"]).optional(),
  notes: s(2000).optional(),
});
const EventSchema = z.object({
  kind: z.enum(svc.EVENT_KINDS),
  date: isoDate,
  fromValue: s(100).optional(),
  toValue: s(100).optional(),
  details: s(2000).optional(),
});
const ListSchema = z.object({
  q: s(80).optional(),
  department: s(100).optional(),
});

export const establishmentRouter = Router();
const A = (req: any) => actorOf(req)!;

establishmentRouter.use(
  authenticate,
  makeLimiter("establishment"),
  makeGate("FEATURE_ESTABLISHMENT", "Establishment") as any,
);
establishmentRouter.get(
  "/staff",
  wrap(async (req, res) => {
    res.json({
      success: true,
      staff: await svc.list(A(req), ListSchema.parse(req.query)),
    });
  }) as any,
);
establishmentRouter.get(
  "/designations",
  wrap(async (req, res) => {
    res.json({ success: true, designations: await svc.designations(A(req)) });
  }) as any,
);
establishmentRouter.put(
  "/staff",
  wrap(async (req, res) => {
    res.json({
      success: true,
      record: await svc.upsert(A(req), RecordSchema.parse(req.body)),
    });
  }) as any,
);
establishmentRouter.get(
  "/staff/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      record: await svc.get(A(req), uuid.parse(req.params.id)),
    });
  }) as any,
);
establishmentRouter.post(
  "/staff/:id/events",
  wrap(async (req, res) => {
    res.status(201).json({
      success: true,
      event: await svc.addEvent(
        A(req),
        uuid.parse(req.params.id),
        EventSchema.parse(req.body),
      ),
    });
  }) as any,
);
