'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, getSession } from '@/lib/auth';
import { redis } from '@/lib/redis';
import crypto from 'crypto';
import { getCadetLevel, ENERGY_REWARDS } from '@/lib/gamification-constants';

type PrismaWithOptionalGamification = typeof prisma & {
  cadetProfile?: typeof prisma.cadetProfile;
  energyTransaction?: typeof prisma.energyTransaction;
};

type EnergyReason = Parameters<typeof prisma.energyTransaction.create>[0]['data']['reason'];

const prismaGamification = prisma as PrismaWithOptionalGamification;

const getRankCacheKey = (userId: string) => `rank:${userId}`;

async function invalidateRankCache(userId: string) {
  try {
    await redis.del(getRankCacheKey(userId));
  } catch {
    // Ignore Redis failures to avoid breaking write actions.
  }
}

// ─── Re-export async wrappers for server-safe usage ─────────────────────────

export async function getOrCreateCadetProfile(userId: string) {
  const existing = await prisma.cadetProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const created = await prisma.cadetProfile.create({
    data: { id: crypto.randomUUID(), userId, totalEnergy: 0, badgeIds: [], updatedAt: new Date() }
  });
  await invalidateRankCache(userId);
  return created;
}

/**
 * Syncs a user's energy based on their database records:
 * - Registrations (Register + Attend + Rank)
 * - Profile completeness
 * - Avatar upload
 * - Team participations
 * 
 * Uses notes to track which entities have already been processed to avoid duplicates.
 */
