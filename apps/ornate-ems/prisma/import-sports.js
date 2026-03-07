// Fix event statuses + create Sports, SportTeams, SportRegistrations, Matches
const { PrismaClient } = require("../src/lib/generated/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, "backups", "latest");

function loadJSON(f) {
  const p = path.join(backupDir, f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
}

function mapEventStatus(raw) {
  if (!raw) return "DRAFT";
  const map = {
    draft: "DRAFT",
    published: "PUBLISHED",
    active: "PUBLISHED",
    ongoing: "ONGOING",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    canceled: "CANCELLED",
  };
  return map[String(raw).toLowerCase()] || "DRAFT";
}
function mapGender(raw) {
  if (!raw) return "MALE";
  const u = String(raw).toUpperCase().trim();
  if (["GIRLS", "FEMALE", "WOMEN"].includes(u)) return "FEMALE";
  if (["MIXED", "CO-ED", "COED"].includes(u)) return "MIXED";
  return "MALE";
}
function mapCategory(raw) {
  if (!raw) return "TEAM";
  return String(raw).toLowerCase().trim() === "individual"
    ? "INDIVIDUAL"
    : "TEAM";
}
function mapFormat(raw) {
  if (!raw) return "KNOCKOUT";
  const l = String(raw).toLowerCase().trim();
  if (l === "league" || l === "round-robin") return "LEAGUE";
  if (l.includes("group")) return "GROUP_KNOCKOUT";
  return "KNOCKOUT";
}
function mapMatchWinner(raw) {
  if (!raw) return null;
  const l = String(raw).toLowerCase().trim();
  if (["team1", "team_1", "home"].includes(l)) return "TEAM1";
  if (["team2", "team_2", "away"].includes(l)) return "TEAM2";
  if (["draw", "tie"].includes(l)) return "DRAW";
  return null;
}
function safeInt(v) {
  if (v == null) return null;
  const n = parseInt(String(v));
  return isNaN(n) ? null : n;
}
function safeStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return [v];
    }
  }
  return [];
}
function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

