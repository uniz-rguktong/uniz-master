'use server'

import prisma from '@/lib/prisma'
import { executeAction } from '@/lib/api-utils'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { assertPermission, type User } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { revalidateSportRegistrationData } from '@/lib/revalidation'
import { MemberStatus, RegistrationStatus, TeamRole, UserRole, type SportRegistration } from '@/lib/generated/client'
import { SportRegistrationSchema } from '@/lib/schemas/sportSchemas'
import { sendEmail, getSportRegistrationEmailTemplate, getIndividualSportRegistrationEmailTemplate } from '@/lib/email'

interface CreateSportRegistrationInput {
    sportId: string;
    studentName: string;
    studentId: string;
    email?: string;
    phone?: string;
    branch?: string;
    year?: string;
    section?: string;
}

interface SportTeamMemberInput {
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

export interface SportOfflineTeamRegistrationInput {
    sportId: string;
    teamName: string;
    members: SportTeamMemberInput[];
}

export interface UpdateSportOfflineTeamRegistrationInput {
    registrationId: string;
    sportId: string;
    teamName: string;
    members: SportTeamMemberInput[];
}

function normalizeStatus(status: string): RegistrationStatus {
    const raw = status.toUpperCase();
    if (raw === 'CONFIRMED') return RegistrationStatus.CONFIRMED;
    if (raw === 'WAITLISTED') return RegistrationStatus.WAITLISTED;
    if (raw === 'ATTENDED') return RegistrationStatus.ATTENDED;
    if (raw === 'CANCELLED') return RegistrationStatus.CANCELLED;
    if (raw === 'REJECTED') return RegistrationStatus.REJECTED;
    return RegistrationStatus.PENDING;
}

export async function createSportRegistration(input: CreateSportRegistrationInput) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const parsed = SportRegistrationSchema.parse(input);

        const existing = await prisma.sportRegistration.findFirst({
            where: { sportId: parsed.sportId, studentId: parsed.studentId },
            select: { id: true },
        });
        if (existing) throw new Error('Student already registered for this sport');

        const registration = await prisma.sportRegistration.create({
            data: {
                sportId: parsed.sportId,
                studentName: parsed.studentName,
                studentId: parsed.studentId,
                email: parsed.email || null,
                phone: parsed.phone || null,
                branch: parsed.branch || null,
                year: parsed.year || null,
                section: parsed.section || null,
                status: normalizeStatus(parsed.status),
            },
        });

        // Send confirmation physical email
        if (registration.email && !registration.email.endsWith('@offline.local')) {
            try {
                const sport = await prisma.sport.findUnique({
                    where: { id: parsed.sportId },
                    select: { name: true }
                });

                if (sport) {
                    const emailHtml = getIndividualSportRegistrationEmailTemplate(
                        registration.studentName,
                        sport.name,
                        registration.studentId
                    );

                    await sendEmail({
                        to: registration.email,
                        subject: `Registration Confirmed: ${sport.name}`,
                        html: emailHtml
                    });
                }
            } catch (emailError) {
                console.error('Failed to send individual registration email:', emailError);
            }
        }

        await createAuditLog({
            action: 'CREATE_SPORT_REGISTRATION',
            entityType: 'SPORT_REGISTRATION',
            entityId: registration.id,
            performedBy: user.id,
            metadata: { sportId: parsed.sportId, studentId: parsed.studentId },
        });

        await revalidateSportRegistrationData();
        return { success: true, data: registration };
    }, 'createSportRegistration') as any;
}

