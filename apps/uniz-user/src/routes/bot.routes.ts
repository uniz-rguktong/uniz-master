import { Router } from "express";
import {
  linkTelegramAccount,
  getBotProfile,
  validateBotToken,
} from "../controllers/bot.controller";

const router = Router();

// Secure all bot routes with internal secret
router.use(validateBotToken);

router.post("/link", linkTelegramAccount);
router.get("/profile", getBotProfile);

export default router;
