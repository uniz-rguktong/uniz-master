'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { type ClubEntity, ENTITY_METADATA } from '@/lib/constants/clubEntities';
import logger from '@/lib/logger';
import { withPrismaPoolRetry } from '@/lib/prismaPoolRetry';

// Roles that map to portal entities
const ENTITY_ROLES = [
    'CLUB_COORDINATOR', 'BRANCH_ADMIN', 'SUPER_ADMIN',
    'HHO', 'SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN',
] as const;

type AdminRow = {
    id: string; name: string | null; email: string; phone: string | null;
    clubId: string | null; branch: string | null; role: string;
    bio: string | null; profilePicture: string | null; preferences: unknown;
    _count: { eventsCreated: number };
};

/** Derive the canonical entity ID from an admin's role/clubId/branch */
function resolveEntityId(admin: { role: string; clubId: string | null; branch: string | null }): string | null {
    switch (admin.role) {
        case 'CLUB_COORDINATOR':
            return admin.clubId || null;
        case 'BRANCH_ADMIN':
            return admin.branch ? `branch_${admin.branch.toLowerCase()}` : null;
        case 'SUPER_ADMIN':
            return 'super_admin';
        case 'HHO':
            return 'hho';
        case 'SPORTS_ADMIN':
            return 'sports_admin';
        case 'BRANCH_SPORTS_ADMIN':
            return 'branch_sports_admin';
        default:
            return null;
    }
}

/** Build a ClubEntity by merging real Admin data with static metadata fallbacks */
function buildEntity(
    admin: AdminRow,
    entityId: string,
    memberCount: number,
): ClubEntity {
    const meta = ENTITY_METADATA[entityId];
    const prefs = (admin.preferences as Record<string, unknown> | null) ?? {};

    return {
        id: entityId,
        name: (prefs.displayName as string) || meta?.name || admin.clubId || admin.branch || entityId,
        shortName: (prefs.shortName as string) || meta?.shortName || entityId.slice(0, 3).toUpperCase(),
        coordinator: admin.name || 'Admin',
        establishedYear: String((prefs.establishedYear as number) || meta?.establishedYear || '2020'),
        description: admin.bio || meta?.description || '',
        email: admin.email,
        phone: admin.phone || '',
        logo: admin.profilePicture || null,
        stats: { members: memberCount, events: admin._count.eventsCreated },
    };
}

/** Default entity returned when the DB has no matching admins */
function buildFallbackEntity(): ClubEntity {
    const meta = ENTITY_METADATA['techexcel'];
    return {
        id: 'techexcel',
        name: meta?.name ?? 'Default Club',
        shortName: meta?.shortName ?? 'DC',
        coordinator: 'Admin',
        establishedYear: meta?.establishedYear ?? '2020',
        description: meta?.description ?? '',
        email: 'admin@club.com',
        phone: '',
        logo: null,
        stats: { members: 0, events: 0 },
    };
}

/**
 * Build a Prisma `where` clause to look up an admin for a given entity ID
 */
function buildAdminWhereClause(entityId: string): Record<string, unknown> | null {
    if (entityId === 'super_admin') return { role: 'SUPER_ADMIN' };
    if (entityId === 'hho') return { role: 'HHO' };
    if (entityId === 'sports_admin') return { role: 'SPORTS_ADMIN' };
    if (entityId === 'branch_sports_admin') return { role: 'BRANCH_SPORTS_ADMIN' };
    if (entityId.startsWith('branch_')) {
        const branch = entityId.replace('branch_', '');
        return { role: 'BRANCH_ADMIN', branch: { equals: branch, mode: 'insensitive' } };
    }
    // Default: club coordinator with matching clubId
    return { role: 'CLUB_COORDINATOR', clubId: entityId };
}

const ADMIN_SELECT = {
    id: true, name: true, email: true, phone: true,
    clubId: true, branch: true, role: true,
    bio: true, profilePicture: true, preferences: true,
    _count: { select: { eventsCreated: true } },
} as const;

/**
 * Get all club entities — built from real Admin records + registration counts.
 * Cached for 5 minutes, invalidated by 'clubs' tag.
 */