export async function bulkCreateSportRegistrations(sportId: string, registrations: CreateSportRegistrationInput[]) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const parsedRows = registrations.map((row) =>
            SportRegistrationSchema.parse({ ...row, sportId })
        );

        const created = await prisma.sportRegistration.createMany({
            data: parsedRows.map((row) => ({
                sportId: row.sportId,
                studentName: row.studentName,
                studentId: row.studentId,
                email: row.email || null,
                phone: row.phone || null,
                branch: row.branch || null,
                year: row.year || null,
                section: row.section || null,
                status: normalizeStatus(row.status),
            })),
            skipDuplicates: true,
        });

        await createAuditLog({
            action: 'BULK_CREATE_SPORT_REGISTRATIONS',
            entityType: 'SPORT_REGISTRATION',
            entityId: sportId,
            performedBy: user.id,
            metadata: { sportId, count: created.count },
        });

        await revalidateSportRegistrationData();
        return { success: true, data: { createdCount: created.count } };
    }, 'bulkCreateSportRegistrations') as any;
}

export async function getSportRegistrations(sportId: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const registrations = await prisma.sportRegistration.findMany({
            where: { sportId },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: registrations };
    }, 'getSportRegistrations') as any;
}

export async function updateSportRegistrationStatus(registrationId: string, status: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const updated = await prisma.sportRegistration.update({
            where: { id: registrationId },
            data: { status: normalizeStatus(status) },
        });

        await createAuditLog({
            action: 'UPDATE_SPORT_REGISTRATION_STATUS',
            entityType: 'SPORT_REGISTRATION',
            entityId: registrationId,
            performedBy: user.id,
            metadata: { status: normalizeStatus(status) },
        });

        await revalidateSportRegistrationData();
        return { success: true, data: updated };
    }, 'updateSportRegistrationStatus') as any;
}

export async function deleteSportRegistration(registrationId: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const registration = await prisma.sportRegistration.findUnique({
            where: { id: registrationId },
            select: { id: true, sportId: true, studentId: true },
        });
        if (!registration) throw new Error('Registration not found');

        await prisma.sportRegistration.delete({ where: { id: registrationId } });

        await createAuditLog({
            action: 'DELETE_SPORT_REGISTRATION',
            entityType: 'SPORT_REGISTRATION',
            entityId: registrationId,
            performedBy: user.id,
            metadata: { sportId: registration.sportId, studentId: registration.studentId },
        });

        await revalidateSportRegistrationData();
        return { success: true };
    }, 'deleteSportRegistration') as any;
}

export async function getSportRegistrationStats(sportId: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const [total, byStatus, byBranch] = await Promise.all([
            prisma.sportRegistration.count({ where: { sportId } }),
            prisma.sportRegistration.groupBy({ by: ['status'], where: { sportId }, _count: { _all: true } }),
            prisma.sportRegistration.groupBy({ by: ['branch'], where: { sportId }, _count: { _all: true } }),
        ]);

        return {
            success: true,
            data: {
                total,
                byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
                byBranch: byBranch.map((row) => ({ branch: row.branch || 'N/A', count: row._count._all })),
            },
        };
    }, 'getSportRegistrationStats') as any;
}

// ────────────────────────────────────────────────────────────
// Sport Offline Team Registration (for Sports Admin)
// ────────────────────────────────────────────────────────────

function mapTeamRole(role: SportTeamMemberInput['role']): TeamRole {
    if (role === 'Captain') return TeamRole.LEADER;
    if (role === 'Vice Captain') return TeamRole.VICE_CAPTAIN;
    return TeamRole.MEMBER;
}

async function findOrCreateOfflineUser(member: {
    name: string;
    rollNumber?: string;
    email?: string;
    phone?: string;
    branch?: string;
    year?: string;
}) {
    const fallbackLocalPart = (member.rollNumber || `offline-${Date.now()}`).trim().toLowerCase();
    const email = member.email?.trim() || `${fallbackLocalPart}@offline.local`;

    return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            name: member.name,
            email,
            password: 'offline_registration',
            role: UserRole.STUDENT,
            branch: member.branch || null,
            currentYear: member.year || null,
            phone: member.phone || null,
        },
    });
}

