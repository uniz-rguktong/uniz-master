import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

// Uploaded images are stored on the VPS itself (a persistent hostPath volume in
// production, a local folder in dev) and served back through the gateway at
// /api/v1/files/img/*. This keeps image storage free, self-hosted, and
// independent of any third-party service or its egress restrictions.
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), ".uploads");

// Absolute, browser-reachable base URL for serving uploaded images. Defaults to
// the configured gateway URL (e.g. https://api-uniz.rguktong.in/api/v1) plus the
// files/img serving path, so the same value works in prod and local dev.
function publicBase(): string {
  const explicit = process.env.PUBLIC_UPLOADS_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const gw = (process.env.GATEWAY_URL || "http://localhost:3000/api/v1").replace(
    /\/+$/,
    "",
  );
  return `${gw}/files/img`;
}

export function uploadsDir(): string {
  return UPLOADS_DIR;
}

// Local disk is always available; kept for parity with the previous provider
// interface so callers can surface a clean 503 if this ever changes.
export function isStorageConfigured(): boolean {
  return true;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Compress any input image to a bounded-size WebP. Server-side compression
// guarantees the stored size/quality regardless of what the user uploaded.
export async function compressToWebp(
  input: Buffer,
  opts: CompressOptions = {},
): Promise<Buffer> {
  const { maxWidth = 512, maxHeight = 512, quality = 80 } = opts;
  return sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

// Keys are constructed server-side, but normalize and reject traversal as a
// defense-in-depth measure before touching the filesystem.
function safeKey(key: string): string {
  const normalized = path.posix.normalize(key).replace(/^(\.\.(\/|$))+/, "");
  if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

// Write the image to disk under UPLOADS_DIR/<key> and return its public URL. A
// deterministic key (e.g. profiles/student/<id>.webp) means a re-upload replaces
// the previous file; the ?v=<ts> query busts the CDN/browser cache on replace.
export async function saveImage(key: string, body: Buffer): Promise<string> {
  const safe = safeKey(key);
  const full = path.join(UPLOADS_DIR, safe);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return `${publicBase()}/${safe}?v=${Date.now()}`;
}
