import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const globalForR2 = globalThis as unknown as { r2: S3Client | undefined };

function createR2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
    });
}

export const r2 = globalForR2.r2 ?? createR2Client();

if (process.env.NODE_ENV !== 'production') globalForR2.r2 = r2;

const BUCKET = process.env.R2_BUCKET_NAME ?? 'ornate-uploads';

/** Upload a file to R2, returns the public URL */
export async function uploadToR2(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
): Promise<string> {
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    }));

    const publicUrl = process.env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_URL;
    return `${publicUrl}/${key}`;
}

/** Generate a presigned download URL (1 hour expiry) */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(
        r2,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 }
    );
}