export async function createSportOfflineTeamRegistration(
    data: SportOfflineTeamRegistrationInput
) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const { sportId, teamName, members } = data;
        const normalizedTeamName = teamName?.trim() || '';
        if (!sportId?.trim()) throw new Error('Sport ID is required');
        if (!normalizedTeamName) throw new Error('Team name is required');
        if (!members || members.length === 0) throw new Error('At least one team member is required');

        const captainCount = members.filter((m) => m.role === 'Captain').length;
        if (captainCount !== 1) throw new Error('Exactly one captain is required');

        const normalizedIds = members.map((m) => (m.rollNumber || '').trim().toUpperCase()).filter(Boolean);
        const uniqueIds = new Set(normalizedIds);
        if (normalizedIds.length !== uniqueIds.size) throw new Error('Duplicate student IDs are not allowed');

        const captain = members.find((m) => m.role === 'Captain') || members[0];
        if (!captain) throw new Error('Team must include a captain');

        const sport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: { id: true, name: true, category: true, minPlayersPerTeam: true, maxPlayersPerTeam: true },
        });
        if (!sport) throw new Error('Sport not found');
        if (sport.category !== 'TEAM') throw new Error('This sport supports only individual registrations');
        if (sport.minPlayersPerTeam && members.length < sport.minPlayersPerTeam) {
            throw new Error(`Minimum ${sport.minPlayersPerTeam} players required`);
        }
        if (sport.maxPlayersPerTeam && members.length > sport.maxPlayersPerTeam) {
            throw new Error(`Maximum ${sport.maxPlayersPerTeam} players allowed`);
        }

        const captainStudentId = (captain.rollNumber || '').trim() || `TEAM-${Date.now()}`;
        const existing = await prisma.sportRegistration.findFirst({
            where: { sportId, studentId: captainStudentId },
            select: { id: true },
        });
        if (existing) throw new Error(`Captain ${captainStudentId} is already registered for this sport`);

        const leaderUser = await findOrCreateOfflineUser({
            name: captain.name,
            rollNumber: captain.rollNumber,
            ...(captain.email ? { email: captain.email } : {}),
            ...(captain.phone ? { phone: captain.phone } : {}),
            ...(captain.branch || captain.department ? { branch: captain.branch || captain.department } : {}),
            ...(captain.year ? { year: captain.year } : {}),
        });

        const teamCode = `SPT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        const result = await prisma.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: {
                    teamName: normalizedTeamName,
                    teamCode,
                    eventId: null,
                    leaderId: leaderUser.id,
                    leaderName: captain.name,
                    leaderEmail: leaderUser.email,
                    leaderPhone: captain.phone || null,
                    status: RegistrationStatus.CONFIRMED,
                    paymentStatus: 'PAID',
                    amount: 0,
                    isLocked: false,
                },
            });

            await tx.sportTeam.create({ data: { sportId, teamId: team.id } });

            await tx.teamMember.createMany({
                data: members.map((member, index) => ({
                    teamId: team.id,
                    userId: null,
                    name: member.name,
                    email: member.email?.trim() || `temp-${teamCode}-${index}@offline.local`,
                    phone: member.phone?.trim() || null,
                    rollNumber: member.rollNumber?.trim() || null,
                    department: member.branch?.trim() || member.department?.trim() || null,
                    year: member.year?.trim() || null,
                    section: member.section?.trim() || null,
                    role: mapTeamRole(member.role),
                    status: MemberStatus.ACCEPTED,
                })),
            });

            const registration = await tx.sportRegistration.create({
                data: {
                    sportId,
                    studentName: `Team: ${normalizedTeamName}`,
                    studentId: captainStudentId,
                    email: captain.email?.trim() || null,
                    phone: captain.phone?.trim() || null,
                    branch: captain.branch?.trim() || captain.department?.trim() || null,
                    year: captain.year?.trim() || null,
                    section: captain.section?.trim() || null,
                    status: RegistrationStatus.CONFIRMED,
                },
            });

            await tx.teamMember.updateMany({
                where: { teamId: team.id, role: TeamRole.LEADER },
                data: { sportRegistrationId: registration.id },
            });

            return { team, registration };
        });

        await createAuditLog({
            action: 'CREATE_OFFLINE_TEAM_SPORT_REGISTRATION',
            entityType: 'SPORT_REGISTRATION',
            entityId: result.registration.id,
            performedBy: user.id,
            metadata: { sportId, sportName: sport.name, teamName: normalizedTeamName, memberCount: members.length },
        });

        await revalidateSportRegistrationData();

        // Send confirmation email to the team lead (captain)
        if (leaderUser.email && !leaderUser.email.endsWith('@offline.local')) {
            try {
                const sportName = sport.name;
                const leadName = captain.name;
                const emailHtml = getSportRegistrationEmailTemplate(
                    leadName,
                    sportName,
                    normalizedTeamName,
                    teamCode,
                    members.map(m => ({ name: m.name, rollNumber: m.rollNumber, role: m.role }))
                );

                await sendEmail({
                    to: leaderUser.email,
                    subject: `Registration Confirmed: ${sportName} - ${normalizedTeamName}`,
                    html: emailHtml
                });
            } catch (emailError) {
                console.error('Failed to send registration confirmation email:', emailError);
                // We don't throw here to ensure the registration itself is considered successful
            }
        }

        return { success: true, message: `Team "${normalizedTeamName}" registered successfully` };
    }, 'createSportOfflineTeamRegistration') as any;
}

export async function updateSportOfflineTeamRegistration(
    data: UpdateSportOfflineTeamRegistrationInput
) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const { registrationId, sportId, teamName, members } = data;
        const normalizedRegistrationId = registrationId?.trim();
        const normalizedSportId = sportId?.trim();

        if (!normalizedRegistrationId) throw new Error('Registration ID is required');
        if (!normalizedSportId) throw new Error('Sport ID is required');
        if (!teamName?.trim()) throw new Error('Team name is required');
        if (!members || members.length === 0) throw new Error('At least one team member is required');

        const captainCount = members.filter((m) => m.role === 'Captain').length;
        if (captainCount !== 1) throw new Error('Exactly one captain is required');

        const normalizedIds = members.map((m) => (m.rollNumber || '').trim().toUpperCase()).filter(Boolean);
        const uniqueIds = new Set(normalizedIds);
        if (normalizedIds.length !== uniqueIds.size) throw new Error('Duplicate student IDs are not allowed');

        const captain = members.find((m) => m.role === 'Captain') || members[0];
        if (!captain) throw new Error('Team must include a captain');

        const [registration, sport] = await Promise.all([
            prisma.sportRegistration.findUnique({
                where: { id: normalizedRegistrationId },
                select: {
                    id: true, studentId: true, email: true,
                    sport: { select: { id: true, name: true } },
                    teamMember: { select: { teamId: true } },
                },
            }),
            prisma.sport.findUnique({
                where: { id: normalizedSportId },
                select: { id: true, name: true, category: true, minPlayersPerTeam: true, maxPlayersPerTeam: true },
            }),
        ]);

        if (!registration) throw new Error('Registration not found');
        if (!registration.teamMember?.teamId) throw new Error('Linked team not found for this registration');
        if (!sport) throw new Error('Sport not found');
        if (sport.category !== 'TEAM') throw new Error('This sport supports only individual registrations');
        if (sport.minPlayersPerTeam && members.length < sport.minPlayersPerTeam) {
            throw new Error(`Minimum ${sport.minPlayersPerTeam} players required`);
        }
        if (sport.maxPlayersPerTeam && members.length > sport.maxPlayersPerTeam) {
            throw new Error(`Maximum ${sport.maxPlayersPerTeam} players allowed`);
        }

        const captainStudentId = (captain.rollNumber || '').trim() || registration.studentId;
        const duplicate = await prisma.sportRegistration.findFirst({
            where: { sportId: normalizedSportId, studentId: captainStudentId, id: { not: normalizedRegistrationId } },
            select: { id: true },
        });
        if (duplicate) throw new Error(`Captain ${captainStudentId} is already registered for this sport`);

        const teamId = registration.teamMember.teamId;

        await prisma.$transaction(async (tx) => {
            await tx.team.update({
                where: { id: teamId },
                data: {
                    teamName: teamName.trim(),
                    leaderName: captain.name,
                    leaderEmail: captain.email?.trim() || registration.email?.trim() || `temp-${teamId}@offline.local`,
                    leaderPhone: captain.phone?.trim() || null,
                },
            });

            await tx.sportTeam.upsert({
                where: { teamId },
                update: { sportId: normalizedSportId },
                create: { teamId, sportId: normalizedSportId },
            });

            await tx.sportRegistration.update({
                where: { id: normalizedRegistrationId },
                data: {
                    sportId: normalizedSportId,
                    studentName: `Team: ${teamName.trim()}`,
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
                    email: member.email?.trim() || `temp-${teamId}-${index}@offline.local`,
                    phone: member.phone?.trim() || null,
                    rollNumber: member.rollNumber?.trim() || null,
                    department: member.branch?.trim() || member.department?.trim() || null,
                    year: member.year?.trim() || null,
                    section: member.section?.trim() || null,
                    role: mapTeamRole(member.role),
                    status: MemberStatus.ACCEPTED,
                    sportRegistrationId: member.role === 'Captain' ? normalizedRegistrationId : null,
                })),
            });
        });

        await createAuditLog({
            action: 'UPDATE_OFFLINE_TEAM_SPORT_REGISTRATION',
            entityType: 'SPORT_REGISTRATION',
            entityId: normalizedRegistrationId,
            performedBy: user.id,
            metadata: { sportId: normalizedSportId, sportName: sport.name, teamName, memberCount: members.length },
        });

        await revalidateSportRegistrationData();

        // Send confirmation email on update
        if (registration.email && !registration.email.endsWith('@offline.local')) {
            try {
                // Fetch team code (needed for the email)
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    select: { teamCode: true }
                });

                if (team) {
                    const emailHtml = getSportRegistrationEmailTemplate(
                        captain.name,
                        sport.name,
                        teamName.trim(),
                        team.teamCode,
                        members.map(m => ({ name: m.name, rollNumber: m.rollNumber, role: m.role }))
                    );

                    await sendEmail({
                        to: registration.email,
                        subject: `Team Updated: ${sport.name} - ${teamName.trim()}`,
                        html: emailHtml
                    });
                }
            } catch (emailError) {
                console.error('Failed to send team update email:', emailError);
            }
        }

        return { success: true, message: `Team "${teamName}" updated successfully` };
    }, 'updateSportOfflineTeamRegistration') as any;
}

export async function deleteSportTeamRegistration(registrationId: string) {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'manage:sport_registrations');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const normalizedId = registrationId?.trim();
        if (!normalizedId) throw new Error('Registration ID is required');

        const registration = await prisma.sportRegistration.findUnique({
            where: { id: normalizedId },
            select: {
                id: true, sportId: true, studentId: true,
                teamMember: { select: { teamId: true } },
            },
        });
        if (!registration) throw new Error('Registration not found');

        await prisma.$transaction(async (tx) => {
            const teamId = registration.teamMember?.teamId || null;
            if (teamId) {
                await tx.team.delete({ where: { id: teamId } });
            }
            await tx.sportRegistration.delete({ where: { id: normalizedId } });
        });

        await createAuditLog({
            action: 'DELETE_SPORT_TEAM_REGISTRATION',
            entityType: 'SPORT_REGISTRATION',
            entityId: normalizedId,
            performedBy: user.id,
            metadata: { sportId: registration.sportId, studentId: registration.studentId },
        });

        await revalidateSportRegistrationData();
        return { success: true, message: 'Registration deleted successfully' };
    }, 'deleteSportTeamRegistration') as any;
}
