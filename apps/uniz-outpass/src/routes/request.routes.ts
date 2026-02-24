import { Router } from "express";
import {
  createOutpass,
  createOuting,
  getHistory,
  approveOutpass,
  rejectOutpass,
  getAllOutings,
  getAllOutpasses,
  securityCheckOut,
  securityCheckIn,
  getSecuritySummary,
  getOutsideStudents,
} from "../controllers/request.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

import { submissionLimiter } from "../middlewares/ratelimit.middleware";

// Student Routes
router.post("/outpass", submissionLimiter, createOutpass);
router.post("/outing", submissionLimiter, createOuting);
router.get("/history", getHistory);
router.get("/history/:id", getHistory);
router.get("/outside", getOutsideStudents);
router.get("/outing/all", getAllOutings);
router.get("/outpass/all", getAllOutpasses);

// Approval Routes
router.post("/:id/approve", approveOutpass);
router.post("/:id/forward", approveOutpass); // Alias
router.post("/:id/reject", rejectOutpass);

// Security Routes
router.get("/security/summary", getSecuritySummary);
router.post("/:id/checkout", securityCheckOut);
router.post("/:id/checkin", securityCheckIn);

export default router;
