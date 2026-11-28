import { Router } from "express";
import { uploadImage } from "../controllers/file.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { routerRateLimiter } from "../middlewares/router-limiter";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(routerRateLimiter);
router.use(authMiddleware);
router.post("/image/upload", upload.single("image"), uploadImage);

export default router;
