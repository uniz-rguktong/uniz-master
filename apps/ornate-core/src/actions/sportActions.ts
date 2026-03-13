'use server'

import prisma from '@/lib/prisma'
import { executeAction, type ActionResponse } from '@/lib/api-utils'
import { createAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { assertPermission, type User } from '@/lib/permissions'
import { revalidateSportData } from '@/lib/revalidation'
import { SportSchema } from '@/lib/schemas/sportSchemas'
import type { Sport } from '@/lib/generated/client'
import { Prisma } from '@/lib/generated/client'

function parseJsonArray(value: FormDataEntryValue | null): string[] | undefined {
    if (!value) return undefined;

    const raw = String(value).trim();
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item));
        }
    } catch {
        return raw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return undefined;
}

function mapGender(value: string | null | undefined): 'MALE' | 'FEMALE' | 'MIXED' {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'MALE' || normalized === 'BOYS') return 'MALE';
    if (normalized === 'FEMALE' || normalized === 'GIRLS') return 'FEMALE';
    return 'MIXED';
}

function mapCategory(value: string | null | undefined): 'INDIVIDUAL' | 'TEAM' {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'INDIVIDUAL') return 'INDIVIDUAL';
    return 'TEAM';
}

function mapFormat(value: string | null | undefined): 'KNOCKOUT' | 'LEAGUE' | 'GROUP_KNOCKOUT' {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'LEAGUE') return 'LEAGUE';
    if (normalized === 'GROUP_KNOCKOUT') return 'GROUP_KNOCKOUT';
    return 'KNOCKOUT';
}

function mapStatus(value: string | null | undefined): 'UPCOMING' | 'REGISTRATION_OPEN' | 'ONGOING' | 'COMPLETED' {
    const normalized = (value || '').trim().toUpperCase();

    if (normalized === 'REGISTRATION_OPEN' || normalized === 'REGISTRATION OPEN') return 'REGISTRATION_OPEN';
    if (normalized === 'ONGOING') return 'ONGOING';
    if (normalized === 'COMPLETED') return 'COMPLETED';
    return 'UPCOMING';
}

function buildSportInput(formData: FormData) {
    const customFieldsRaw = formData.get('customFields');
    let customFields: Record<string, unknown> = {};

    if (customFieldsRaw) {
        try {
            customFields = JSON.parse(String(customFieldsRaw));
        } catch {
            customFields = {};
        }
    }

    const raw = {
        name:
            (formData.get('name') as string | null) ||
            (formData.get('sportName') as string | null) ||
            (formData.get('title') as string | null),

        gender:
            (formData.get('gender') as string | null) ||
            (formData.get('genderType') as string | null) ||
            (customFields.genderType as string | undefined) ||
            (customFields.type as string | undefined),

        category: (formData.get('category') as string | null) || 'TEAM',
        format: (formData.get('format') as string | null) || 'KNOCKOUT',
        status: (formData.get('status') as string | null) || 'UPCOMING',

        description:
            (formData.get('description') as string | null) ||
            (formData.get('notes') as string | null) ||
            null,

        winnerPoints:
            (formData.get('winnerPoints') as string | null) ||
            (customFields.winnerPoints as string | number | undefined) ||
            0,

        runnerUpPoints:
            (formData.get('runnerUpPoints') as string | null) ||
            (formData.get('runnerupPoints') as string | null) ||
            (customFields.runnerupPoints as string | number | undefined) ||
            0,

        participationPoints:
            (formData.get('participationPoints') as string | null) ||
            (customFields.participationPoints as string | number | undefined) ||
            0,

        awards:
            parseJsonArray(formData.get('awards')) ||
            (Array.isArray(customFields.awards)
                ? (customFields.awards as unknown[]).map((item) => String(item))
                : undefined) ||
            [],

        maxTeamsPerBranch:
            (formData.get('maxTeamsPerBranch') as string | null) ||
            (formData.get('maxParticipants') as string | null) ||
            null,

        minPlayersPerTeam: (formData.get('minPlayersPerTeam') as string | null) || null,
        maxPlayersPerTeam: (formData.get('maxPlayersPerTeam') as string | null) || null,

        eligibility:
            parseJsonArray(formData.get('eligibility')) ||
            (Array.isArray(customFields.eligibility)
                ? (customFields.eligibility as unknown[]).map((item) => String(item))
                : undefined) ||
            [],

        registrationDeadline:
            (formData.get('registrationDeadline') as string | null) ||
            (formData.get('eventDate') as string | null) ||
            (formData.get('date') as string | null) ||
            null,

        rules: (formData.get('rules') as string | null) || null,
        matchDuration: (formData.get('matchDuration') as string | null) || null,
        icon: (formData.get('icon') as string | null) || null,
        bannerUrl:
            (formData.get('bannerUrl') as string | null) ||
            (formData.get('posterUrl') as string | null) ||
            '',
        isActive: formData.get('isActive') !== 'false',
    };

    return {
        ...raw,
        gender: mapGender(raw.gender),
        category: mapCategory(raw.category),
        format: mapFormat(raw.format),
        status: mapStatus(raw.status),
    };
}

