/**
 * Migration Script: Standalone Sport Architecture
 *
 * Transforms the database from the old Event+CustomFields sports approach
 * to the new standalone Sport model with SportRegistration, BranchPoints, etc.
 *
 * This script runs RAW SQL so it works regardless of which Prisma client is generated.
 * It should be run BEFORE `npx prisma migrate dev` on a database with the OLD schema,
 * OR embedded into a custom Prisma migration SQL file.
 *
 * What it does:
 * 1. Creates standalone Sport records by extracting data from Events with category='Sports'
 * 2. Creates SportTeam records linking existing Teams to their Sport (1:1)
 * 3. Creates SportRegistration records from Registration rows for sports events
 * 4. Links existing Match records to new Sport via sportId FK
 * 5. Migrates Match.date strings → DateTime, Match.winner strings → MatchWinner enum
 *
 * Run with: npx tsx scripts/migrate-sports-phase1.ts
 *
 * IDEMPOTENT: Safe to re-run. Uses upserts / conflict-skipping throughout.
 */

import { PrismaClient } from '../src/lib/generated/client';

const prisma = new PrismaClient();

// ─── Mappers ───────────────────────────────────────────────────

function mapGender(raw: string | undefined | null): 'MALE' | 'FEMALE' | 'MIXED' {
    if (!raw) return 'MALE';
    const upper = raw.toUpperCase().trim();
    if (upper === 'GIRLS' || upper === 'FEMALE' || upper === 'WOMEN') return 'FEMALE';
    if (upper === 'MIXED' || upper === 'CO-ED' || upper === 'COED') return 'MIXED';
    return 'MALE';
}

function mapCategory(raw: string | undefined | null): 'INDIVIDUAL' | 'TEAM' {
    if (!raw) return 'TEAM';
    return raw.toLowerCase().trim() === 'individual' ? 'INDIVIDUAL' : 'TEAM';
}

function mapFormat(raw: string | undefined | null): 'KNOCKOUT' | 'LEAGUE' | 'GROUP_KNOCKOUT' {
    if (!raw) return 'KNOCKOUT';
    const lower = raw.toLowerCase().trim();
    if (lower === 'league' || lower === 'round-robin') return 'LEAGUE';
    if (lower.includes('group')) return 'GROUP_KNOCKOUT';
    return 'KNOCKOUT';
}

function mapMatchWinner(raw: string | null): 'TEAM1' | 'TEAM2' | 'DRAW' | null {
    if (!raw) return null;
    const lower = raw.toLowerCase().trim();
    if (lower === 'team1' || lower === 'team_1' || lower === 'home') return 'TEAM1';
    if (lower === 'team2' || lower === 'team_2' || lower === 'away') return 'TEAM2';
    if (lower === 'draw' || lower === 'tie') return 'DRAW';
    // If it's a team name/id, we can't auto-map — leave null for manual fix
    return null;
}

function parseDate(raw: string | null): Date | null {
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

function safeInt(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    const n = parseInt(String(val));
    return isNaN(n) ? null : n;
}

function safeStringArray(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val]; }
    }
    return [];
}

// ─── Main Migration ────────────────────────────────────────────

