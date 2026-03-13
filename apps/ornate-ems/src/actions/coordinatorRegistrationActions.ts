'use server'

import prisma from '@/lib/prisma'
import { executeAction } from '@/lib/api-utils'
import { createAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { MemberStatus, RegistrationStatus, TeamRole, UserRole } from '@/lib/generated/client'
import { revalidateRegistrations } from '@/lib/revalidation'

interface TeamMemberInput {
    name: string;
    rollNumber: string;
    email?: string;
    phone?: string;
    branch?: string;
    department?: string;
    year?: string;
    section?: string;
    role: 'Captain' | 'Vice Captain' | 'Member';
}

interface SpotTeamRegistrationInput {
    eventId: string;
    teamName: string;
    members: TeamMemberInput[];
    amount?: number | string;
    paymentStatus?: string;
}

interface SpotIndividualRegistrationInput {
    eventId: string;
    studentName: string;
    studentId: string;
    email?: string;
    phone?: string;
    year?: string;
    branch?: string;
    section?: string;
    amount?: number | string;
    paymentStatus?: string;
}

interface RegistrationResponse {
    success?: boolean;
    error?: string;
    message?: string;
}

interface UpdateSpotTeamRegistrationInput {
    registrationId: string;
    eventId: string;
    teamName: string;
    members: TeamMemberInput[];
}

interface UpdateSpotRegistrationInput {
    registrationId: string;
    eventId: string;
    studentName: string;
    studentId: string;
    email?: string;
    phone?: string;
    year?: string;
    amount?: number | string;
    paymentStatus?: string;
    status?: string;
    teamName?: string;
}

const ALLOWED_ROLES = ['EVENT_COORDINATOR', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'HHO'];

function canAccessEvent(
    user: { id: string; role: string; branch?: string | null },
    event: { creator?: { branch: string | null } | null; assignedCoordinators?: Array<{ id: string }> }
) {
    if (['SUPER_ADMIN', 'BRANCH_ADMIN', 'HHO'].includes(user.role)) {
        return true;
    }

    const isAssigned = (event.assignedCoordinators || []).some((coordinator) => coordinator.id === user.id);
    const isBranchMatch = !!user.branch && event.creator?.branch === user.branch;

    if (user.role === 'EVENT_COORDINATOR') return isAssigned || isBranchMatch;

    return false;
}

async function findOrCreateSpotUser(member: {
    name: string;
    rollNumber?: string;
    email?: string;
    phone?: string;
    branch?: string;
    year?: string;
}) {
    const fallbackLocalPart = (member.rollNumber || `spot-${Date.now()}`).trim().toLowerCase();
    const email = member.email?.trim() || `${fallbackLocalPart}@spot.local`;

    return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            name: member.name,
            email,
            password: 'spot_registration',
            role: UserRole.STUDENT,
            branch: member.branch || null,
            currentYear: member.year || null,
            phone: member.phone || null,
        },
    });
}

function mapTeamRole(role: TeamMemberInput['role']): TeamRole {
    if (role === 'Captain') return TeamRole.LEADER;
    if (role === 'Vice Captain') return TeamRole.VICE_CAPTAIN;
    return TeamRole.MEMBER;
}

function isTeamEventType(eventType: string | null | undefined) {
    const normalized = String(eventType || '').trim().toLowerCase();
    return normalized === 'team' || normalized.includes('team');
}

