'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/r2';

function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Unauthorized';
}

export async function getCertificateDownloadUrl(registrationId: string) {
    try {
        const user = await requireAuth();

        let userData = await prisma.user.findUnique({ where: { id: user.id } });
        if (!userData && user.email) userData = await prisma.user.findUnique({ where: { email: user.email } });

        if (!userData) return { success: false, error: 'User profile not found.' };

        const registration = await prisma.registration.findFirst({
            where: { id: registrationId, userId: userData.id },
        });

        if (!registration) return { success: false, error: 'Registration not found.' };
        if (!registration.certificateUrl || !registration.certificateIssuedAt) {
            return { success: false, error: 'Certificate not yet issued.' };
        }

        // The certificateUrl stored in DB is the R2 key
        const downloadUrl = await getPresignedDownloadUrl(registration.certificateUrl);

        return { success: true, data: { url: downloadUrl } };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in.' };
        return { success: false, error: 'Failed to generate download link.' };
    }
}

/**
 * Return the certificate download URL for a given registration.
 * Used on the profile admin-view page (no user session required).
 * Points to the /api/certificates/download/[id] route which handles
 * both R2-key and stored-URL-path cases.
 */
export async function getCertificateUrlByKey(registrationId: string) {
    try {
        if (!registrationId) return { success: false, error: 'No registration ID provided.' };

        // Verify the registration exists and has a certificate
        const registration = await prisma.registration.findUnique({
            where: { id: registrationId },
            select: { certificateUrl: true, certificateIssuedAt: true },
        });

        if (!registration) return { success: false, error: 'Registration not found.' };
        if (!registration.certificateUrl || !registration.certificateIssuedAt) {
            return { success: false, error: 'Certificate not yet issued.' };
        }

        // Return route to our new download API which handles the cert serving
        return { success: true, data: { url: `/api/certificates/download/${registrationId}` } };
    } catch (error: unknown) {
        console.error('[getCertificateUrlByKey]', error);
        return { success: false, error: 'Failed to fetch certificate link.' };
    }
}