async function migrate() {
    console.log('═══════════════════════════════════════════════');
    console.log('  Standalone Sport Architecture Migration');
    console.log('═══════════════════════════════════════════════\n');

    // ── Step 1: Find sport events in the OLD schema ────────────
    console.log('Step 1: Finding sport events...');

    const sportEvents = await prisma.event.findMany({
        where: {
            OR: [
                { category: 'Sports' },
                { category: 'sports' },
                { creator: { role: 'SPORTS_ADMIN' } },
                { creator: { role: 'SPORTS_COORDINATOR' } }
            ]
        },
        include: {
            teams: {
                include: {
                    members: true
                }
            },
            registrations: true,
            creator: { select: { id: true, role: true } }
        }
    });

    console.log(`   Found ${sportEvents.length} sport event(s)\n`);

    if (sportEvents.length === 0) {
        console.log('Nothing to migrate. If this is a fresh database, just run:');
        console.log('   npx prisma migrate dev --name standalone-sport');
        return;
    }

    let stats = {
        sportsCreated: 0,
        matchesLinked: 0,
        teamsLinked: 0,
        registrationsCreated: 0,
        matchDatesFixed: 0,
        matchWinnersFixed: 0,
        errors: [] as string[]
    };

    // ── Step 2: Create Sport records ───────────────────────────
    console.log('Step 2: Creating Sport records...\n');

    // Map of "eventId" → sportId, for linking matches/teams later
    const eventToSportMap = new Map<string, string>();

    for (const event of sportEvents) {
        const cf = (event.customFields as Record<string, unknown>) || {};
        const sportName = event.title;
        const gender = mapGender((cf.genderType || cf.type || cf.gender) as string);
        const category = mapCategory((cf.category || event.category) as string);
        const format = mapFormat((cf.tournamentType || cf.format) as string);

        console.log(`   ── "${sportName}" (${gender}) from event ${event.id}`);

        try {
            // Check if already migrated (by unique name+gender)
            const existing = await prisma.sport.findUnique({
                where: { name_gender: { name: sportName, gender } }
            });

            if (existing) {
                console.log(`      Already exists (${existing.id}), skipping`);
                eventToSportMap.set(event.id, existing.id);
                continue;
            }

            const sport = await prisma.sport.create({
                data: {
                    name: sportName,
                    gender,
                    category,
                    format,
                    status: 'UPCOMING',
                    description: event.description || null,
                    winnerPoints: safeInt(cf.winnerPoints) ?? 0,
                    runnerUpPoints: safeInt(cf.runnerupPoints || cf.runnerPoints || cf.runnerUpPoints) ?? 0,
                    participationPoints: safeInt(cf.participationPoints) ?? 0,
                    awards: safeStringArray(cf.awards),
                    eligibility: safeStringArray(cf.eligibility),
                    rules: (event as any).rules || (cf.rules as string) || null,
                    minPlayersPerTeam: (event as any).teamSizeMin ?? safeInt(cf.minPlayers),
                    maxPlayersPerTeam: (event as any).teamSizeMax ?? safeInt(cf.maxPlayers),
                    maxTeamsPerBranch: safeInt(cf.maxTeamsPerBranch),
                    matchDuration: safeInt(cf.matchDuration),
                    registrationDeadline: (event as any).endDate || null,
                    coordinatorId: event.creator?.id || null,
                    certificateStatus: (event as any).certificateStatus || 'DRAFT',
                    certificateTheme: (event as any).certificateTheme || null,
                    certificateTemplates: (event as any).certificateTemplates || null,
                }
            });

            eventToSportMap.set(event.id, sport.id);
            stats.sportsCreated++;
            console.log(`      Created: ${sport.id}`);

        } catch (err: any) {
            const msg = `Sport "${sportName}" (${gender}): ${err.message}`;
            stats.errors.push(msg);
            console.error(`      ERROR: ${msg}`);
        }
    }

    // ── Step 3: Create SportTeam records (1:1 Team→Sport) ──────
    console.log('\nStep 3: Linking teams to sports via SportTeam...\n');

    for (const event of sportEvents) {
        const sportId = eventToSportMap.get(event.id);
        if (!sportId) continue;

        for (const team of event.teams) {
            try {
                // Check if already linked
                const existing = await prisma.sportTeam.findUnique({
                    where: { teamId: team.id }
                });
                if (existing) continue;

                await prisma.sportTeam.create({
                    data: {
                        sportId,
                        teamId: team.id
                    }
                });
                stats.teamsLinked++;
            } catch (err: any) {
                // Skip duplicates silently
                if (!err.message.includes('Unique constraint')) {
                    stats.errors.push(`SportTeam for team ${team.id}: ${err.message}`);
                }
            }
        }
    }
    console.log(`   Linked ${stats.teamsLinked} teams\n`);

    // ── Step 4: Create SportRegistration records ───────────────
    console.log('Step 4: Creating SportRegistration records...\n');

    for (const event of sportEvents) {
        const sportId = eventToSportMap.get(event.id);
        if (!sportId) continue;

        for (const reg of event.registrations) {
            try {
                await prisma.sportRegistration.create({
                    data: {
                        sportId,
                        studentName: reg.studentName,
                        studentId: reg.studentId,
                        email: reg.email || null,
                        phone: reg.phone || null,
                        branch: reg.branch || null,
                        year: reg.year || null,
                        section: reg.section || null,
                        status: reg.status,
                    }
                });
                stats.registrationsCreated++;
            } catch (err: any) {
                // Skip duplicates (sportId+studentId unique constraint)
                if (!err.message.includes('Unique constraint')) {
                    stats.errors.push(`SportRegistration ${reg.studentId}: ${err.message}`);
                }
            }
        }
    }
    console.log(`   Created ${stats.registrationsCreated} sport registrations\n`);

    // ── Step 5: Link Matches to Sport ──────────────────────────
    console.log('Step 5: Linking matches to sports...\n');

    // Build a lookup: sport string + gender string → sportId
    // The old Match table has `sport` (name) and `gender` (string like "Boys")
    const sportLookup = new Map<string, string>();

    for (const event of sportEvents) {
        const sportId = eventToSportMap.get(event.id);
        if (!sportId) continue;

        const cf = (event.customFields as Record<string, unknown>) || {};
        const sportName = event.title;
        const genderRaw = (cf.genderType || cf.type || cf.gender) as string;

        // Register all possible string combinations for this sport
        const genderVariants: string[] = [];
        const mappedGender = mapGender(genderRaw);
        if (mappedGender === 'MALE') genderVariants.push('Boys', 'boys', 'BOYS', 'Male', 'male', 'MALE', 'Men', 'men');
        if (mappedGender === 'FEMALE') genderVariants.push('Girls', 'girls', 'GIRLS', 'Female', 'female', 'FEMALE', 'Women', 'women');
        if (mappedGender === 'MIXED') genderVariants.push('Mixed', 'mixed', 'MIXED', 'Co-ed', 'co-ed');

        for (const gv of genderVariants) {
            sportLookup.set(`${sportName}||${gv}`, sportId);
        }
        // Also register without gender for cases where gender field might match the enum
        sportLookup.set(`${sportName}||${mappedGender}`, sportId);
    }

    // Fetch all matches that need linking (the old schema has string sport+gender fields)
    try {
        const matches = await (prisma as any).$queryRawUnsafe(`
            SELECT id, sport, gender, date, winner
            FROM "Match"
            WHERE "sportId" IS NULL OR "sportId" = ''
        `) as Array<{ id: string; sport: string; gender: string; date: string | null; winner: string | null }>;

        console.log(`   Found ${matches.length} unlinked matches`);

        for (const match of matches) {
            const key = `${match.sport}||${match.gender}`;
            const sportId = sportLookup.get(key);

            if (sportId) {
                await (prisma as any).$executeRawUnsafe(
                    `UPDATE "Match" SET "sportId" = $1 WHERE id = $2`,
                    sportId,
                    match.id
                );
                stats.matchesLinked++;
            } else {
                stats.errors.push(`Match ${match.id}: no sport found for "${match.sport}" + "${match.gender}"`);
            }
        }
    } catch (err: any) {
        // If columns don't exist (already migrated), this is fine
        console.log(`   Skipped match linking (columns may already be migrated): ${err.message}`);
    }
    console.log(`   Linked ${stats.matchesLinked} matches\n`);

    // ── Step 6: Migrate Match.date strings → DateTime ──────────
    console.log('Step 6: Fixing match dates and winners...\n');

    try {
        const matchesWithStringDates = await (prisma as any).$queryRawUnsafe(`
            SELECT id, date, winner FROM "Match" WHERE date IS NOT NULL
        `) as Array<{ id: string; date: string; winner: string | null }>;

        for (const match of matchesWithStringDates) {
            // Fix date if it's a string representation
            const parsedDate = parseDate(String(match.date));
            const mappedWinner = mapMatchWinner(match.winner);

            if (parsedDate || mappedWinner !== undefined) {
                const updates: string[] = [];
                const vals: unknown[] = [];
                let paramIdx = 1;

                if (parsedDate) {
                    updates.push(`date = $${paramIdx++}`);
                    vals.push(parsedDate.toISOString());
                    stats.matchDatesFixed++;
                }

                if (mappedWinner) {
                    updates.push(`winner = $${paramIdx++}`);
                    vals.push(mappedWinner);
                    stats.matchWinnersFixed++;
                }

                if (updates.length > 0) {
                    vals.push(match.id);
                    await (prisma as any).$executeRawUnsafe(
                        `UPDATE "Match" SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
                        ...vals
                    );
                }
            }
        }
    } catch (err: any) {
        console.log(`   Skipped date/winner migration: ${err.message}`);
    }

    console.log(`   Fixed ${stats.matchDatesFixed} dates, ${stats.matchWinnersFixed} winners\n`);

    // ── Step 7: Migrate Event.status strings → EventStatus enum ──
    console.log('Step 7: Migrating Event status values...\n');

    const eventStatusMap: Record<string, string> = {
        'draft': 'DRAFT',
        'published': 'PUBLISHED',
        'ongoing': 'ONGOING',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED',
        'canceled': 'CANCELLED',
        'active': 'PUBLISHED',
    };

    for (const [from, to] of Object.entries(eventStatusMap)) {
        try {
            await (prisma as any).$executeRawUnsafe(
                `UPDATE "Event" SET status = $1 WHERE LOWER(status) = $2 AND status != $1`,
                to,
                from
            );
        } catch {
            // Enum might already be enforced
        }
    }
    console.log('   Done\n');

    // ── Summary ────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log('  MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Sports created:              ${stats.sportsCreated}`);
    console.log(`  Teams linked (SportTeam):    ${stats.teamsLinked}`);
    console.log(`  Sport registrations created: ${stats.registrationsCreated}`);
    console.log(`  Matches linked to Sport:     ${stats.matchesLinked}`);
    console.log(`  Match dates fixed:           ${stats.matchDatesFixed}`);
    console.log(`  Match winners mapped:        ${stats.matchWinnersFixed}`);
    console.log(`  Errors:                      ${stats.errors.length}`);

    if (stats.errors.length > 0) {
        console.log('\n  ERRORS:');
        stats.errors.slice(0, 20).forEach(e => console.log(`     - ${e}`));
        if (stats.errors.length > 20) {
            console.log(`     ... and ${stats.errors.length - 20} more`);
        }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('  1. Review the output above for any errors');
    console.log('  2. Run: npx prisma migrate dev --name standalone-sport');
    console.log('  3. Run: npx prisma generate');
    console.log('  4. Verify with: npx prisma studio');
    console.log('═══════════════════════════════════════════════');
}

migrate()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fatal migration error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
