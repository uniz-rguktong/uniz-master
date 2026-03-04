import { Router } from "express";
import {
  getGrades,
  getBatchGrades,
  addGrades,
  bulkUpdateGrades,
  getGradesTemplate,
  uploadGrades,
  getUploadProgress,
  getPublishProgress,
  getAttendance,
  addAttendance,
  getAttendanceTemplate,
  uploadAttendance,
  publishAttendance,
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
  publishResults,
  downloadGrades,
  downloadAttendance,
} from "../controllers/academic.controller";
import {
  initSemester,
  getSemesters,
  updateSemesterStatus,
  getDeanAllocations,
  updateAllocation,
  approveBranchAllocation,
  getAvailableSubjects,
  registerSubjects,
  getCurrentSubjects,
  exportAcademicData,
  deleteSemester,
  getRegistrations,
} from "../controllers/registration.controller";
import {
  getFaculties,
  getFacultyProfile,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  updateFacultyRole,
} from "../controllers/faculty.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authMiddleware);

// Grades
router.get("/grades", getGrades);
router.get("/grades/batch", getBatchGrades);
router.post("/grades/add", addGrades);
router.put("/grades/bulk-update", bulkUpdateGrades);
router.get("/grades/template", getGradesTemplate);
router.get("/grades/download/:semesterId", downloadGrades);
router.post(
  "/grades/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  uploadGrades,
);
router.post("/grades/publish-email", publishResults); // Deprecated in favor of direct download but keeping for audit compliance

// Bulk Progress
router.get("/upload/progress", getUploadProgress); // Main generic endpoint
router.get("/grades/upload/progress", getUploadProgress);
router.get("/attendance/upload/progress", getUploadProgress);
router.get("/grades/publish/progress", getPublishProgress);
router.get("/attendance/publish/progress", getPublishProgress);

// Attendance
router.get("/attendance", getAttendance);
router.post("/attendance/add", addAttendance);
router.get("/attendance/template", getAttendanceTemplate);
router.get("/attendance/download/:semesterId", downloadAttendance);
router.post("/attendance/upload", upload.single("file"), uploadAttendance);
router.post("/attendance/publish-email", publishAttendance); // Deprecated in favor of direct download but keeping for audit compliance

// Subjects
router.get("/subjects", getSubjects);
router.post("/subjects/add", addSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// Registration Workflow
router.get("/semester", getSemesters);
router.post("/semester/init", initSemester);
router.patch("/semester/status/:id", updateSemesterStatus);
router.put("/semester/status/:id", updateSemesterStatus);
router.delete("/semester/:id", deleteSemester);

router.get("/dean/review/:branch", getDeanAllocations);
router.put("/dean/allocation/:id", updateAllocation);
router.post("/dean/approve", approveBranchAllocation);

router.get("/student/available", getAvailableSubjects);
router.post("/student/register", registerSubjects);
router.get("/student/current/:studentId", getCurrentSubjects);

router.get("/export", exportAcademicData);
router.get("/registrations", getRegistrations);

// Faculty Management
router.get("/faculty", getFaculties);
router.get("/faculty/:id", getFacultyProfile);
router.post("/faculty", createFaculty);
router.put("/faculty/:id", updateFaculty);
router.delete("/faculty/:id", deleteFaculty);
router.patch("/faculty/:id/role", updateFacultyRole);

export default router;