export async function createCoordinatorSpotTeamRegistration(
    data: SpotTeamRegistrationInput
): Promise<RegistrationResponse> {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const eventId = data.eventId?.trim();
        if (!eventId) return { error: 'Event ID is required' };

        const { teamName, members } = data;
        const normalizedTeamName = teamName?.trim() || '';
        if (!normalizedTeamName) return { error: 'Team name is required' };
        if (!members || members.length === 0) return { error: 'At least one team member is required' };

        const captainCount = members.filter((member) => member.role === 'Captain').length;
        if (captainCount !== 1) return { error: 'Exactly one captain is required' };

        const normalizedIds = members
            .map((member) => (member.rollNumber || '').trim().toUpperCase())
            .filter(Boolean);
        const uniqueIds = new Set(normalizedIds);
        if (normalizedIds.length !== uniqueIds.size) {
            return { error: 'Duplicate student IDs are not allowed in team members' };
        }

        const captain = members.find((member) => member.role === 'Captain') || members[0];
        if (!captain) return { error: 'Team must include a captain' };

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                eventType: true,
                teamSizeMin: true,
                teamSizeMax: true,
                maxCapacity: true,
                creator: { select: { branch: true } },
                assignedCoordinators: { select: { id: true } },
            },
        });

        if (!event) return { error: 'Event not found' };
        if (!canAccessEvent(user, event)) return { error: 'Access denied: You are not assigned to this event' };

        if (!isTeamEventType(event.eventType)) return { error: 'This event supports only individual registrations' };
        if (event.teamSizeMin && members.length < event.teamSizeMin) {
            return { error: `Minimum ${event.teamSizeMin} players required` };
        }
        if (event.teamSizeMax && members.length > event.teamSizeMax) {
            return { error: `Maximum ${event.teamSizeMax} players allowed` };
        }

        const leaderUser = await findOrCreateSpotUser({
            name: captain.name,
            rollNumber: captain.rollNumber,
            ...(captain.email ? { email: captain.email } : {}),
            ...(captain.phone ? { phone: captain.phone } : {}),
            ...(captain.branch || captain.department ? { branch: captain.branch || captain.department } : {}),
            ...(captain.year ? { year: captain.year } : {}),
        });

        const teamCode = `EVT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        await prisma.$transaction(async (tx) => {
            const activeCount = await tx.registration.count({
                where: {
                    eventId: event.id,
                    status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED] }
                }
            });

            const registrationStatus = activeCount >= (event.maxCapacity || 100)
                ? RegistrationStatus.WAITLISTED
                : RegistrationStatus.CONFIRMED;

            const registration = await tx.registration.create({
                data: {
                    eventId: event.id,
                    userId: null,
                    studentName: captain.name,
                    studentId: (captain.rollNumber || '').trim() || `TEAM-${Date.now()}`,
                    status: registrationStatus,
                    paymentStatus: registrationStatus === RegistrationStatus.WAITLISTED ? 'PENDING' : 'PAID',
                    amount: Number(data.amount || 0),
                    email: captain.email?.trim() || null,
                    phone: captain.phone?.trim() || null,
                    branch: captain.branch?.trim() || captain.department?.trim() || null,
                    year: captain.year?.trim() || null,
                    section: captain.section?.trim() || null,
                },
            });

            const team = await tx.team.create({
                data: {
                    teamName: normalizedTeamName,
                    teamCode,
                    eventId: event.id,
                    leaderId: leaderUser.id,
                    leaderName: captain.name,
                    leaderEmail: leaderUser.email,
                    leaderPhone: captain.phone || null,
                    status: RegistrationStatus.CONFIRMED,
                    paymentStatus: 'PAID',
                    amount: Number(data.amount || 0),
                    registrationId: registration.id,
                    isLocked: false,
                },
            });

            await tx.teamMember.createMany({
                data: members.map((member, index) => ({
                    teamId: team.id,
                    userId: null,
                    name: member.name,
                    email: member.email?.trim() || `temp-${teamCode}-${index}@spot.local`,
                    phone: member.phone?.trim() || null,
                    rollNumber: member.rollNumber?.trim() || null,
                    department: member.branch?.trim() || member.department?.trim() || null,
                    year: member.year?.trim() || null,
                    section: member.section?.trim() || null,
                    role: mapTeamRole(member.role),
                    status: MemberStatus.ACCEPTED,
                })),
            });
        });

        await createAuditLog({
            action: 'CREATE_SPOT_TEAM_EVENT_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: event.id,
            performedBy: user.id,
            metadata: { eventId: event.id, teamName: normalizedTeamName, memberCount: members.length },
        });

        await revalidateRegistrations();
        return { success: true, message: `Team "${normalizedTeamName}" registered successfully` };
    }, 'createCoordinatorSpotTeamRegistration');
}

export async function createCoordinatorSpotIndividualRegistration(
    data: SpotIndividualRegistrationInput
): Promise<RegistrationResponse> {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const eventId = data.eventId?.trim();
        if (!eventId) return { error: 'Event ID is required' };

        const { studentName, studentId } = data;
        const normalizedStudentName = studentName?.trim() || '';
        const normalizedStudentId = studentId?.trim() || '';
        if (!normalizedStudentName) return { error: 'Student name is required' };
        if (!normalizedStudentId) return { error: 'Student ID / Roll Number is required' };

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                maxCapacity: true,
                creator: { select: { branch: true } },
                assignedCoordinators: { select: { id: true } },
            },
        });

        if (!event) return { error: 'Event not found' };
        if (!canAccessEvent(user, event)) return { error: 'Access denied: You are not assigned to this event' };

        const existingRegistration = await prisma.registration.findFirst({
            where: { eventId: event.id, studentId: normalizedStudentId },
            select: { id: true },
        });
        if (existingRegistration) return { error: `Student ${normalizedStudentId} is already registered for this event` };

        const activeCount = await prisma.registration.count({
            where: {
                eventId: event.id,
                status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED] }
            }
        });

        const registrationStatus = activeCount >= (event.maxCapacity || 100)
            ? RegistrationStatus.WAITLISTED
            : RegistrationStatus.CONFIRMED;

        const registration = await prisma.registration.create({
            data: {
                eventId: event.id,
                userId: null,
                studentName: normalizedStudentName,
                studentId: normalizedStudentId,
                status: registrationStatus,
                paymentStatus: registrationStatus === RegistrationStatus.WAITLISTED ? 'PENDING' : 'PAID',
                amount: Number(data.amount || 0),
                email: data.email?.trim() || null,
                phone: data.phone?.trim() || null,
                branch: data.branch?.trim() || null,
                year: data.year?.trim() || null,
                section: data.section?.trim() || null,
            },
        });

        await createAuditLog({
            action: 'CREATE_SPOT_INDIVIDUAL_EVENT_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: registration.id,
            performedBy: user.id,
            metadata: { eventId: event.id, studentId: normalizedStudentId },
        });

        await revalidateRegistrations();
        return { success: true, message: `${normalizedStudentName} registered successfully` };
    }, 'createCoordinatorSpotIndividualRegistration');
}

export async function deleteCoordinatorRegistration(registrationId: string): Promise<RegistrationResponse> {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const normalizedRegistrationId = registrationId?.trim();
        if (!normalizedRegistrationId) return { error: 'Registration ID is required' };

        const registration = await prisma.registration.findUnique({
            where: { id: normalizedRegistrationId },
            select: {
                id: true,
                eventId: true,
                studentId: true,
                event: {
                    select: {
                        id: true,
                        creator: { select: { branch: true } },
                        assignedCoordinators: { select: { id: true } },
                    },
                },
                team: { select: { id: true } },
            },
        });

        if (!registration) return { error: 'Registration not found' };
        if (!registration.event) return { error: 'Linked event not found for this registration' };
        if (!canAccessEvent(user, registration.event)) {
            return { error: 'Access denied: You are not assigned to this event' };
        }

        await prisma.$transaction(async (tx) => {
            if (registration.team?.id) {
                await tx.team.delete({ where: { id: registration.team.id } });
            }
            await tx.registration.delete({ where: { id: normalizedRegistrationId } });
        });

        await createAuditLog({
            action: 'DELETE_SPOT_EVENT_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: normalizedRegistrationId,
            performedBy: user.id,
            metadata: { eventId: registration.eventId, studentId: registration.studentId },
        });

        await revalidateRegistrations();
        return { success: true, message: 'Registration deleted successfully' };
    }, 'deleteCoordinatorRegistration');
}

export async function updateCoordinatorSpotTeamRegistration(
    data: UpdateSpotTeamRegistrationInput
): Promise<RegistrationResponse> {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const { registrationId, eventId, teamName, members } = data;
        const normalizedRegistrationId = registrationId?.trim();
        const normalizedEventId = eventId?.trim();

        if (!normalizedRegistrationId) return { error: 'Registration ID is required' };
        if (!normalizedEventId) return { error: 'Event ID is required' };
        if (!teamName?.trim()) return { error: 'Team name is required' };
        if (!members || members.length === 0) return { error: 'At least one team member is required' };

        const captainCount = members.filter((member) => member.role === 'Captain').length;
        if (captainCount !== 1) return { error: 'Exactly one captain is required' };

        const normalizedIds = members
            .map((member) => (member.rollNumber || '').trim().toUpperCase())
            .filter(Boolean);
        const uniqueIds = new Set(normalizedIds);
        if (normalizedIds.length !== uniqueIds.size) {
            return { error: 'Duplicate student IDs are not allowed in team members' };
        }

        const captain = members.find((member) => member.role === 'Captain') || members[0];
        if (!captain) return { error: 'Team must include a captain' };

        const [registration, event] = await Promise.all([
            prisma.registration.findUnique({
                where: { id: normalizedRegistrationId },
                select: {
                    id: true,
                    studentId: true,
                    email: true,
                    event: {
                        select: {
                            id: true,
                            creator: { select: { branch: true } },
                            assignedCoordinators: { select: { id: true } },
                        },
                    },
                    team: {
                        select: {
                            id: true,
                        },
                    },
                },
            }),
            prisma.event.findUnique({
                where: { id: normalizedEventId },
                select: {
                    id: true,
                    title: true,
                    eventType: true,
                    teamSizeMin: true,
                    teamSizeMax: true,
                    creator: { select: { branch: true } },
                    assignedCoordinators: { select: { id: true } },
                },
            }),
        ]);

        if (!registration) return { error: 'Registration not found' };
        if (!registration.team?.id) return { error: 'Linked team not found for this registration' };
        if (!event) return { error: 'Event not found' };

        if (!canAccessEvent(user, event)) {
            return { error: 'Access denied: You are not assigned to this event' };
        }

        if (!isTeamEventType(event.eventType)) return { error: 'This event supports only individual registrations' };
        if (event.teamSizeMin && members.length < event.teamSizeMin) {
            return { error: `Minimum ${event.teamSizeMin} players required` };
        }
        if (event.teamSizeMax && members.length > event.teamSizeMax) {
            return { error: `Maximum ${event.teamSizeMax} players allowed` };
        }

        const captainStudentId = (captain.rollNumber || '').trim() || registration.studentId;
        const duplicateRegistration = await prisma.registration.findFirst({
            where: {
                eventId: normalizedEventId,
                studentId: captainStudentId,
                id: { not: normalizedRegistrationId },
            },
            select: { id: true },
        });
        if (duplicateRegistration) return { error: `Captain ${captainStudentId} is already registered for this event` };

        const teamId = registration.team.id;

        await prisma.$transaction(async (tx) => {
            await tx.team.update({
                where: { id: teamId },
                data: {
                    teamName: teamName.trim(),
                    leaderName: captain.name,
                    leaderEmail: captain.email?.trim() || registration.email?.trim() || `temp-${teamId}@spot.local`,
                    leaderPhone: captain.phone?.trim() || null,
                },
            });

            await tx.registration.update({
                where: { id: normalizedRegistrationId },
                data: {
                    eventId: normalizedEventId,
                    studentName: captain.name,
                    studentId: captainStudentId,
                    email: captain.email?.trim() || null,
                    phone: captain.phone?.trim() || null,
                    branch: captain.branch?.trim() || captain.department?.trim() || null,
                    year: captain.year?.trim() || null,
                    section: captain.section?.trim() || null,
                },
            });

            await tx.teamMember.deleteMany({ where: { teamId } });

            await tx.teamMember.createMany({
                data: members.map((member, index) => ({
                    teamId,
                    userId: null,
                    name: member.name,
                    email: member.email?.trim() || `temp-${teamId}-${index}@spot.local`,
                    phone: member.phone?.trim() || null,
                    rollNumber: member.rollNumber?.trim() || null,
                    department: member.branch?.trim() || member.department?.trim() || null,
                    year: member.year?.trim() || null,
                    section: member.section?.trim() || null,
                    role: mapTeamRole(member.role),
                    status: MemberStatus.ACCEPTED,
                })),
            });
        });

        await createAuditLog({
            action: 'UPDATE_SPOT_TEAM_EVENT_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: normalizedRegistrationId,
            performedBy: user.id,
            metadata: {
                eventId: normalizedEventId,
                eventTitle: event.title,
                teamName,
                memberCount: members.length,
            },
        });

        await revalidateRegistrations();
        return { success: true, message: `Team "${teamName}" updated successfully` };
    }, 'updateCoordinatorSpotTeamRegistration');
}

export async function updateCoordinatorSpotRegistration(
    data: UpdateSpotRegistrationInput
): Promise<RegistrationResponse> {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const normalizedRegistrationId = data.registrationId?.trim();
        const normalizedEventId = data.eventId?.trim();
        const normalizedStudentName = data.studentName?.trim();
        const normalizedStudentId = data.studentId?.trim().toUpperCase();

        if (!normalizedRegistrationId) return { error: 'Registration ID is required' };
        if (!normalizedEventId) return { error: 'Event ID is required' };
        if (!normalizedStudentName) return { error: 'Student name is required' };
        if (!normalizedStudentId) return { error: 'Student ID is required' };

        const registration = await prisma.registration.findUnique({
            where: { id: normalizedRegistrationId },
            select: {
                id: true,
                eventId: true,
                team: { select: { id: true, teamName: true } },
                event: {
                    select: {
                        id: true,
                        creator: { select: { branch: true } },
                        assignedCoordinators: { select: { id: true } },
                    },
                },
            },
        });

        if (!registration) return { error: 'Registration not found' };
        if (!registration.event) return { error: 'Linked event not found for this registration' };
        if (!canAccessEvent(user, registration.event)) {
            return { error: 'Access denied: You are not assigned to this event' };
        }

        const duplicateRegistration = await prisma.registration.findFirst({
            where: {
                eventId: normalizedEventId,
                studentId: normalizedStudentId,
                id: { not: normalizedRegistrationId },
            },
            select: { id: true },
        });
        if (duplicateRegistration) return { error: `Student ID ${normalizedStudentId} is already registered for this event` };

        await prisma.$transaction(async (tx) => {
            const normalizedStatus = data.status?.trim().toUpperCase();
            const registrationStatus = normalizedStatus === 'CONFIRMED'
                ? RegistrationStatus.CONFIRMED
                : normalizedStatus === 'WAITLISTED'
                    ? RegistrationStatus.WAITLISTED
                    : undefined;

            const registrationUpdateData: any = {
                eventId: normalizedEventId,
                studentName: normalizedStudentName,
                studentId: normalizedStudentId,
                email: data.email?.trim() || null,
                phone: data.phone?.trim() || null,
                year: data.year?.trim() || null,
                amount: Number(data.amount || 0),
                paymentStatus: (data.paymentStatus as any) || undefined,
            };
            if (registrationStatus) {
                registrationUpdateData.status = registrationStatus;
            }

            await tx.registration.update({
                where: { id: normalizedRegistrationId },
                data: registrationUpdateData,
            });

            if (registration.team?.id) {
                const teamUpdateData: any = {
                    teamName: data.teamName?.trim() || registration.team.teamName,
                    leaderName: normalizedStudentName,
                    leaderEmail: data.email?.trim() || `${normalizedStudentId.toLowerCase()}@spot.local`,
                    leaderPhone: data.phone?.trim() || null,
                };
                if (registrationStatus) {
                    teamUpdateData.status = registrationStatus;
                }

                await tx.team.update({
                    where: { id: registration.team.id },
                    data: teamUpdateData,
                });
            }
        });

        await createAuditLog({
            action: 'UPDATE_SPOT_EVENT_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: normalizedRegistrationId,
            performedBy: user.id,
            metadata: {
                eventId: normalizedEventId,
                studentId: normalizedStudentId,
                teamName: data.teamName || null,
            },
        });

        await revalidateRegistrations();
        return { success: true, message: 'Registration updated successfully' };
    }, 'updateCoordinatorSpotRegistration');
}

export async function getRecentSpotRegistrationsV2(eventId: string) {
    const user = await getAuthenticatedUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return { success: false, data: [], registrations: [], error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const normalizedEventId = eventId?.trim();
        if (!normalizedEventId) {
            return { success: false, data: [], registrations: [], error: 'Event ID is required' };
        }

        const event = await prisma.event.findUnique({
            where: { id: normalizedEventId },
            select: {
                id: true,
                creator: { select: { branch: true } },
                assignedCoordinators: { select: { id: true } },
            },
        });

        if (!event) {
            return { success: false, data: [], registrations: [], error: 'Event not found' };
        }

        if (!canAccessEvent(user, event)) {
            return { success: false, data: [], registrations: [], error: 'Access denied' };
        }

        const eventRegistrations = await prisma.registration.findMany({
            where: { eventId: normalizedEventId },
            orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' },
            ],
            select: {
                id: true,
                eventId: true,
                studentName: true,
                studentId: true,
                status: true,
                paymentStatus: true,
                amount: true,
                email: true,
                phone: true,
                branch: true,
                year: true,
                section: true,
                createdAt: true,
                team: {
                    select: {
                        id: true,
                        teamName: true,
                        members: {
                            select: {
                                id: true,
                                name: true,
                                rollNumber: true,
                                email: true,
                                phone: true,
                                department: true,
                                year: true,
                                section: true,
                                role: true,
                            },
                            orderBy: [
                                {
                                    joinedAt: 'asc',
                                },
                                {
                                    id: 'asc',
                                },
                            ],
                        },
                    },
                },
            },
        });

        const mapped = eventRegistrations.map((registration) => ({
            ...registration,
            team: registration.team
                ? {
                    id: registration.team.id,
                    teamName: registration.team.teamName,
                    members: registration.team.members,
                }
                : null,
        }));

        return { success: true, data: mapped, registrations: mapped };
    }, 'getRecentSpotRegistrationsV2');
}

export async function getRecentSpotRegistrations(eventId: string) {
    return getRecentSpotRegistrationsV2(eventId);
}
