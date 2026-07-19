import { apiClient } from "./apiClient";
import { UPLOAD_IMAGE } from "./endpoints";

// Purpose determines the storage key + compression profile on the backend.
// Profile purposes replace-on-reupload (one object per user); banner/website
// purposes create a new object each time.
export type UploadPurpose =
  | "student-profile"
  | "faculty-profile"
  | "admin-profile"
  | "banner"
  | "website"
  | "generic";

/**
 * Uploads an image to our backend (Cloudflare R2) and returns the public URL.
 *
 * Replaces the previous client-direct-to-Cloudinary uploads. The backend
 * compresses the image to WebP and stores it, so the caller just persists the
 * returned URL exactly as before. Returns `null` on failure (a toast is shown
 * by apiClient).
 *
 * @param targetId optional subject id when an admin uploads on behalf of
 *   another user (e.g. a faculty photo).
 */
export async function uploadImage(
  file: File,
  purpose: UploadPurpose,
  targetId?: string,
): Promise<string | null> {
  const form = new FormData();
  form.append("image", file);
  form.append("purpose", purpose);
  if (targetId) form.append("targetId", targetId);

  const res = await apiClient<{ success: boolean; url: string }>(UPLOAD_IMAGE, {
    method: "POST",
    body: form,
  });

  return res?.url ?? null;
}
