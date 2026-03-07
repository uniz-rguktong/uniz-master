import { Router } from "express";
import { sendEmail } from "../controllers/email.controller";

import { internalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/send", internalAuthMiddleware, sendEmail);

export default router;
