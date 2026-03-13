import prisma from '@/lib/prisma';
import { apiResponse, apiHandler, parseBody } from '@/lib/api-utils';
import { RegistrationSchema } from '@/lib/schemas';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type RegistrationInput = z.infer<typeof RegistrationSchema>;

export const POST = apiHandler(async (request: NextRequest) => {
    // ── Auth check ──
    const session = await getServerSession(authOptions);
    if (!session) {
        return apiResponse(false, null, 'Unauthorized', 401);
    }

    // 1. Parse and Validate Body
    const data = await parseBody(request, RegistrationSchema) as RegistrationInput;

    // 2. Business Logic Checks
    const event = await prisma.event.findUnique({
        where: { id: data.eventId }
    });

    if (!event) {
        return apiResponse(false, null, "Event not found", 404);
    }

    if (!event.registrationOpen) {
        return apiResponse(false, null, "Registrations are closed for this event", 400);
    }

    // 3. Check Capacity and Determine Status
    const activeRegistrationsCount = await prisma.registration.count({
        where: {
            eventId: data.eventId,
            status: { in: ['CONFIRMED', 'PENDING'] }
        }
    });

    let registrationStatus = 'PENDING';
    if (event.maxCapacity && activeRegistrationsCount >= event.maxCapacity) {
        registrationStatus = 'WAITLISTED';
    }

    // 4. Create or Link User (Student)
    let userId: string | undefined = data.userId;
    let currentUser = null;

    if (userId) {
        currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            const admin = await prisma.admin.findUnique({ where: { id: userId } });
            if (admin) {
                return apiResponse(false, null, "Admins are not allowed to register for events", 403);
            }
        } else if (currentUser.role !== 'STUDENT') {
            return apiResponse(false, null, "Only students can register for events", 403);
        }
    }

    if (!userId) {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone || null }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.role !== 'STUDENT') {
                return apiResponse(false, null, "Only students can register for events", 403);
            }
            userId = existingUser.id;
        } else {
            const existingAdmin = await prisma.admin.findUnique({
                where: { email: data.email }
            });
            if (existingAdmin) {
                return apiResponse(false, null, "Admins are not allowed to register for events", 403);
            }
        }
    }

    // 5. Create Registration
    const registration = await prisma.registration.create({
        data: {
            eventId: data.eventId,
            userId: userId || null,
            studentName: data.studentName,
            studentId: data.studentId,
            status: registrationStatus as any,
            amount: event.price || 0,
            paymentStatus: (event.price > 0 && registrationStatus !== 'WAITLISTED') ? 'PENDING' : 'PAID',
        }
    });

    return apiResponse(true, registration, null, 201);
});

