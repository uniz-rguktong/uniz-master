import { Router } from "express";
import { z } from "zod";
import { actorOf, isoDate, makeWrap, uuid } from "../utils/module-kit";
import * as svc from "../services/consultancy.service";

const wrap = makeWrap("Consultancy");
const Schema = z.object({
  title: z.string().trim().min(2).max(200),
  client: z.string().trim().min(2).max(200),
  faculty: z.string().trim().max(300).optional(),
  department: z.string().trim().max(60).optional(),
  valueInr: z.number().min(0).max(1e10).default(0),
  status: z.enum(svc.STATUSES).default("proposed"),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
  notes: z.string().trim().max(3000).optional(),
});
const A = (req: any) => actorOf(req)!;

/** Mounted under /clubs/consultancy, after the clubs auth and gate. */
export const consultancyRouter = Router();
consultancyRouter.get(
  "/",
  wrap(async (req, res) => {
    res.json({ success: true, ...(await svc.list(A(req))) });
  }) as any,
);
consultancyRouter.post(
  "/",
  wrap(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        project: await svc.add(A(req), Schema.parse(req.body)),
      });
  }) as any,
);
consultancyRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const d = Schema.partial().parse(req.body);
    for (const k of ["valueInr", "status"] as const)
      if (!(k in req.body)) delete d[k];
    res.json({
      success: true,
      project: await svc.update(A(req), uuid.parse(req.params.id), d),
    });
  }) as any,
);
