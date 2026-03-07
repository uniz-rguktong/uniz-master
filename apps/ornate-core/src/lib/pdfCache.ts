import fs from "fs";
import path from "path";
import os from "os";
import logger from "./logger";

// ── Configuration ────────────────────────────────────────────────
const CACHE_DIR =
  process.env.PDF_CACHE_DIR || path.join(os.tmpdir(), "ornate-pdf-cache");
const MIN_VALID_SIZE = 1024; // 1KB — PDFs smaller than this are likely corrupt
const PDF_HEADER = "%PDF-";

// ── Ensure cache directory exists ────────────────────────────────
let dirEnsured = false;
function ensureCacheDir(): void {
  if (dirEnsured) return;
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    dirEnsured = true;
  } catch (err) {
    logger.error(
      { err, dir: CACHE_DIR },
      "pdfCache: failed to create cache directory",
    );
  }
}

// ── Cache Path Helper ────────────────────────────────────────────
function cachePath(registrationId: string): string {
  // Sanitize the ID to prevent path traversal
  const safeId = registrationId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safeId}.pdf`);
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Retrieve a cached PDF by registration ID.
 * Returns the PDF buffer if valid, null on cache miss or corruption.
 */
export function getCachedPdf(registrationId: string): Buffer | null {
  ensureCacheDir();
  const filePath = cachePath(registrationId);

  try {
    if (!fs.existsSync(filePath)) {
      logger.debug({ registrationId }, "cache.miss");
      return null;
    }

    const stat = fs.statSync(filePath);

    // Size check — reject suspiciously small files
    if (stat.size < MIN_VALID_SIZE) {
      logger.warn(
        { registrationId, size: stat.size },
        "cache.corrupt.size — removing",
      );
      fs.unlinkSync(filePath);
      return null;
    }

    const buffer = fs.readFileSync(filePath);

    // Header check — must start with %PDF-
    if (!buffer.subarray(0, 5).toString("ascii").startsWith(PDF_HEADER)) {
      logger.warn({ registrationId }, "cache.corrupt.header — removing");
      fs.unlinkSync(filePath);
      return null;
    }

    logger.info({ registrationId, sizeBytes: buffer.length }, "cache.hit");
    return buffer;
  } catch (err) {
    logger.error({ err, registrationId }, "cache.read.error");
    return null;
  }
}

/**
 * Write a rendered PDF to the cache. Failure never throws —
 * cache is non-blocking and optional.
 */
export function cachePdf(registrationId: string, buffer: Buffer): void {
  ensureCacheDir();
  const filePath = cachePath(registrationId);

  try {
    fs.writeFileSync(filePath, buffer);
    logger.debug({ registrationId, sizeBytes: buffer.length }, "cache.write");
  } catch (err) {
    logger.error({ err, registrationId }, "cache.write.error");
  }
}

/**
 * Invalidate (delete) a cached PDF. Used when certificate data changes
 * (e.g. re-distribution after correction).
 */
export function invalidateCache(registrationId: string): void {
  const filePath = cachePath(registrationId);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info({ registrationId }, "cache.invalidate");
    }
  } catch (err) {
    logger.error({ err, registrationId }, "cache.invalidate.error");
  }
}

/**
 * Remove all cached PDFs. Admin/maintenance operation.
 */
export function clearCache(): { deleted: number; errors: number } {
  ensureCacheDir();
  let deleted = 0;
  let errors = 0;

  try {
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      if (!file.endsWith(".pdf")) continue;
      try {
        fs.unlinkSync(path.join(CACHE_DIR, file));
        deleted++;
      } catch {
        errors++;
      }
    }
    logger.info({ deleted, errors }, "cache.clear");
  } catch (err) {
    logger.error({ err }, "cache.clear.error");
  }

  return { deleted, errors };
}

/**
 * Cache statistics for monitoring/health checks.
 */
export function getCacheStats(): {
  directory: string;
  fileCount: number;
  totalSizeBytes: number;
  totalSizeMB: string;
} {
  ensureCacheDir();
  let fileCount = 0;
  let totalSizeBytes = 0;

  try {
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      if (!file.endsWith(".pdf")) continue;
      try {
        const stat = fs.statSync(path.join(CACHE_DIR, file));
        fileCount++;
        totalSizeBytes += stat.size;
      } catch {
        /* skip unreadable files */
      }
    }
  } catch {
    /* directory may not exist yet */
  }

  return {
    directory: CACHE_DIR,
    fileCount,
    totalSizeBytes,
    totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
  };
}
