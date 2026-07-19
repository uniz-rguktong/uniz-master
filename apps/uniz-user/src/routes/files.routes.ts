import { Router, Response } from "express";
import multer from "multer";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware";
import {
  compressToWebp,
  putImage,
  isR2Configured,
  type CompressOptions,
} from "../utils/r2.util";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

// Roles permitted to upload admin-scoped assets (banners, website images, and
// faculty photos on behalf of another user).
const ADMIN_UPLOAD_ROLES = new Set([
  "webadmin",
  "webmaster",
  "dean",
  "director",
  "coe",
  "ao",
  "hod",
  "admin",
]);

type Purpose =
  | "student-profile"
  | "faculty-profile"
  | "admin-profile"
  | "banner"
  | "website"
  | "generic";

const PROFILE_COMPRESS: CompressOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 80,
};
const WIDE_COMPRESS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 82,
};

// Keep object keys filesystem/URL-safe and free of path traversal.
function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
}

function randomKeyPart(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// Image upload → Cloudflare R2. Server-side compression to WebP guarantees a
// bounded output size regardless of the source quality/dimensions. Profile
// assets use a deterministic key (one object per user) so a re-upload replaces
// the old image; append-style assets (banners/website) get a unique key.
router.post(
  "/image/upload",
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!isR2Configured()) {
      return res
        .status(503)
        .json({ success: false, message: "Image storage is not configured" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided" });
    }

    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const purpose = String(
      req.body?.purpose || req.query?.purpose || "generic",
    ) as Purpose;
    const role = String(user.role || "").toLowerCase();
    const isAdmin = ADMIN_UPLOAD_ROLES.has(role);

    let key: string;
    let compress: CompressOptions;

    switch (purpose) {
      case "student-profile":
        key = `profiles/student/${sanitizeId(user.id)}.webp`;
        compress = PROFILE_COMPRESS;
        break;
      case "admin-profile":
        key = `profiles/admin/${sanitizeId(user.id)}.webp`;
        compress = PROFILE_COMPRESS;
        break;
      case "faculty-profile": {
        // Faculty photos are managed by admins on behalf of a faculty member,
        // keyed by that faculty's identifier for replace-on-reupload. Without a
        // target (e.g. new faculty not yet named) fall back to a unique key.
        const targetId = sanitizeId(
          String(req.body?.targetId || req.query?.targetId || ""),
        );
        if (targetId) {
          if (!isAdmin) {
            return res
              .status(403)
              .json({ success: false, message: "Not permitted" });
          }
          key = `profiles/faculty/${targetId}.webp`;
        } else {
          key = `profiles/faculty/${randomKeyPart()}.webp`;
        }
        compress = PROFILE_COMPRESS;
        break;
      }
      case "banner":
        if (!isAdmin) {
          return res
            .status(403)
            .json({ success: false, message: "Not permitted" });
        }
        key = `banners/${randomKeyPart()}.webp`;
        compress = WIDE_COMPRESS;
        break;
      case "website":
        if (!isAdmin) {
          return res
            .status(403)
            .json({ success: false, message: "Not permitted" });
        }
        key = `website/${randomKeyPart()}.webp`;
        compress = WIDE_COMPRESS;
        break;
      default:
        // Unknown/generic uploads are treated as append-style admin assets.
        if (!isAdmin) {
          return res
            .status(403)
            .json({ success: false, message: "Not permitted" });
        }
        key = `uploads/${randomKeyPart()}.webp`;
        compress = WIDE_COMPRESS;
    }

    try {
      const webp = await compressToWebp(req.file.buffer, compress);
      const url = await putImage(key, webp);
      return res.json({ success: true, url });
    } catch (e: any) {
      console.error("[R2 Image Upload] error:", e?.message || e);
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }
  },
);

export default router;
