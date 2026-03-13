'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const RegisterSportSchema = z.object({
    sportId: z.string().min(1),
});

function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Unauthorized';
}

export async function registerForSport(input: z.infer<typeof RegisterSportSchema>) {
    try {
        const user = await requireAuth();
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests.' };

        const parsed = RegisterSportSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Invalid input.' };

        const { sportId } = parsed.data;

        const sport = await prisma.sport.findUnique({ where: { id: sportId } });
        if (!sport) return { success: false, error: 'Sport not found.' };
        if (sport.status !== 'REGISTRATION_OPEN') return { success: false, error: 'Registration is not open for this sport.' };

        let userData = await prisma.user.findUnique({ where: { id: user.id } });

        if (!userData && user.email) {
            userData = await prisma.user.findUnique({ where: { email: user.email } });
        }

        if (!userData) {
            console.error('[registerForSport] User record missing for session:', user.id, 'Email:', user.email);
            return { success: false, error: 'Your session has expired or your user account was deleted from the database. Please sign out and sign in again! ID: ' + user.id };
        }

        // Resolve effective student ID
        const effectiveStudentId = userData.stdid || (userData.email ? userData.email.split('@')[0].toUpperCase() : null);
        if (!effectiveStudentId) return { success: false, error: 'User does not have a valid student ID.' };

        // Check already registered
        const existing = await prisma.sportRegistration.findUnique({
            where: { sportId_studentId: { sportId, studentId: effectiveStudentId } },
        });
        if (existing) return { success: false, error: 'Already registered.' };

        await prisma.sportRegistration.create({
            data: {
                id: crypto.randomUUID(),
                sportId,
                studentName: userData.name ?? 'Unknown',
                studentId: effectiveStudentId,
                email: userData.email || '',
                phone: userData.phone || '',
                branch: userData.branch || '',
                year: userData.currentYear || '',
                status: 'CONFIRMED',
            },
        });

        revalidatePath('sports');
        revalidatePath('/home/missions');
        revalidatePath('/home/profile');

        return { success: true };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in.' };
        console.error('[registerForSport]', error);
        return { success: false, error: 'Sport registration failed.' };
    }
}