export async function syncCadetEnergy(userId: string) {
  try {
    // ─── Throttling: only sync once every 10 minutes ────────────────────────
    const throttleKey = `energy_sync:${userId}`;
    try {
      // Use NX (Set if Not eXists) to prevent concurrent executions from causing duplicates
      const acquired = await redis.set(throttleKey, '1', 'EX', 600, 'NX');
      if (!acquired) return { success: true, reason: 'throttled' };
    } catch (redisError) {
      console.warn('[syncCadetEnergy] Redis check failed (ignoring throttle):', redisError);
    }
    // ────────────────────────────────────────────────────────────────────────

    const [user, existingTransactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          registrations: { include: { event: { select: { title: true } } } },
          teamMembers: { include: { team: { include: { sportTeam: { include: { sport: true } } } } } },
          CadetProfile: true,
        }
      }),
      prisma.energyTransaction.findMany({
        where: { userId },
        select: { note: true }
      })
    ]);

    if (!user) return { success: false, error: 'User not found' };

    // Fetch individual sport registrations by studentId (email prefix, uppercase)
    const studentId = user.email.split('@')[0].toUpperCase();
    const sportRegs = await prisma.sportRegistration.findMany({
      where: { studentId },
      select: { id: true, status: true },
    });



    const processedNotes = new Set(existingTransactions.map((t: { note: string | null }) => t.note).filter(Boolean));
    const newAwards: { amount: number; reason: EnergyReason; note: string }[] = [];

    const awardIfNew = (amount: number, reason: EnergyReason, note: string) => {
      if (!processedNotes.has(note)) {
        newAwards.push({ amount, reason, note });
        processedNotes.add(note); // Prevent duplicate transactions in the same loop execution
      }
    };

    // 1. Registration Bonus (Base)
    awardIfNew(ENERGY_REWARDS.REGISTRATION_BONUS, 'REGISTRATION_BONUS', 'BASE_SYNC');

    // 2. Profile Complete (Name, Branch, Phone, Year)
    if (user.name && user.branch && user.phone && user.currentYear) {
      awardIfNew(ENERGY_REWARDS.PROFILE_COMPLETE, 'PROFILE_COMPLETE', 'PROFILE_SYNC');
    }

    // 3. Event Registrations (CONFIRMED = register bonus if > 0, ATTENDED = attend bonus + rank)
    for (const reg of user.registrations) {
      if (reg.status === 'CONFIRMED' || reg.status === 'ATTENDED' || reg.status === 'WAITLISTED') {
        if (ENERGY_REWARDS.EVENT_REGISTER > 0) {
          awardIfNew(ENERGY_REWARDS.EVENT_REGISTER, 'EVENT_REGISTER', `REG:${reg.id}`);
        }
      }
      if (reg.status === 'ATTENDED') {
        awardIfNew(ENERGY_REWARDS.EVENT_ATTEND, 'EVENT_ATTEND', `ATTEND:${reg.id}`);
      }
      if (reg.rank && reg.rank > 0) {
        const reason = reg.rank === 1 ? 'MISSION_FIRST' : reg.rank === 2 ? 'MISSION_SECOND' : 'MISSION_THIRD';
        const pts = reg.rank === 1
          ? ENERGY_REWARDS.MISSION_FIRST
          : reg.rank === 2
            ? ENERGY_REWARDS.MISSION_SECOND
            : ENERGY_REWARDS.MISSION_THIRD;
        awardIfNew(pts, reason, `RANK:${reg.id}`);
      }
    }

    // 4. Individual Sport Registrations (SportRegistration table)
    for (const sr of sportRegs) {
      if (sr.status !== 'CANCELLED' && sr.status !== 'REJECTED') {
        awardIfNew(ENERGY_REWARDS.SPORT_REGISTER, 'SPORT_REGISTER', `SPORT_REG:${sr.id}`);
      }
    }

    // 5. Sport Team Participations
    for (const tm of user.teamMembers) {
      if (tm.status === 'ACCEPTED') {
        awardIfNew(ENERGY_REWARDS.SPORT_PARTICIPATE, 'SPORT_PARTICIPATE', `TEAM:${tm.teamId}`);
      }
    }

    // Process new awards sequentially to prevent connection pool exhaustion
    if (newAwards.length > 0) {
      for (const a of newAwards) {
        await awardEnergyToUser(userId, a.amount, a.reason, a.note);
      }
    }

    // (We set NX earlier, so we don't need to set it again here unless we want to extend the time. The 10m lock remains.)

    // 6. Badge Unlocking based on Energy and Activity
    const updatedProfile = await prisma.cadetProfile.findUnique({ where: { userId } });
    if (updatedProfile) {
      const newBadgeIds = [...updatedProfile.badgeIds];
      let badgesChanged = false;

      // NEON POWERED: 500+ Energy
      if (updatedProfile.totalEnergy >= 500 && !newBadgeIds.includes('neon-powered')) {
        newBadgeIds.push('neon-powered');
        badgesChanged = true;
      }
      // LEGEND CADET: 1729+ Energy
      if (updatedProfile.totalEnergy >= 1729 && !newBadgeIds.includes('legend-cadet')) {
        newBadgeIds.push('legend-cadet');
        badgesChanged = true;
      }
      // FIRST MISSION: Any event registration
      if (user.registrations.length > 0 && !newBadgeIds.includes('first-mission')) {
        newBadgeIds.push('first-mission');
        badgesChanged = true;
      }
      // SPORTS WARRIOR: Any team membership or individual sport registration
      if ((user.teamMembers.length > 0 || sportRegs.length > 0) && !newBadgeIds.includes('sports-warrior')) {
        newBadgeIds.push('sports-warrior');
        badgesChanged = true;
      }

      if (badgesChanged) {
        await prisma.cadetProfile.update({
          where: { userId },
          data: { badgeIds: newBadgeIds }
        });
      }
    }

    return { success: true, newAwardsCount: newAwards.length };
  } catch (error) {
    console.error('[syncCadetEnergy]', error);
    return { success: false, error: 'Sync failed' };
  }
}

// ─── Award energy to a user ──────────────────────────────────────────────────
export async function awardEnergyToUser(
  userId: string,
  amount: number,
  reason: EnergyReason,
  note?: string
) {
  try {
    await prisma.energyTransaction.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        amount,
        reason,
        note,
      }
    });

    await prisma.cadetProfile.upsert({
      where: { userId },
      create: { id: crypto.randomUUID(), userId, totalEnergy: amount, badgeIds: [], updatedAt: new Date() },
      update: { totalEnergy: { increment: amount }, updatedAt: new Date() },
    });

    await invalidateRankCache(userId);

    return { success: true };
  } catch (error) {
    console.error('[awardEnergyToUser]', error);
    return { success: false, error: 'Failed to award energy.' };
  }
}

