import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { feedbackLimiter } from "../middlewares/feedback-ratelimit.middleware";
import * as c from "../controllers/feedback.controller";

const router = Router();
router.use(authMiddleware, feedbackLimiter, c.moduleGate as any);
router.get("/status", c.status as any);
router.post("/forms", c.createForm as any);
router.get("/forms", c.listForms as any);
router.post("/forms/:id/close", c.closeForm as any);
router.get("/open", c.forStudent as any);
router.post("/forms/:id/submit", c.submit as any);
router.get("/forms/:id/results", c.results as any);
router.get("/mine", c.mine as any);

export default router;