function toPermissionResource(_sport: Record<string, unknown>) {
    return {
        creatorId: '',
        branch: null as string | null,
    };
}

function toSportCreateData(
    parsed: ReturnType<typeof SportSchema.parse>,
    statusRaw: string | null | undefined
): Prisma.SportUncheckedCreateInput {
    return {
        name: parsed.name,
        gender: parsed.gender,
        category: parsed.category,
        format: parsed.format,
        status: mapStatus(statusRaw),
        description: parsed.description ?? null,
        icon: parsed.icon ?? null,
        bannerUrl: parsed.bannerUrl ? parsed.bannerUrl : null,
        winnerPoints: parsed.winnerPoints,
        runnerUpPoints: parsed.runnerUpPoints,
        participationPoints: parsed.participationPoints,
        awards: parsed.awards,
        maxTeamsPerBranch: parsed.maxTeamsPerBranch ?? null,
        minPlayersPerTeam: parsed.minPlayersPerTeam ?? null,
        maxPlayersPerTeam: parsed.maxPlayersPerTeam ?? null,
        rules: parsed.rules ?? null,
        eligibility: parsed.eligibility,
        registrationDeadline: parsed.registrationDeadline ?? null,
        matchDuration: parsed.matchDuration ?? null,
        isActive: parsed.isActive,
    };
}

function toSportUpdateData(
    parsed: ReturnType<typeof SportSchema.parse>,
    statusRaw: string | null | undefined
): Prisma.SportUncheckedUpdateInput {
    return {
        name: parsed.name,
        gender: parsed.gender,
        category: parsed.category,
        format: parsed.format,
        status: mapStatus(statusRaw),
        description: parsed.description ?? null,
        icon: parsed.icon ?? null,
        bannerUrl: parsed.bannerUrl ? parsed.bannerUrl : null,
        winnerPoints: parsed.winnerPoints,
        runnerUpPoints: parsed.runnerUpPoints,
        participationPoints: parsed.participationPoints,
        awards: parsed.awards,
        maxTeamsPerBranch: parsed.maxTeamsPerBranch ?? null,
        minPlayersPerTeam: parsed.minPlayersPerTeam ?? null,
        maxPlayersPerTeam: parsed.maxPlayersPerTeam ?? null,
        rules: parsed.rules ?? null,
        eligibility: parsed.eligibility,
        registrationDeadline: parsed.registrationDeadline ?? null,
        matchDuration: parsed.matchDuration ?? null,
        isActive: parsed.isActive,
    };
}

async function createUniqueSportCopyName(baseName: string, gender: 'MALE' | 'FEMALE' | 'MIXED'): Promise<string> {
    let suffix = 1;
    let candidate = `${baseName} (Copy)`;

    while (true) {
        const exists = await prisma.sport.findUnique({
            where: {
                name_gender: {
                    name: candidate,
                    gender,
                },
            },
            select: { id: true },
        });

        if (!exists) return candidate;
        suffix += 1;
        candidate = `${baseName} (Copy ${suffix})`;
    }
}

export async function createSport(formData: FormData): Promise<ActionResponse<Sport>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        assertPermission(user as User, 'create:sport');
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const parsed = SportSchema.parse(buildSportInput(formData));

        const sport = await prisma.sport.create({
            data: toSportCreateData(parsed, formData.get('status') as string | null),
        });

        await createAuditLog({
            action: 'CREATE_SPORT',
            entityType: 'SPORT',
            entityId: sport.id,
            performedBy: user.id,
            metadata: {
                name: sport.name,
                gender: sport.gender,
            },
        });

        await revalidateSportData();
        return { success: true, data: sport };
    }, 'createSport') as any;
}

export async function updateSport(formData: FormData): Promise<ActionResponse<Sport>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sportId = String(formData.get('id') || '');
        if (!sportId) throw new Error('Sport ID is required for update');

        const existingSport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: {
                id: true,
            },
        });

        if (!existingSport) throw new Error('Sport not found');

        assertPermission(user as User, 'update:sport', toPermissionResource(existingSport));

        const parsed = SportSchema.parse(buildSportInput(formData));

        const updatedSport = await prisma.sport.update({
            where: { id: sportId },
            data: toSportUpdateData(parsed, formData.get('status') as string | null),
        });

        await createAuditLog({
            action: 'UPDATE_SPORT',
            entityType: 'SPORT',
            entityId: updatedSport.id,
            performedBy: user.id,
            metadata: {
                name: updatedSport.name,
                gender: updatedSport.gender,
            },
        });

        await revalidateSportData();
        return { success: true, data: updatedSport };
    }, 'updateSport') as any;
}

