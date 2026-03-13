'use server'

import prisma from '@/lib/prisma'
import { getAuthenticatedUser, type AuthUser } from '@/lib/auth-helpers'
import { ROLES } from '@/lib/permissions'
import { revalidateTeams } from '@/lib/revalidation'
import { executeAction } from '@/lib/api-utils'
import { RegistrationStatus, PaymentStatus, TeamRole, MemberStatus } from '@/lib/generated/client'

export interface MemberData {
    name: string;
    email?: string;
    phoneNumber?: string;
    studentId?: string;
    Section?: string;
    year?: string;
    role: 'Captain' | 'Vice Captain' | 'Member';
}

export interface TeamData {
    teamName: string;
    eventId: string;
    members: MemberData[];
}

export interface TeamActionResponse<T = unknown> {
    success?: boolean;
    error?: string;
    data?: T;
    count?: number;
}



// Roles authorized to manage teams
const TEAM_MANAGEMENT_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.SPORTS_ADMIN,
    ROLES.BRANCH_SPORTS_ADMIN,
    ROLES.HHO,
    ROLES.CLUB_COORDINATOR,
    ROLES.EVENT_COORDINATOR,
] as readonly string[];

/**
 * Verifies the caller is authenticated AND has a role authorized to manage teams.
 * Returns the authenticated user with role/branch/clubId for downstream scoping.
 */
async function checkTeamManagementAccess(): Promise<AuthUser> {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error('Unauthorized: Not authenticated');
    }
    if (!TEAM_MANAGEMENT_ROLES.includes(user.role)) {
        throw new Error('Unauthorized: Insufficient permissions to manage teams');
    }
    return user;
}

/**
 * For operations on existing teams, verifies the caller has scope over the team's event.
 * - SUPER_ADMIN: full access
 * - BRANCH_ADMIN / BRANCH_SPORTS_ADMIN: event creator must be in the same branch
 * - CLUB_COORDINATOR: event creator must be in the same club
 * - EVENT_COORDINATOR: must be assigned to the event
 * - SPORTS_ADMIN / HHO: full access within their category scope
 */
async function assertTeamScope(user: AuthUser, teamId: string): Promise<void> {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SPORTS_ADMIN || user.role === ROLES.HHO) {
        return; // full access
    }

    const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
            event: {
                select: {
                    id: true,
                    creatorId: true,
                    creator: { select: { branch: true, clubId: true } },
                    assignedCoordinators: { select: { id: true } },
                },
            },
        },
    });

    if (!team?.event) {
        throw new Error('Team or associated event not found');
    }

    const event = team.event;

    // Event creator always has access
    if (event.creatorId === user.id) return;

    // Branch-scoped roles
    if ((user.role === ROLES.BRANCH_ADMIN || user.role === ROLES.BRANCH_SPORTS_ADMIN) && user.branch) {
        if (event.creator?.branch === user.branch) return;
        throw new Error('Unauthorized: This team belongs to an event outside your branch');
    }

    // Club-scoped roles
    if (user.role === ROLES.CLUB_COORDINATOR && user.clubId) {
        if (event.creator?.clubId === user.clubId) return;
        throw new Error('Unauthorized: This team belongs to an event outside your club');
    }

    // Event Coordinator: must be assigned to the event
    if (user.role === ROLES.EVENT_COORDINATOR) {
        const isAssigned = event.assignedCoordinators.some((c: { id: string }) => c.id === user.id);
        if (isAssigned) return;
        throw new Error('Unauthorized: You are not assigned to this event');
    }

    throw new Error('Unauthorized: Insufficient scope for this team');
}

/**
 * Batch scope check for bulk operations.
 * Verifies the caller has scope over ALL teams' events.
 */
