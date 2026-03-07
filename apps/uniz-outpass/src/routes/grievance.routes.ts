import { Router } from "express";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  submitGrievance,
  getGrievances,
} from "../controllers/grievance.controller";
import { submissionLimiter } from "../middlewares/ratelimit.middleware";

const router = Router();

// Submit Grievance - Rate Limited
router.post("/submit", authenticate, submissionLimiter, submitGrievance);

// View Grievances - Protected (Admin/SWO)
router.get("/list", authenticate, getGrievances);

export default router;