// ─── Get Neon Core stats ─────────────────────────────────────────────────────
export async function getNeonCoreStats() {
  if (!prismaGamification.cadetProfile) {
    return { totalEnergy: 0, totalCadets: 0, topCadets: [] };
  }
  try {
    const [totalResult, topCadets] = await Promise.all([
      prisma.cadetProfile.aggregate({ _sum: { totalEnergy: true }, _count: { id: true } }),
      prisma.cadetProfile.findMany({
        take: 3,
        orderBy: { totalEnergy: 'desc' },
        include: { User: { select: { name: true, branch: true } } },
      }),
    ]);

    const totalEnergy = totalResult._sum.totalEnergy ?? 0;
    const totalCadets = totalResult._count.id;

    return {
      totalEnergy,
      totalCadets,
      topCadets: topCadets.map((c: { User: { name: string | null; branch: string | null }; totalEnergy: number }, i: number) => ({
        rank: i + 1,
        name: c.User.name || 'Unknown Cadet',
        branch: c.User.branch || '—',
        energy: c.totalEnergy,
        level: getCadetLevel(c.totalEnergy),
      })),
    };
  } catch (error) {
    console.error('[getNeonCoreStats]', error);
    return { totalEnergy: 0, totalCadets: 0, topCadets: [] };
  }
}

// ─── Cadet leaderboard ───────────────────────────────────────────────────────
export async function getLeaderboard(limit = 10) {
  if (!prismaGamification.cadetProfile) return [];
  try {
    const cadets = await prisma.cadetProfile.findMany({
      take: limit,
      orderBy: { totalEnergy: 'desc' },
      include: { User: { select: { name: true, branch: true, stdid: true } } },
    });

    return cadets.map((c: { User: { name: string | null; branch: string | null; stdid: string | null }; totalEnergy: number; badgeIds: string[] }, i: number) => ({
      rank: i + 1,
      name: c.User.name || 'Unknown Cadet',
      branch: c.User.branch || '—',
      stdid: c.User.stdid || '—',
      energy: c.totalEnergy,
      level: getCadetLevel(c.totalEnergy),
      badgeCount: c.badgeIds.length,
    }));
  } catch (error) {
    console.error('[getLeaderboard]', error);
    return [];
  }
}

// ─── Planet (branch) leaderboard ─────────────────────────────────────────────
export async function getPlanetLeaderboard() {
  if (!prismaGamification.cadetProfile) return [];
  try {
    const rows = await prisma.$queryRaw<Array<{ branch: string | null; energy: number | bigint | null; cadets: number | bigint }>>`
      SELECT
        u.branch,
        COALESCE(SUM(cp."totalEnergy"), 0) AS energy,
        COUNT(*) AS cadets
      FROM "CadetProfile" cp
      JOIN "User" u ON u.id = cp."userId"
      GROUP BY u.branch
      ORDER BY COALESCE(SUM(cp."totalEnergy"), 0) DESC
    `;

    const branches = rows.map((row: { branch: string | null; energy: number | bigint | null; cadets: number | bigint }) => ({
      branch: row.branch || 'Unknown',
      energy: Number(row.energy ?? 0),
      cadets: Number(row.cadets),
    }));

    return branches.map((b: { branch: string; energy: number; cadets: number }, i: number) => ({ ...b, rank: i + 1 }));
  } catch (error) {
    console.error('[getPlanetLeaderboard]', error);
    return [];
  }
}