async function assertBulkTeamScope(user: AuthUser, teamIds: string[]): Promise<void> {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SPORTS_ADMIN || user.role === ROLES.HHO) {
        return;
    }

    const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: {
            id: true,
            event: {
                select: {
                    id: true,
                    creatorId: true,
                    creator: { select: { branch: true, clubId: true } },
                    assignedCoordinators: { select: { id: true } },
                },
            },
        },
    });

    for (const team of teams) {
        if (!team.event) {
            throw new Error(`Team ${team.id} has no associated event`);
        }
        const event = team.event;
        if (event.creatorId === user.id) continue;

        if ((user.role === ROLES.BRANCH_ADMIN || user.role === ROLES.BRANCH_SPORTS_ADMIN) && user.branch) {
            if (event.creator?.branch !== user.branch) {
                throw new Error('Unauthorized: One or more teams belong to events outside your branch');
            }
            continue;
        }
        if (user.role === ROLES.CLUB_COORDINATOR && user.clubId) {
            if (event.creator?.clubId !== user.clubId) {
                throw new Error('Unauthorized: One or more teams belong to events outside your club');
            }
            continue;
        }
        if (user.role === ROLES.EVENT_COORDINATOR) {
            const isAssigned = event.assignedCoordinators.some((c: { id: string }) => c.id === user.id);
            if (!isAssigned) {
                throw new Error('Unauthorized: You are not assigned to one or more of these events');
            }
            continue;
        }
        throw new Error('Unauthorized: Insufficient scope for bulk team operation');
    }
}

