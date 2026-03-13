'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const CreateTeamSchema = z.object({
    eventId: z.string().min(1),
    teamName: z.string().min(2).max(50),
    members: z.array(z.object({
        studentName: z.string().min(2),
        studentId: z.string().min(1),
    })).optional(),
});

const JoinTeamSchema = z.object({
    teamCode: z.string().min(1).max(20),
});

function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Unauthorized';
}

function generateTeamCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., "A3F2B1"
}

export async function createTeam(input: z.infer<typeof CreateTeamSchema>) {
    try {
        const user = await requireAuth();
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests.' };

        const parsed = CreateTeamSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Invalid input.' };

        const { eventId, teamName, members } = parsed.data;

        // Validate event is team-based
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return { success: false, error: 'Event not found.' };
        if ((event.teamSizeMin ?? 0) < 2) return { success: false, error: 'This event is not team-based.' };

        // Get user data
        let userData = await prisma.user.findUnique({ where: { id: user.id } });

        if (!userData && user.email) {
            userData = await prisma.user.findUnique({ where: { email: user.email } });
        }

        if (!userData) return { success: false, error: 'Your session has expired or your user account was deleted from the database. Please sign out and sign in again!' };

        // Resolve effective student ID
        const effectiveStudentId = (userData.stdid || (userData.email ? userData.email.split('@')[0] : null))?.toUpperCase();
        if (!effectiveStudentId) return { success: false, error: 'User does not have a valid student ID.' };

        const teamCode = generateTeamCode();

        // Transaction: create Registration + Team + TeamMember (leader)
        const result = await prisma.$transaction(async (tx) => {
            const registration = await tx.registration.create({
                data: {
                    id: crypto.randomUUID(),
                    eventId,
                    userId: userData.id,
                    studentName: userData.name ?? 'Unknown',
                    studentId: effectiveStudentId,
                    status: 'PENDING',
                    paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
                    amount: event.price,
                    email: userData.email || '',
                    phone: userData.phone || '',
                    branch: userData.branch || '',
                    year: userData.currentYear || '',
                },
            });

            const team = await tx.team.create({
                data: {
                    id: crypto.randomUUID(),
                    teamName,
                    teamCode,
                    eventId,
                    leaderId: userData.id,
                    leaderName: userData.name ?? 'Unknown',
                    leaderEmail: userData.email || '',
                    leaderPhone: userData.phone || '',
                    registrationId: registration.id,
                    status: 'PENDING',
                    paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
                    amount: event.price,
                    updatedAt: new Date(),
                },
            });

            // Create leader member
            await tx.teamMember.create({
                data: {
                    id: crypto.randomUUID(),
                    teamId: team.id,
                    userId: userData.id,
                    name: userData.name ?? 'Unknown',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    rollNumber: effectiveStudentId,
                    department: userData.branch || '',
                    year: userData.currentYear || '',
                    role: 'LEADER',
                    status: 'ACCEPTED',
                },
            });

            // Optimized validation and batch creation of other members
            if (members && members.length > 0) {
                const memberIds = members.map(m => m.studentId.toUpperCase()).filter(id => id !== effectiveStudentId);
                
                // Optimized fetch: Only pull necessary fields from User table
                const registeredUsers = await tx.user.findMany({
                    where: {
                        stdid: { in: memberIds }
                    },
                    select: {
                        id: true,
                        name: true,
                        stdid: true,
                        email: true,
                        phone: true,
                        branch: true,
                        currentYear: true,
                    }
                });

                const registeredIdMap = new Map(registeredUsers.map(u => [u.stdid?.toUpperCase(), u]));
                const unregistered = members.filter(m => m.studentId.toUpperCase() !== effectiveStudentId && !registeredIdMap.has(m.studentId.toUpperCase()));

                if (unregistered.length > 0) {
                    const names = unregistered.map(m => m.studentName.toUpperCase()).join(', ');
                    throw new Error(`The following members are not registered on the platform: ${names}. They must create an account first.`);
                }

                // Batch prepare teammate data
                const teammatesData = members
                    .filter(m => m.studentId.toUpperCase() !== effectiveStudentId)
                    .map(m => {
                        const dbUser = registeredIdMap.get(m.studentId.toUpperCase())!;
                        return {
                            id: crypto.randomUUID(),
                            teamId: team.id,
                            userId: dbUser.id,
                            name: (dbUser.name ?? m.studentName).toUpperCase(),
                            rollNumber: (dbUser.stdid ?? m.studentId).toUpperCase(),
                            email: dbUser.email, 
                            phone: dbUser.phone || '',
                            department: dbUser.branch || '',
                            year: dbUser.currentYear || '',
                            role: 'MEMBER' as const,
                            status: 'ACCEPTED' as const,
                        };
                    });

                // Batch insert into TeamMember table (one query)
                if (teammatesData.length > 0) {
                    await tx.teamMember.createMany({
                        data: teammatesData,
                    });
                }
            }

            return { teamCode: team.teamCode, teamId: team.id };
        });

        revalidatePath('/home/missions');
        revalidatePath('/home/profile');

        return { success: true, data: result };
    } catch (error: any) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in first.' };
        
        // Handle custom registration error thrown from transaction
        if (error.message?.includes('platform')) {
            return { success: false, error: error.message };
        }
        
        console.error('[createTeam]', error);
        return { success: false, error: 'Team creation failed.' };
    }
}

