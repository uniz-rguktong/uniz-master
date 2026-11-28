import { Router } from "express";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  submitGrievance,
  getGrievances,
  resolveGrievance,
  deleteGrievance,
  deleteAllGrievances,
} from "../controllers/grievance.controller";
import { submissionLimiter } from "../middlewares/grievance-ratelimit.middleware";
import { routerRateLimiter } from "../middlewares/router-limiter";

const router = Router();
router.use(routerRateLimiter);

router.post("/submit", authenticate, submissionLimiter, submitGrievance);
router.get("/list", authenticate, getGrievances);
router.patch("/:id/resolve", authenticate, resolveGrievance);
router.delete("/all", authenticate, deleteAllGrievances);
router.delete("/:id", authenticate, deleteGrievance);

export default router;