export async function createTeam(teamData: TeamData): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();

        // Validate basic requirements
        if (!teamData.teamName || !teamData.eventId || !teamData.members || teamData.members.length === 0) {
            throw new Error('Missing required team information');
        }

        const { teamName, eventId, members } = teamData;
        const captain = members.find(m => m.role === 'Captain');
        const viceCaptain = members.find(m => m.role === 'Vice Captain');

        if (!captain) throw new Error('Team must have a Captain');

        // Generate a unique team code
        const teamCode = `TEAM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        // Verify event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, price: true }
        });

        if (!event) throw new Error('Event not found');

        // Use transaction to create Team and TeamMembers
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Team
            const team = await tx.team.create({
                data: {
                    teamName,
                    teamCode,
                    eventId,
                    leaderId: user.id, // Creator is the leader/admin
                    leaderName: captain.name,
                    leaderEmail: captain.email || user.email || 'N/A', // Fallback to admin email if not provided? Or enforce email
                    leaderPhone: captain.phoneNumber || 'N/A',
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    amount: event.price || 0
                }
            });

            // 2. Create Members
            if (members && members.length > 0) {
                await tx.teamMember.createMany({
                    data: members.map(member => ({
                        teamId: team.id,
                        name: member.name, // Mapping from frontend 'name'
                        email: member.email || `temp-${Date.now()}-${Math.random()}@example.com`, // Frontend might not provide email for all members?
                        phone: member.phoneNumber || 'N/A',
                        rollNumber: member.studentId || 'N/A', // Mapping frontend studentId to rollNumber
                        department: member.Section || 'N/A', // Or wherever department comes from
                        year: member.year || 'N/A',
                        role: member.role === 'Captain' ? TeamRole.LEADER : TeamRole.MEMBER,
                        status: MemberStatus.ACCEPTED
                    }))
                });
            }

            return team;
        });

        await revalidateTeams();
        return { success: true, data: result } as TeamActionResponse;
    }, 'createTeam');
}

export async function updateTeamStatus(teamId: string, newStatus: string): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();
        await assertTeamScope(user, teamId);

        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                status: newStatus as RegistrationStatus,
                // If confirmed, lock the team editing?
                isLocked: newStatus === 'CONFIRMED' || newStatus === 'ATTENDED'
            },
            include: { registration: true }
        });

        // Also update the linked registration status if it exists
        if (team.registration) {
            await prisma.registration.update({
                where: { id: team.registration.id },
                data: { status: newStatus as RegistrationStatus }
            });
        }

        await revalidateTeams();
        return { success: true, data: team } as TeamActionResponse;
    }, 'updateTeamStatus');
}

export async function deleteTeam(teamId: string): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();
        await assertTeamScope(user, teamId);

        await prisma.$transaction(async (tx) => {
            // 1. Get team to find registration
            const team = await tx.team.findUnique({
                where: { id: teamId },
                include: { registration: true }
            });

            if (!team) throw new Error('Team not found');

            // 2. Delete linked registration if exists
            if (team.registration) {
                await tx.registration.delete({
                    where: { id: team.registration.id }
                });
            }

            // 3. Delete members
            await tx.teamMember.deleteMany({
                where: { teamId: teamId }
            });

            // 4. Delete the team
            await tx.team.delete({
                where: { id: teamId }
            });
        });

        await revalidateTeams();
        return { success: true } as TeamActionResponse;
    }, 'deleteTeam');
}

export async function updateTeamPaymentStatus(teamId: string, paymentStatus: string, transactionId: string | null = null): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();
        await assertTeamScope(user, teamId);

        const data: {
            paymentStatus: PaymentStatus;
            transactionId: string | null;
            status?: RegistrationStatus;
            isLocked?: boolean;
        } = {
            paymentStatus: paymentStatus as PaymentStatus,
            transactionId
        };

        // If paid, maybe auto-confirm?
        if (paymentStatus === 'PAID') {
            data.status = RegistrationStatus.CONFIRMED;
            data.isLocked = true;
        }

        const team = await prisma.team.update({
            where: { id: teamId },
            data,
            include: { registration: true }
        });

        if (team.registration) {
            const regData: {
                paymentStatus: PaymentStatus;
                transactionId?: string;
                status?: RegistrationStatus;
            } = { paymentStatus: paymentStatus as PaymentStatus };
            if (transactionId) regData.transactionId = transactionId;
            if (paymentStatus === 'PAID') regData.status = RegistrationStatus.CONFIRMED;

            await prisma.registration.update({
                where: { id: team.registration.id },
                data: regData
            });
        }

        await revalidateTeams();
        return { success: true, data: team } as TeamActionResponse;
    }, 'updateTeamPaymentStatus');
}

export async function bulkUpdateTeamStatus(teamIds: string[], newStatus: string): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();
        await assertBulkTeamScope(user, teamIds);

        // Update all teams
        await prisma.team.updateMany({
            where: { id: { in: teamIds } },
            data: {
                status: newStatus as RegistrationStatus,
                isLocked: newStatus === 'CONFIRMED' || newStatus === 'ATTENDED'
            }
        });

        // Update linked registrations
        const teams = await prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: { id: true, registration: { select: { id: true } } }
        });

        const registrationIds = teams
            .map(t => t.registration?.id)
            .filter((id): id is string => id !== undefined && id !== null);

        if (registrationIds.length > 0) {
            await prisma.registration.updateMany({
                where: { id: { in: registrationIds } },
                data: { status: newStatus as RegistrationStatus }
            });
        }

        await revalidateTeams();
        return { success: true, count: teamIds.length } as TeamActionResponse;
    }, 'bulkUpdateTeamStatus');
}

export async function bulkDeleteTeams(teamIds: string[]): Promise<TeamActionResponse> {
    return executeAction(async () => {
        const user = await checkTeamManagementAccess();
        await assertBulkTeamScope(user, teamIds);

        await prisma.$transaction(async (tx) => {
            // Get registrations to delete
            const teams = await tx.team.findMany({
                where: { id: { in: teamIds } },
                select: { id: true, registration: { select: { id: true } } }
            });

            const registrationIds = teams
                .map(t => t.registration?.id)
                .filter((id): id is string => id !== undefined && id !== null);

            // Delete registrations
            if (registrationIds.length > 0) {
                await tx.registration.deleteMany({
                    where: { id: { in: registrationIds } }
                });
            }

            // Delete members
            await tx.teamMember.deleteMany({
                where: { teamId: { in: teamIds } }
            });

            // Delete teams
            await tx.team.deleteMany({
                where: { id: { in: teamIds } }
            });
        });

        await revalidateTeams();
        return { success: true, count: teamIds.length } as TeamActionResponse;
    }, 'bulkDeleteTeams');
}
