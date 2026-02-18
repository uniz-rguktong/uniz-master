import { Router } from "express";
import { processQueue } from "../controllers/queue.controller";

const router = Router();

// Internal/Protected Endpoint
router.post("/process", processQueue);

export default router;
