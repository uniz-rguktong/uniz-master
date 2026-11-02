import { Router } from "express";
import { leaveLimiter as limiter } from "../middlewares/leave-ratelimit.middleware";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import * as c from "../controllers/leave.controller";

export const leaveRouter = Router();
leaveRouter.use(authenticate, limiter, c.moduleGate as any);
leaveRouter.get("/status", c.status as any);
leaveRouter.post("/apply", c.apply as any);
leaveRouter.get("/mine", c.mine as any);
leaveRouter.get("/balance", c.balance as any);
leaveRouter.get("/pending", c.pending as any);
leaveRouter.post("/:id/decide", c.decide as any);
leaveRouter.post("/:id/cancel", c.cancel as any);

export const dutyRouter = Router();
dutyRouter.use(authenticate, limiter, c.moduleGate as any);
dutyRouter.get("/mine", c.myDuties as any);
dutyRouter.get("/roster", c.roster as any);
dutyRouter.post("/assign", c.assignDuty as any);
dutyRouter.delete("/:id", c.removeDuty as any);
