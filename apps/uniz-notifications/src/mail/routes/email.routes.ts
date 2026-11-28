import { Router } from "express";
import { sendEmail } from "../controllers/email.controller";
import { internalAuthMiddleware } from "../middlewares/internal-auth.middleware";
import { routerRateLimiter } from "../../middlewares/router-limiter";

const router = Router();
router.use(routerRateLimiter);

router.post("/send", internalAuthMiddleware, sendEmail);

export default router;
