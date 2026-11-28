import { Router } from "express";
import { processQueue } from "../controllers/queue.controller";
import { routerRateLimiter } from "../middlewares/router-limiter";

const router = Router();
router.use(routerRateLimiter);
router.post("/process", processQueue);

export default router;
