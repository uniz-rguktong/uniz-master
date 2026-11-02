import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { examDutyLimiter } from "../middlewares/examduty-ratelimit.middleware";
import * as c from "../controllers/examduty.controller";

const router = Router();
router.use(authMiddleware, examDutyLimiter, c.moduleGate as any);
router.get("/status", c.status as any);
router.get("/halls", c.halls as any);
router.post("/generate", c.generate as any);
router.get("/roster", c.roster as any);
router.get("/mine", c.mine as any);
router.post("/:id/swap", c.requestSwap as any);
router.get("/swaps", c.swaps as any);
router.post("/:id/swap/decide", c.decideSwap as any);

export default router;
