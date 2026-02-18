import { Router } from "express";
import {
  uploadAttendance,
  uploadGrades,
  downloadAttendanceTemplate,
  downloadGradesTemplate,
} from "../controllers/file.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import multer from "multer";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authMiddleware);

router.post("/attendance/upload", upload.single("file"), uploadAttendance);
router.get("/attendance/template", downloadAttendanceTemplate);

router.post("/grades/upload", upload.single("file"), uploadGrades);
router.get("/grades/template", downloadGradesTemplate);

export default router;
