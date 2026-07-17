import { Router } from "express";
import multer from "multer";
import { Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

router.post(
  "/image/upload",
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided" });
    }

    try {
      const result: { secure_url: string; public_id: string } = await new Promise(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "uniz/profiles",
              resource_type: "image",
              transformation: [{ width: 500, height: 500, crop: "limit" }],
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else
                resolve(uploadResult as { secure_url: string; public_id: string });
            },
          );
          uploadStream.end(req.file!.buffer);
        },
      );

      return res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (e: any) {
      console.error("Cloudinary Image Upload Error:", e);
      return res.status(500).json({ success: false, message: e.message });
    }
  },
);

export default router;