export async function deleteSport(sportId: string): Promise<ActionResponse> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: {
                id: true,
                name: true,
                gender: true,
            },
        });

        if (!sport) {
            return { success: false, error: 'Sport not found or already deleted' };
        }

        assertPermission(user as User, 'delete:sport', toPermissionResource(sport));

        await prisma.$transaction([
            prisma.match.deleteMany({ where: { sportId } }),
            prisma.sportRegistration.deleteMany({ where: { sportId } }),
            prisma.branchPoints.deleteMany({ where: { sportId } }),
            prisma.sportWinnerAnnouncement.deleteMany({ where: { sportId } }),
            prisma.sportTeam.deleteMany({ where: { sportId } }),
            prisma.sport.delete({ where: { id: sportId } }),
        ]);

        await createAuditLog({
            action: 'DELETE_SPORT',
            entityType: 'SPORT',
            entityId: sportId,
            performedBy: user.id,
            metadata: {
                name: sport.name,
                gender: sport.gender,
            },
        });

        await revalidateSportData();
        return { success: true };
    }, 'deleteSport');
}

export async function updateSportStatus(
    sportId: string,
    status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'ONGOING' | 'COMPLETED'
): Promise<ActionResponse<Sport>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: {
                id: true,
            },
        });

        if (!sport) throw new Error('Sport not found');

        assertPermission(user as User, 'update:sport', toPermissionResource(sport));

        const updated = await prisma.sport.update({
            where: { id: sportId },
            data: { status },
        });

        await createAuditLog({
            action: 'UPDATE_SPORT_STATUS',
            entityType: 'SPORT',
            entityId: sportId,
            performedBy: user.id,
            metadata: { status },
        });

        await revalidateSportData();
        return { success: true, data: updated };
    }, 'updateSportStatus') as any;
}

export async function duplicateSport(sportId: string): Promise<ActionResponse<Sport>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const existing = await prisma.sport.findUnique({ where: { id: sportId } });
        if (!existing) throw new Error('Sport not found');

        assertPermission(user as User, 'create:sport');

        const copyName = await createUniqueSportCopyName(existing.name, existing.gender);

        const duplicated = await prisma.sport.create({
            data: {
                name: copyName,
                gender: existing.gender,
                category: existing.category,
                format: existing.format,
                status: 'UPCOMING',
                description: existing.description,
                icon: existing.icon,
                bannerUrl: existing.bannerUrl,
                winnerPoints: existing.winnerPoints,
                runnerUpPoints: existing.runnerUpPoints,
                participationPoints: existing.participationPoints,
                awards: existing.awards,
                maxTeamsPerBranch: existing.maxTeamsPerBranch,
                minPlayersPerTeam: existing.minPlayersPerTeam,
                maxPlayersPerTeam: existing.maxPlayersPerTeam,
                rules: existing.rules,
                eligibility: existing.eligibility,
                registrationDeadline: existing.registrationDeadline,
                matchDuration: existing.matchDuration,
                certificateStatus: 'DRAFT',
                certificateIssuedAt: null,
                certificateTheme: existing.certificateTheme,
                certificateTemplates:
                    existing.certificateTemplates === null
                        ? Prisma.JsonNull
                        : (existing.certificateTemplates as Prisma.InputJsonValue),
                isActive: true,
            },
        });

        await createAuditLog({
            action: 'DUPLICATE_SPORT',
            entityType: 'SPORT',
            entityId: duplicated.id,
            performedBy: user.id,
            metadata: {
                originalSportId: sportId,
                name: duplicated.name,
                gender: duplicated.gender,
            },
        });

        await revalidateSportData();
        return { success: true, data: duplicated };
    }, 'duplicateSport') as any;
}

export async function setSportActive(sportId: string, isActive: boolean): Promise<ActionResponse<Sport>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: {
                id: true,
            },
        });

        if (!sport) throw new Error('Sport not found');
        assertPermission(user as User, 'update:sport', toPermissionResource(sport));

        const updated = await prisma.sport.update({
            where: { id: sportId },
            data: { isActive },
        });

        await createAuditLog({
            action: isActive ? 'RESTORE_SPORT' : 'ARCHIVE_SPORT',
            entityType: 'SPORT',
            entityId: sportId,
            performedBy: user.id,
            metadata: { isActive },
        });

        await revalidateSportData();
        return { success: true, data: updated };
    }, 'setSportActive') as any;
}