async function run() {
  const errors = [];
  const events = loadJSON("events.json");
  const admins = loadJSON("admins.json");
  const registrations = loadJSON("registrations.json");
  const teams = loadJSON("teams.json");
  const matches = loadJSON("matches.json");

  // ── 1. Fix Event statuses ──────────────────────────────
  console.log("1. Fixing Event statuses...");
  let fixCount = 0;
  for (const ev of events) {
    const status = mapEventStatus(ev.status);
    if (status !== "DRAFT") {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Event" SET status = $1::"EventStatus" WHERE id = $2`,
          status,
          ev.id,
        );
        fixCount++;
      } catch (e) {
        errors.push(`EventStatus ${ev.id}: ${e.message}`);
      }
    }
  }
  console.log(`   ✅ Fixed ${fixCount} event statuses\n`);

  // ── 2. Create Sports from sport events ─────────────────
  console.log("2. Creating Sport records...");
  const sportsAdminIds = new Set(
    admins
      .filter((a) => ["SPORTS_ADMIN", "SPORTS_COORDINATOR"].includes(a.role))
      .map((a) => a.id),
  );
  const sportEvents = events.filter(
    (e) =>
      (e.category && e.category.toLowerCase() === "sports") ||
      sportsAdminIds.has(e.creatorId),
  );
  console.log(`   Found ${sportEvents.length} sport events`);

  const eventToSportId = new Map();
  for (const event of sportEvents) {
    const cf =
      event.customFields &&
      typeof event.customFields === "object" &&
      !Array.isArray(event.customFields)
        ? event.customFields
        : {};
    const sportName = event.title;
    const gender = mapGender(cf.genderType || cf.type || cf.gender);
    const category = mapCategory(cf.category || event.category);
    const format = mapFormat(cf.tournamentType || cf.format);

    try {
      const sport = await prisma.sport.create({
        data: {
          name: sportName,
          gender,
          category,
          format,
          status: "UPCOMING",
          description: event.description || null,
          winnerPoints: safeInt(cf.winnerPoints) ?? 0,
          runnerUpPoints:
            safeInt(
              cf.runnerupPoints || cf.runnerPoints || cf.runnerUpPoints,
            ) ?? 0,
          participationPoints: safeInt(cf.participationPoints) ?? 0,
          awards: safeStringArray(cf.awards),
          eligibility: safeStringArray(cf.eligibility),
          rules: event.rules || (cf.rules ? String(cf.rules) : null),
          minPlayersPerTeam: event.teamSizeMin ?? safeInt(cf.minPlayers),
          maxPlayersPerTeam: event.teamSizeMax ?? safeInt(cf.maxPlayers),
          maxTeamsPerBranch: safeInt(cf.maxTeamsPerBranch),
          matchDuration: safeInt(cf.matchDuration),
          registrationDeadline: event.endDate ? new Date(event.endDate) : null,
          coordinatorId: event.creatorId || null,
          certificateStatus: event.certificateStatus || "DRAFT",
          certificateTheme: event.certificateTheme || null,
          certificateTemplates: event.certificateTemplates || null,
        },
      });
      eventToSportId.set(event.id, sport.id);
      console.log(`   ✅ "${sportName}" (${gender}) → ${sport.id}`);
    } catch (err) {
      if (err.message.includes("Unique constraint")) {
        const existing = await prisma.sport.findFirst({
          where: { name: sportName, gender },
        });
        if (existing) {
          eventToSportId.set(event.id, existing.id);
          console.log(`   ⏭️  "${sportName}" (${gender}) already exists`);
        }
      } else {
        errors.push(`Sport "${sportName}": ${err.message}`);
        console.error(`   ❌ "${sportName}": ${err.message}`);
      }
    }
  }
  console.log(`   Mapped ${eventToSportId.size} event→sport links\n`);

  // ── 3. SportTeam (Team → Sport 1:1) ────────────────────
  console.log("3. Creating SportTeam records...");
  let stCount = 0;
  for (const team of teams) {
    const sportId = eventToSportId.get(team.eventId);
    if (!sportId) continue;
    try {
      await prisma.sportTeam.create({ data: { sportId, teamId: team.id } });
      stCount++;
    } catch (err) {
      if (!err.message.includes("Unique constraint"))
        errors.push(`SportTeam ${team.id}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${stCount} sport teams\n`);

  // ── 4. SportRegistration ───────────────────────────────
  console.log("4. Creating SportRegistrations...");
  let srCount = 0;
  for (const reg of registrations) {
    const sportId = eventToSportId.get(reg.eventId);
    if (!sportId) continue;
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
          status: reg.status || "PENDING",
          createdAt: new Date(reg.createdAt),
        },
      });
      srCount++;
    } catch (err) {
      if (!err.message.includes("Unique constraint"))
        errors.push(`SportReg ${reg.studentId}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${srCount} sport registrations\n`);

  // ── 5. Matches ─────────────────────────────────────────
  console.log("5. Importing Matches...");

  // Build lookup for match→sport
  const sportLookup = new Map();
  for (const event of sportEvents) {
    const sportId = eventToSportId.get(event.id);
    if (!sportId) continue;
    const cf =
      event.customFields &&
      typeof event.customFields === "object" &&
      !Array.isArray(event.customFields)
        ? event.customFields
        : {};
    const sportName = event.title;
    const mg = mapGender(cf.genderType || cf.type || cf.gender);
    const variants = [];
    if (mg === "MALE")
      variants.push(
        "Boys",
        "boys",
        "BOYS",
        "Male",
        "male",
        "MALE",
        "Men",
        "men",
      );
    if (mg === "FEMALE")
      variants.push(
        "Girls",
        "girls",
        "GIRLS",
        "Female",
        "female",
        "FEMALE",
        "Women",
        "women",
      );
    if (mg === "MIXED")
      variants.push("Mixed", "mixed", "MIXED", "Co-ed", "co-ed");
    variants.push(mg);
    for (const v of variants) sportLookup.set(`${sportName}||${v}`, sportId);
  }

  let mOk = 0,
    mSkip = 0;
  for (const row of matches) {
    const key = `${row.sport}||${row.gender}`;
    const sportId = sportLookup.get(key) || row.sportId;
    if (!sportId) {
      mSkip++;
      errors.push(
        `Match ${row.id}: no sport for "${row.sport}||${row.gender}"`,
      );
      continue;
    }

    try {
      await prisma.match.create({
        data: {
          id: row.id,
          sportId,
          round: row.round,
          matchId: row.matchId || null,
          team1Id: row.team1Id || null,
          team1Name: row.team1Name || null,
          team2Id: row.team2Id || null,
          team2Name: row.team2Name || null,
          date: parseDate(row.date),
          time: row.time || null,
          venue: row.venue || null,
          status: row.status || "PENDING",
          score1: row.score1 || null,
          score2: row.score2 || null,
          winner: mapMatchWinner(row.winner),
          note: row.note || null,
          referee: row.referee || null,
          matchOrder: row.matchOrder || row.roundOrder || 0,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
      mOk++;
    } catch (err) {
      errors.push(`Match ${row.id}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${mOk} matches imported (${mSkip} skipped)\n`);

  // ── Summary ────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log(`  Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log("\n  ERRORS (first 20):");
    errors.slice(0, 20).forEach((e) => console.log(`     - ${e}`));
    if (errors.length > 20)
      console.log(`     ... and ${errors.length - 20} more`);
  }
  console.log("═══════════════════════════════════════════════");
  console.log("Done!");
}

run()
  .catch((e) => console.error("Fatal:", e))
  .finally(() => prisma.$disconnect());
