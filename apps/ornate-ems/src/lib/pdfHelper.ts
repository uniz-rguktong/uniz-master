import fs from "fs";
import path from "path";
import logger from "./logger";

// ── In-Memory Image Cache ────────────────────────────────────────
// Keyed by absolute path → base64 data URI string.
// 17 images × ~50-200KB each ≈ 1-3MB in memory — trivial.
const imageCache = new Map<string, string>();

/**
 * Consolidated image inliner — single source of truth.
 * Handles both `./components/*` paths (from templates) and
 * broader relative paths (./  ../  /) with image extensions.
 *
 * Uses an in-memory cache: first call reads from disk, subsequent
 * calls return instantly from the Map.
 */
export function inlineImages(html: string): string {
  // Pattern 1: ./components/filename.ext (used by certificate templates)
  html = html.replace(
    /src="\.\/components\/([^"]+)"/g,
    (match: string, filename: string) => {
      const componentDir = path.join(
        process.cwd(),
        "src",
        "templates",
        "components",
      );
      const filePath = path.join(componentDir, filename);
      return inlineImageAtPath(filePath, match);
    },
  );

  // Pattern 2: broader relative/absolute paths with image extensions
  html = html.replace(
    /src="((?:\.\/|\.\.\/|\/)[^"]+\.(png|jpg|jpeg|gif|svg|webp))"/gi,
    (match: string, imgPath: string, ext: string) => {
      // Skip already-inlined data URIs
      if (imgPath.startsWith("data:")) return match;
      const absolutePath = path.resolve(process.cwd(), imgPath);
      // Skip if this is a ./components/ path already handled above
      if (imgPath.startsWith("./components/")) return match;
      return inlineImageAtPath(absolutePath, match);
    },
  );

  return html;
}

/**
 * Read an image file, base64-encode it, and return the `src="data:..."` attribute.
 * Results are cached in memory — subsequent calls for the same path return instantly.
 */
function inlineImageAtPath(absolutePath: string, fallback: string): string {
  // Check memory cache first
  const cached = imageCache.get(absolutePath);
  if (cached) return cached;

  try {
    if (!fs.existsSync(absolutePath)) {
      logger.warn({ path: absolutePath }, "inlineImages: file not found");
      return fallback;
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const base64 = fileBuffer.toString("base64");
    const ext = path.extname(absolutePath).substring(1).toLowerCase();
    const mimeType =
      ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
    const result = `src="data:${mimeType};base64,${base64}"`;

    // Cache for next call
    imageCache.set(absolutePath, result);
    return result;
  } catch (e: any) {
    logger.error(
      { path: absolutePath, err: e },
      "inlineImages: failed to inline",
    );
    return fallback;
  }
}
