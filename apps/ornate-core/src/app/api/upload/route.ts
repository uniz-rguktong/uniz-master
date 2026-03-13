import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';
import { enforceServerActionRateLimit, ServerActionRateLimitError } from '@/lib/serverActionRateLimit';

// ── Security Constants ───────────────────────────────────
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream', // Generic fallback
];

/** Map of MIME types to their expected magic bytes (first N bytes) */
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]], // PK (zip)
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    // ── Explicit HEIC/HEIF Validation ──
    // HEIC/HEIF files follow ISO BMFF: [4 bytes size][4 bytes 'ftyp'][4 bytes major brand]
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
        if (buffer.length < 12) return false;
        const brandMarker = buffer.slice(4, 8).toString('ascii');
        const majorBrand = buffer.slice(8, 12).toString('ascii');

        return brandMarker === 'ftyp' && ['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(majorBrand);
    }

    const signatures = MAGIC_BYTES[mimeType];

    if (!signatures || signatures.length === 0) {
        if (mimeType === 'image/svg+xml') {
            const content = buffer.slice(0, 1000).toString('utf8').toLowerCase();
            return content.includes('<svg') || content.includes('<?xml');
        }
        if (mimeType === 'text/csv') {
            // Very basic CSV check: look for commas or tabs in a text-like content
            if (buffer.includes(0x00)) return false;
            const content = buffer.slice(0, 500).toString('utf8');
            return content.includes(',') || content.includes('\n');
        }
        if (mimeType === 'application/octet-stream') {
            return true; // Allow generic binary
        }
        return false; // reject unknown types without signatures
    }

    return signatures.some(sig =>
        sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
    );
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // ── Rate limiting (10 uploads/min per user) ──
        await enforceServerActionRateLimit({
            actionName: 'upload',
            identifier: session.user?.email || 'anonymous',
            config: { limit: 10, window: '1 m', prefix: 'ratelimit:upload' },
        });

        const contentTypeHeader = request.headers.get('content-type') || '';

        // Case 1: Direct File Upload (Server-Side Proxy to bypass CORS)
        if (contentTypeHeader.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            // ── Size check ──
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.` },
                    { status: 413 }
                );
            }

            // ── MIME type check ──
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `File type '${file.type}' is not allowed.` },
                    { status: 415 }
                );
            }

            const fileBuffer = Buffer.from(await file.arrayBuffer());
            let detectedMimeType = file.type;

            // ── Intelligent Magic Byte Sniffing ──
            // If the declared type doesn't match, we try to detect the real type
            if (!validateMagicBytes(fileBuffer, file.type)) {
                console.log(`[Upload] Mismatch detected for ${file.name}. Declared: ${file.type}. Sniffing...`);

                let foundType = null;
                // Try to find if it fits ANY of our allowed types
                for (const type of ALLOWED_MIME_TYPES) {
                    if (validateMagicBytes(fileBuffer, type)) {
                        foundType = type;
                        break;
                    }
                }

                if (foundType) {
                    console.log(`[Upload] Corrected type for ${file.name}: ${foundType}`);
                    detectedMimeType = foundType;
                } else {
                    // Still no match, reject
                    logger.warn({ claimedType: file.type, user: session.user?.email, filename: file.name }, 'upload.validation_failed');
                    return NextResponse.json(
                        { error: `The file content of '${file.name}' does not match any supported image or document formats. Please ensure it is a valid JPG, PNG, or SVG.` },
                        { status: 415 }
                    );
                }
            }

            const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || '',
                Key: uniqueFilename,
                ContentType: detectedMimeType,
                Body: fileBuffer,
            });

            await r2.send(command);

            const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`;

            return NextResponse.json({
                success: true,
                publicUrl: publicUrl
            });
        }

        // Presigned URL path removed — all uploads must go through the
        // server-side multipart proxy above so that file size, MIME type,
        // and magic bytes are validated server-side.
        return NextResponse.json(
            { error: 'Upload must use multipart/form-data. JSON presigned URL requests are no longer supported.' },
            { status: 400 }
        );

    } catch (error: any) {
        if (error instanceof ServerActionRateLimitError) {
            return NextResponse.json(
                { error: `Rate limit exceeded. Try again in ${error.retryAfter}s.` },
                { status: 429 }
            );
        }
        logger.error({ err: error }, 'upload.error');
        return NextResponse.json({
            error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (error.message || 'Internal Server Error')
        }, { status: 500 });
    }
}

