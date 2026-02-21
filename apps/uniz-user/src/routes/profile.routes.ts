import { Router, Request, Response, NextFunction } from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  adminUpdateStudentProfile,
  getAdminProfile,
  getFacultyProfile,
  searchStudents,
  createFacultyProfile,
  updateStudentPresence,
} from "../controllers/profile.controller";

import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

import { authMiddleware } from "../middlewares/auth.middleware";
import { z, ZodSchema } from "zod";
import { ErrorCode } from "../shared/error-codes";
import {
  getStudentsTemplate,
  getUploadProgress,
  uploadStudents,
  exportStudentsSelective,
  getUploadHistory,
  recordExternalUpload,
} from "../controllers/bulk.controller";

const validateRequest =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ code: ErrorCode.VALIDATION_ERROR, errors: error.errors });
      }
      next(error);
    }
  };

const router = Router();

// Helper to remove empty strings/nulls so they don't fail .min() checks
const cleanData = (data: any) => {
  if (!data || typeof data !== "object") return data;
  const clean: any = {};
  for (const key in data) {
    if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
      clean[key] = data[key];
    }
  }
  return clean;
};

const StudentBaseSchema = z.preprocess(
  cleanData,
  z
    .object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      gender: z.enum(["M", "F", "Other"]).optional(),
      phone: z.string().min(10).max(15).optional(),
      phoneNumber: z.string().min(10).max(15).optional(),
      phone_number: z.string().min(10).max(15).optional(),
      bloodGroup: z.string().max(5).optional(),
      blood_group: z.string().max(5).optional(),
      dateOfBirth: z.coerce.date().optional(),
      date_of_birth: z.coerce.date().optional(),
      profileUrl: z.string().url().optional(),
      profile_url: z.string().url().optional(),
      fatherName: z.string().min(2).max(100).optional(),
      father_name: z.string().min(2).max(100).optional(),
      motherName: z.string().min(2).max(100).optional(),
      mother_name: z.string().min(2).max(100).optional(),
      fatherOccupation: z.string().max(100).optional(),
      father_occupation: z.string().max(100).optional(),
      motherOccupation: z.string().max(100).optional(),
      mother_occupation: z.string().max(100).optional(),
      fatherEmail: z.string().email().optional(),
      father_email: z.string().email().optional(),
      motherEmail: z.string().email().optional(),
      mother_email: z.string().email().optional(),
      fatherAddress: z.string().max(500).optional(),
      father_address: z.string().max(500).optional(),
      motherAddress: z.string().max(500).optional(),
      mother_address: z.string().max(500).optional(),
      roomno: z.string().max(20).optional(),
      room_number: z.string().max(20).optional(),
      branch: z.string().max(50).optional(),
      year: z.string().max(10).optional(),
      section: z.string().max(10).optional(),
      isPresentInCampus: z.boolean().optional(),
      is_in_campus: z.boolean().optional(),
      isApplicationPending: z.boolean().optional(),
      has_pending_requests: z.boolean().optional(),
    })
    .transform((data: any) => {
      const mapped: any = { ...data };

      // Map aliases
      if (data.phoneNumber) {
        mapped.phone = data.phoneNumber;
        delete mapped.phoneNumber;
      }
      if (data.phone_number) {
        mapped.phone = data.phone_number;
        delete mapped.phone_number;
      }
      if (data.blood_group) {
        mapped.bloodGroup = data.blood_group;
        delete mapped.blood_group;
      }
      if (data.date_of_birth) {
        mapped.dateOfBirth = data.date_of_birth;
        delete mapped.date_of_birth;
      }
      if (data.profile_url) {
        mapped.profileUrl = data.profile_url;
        delete mapped.profile_url;
      }
      if (data.father_name) {
        mapped.fatherName = data.father_name;
        delete mapped.father_name;
      }
      if (data.mother_name) {
        mapped.motherName = data.mother_name;
        delete mapped.mother_name;
      }
      if (data.father_occupation) {
        mapped.fatherOccupation = data.father_occupation;
        delete mapped.father_occupation;
      }
      if (data.mother_occupation) {
        mapped.motherOccupation = data.mother_occupation;
        delete mapped.mother_occupation;
      }
      if (data.father_email) {
        mapped.fatherEmail = data.father_email;
        delete mapped.father_email;
      }
      if (data.mother_email) {
        mapped.motherEmail = data.mother_email;
        delete mapped.mother_email;
      }
      if (data.father_address) {
        mapped.fatherAddress = data.father_address;
        delete mapped.father_address;
      }
      if (data.mother_address) {
        mapped.motherAddress = data.mother_address;
        delete mapped.mother_address;
      }
      if (data.room_number) {
        mapped.roomno = data.room_number;
        delete mapped.room_number;
      }
      if (data.is_in_campus !== undefined) {
        mapped.isPresentInCampus = data.is_in_campus;
        delete mapped.is_in_campus;
      }
      if (data.has_pending_requests !== undefined) {
        mapped.isApplicationPending = data.has_pending_requests;
        delete mapped.has_pending_requests;
      }

      return mapped;
    }),
);

const StudentUpdateSchema = StudentBaseSchema;
const AdminUpdateStudentSchema = StudentBaseSchema;

const FacultyCreateSchema = z.object({
  username: z.string(),
  name: z.string(),
  email: z.string().email(),
  department: z.string(),
  designation: z.string(),
});

router.get("/student/me", authMiddleware, getStudentProfile);

// Bulk Import Routes
router.get("/admin/student/template", authMiddleware, getStudentsTemplate);
router.post(
  "/admin/student/upload",
  authMiddleware,
  upload.single("file"),
  uploadStudents,
);
router.get("/admin/student/upload/progress", authMiddleware, getUploadProgress);
router.get("/admin/student/export", authMiddleware, exportStudentsSelective);
router.get("/admin/upload-history", authMiddleware, getUploadHistory);
router.post("/internal/upload-history", recordExternalUpload);

router.get("/admin/student/:username", authMiddleware, getStudentProfile);
router.put(
  "/student/update",
  authMiddleware,
  validateRequest(StudentUpdateSchema),
  updateStudentProfile,
);
router.put(
  "/admin/student/:username",
  authMiddleware,
  validateRequest(AdminUpdateStudentSchema),
  adminUpdateStudentProfile,
);
router.post("/student/search", authMiddleware, searchStudents);

router.get("/faculty/me", authMiddleware, getFacultyProfile);
router.post(
  "/faculty/create",
  authMiddleware,
  validateRequest(FacultyCreateSchema),
  createFacultyProfile,
);
router.put("/student/status", authMiddleware, updateStudentPresence);

router.get("/admin/me", authMiddleware, getAdminProfile);

export default router;
