import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Cloudflare R2 object storage (S3-compatible) for user-uploaded images.
// Replaces client-direct Cloudinary uploads: files are compressed server-side
// with sharp and written under deterministic keys so re-uploads overwrite the
// previous asset ("replace on re-upload"). Public serving is via the bucket's
// Cloudflare CDN domain (R2_PUBLIC_BASE_URL).

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || "").replace(
  /\/+$/,
  "",
);

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
    R2_BUCKET &&
    R2_PUBLIC_BASE_URL &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
}

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!R2_ACCOUNT_ID || !accessKeyId || !secretAccessKey || !R2_BUCKET) {
    throw new Error("R2 storage is not configured (missing R2_* env vars)");
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Normalise any incoming image to a compact WebP. EXIF orientation is baked in
// via rotate(); images are scaled to fit within the bounds without upscaling so
// we never enlarge (and inflate) a small source.
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

// Upload bytes to a fixed key and return a versioned public URL. Objects are
// cached immutably by the CDN; the ?v= cache-buster changes on every replace so
// clients fetch the new image immediately despite the stable key.
export async function putImage(
  key: string,
  body: Buffer,
  contentType = "image/webp",
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${R2_PUBLIC_BASE_URL}/${key}?v=${Date.now()}`;
}