// ─── Get my gamification profile ─────────────────────────────────────────────
export async function getMyGamificationProfile() {
  if (!prismaGamification.cadetProfile) return null;
  try {
    const session = await getSession();
    if (!session?.user?.email || !session?.user?.id) return null;
    const user = session.user as { email: string; id: string; name?: string | null };

    const studentId = user.email!.split('@')[0].toUpperCase();

    const [cadet, rawTransactions, leaderboardCount] = await Promise.all([
      prisma.cadetProfile.findUnique({ where: { userId: user.id } }),
      prisma.energyTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.cadetProfile.count({ where: { totalEnergy: { gt: 0 } } }),
    ]);

    const [registrations, sportRegistrations, teamMemberships, userWithMissions, sportRegData] = await Promise.all([
      prisma.registration.count({ where: { OR: [{ userId: user.id }, { studentId }] } }),
      prisma.sportRegistration.count({ where: { studentId } }),
      prisma.teamMember.count({ where: { userId: user.id } }),
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          registrations: {
            include: { event: { select: { title: true, category: true, date: true } } },
            orderBy: { createdAt: 'desc' },
          },
          teamMembers: {
            include: {
              team: {
                include: {
                  event: { select: { title: true } },
                  sportTeam: { include: { sport: { select: { name: true } } } }
                }
              }
            }
          }
        }
      }),
      prisma.sportRegistration.findMany({
        where: { studentId },
        include: { sport: { select: { name: true } } }
      })
    ]);

    // Build lookup: note key → human-readable description
    const noteDescriptions = new Map<string, string>();
    noteDescriptions.set('BASE_SYNC', 'Registered Account');
    noteDescriptions.set('PROFILE_SYNC', 'Completed Profile');

    const rankLabel = (r: number) => r === 1 ? '1st Place' : r === 2 ? '2nd Place' : '3rd Place';
    for (const reg of userWithMissions?.registrations ?? []) {
      const title = reg.event.title;
      noteDescriptions.set(`REG:${reg.id}`, `Registered for "${title}"`);
      noteDescriptions.set(`ATTEND:${reg.id}`, `Attended "${title}"`);
      if (reg.rank && reg.rank > 0) {
        noteDescriptions.set(`RANK:${reg.id}`, `${rankLabel(reg.rank)} at "${title}"`);
      }
    }
    for (const tm of userWithMissions?.teamMembers ?? []) {
      const sportName = tm.team?.sportTeam?.sport?.name;
      const eventName = tm.team?.event?.title;
      const label = sportName ? `Sports: ${sportName}` : eventName ? `Team event: ${eventName}` : 'Team Participation';
      noteDescriptions.set(`TEAM:${tm.teamId}`, label);
    }
    for (const sr of sportRegData ?? []) {
      noteDescriptions.set(`SPORT_REG:${sr.id}`, `Registered for ${sr.sport?.name || 'Sport'}`);
    }

    const missionsCount = registrations + sportRegistrations + teamMemberships;
    const recentMissions = (userWithMissions?.registrations ?? []).slice(0, 10).map((reg) => ({
      title: reg.event.title,
      category: (reg.event.category || 'Mission').toUpperCase(),
      date: reg.createdAt.toISOString(),
      status: reg.status,
      energy: reg.status === 'ATTENDED' ? ENERGY_REWARDS.EVENT_ATTEND : ENERGY_REWARDS.EVENT_REGISTER
    }));

    const duplicateSafeTransactions = [];
    const seenDisplayNotes = new Set<string>();
    
    for (const t of rawTransactions) {
      if (t.note) {
        if (seenDisplayNotes.has(t.note)) continue;
        seenDisplayNotes.add(t.note);
      }
      duplicateSafeTransactions.push(t);
    }

    const enrichedTransactions = duplicateSafeTransactions.map((t: { amount: number; reason: string; note: string | null; createdAt: Date }) => ({
      amount: t.amount,
      reason: t.reason,
      description: t.note ? (noteDescriptions.get(t.note) ?? null) : null,
      createdAt: t.createdAt.toISOString(),
    }));

    if (!cadet) {
      return {
        name: userWithMissions?.name || session.user.name || 'Anonymous Cadet',
        branch: userWithMissions?.branch || 'PLANET UNKNOWN',
        totalEnergy: 0,
        level: { level: 1, name: 'Explorer', min: 0, max: 150 },
        badgeIds: [] as string[],
        transactions: enrichedTransactions,
        rank: null,
        totalCadets: leaderboardCount,
        stats: {
          missions: missionsCount,
          events: registrations,
          gamesPlayed: 0
        },
        recentMissions
      };
    }

    const rank = await prisma.cadetProfile.count({
      where: { totalEnergy: { gt: cadet.totalEnergy } }
    });

    return {
      name: userWithMissions?.name || session.user.name || 'Anonymous Cadet',
      branch: userWithMissions?.branch || 'PLANET UNKNOWN',
      totalEnergy: cadet.totalEnergy,
      level: getCadetLevel(cadet.totalEnergy),
      badgeIds: cadet.badgeIds,
      transactions: enrichedTransactions,
      rank: rank + 1,
      totalCadets: leaderboardCount,
      stats: {
        missions: missionsCount,
        events: registrations,
        gamesPlayed: 0
      },
      recentMissions
    };
  } catch (error) {
    console.error('[getMyGamificationProfile]', error);
    return null;
  }
}

// ─── creator: grant energy ──────────────────────────────────────────────────────
export async function adminGrantEnergy(targetUserId: string, amount: number, note?: string) {
  try {
    const admin = await requireAuth();
    const adminUser = await prisma.admin.findUnique({ where: { id: admin.id } });
    if (!adminUser) return { success: false, error: 'Unauthorized' };

    return awardEnergyToUser(targetUserId, amount, 'ADMIN_GRANT', note);
  } catch (error) {
    console.error('[adminGrantEnergy]', error);
    return { success: false, error: 'Failed.' };
  }
}