export async function joinTeam(input: z.infer<typeof JoinTeamSchema>) {
    try {
        const user = await requireAuth();
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests.' };

        // Get user data
        let userData = await prisma.user.findUnique({ where: { id: user.id } });

        if (!userData && user.email) {
            userData = await prisma.user.findUnique({ where: { email: user.email } });
        }

        if (!userData) return { success: false, error: 'Your session has expired or your user account was deleted from the database. Please sign out and sign in again!' };

        // Resolve effective student ID
        const effectiveStudentId = userData.stdid || (userData.email ? userData.email.split('@')[0].toUpperCase() : null);
        if (!effectiveStudentId) return { success: false, error: 'User does not have a valid student ID.' };

        const parsed = JoinTeamSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Invalid team code.' };

        const { teamCode } = parsed.data;

        const team = await prisma.team.findUnique({
            where: { teamCode },
            include: {
                event: true,
                members: true,
            },
        });

        if (!team) return { success: false, error: 'Team not found. Check the code.' };
        if (team.isLocked) return { success: false, error: 'Team is locked.' };

        // Check team size
        const maxSize = team.event?.teamSizeMax ?? 10;
        if (team.members.length >= maxSize) return { success: false, error: 'Team is full.' };

        // Check not already a member
        const isMember = team.members.some((m) => m.userId === userData.id);
        if (isMember) return { success: false, error: 'Already in this team.' };

        await prisma.teamMember.create({
            data: {
                id: crypto.randomUUID(),
                teamId: team.id,
                userId: userData.id,
                name: userData.name ?? 'Unknown',
                email: userData.email || '',
                phone: userData.phone || '',
                rollNumber: effectiveStudentId,
                department: userData.branch || '',
                year: userData.currentYear || '',
                role: 'MEMBER',
                status: 'ACCEPTED',
            },
        });

        revalidatePath('/home/missions');
        revalidatePath('/home/profile');

        return { success: true, data: { teamName: team.teamName } };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in first.' };
        console.error('[joinTeam]', error);
        return { success: false, error: 'Failed to join team.' };
    }
}

export async function getTeamDetails(eventId: string) {
    try {
        const user = await requireAuth();
        
        // Find if user is a member or leader of any team for this event
        const team = await prisma.team.findFirst({
            where: {
                eventId,
                members: {
                    some: { userId: user.id }
                }
            },
            include: {
                members: {
                    orderBy: [
                        { role: 'asc' }, // LEADER usually comes first if alphanumeric (L vs M) or add specific sorting
                        { joinedAt: 'asc' }
                    ]
                }
            }
        });

        if (!team) return { success: false, error: 'Team not found.' };

        // Ensure LEADER is always first in the returned array
        const sortedMembers = [...team.members].sort((a, b) => {
            if (a.role === 'LEADER') return -1;
            if (b.role === 'LEADER') return 1;
            return 0;
        });

        return {
            success: true,
            data: {
                teamName: team.teamName,
                teamCode: team.teamCode,
                members: sortedMembers.map(m => ({
                    name: m.name,
                    id: m.rollNumber || '',
                    role: m.role
                }))
            }
        };
    } catch (error) {
        console.error('[getTeamDetails]', error);
        return { success: false, error: 'Failed to fetch team details.' };
    }
}
