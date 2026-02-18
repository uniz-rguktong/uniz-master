import { Router } from "express";
import {
  getPublicBanners,
  getPublicNotifications,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  createUpdate,
  updateUpdate,
  deleteUpdate,
  createTender,
  toggleVisibility,
} from "../controllers/cms.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { cmsPublicGuard } from "../middlewares/cms-auth.middleware";
import { z } from "zod";
import { NextFunction, Request, Response } from "express";

const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (e: any) {
      return res.status(400).json({ success: false, errors: e.errors });
    }
  };

const BannerSchema = z.object({
  title: z.string().min(3),
  text: z.string().min(3),
  imageUrl: z.string().url(),
  isVisible: z.boolean().optional(),
});

const UpdateSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
  link: z.string().url().optional().nullable(),
  isVisible: z.boolean().optional(),
});

const TenderSchema = z.object({
  title: z.string().min(5),
  description: z.string(),
  pdfUrl: z.string().url().optional().nullable(),
  deadline: z.string().optional().nullable(), // ISO string
  isVisible: z.boolean().optional(),
});

const router = Router();

/**
 * PUBLIC ROUTES
 */
// Public endpoints protected by Origin/API-Key guard
router.get("/banners/public", cmsPublicGuard, getPublicBanners);
router.get("/notifications", cmsPublicGuard, getPublicNotifications);

/**
 * ADMIN ROUTES
 */
// Admin endpoints protected by RBAC (via authMiddleware + Controller role checks)
router.get("/admin/banners", authMiddleware, getAdminBanners);
router.post(
  "/admin/banners",
  authMiddleware,
  validate(BannerSchema),
  createBanner,
);
router.put("/admin/banners/:id", authMiddleware, updateBanner);
router.delete("/admin/banners/:id", authMiddleware, deleteBanner);

router.post(
  "/admin/updates",
  authMiddleware,
  validate(UpdateSchema),
  createUpdate,
);
router.put("/admin/updates/:id", authMiddleware, updateUpdate);
router.delete("/admin/updates/:id", authMiddleware, deleteUpdate);
router.post(
  "/admin/tenders",
  authMiddleware,
  validate(TenderSchema),
  createTender,
);

// Visibility toggle for all types
router.post("/admin/visibility/:type/:id", authMiddleware, toggleVisibility);

export default router;
