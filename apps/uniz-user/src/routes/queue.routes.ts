import { Router } from "express";
import { processQueue } from "../controllers/queue.controller";

const router = Router();
router.post("/process", processQueue);

export default router;
