import { Router } from "express";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import {
  submitGrievance,
  getGrievances,
  resolveGrievance,
  deleteGrievance,
  deleteAllGrievances,
} from "../controllers/grievance.controller";
import { submissionLimiter } from "../middlewares/ratelimit.middleware";

const router = Router();

// Submit Grievance - Rate Limited
router.post("/submit", authenticate, submissionLimiter, submitGrievance);

// View Grievances - Protected (Admin/SWO)
router.get("/list", authenticate, getGrievances);

// Resolve Grievance - Protected (Admin/SWO)
router.patch("/:id/resolve", authenticate, resolveGrievance);

// Delete Grievances - Protected (Admin/SWO)
router.delete("/all", authenticate, deleteAllGrievances);
router.delete("/:id", authenticate, deleteGrievance);

export default router;
