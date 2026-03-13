'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import { sendEventRegistrationEmail } from '@/lib/mail/aws-ses';

const RegisterEventSchema = z.object({
    eventId: z.string().min(1),
});

function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Unauthorized';
}

export async function registerForEvent(input: z.infer<typeof RegisterEventSchema>) {
    try {
        const user = await requireAuth();

        // Rate limit
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests. Slow down, operative.' };

        const parsed = RegisterEventSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Invalid input.' };

        const { eventId } = parsed.data;

        // Fetch event with capacity check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { Registration: true } } },
        });

        if (!event) return { success: false, error: 'Event not found.' };
        if (event.status !== 'PUBLISHED') return { success: false, error: 'Event is not open for registration.' };
        if (!event.registrationOpen) return { success: false, error: 'Registration is closed.' };
        if (event._count.Registration >= event.maxCapacity) return { success: false, error: 'Event is full.' };

        // Get user details
        let userData = await prisma.user.findUnique({ where: { id: user.id } });

        if (!userData && user.email) {
            userData = await prisma.user.findUnique({ where: { email: user.email } });
        }

        if (!userData) {
            console.error('[registerForEvent] User record totally missing for session:', user.id, 'Email:', user.email);
            return { success: false, error: 'Your session has expired or your user account was deleted from the database. Please sign out and sign in again! Session ID: ' + user.id };
        }

        // Resolve effective student ID
        const effectiveStudentId = (userData.stdid || (userData.email ? userData.email.split('@')[0] : null))?.toUpperCase();
        if (!effectiveStudentId) return { success: false, error: 'User does not have a valid student ID.' };

        // Check if already registered
        const existing = await prisma.registration.findUnique({
            where: { eventId_studentId: { eventId, studentId: effectiveStudentId } },
        });
        if (existing) return { success: false, error: 'Already registered for this event.' };

        // Create registration
        const registrationStatus = event.price > 0 ? 'PENDING' : 'CONFIRMED';

        await prisma.registration.create({
            data: {
                id: crypto.randomUUID(),
                eventId,
                userId: userData.id,
                studentName: (userData.name ?? 'Unknown').toUpperCase(),
                studentId: effectiveStudentId,
                status: registrationStatus,
                paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
                amount: event.price,
                email: userData.email || '',
                phone: userData.phone || '',
                branch: userData.branch || '',
                year: userData.currentYear || '',
            },
        });

        if (userData.email) {
            // Do not fail registration on SES mail issues.
            void sendEventRegistrationEmail({
                to: userData.email,
                name: userData.name,
                eventName: event.title,
                eventDate: event.date,
                venue: event.venue,
                registrationStatus,
                amount: event.price,
                studentId: effectiveStudentId,
            }).catch((mailError) => {
                console.error('[registerForEvent][REGISTRATION_MAIL]', mailError);
            });
        }

        revalidatePath('events');
        revalidatePath('registrations');

        revalidatePath('/home/missions');
        revalidatePath('/home/profile');
        return { success: true };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in first.' };
        console.error('[registerForEvent]', error);
        return { success: false, error: 'Registration failed. Try again.' };
    }
}