const getCachedAllEntities = unstable_cache(
    async (): Promise<ClubEntity[]> => {
        try {
            // 1) Fetch all admins that represent portal entities
            const admins = await withPrismaPoolRetry(
                () => prisma.admin.findMany({
                    where: { role: { in: [...ENTITY_ROLES] } },
                    select: ADMIN_SELECT,
                    orderBy: { createdAt: 'asc' },
                }),
                { label: 'getCachedAllEntities:admin-findMany' },
            );

            // 2) Keep the first (oldest) admin per entity
            const entityAdminMap = new Map<string, AdminRow>();
            for (const admin of admins) {
                const eid = resolveEntityId(admin);
                if (eid && !entityAdminMap.has(eid)) {
                    entityAdminMap.set(eid, admin as AdminRow);
                }
            }

            if (entityAdminMap.size === 0) {
                return [buildFallbackEntity()];
            }

            // 3) Batch-count registrations per admin's events (2 queries total)
            const adminIds = [...entityAdminMap.values()].map(a => a.id);
            const eventsWithRegCounts = await withPrismaPoolRetry(
                () => prisma.event.findMany({
                    where: { creatorId: { in: adminIds } },
                    select: { creatorId: true, _count: { select: { registrations: true } } },
                }),
                { label: 'getCachedAllEntities:event-findMany' },
            );

            const memberCountByAdmin = new Map<string, number>();
            for (const ev of eventsWithRegCounts) {
                memberCountByAdmin.set(
                    ev.creatorId,
                    (memberCountByAdmin.get(ev.creatorId) || 0) + ev._count.registrations,
                );
            }

            // 4) Build final entities
            const entities: ClubEntity[] = [];
            for (const [entityId, admin] of entityAdminMap) {
                entities.push(buildEntity(admin, entityId, memberCountByAdmin.get(admin.id) || 0));
            }

            return entities;
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch club entities from DB');
            return [buildFallbackEntity()];
        }
    },
    ['all-club-entities'],
    { tags: ['clubs'], revalidate: 300 },
);

/**
 * Get a single club entity by its canonical ID.
 */
const getCachedEntityById = unstable_cache(
    async (entityId: string): Promise<ClubEntity | null> => {
        try {
            const whereClause = buildAdminWhereClause(entityId);
            if (!whereClause) return null;

            const admin = await withPrismaPoolRetry(
                () => prisma.admin.findFirst({
                    where: whereClause,
                    select: ADMIN_SELECT,
                    orderBy: { createdAt: 'asc' },
                }),
                { label: 'getCachedEntityById:admin-findFirst' },
            );
            if (!admin) return null;

            const memberCount = await withPrismaPoolRetry(
                () => prisma.registration.count({
                    where: { event: { creatorId: admin.id } },
                }),
                { label: 'getCachedEntityById:registration-count' },
            );

            return buildEntity(admin as AdminRow, entityId, memberCount);
        } catch (error) {
            logger.error({ err: error, entityId }, 'Failed to fetch entity by ID');
            return null;
        }
    },
    ['club-entity-by-id'],
    { tags: ['clubs'], revalidate: 300 },
);

/**
 * Get entity for current user based on session
 */
export async function getCurrentUserEntity(): Promise<{
    entity: ClubEntity | null;
    allEntities: ClubEntity[];
}> {
    const session = await getServerSession(authOptions);
    const allEntities = await getCachedAllEntities();

    if (!session?.user) {
        return { entity: allEntities[0] ?? null, allEntities };
    }

    // Determine entity ID from session
    let entityId: string | null = null;

    if (session.user.clubId) {
        entityId = session.user.clubId;
    } else if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'super_admin') {
        entityId = 'super_admin';
    } else if (session.user.role === 'BRANCH_ADMIN' && session.user.branch) {
        entityId = `branch_${session.user.branch.toLowerCase()}`;
    } else if (session.user.role === 'HHO') {
        entityId = 'hho';
    } else if (session.user.role === 'SPORTS_ADMIN') {
        entityId = 'sports_admin';
    }

    // Try the cached list first (avoids an extra DB round-trip)
    const fromList = entityId ? allEntities.find(e => e.id === entityId) : null;
    if (fromList) {
        return { entity: fromList, allEntities };
    }

    // Fall back to a direct lookup if not in list
    const entity = entityId ? await getCachedEntityById(entityId) : null;
    return { entity: entity ?? allEntities[0] ?? null, allEntities };
}

/**
 * Get entity by ID
 */
export async function getEntityById(entityId: string): Promise<ClubEntity | null> {
    return await getCachedEntityById(entityId);
}

/**
 * Get all entities
 */
export async function getAllEntities(): Promise<ClubEntity[]> {
    return await getCachedAllEntities();
}
