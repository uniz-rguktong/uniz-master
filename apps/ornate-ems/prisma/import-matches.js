// Import matches by mapping short sport names to existing Sport records
// and creating missing Sport records as needed
const { PrismaClient } = require("../src/lib/generated/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, "backups", "latest");
const matches = JSON.parse(
  fs.readFileSync(path.join(backupDir, "matches.json"), "utf-8"),
);

function mapGender(raw) {
  if (!raw) return "MALE";
  const u = String(raw).toUpperCase().trim();
  if (["GIRLS", "FEMALE", "WOMEN"].includes(u)) return "FEMALE";
  if (["MIXED", "CO-ED", "COED"].includes(u)) return "MIXED";
  return "MALE";
}
function mapMatchWinner(raw) {
  if (!raw) return null;
  const l = String(raw).toLowerCase().trim();
  if (["team1", "team_1", "home"].includes(l)) return "TEAM1";
  if (["team2", "team_2", "away"].includes(l)) return "TEAM2";
  if (["draw", "tie"].includes(l)) return "DRAW";
  return null;
}
function mapMatchStatus(raw) {
  if (!raw) return "PENDING";
  const u = String(raw).toUpperCase().trim();
  if (["COMPLETED", "DONE", "FINISHED"].includes(u)) return "COMPLETED";
  if (["LIVE", "IN_PROGRESS", "ONGOING"].includes(u)) return "LIVE";
  if (["SCHEDULED"].includes(u)) return "SCHEDULED";
  return "PENDING";
}
function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

async function run() {
  const errors = [];

  // Get all existing sports from DB
  const allSports = await prisma.sport.findMany();
  console.log(`Existing sports in DB: ${allSports.length}`);
  allSports.forEach((s) => console.log(`  ${s.name} (${s.gender}) → ${s.id}`));

  // Build a flexible lookup: normalize sport name from matches → Sport.id
  // Match names are like "Basketball", "Cricket", "Volleyball", "Football", "Kabaddi", "Badminton", "Badminton Singles Open"
  // Event/Sport names are like "Basketball Tournament", "Cricket Championship", "Volleyball League", "Badminton Open", "Badminton Singles Open"
  const sportByNameGender = new Map();
  for (const s of allSports) {
    sportByNameGender.set(`${s.name}||${s.gender}`, s.id);
  }

  // Build keyword mapping: extract first word from Sport.name → sportId
  // e.g. "Basketball Tournament" → keyword "Basketball"
  const keywordMap = new Map(); // keyword||gender → sportId
  for (const s of allSports) {
    const keyword = s.name.split(" ")[0]; // "Basketball", "Volleyball", etc.
    const key = `${keyword}||${s.gender}`;
    if (!keywordMap.has(key)) keywordMap.set(key, s.id);
  }

  function findSportId(matchSport, matchGender) {
    const gender = mapGender(matchGender);
    // 1. Exact match
    const exact = sportByNameGender.get(`${matchSport}||${gender}`);
    if (exact) return exact;
    // 2. Keyword match (first word of match sport)
    const kw = matchSport.split(" ")[0];
    const kwMatch = keywordMap.get(`${kw}||${gender}`);
    if (kwMatch) return kwMatch;
    return null;
  }

  // Find which combos we need to create new Sports for
  const needed = new Map(); // "SportName||GENDER" → count
  for (const m of matches) {
    if (!m.sport || m.sport === "All") continue;
    const gender = mapGender(m.gender);
    const id = findSportId(m.sport, m.gender);
    if (!id) {
      const key = `${m.sport}||${gender}`;
      needed.set(key, (needed.get(key) || 0) + 1);
    }
  }

  if (needed.size > 0) {
    console.log(`\nCreating ${needed.size} missing Sport records:`);
    for (const [key, count] of needed) {
      const [name, gender] = key.split("||");
      try {
        const sport = await prisma.sport.create({
          data: {
            name,
            gender,
            category: "TEAM",
            format: "KNOCKOUT",
            status: "UPCOMING",
          },
        });
        sportByNameGender.set(key, sport.id);
        keywordMap.set(`${name}||${gender}`, sport.id);
        console.log(
          `  ✅ "${name}" (${gender}) → ${sport.id}  [${count} matches]`,
        );
      } catch (e) {
        if (e.message.includes("Unique constraint")) {
          const existing = await prisma.sport.findFirst({
            where: { name, gender },
          });
          if (existing) {
            sportByNameGender.set(key, existing.id);
            keywordMap.set(`${name}||${gender}`, existing.id);
          }
        } else {
          errors.push(`Create Sport "${name}": ${e.message}`);
        }
      }
    }
  }

  // Now import all matches
  console.log(`\nImporting ${matches.length} matches...`);
  let ok = 0,
    skip = 0;
  for (const row of matches) {
    if (!row.sport || row.sport === "All") {
      skip++;
      continue;
    }
    const sportId = findSportId(row.sport, row.gender);
    if (!sportId) {
      skip++;
      errors.push(
        `Match ${row.id}: still no sport for "${row.sport}||${row.gender}"`,
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
          status: mapMatchStatus(row.status),
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
      ok++;
    } catch (err) {
      if (!err.message.includes("Unique constraint"))
        errors.push(`Match ${row.id}: ${err.message}`);
      else ok++; // already exists
    }
  }
  console.log(`   ✅ ${ok} matches imported (${skip} skipped)\n`);

  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    errors.slice(0, 15).forEach((e) => console.log(`  - ${e}`));
    if (errors.length > 15) console.log(`  ... and ${errors.length - 15} more`);
  }
  console.log("Done!");
}

run()
  .catch((e) => console.error("Fatal:", e))
  .finally(() => prisma.$disconnect());
