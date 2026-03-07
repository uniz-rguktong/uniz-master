// Import backed-up data into the new standalone Sport schema
// Run with: node prisma/import-data.js
//
// This script:
// 1. Imports all non-sports tables (mapping enums where needed)
// 2. Creates Sport records from Events with category='Sports'
// 3. Creates SportRegistration, SportTeam, links Matches to Sports

let PrismaClient;
try {
  PrismaClient = require("../src/lib/generated/client").PrismaClient;
} catch {
  PrismaClient = require("@prisma/client").PrismaClient;
}
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, "backups", process.argv[2] || "latest");

function loadJSON(filename) {
  const filePath = path.join(backupDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  ${filename} not found, skipping`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// ─── Mappers ───────────────────────────────────────────────────

function mapGender(raw) {
  if (!raw) return "MALE";
  const upper = String(raw).toUpperCase().trim();
  if (["GIRLS", "FEMALE", "WOMEN"].includes(upper)) return "FEMALE";
  if (["MIXED", "CO-ED", "COED"].includes(upper)) return "MIXED";
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
  const lower = String(raw).toLowerCase().trim();
  if (lower === "league" || lower === "round-robin") return "LEAGUE";
  if (lower.includes("group")) return "GROUP_KNOCKOUT";
  return "KNOCKOUT";
}
function mapEventStatus(raw) {
  if (!raw) return "DRAFT";
  const map = {
    draft: "DRAFT",
    Draft: "DRAFT",
    published: "PUBLISHED",
    Published: "PUBLISHED",
    active: "PUBLISHED",
    Active: "PUBLISHED",
    ongoing: "ONGOING",
    Ongoing: "ONGOING",
    completed: "COMPLETED",
    Completed: "COMPLETED",
    cancelled: "CANCELLED",
    Cancelled: "CANCELLED",
    canceled: "CANCELLED",
  };
  return map[raw] || map[String(raw).toLowerCase()] || "DRAFT";
}
function mapMatchWinner(raw) {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  if (["team1", "team_1", "home"].includes(lower)) return "TEAM1";
  if (["team2", "team_2", "away"].includes(lower)) return "TEAM2";
  if (["draw", "tie"].includes(lower)) return "DRAW";
  return null;
}
function safeInt(val) {
  if (val === null || val === undefined) return null;
  const n = parseInt(String(val));
  return isNaN(n) ? null : n;
}
function safeStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [val];
    }
  }
  return [];
}
function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Main Import ───────────────────────────────────────────────
// Usage:
//   node prisma/import-data.js              → import remaining tables (skips admins/users/events/registrations)
//   node prisma/import-data.js --all        → import ALL tables from scratch
//   node prisma/import-data.js --all latest → import ALL from specific backup folder

const SKIP_ALREADY_IMPORTED = !process.argv.includes("--all");

async function importData() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Importing Data into New Schema");
  console.log(`  Source: ${backupDir}`);
  console.log(
    `  Mode: ${SKIP_ALREADY_IMPORTED ? "REMAINING ONLY (skip admins/users/events/registrations)" : "FULL IMPORT"}`,
  );
  console.log("═══════════════════════════════════════════════\n");

  if (!fs.existsSync(backupDir)) {
    console.error("Backup directory not found. Run export first.");
    process.exit(1);
  }

  const summaryPath = path.join(backupDir, "_summary.json");
  if (fs.existsSync(summaryPath)) {
    const s = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
    console.log(`Backup from: ${s.exportedAt} (${s.totalRecords} records)\n`);
  }

  const errors = [];

  // We always load these JSONs because later steps (Sport creation, SportRegistration) reference them
  const admins = loadJSON("admins.json");
  const events = loadJSON("events.json");
  const registrations = loadJSON("registrations.json");

  if (!SKIP_ALREADY_IMPORTED) {
    // ── 1. Admins ──────────────────────────────────────────────
    console.log("1. Importing Admins...");
    for (const row of admins) {
      try {
        await prisma.admin.create({
          data: {
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            role: row.role,
            branch: row.branch || null,
            clubId: row.clubId || null,
            createdAt: new Date(row.createdAt),
            bio: row.bio || null,
            designation: row.designation || null,
            notificationSettings: row.notificationSettings || null,
            phone: row.phone || null,
            preferences: row.preferences || null,
            profilePicture: row.profilePicture || null,
            coordinatorToken: row.coordinatorToken || null,
            coordinatorTokenExpiry: row.coordinatorTokenExpiry
              ? new Date(row.coordinatorTokenExpiry)
              : null,
          },
        });
      } catch (err) {
        errors.push(`Admin ${row.email}: ${err.message}`);
      }
    }
    console.log(`   ✅ ${admins.length} admins`);

    // ── 2. Users ───────────────────────────────────────────────
    console.log("2. Importing Users...");
    const users = loadJSON("users.json");
    for (const row of users) {
      try {
        await prisma.user.create({
          data: {
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            role: row.role || "STUDENT",
            branch: row.branch || null,
            currentYear: row.currentYear || null,
            phone: row.phone || null,
            createdAt: new Date(row.createdAt),
          },
        });
      } catch (err) {
        errors.push(`User ${row.email}: ${err.message}`);
      }
    }
    console.log(`   ✅ ${users.length} users`);

    // ── 3. Events (status → EventStatus enum) ─────────────────
    console.log("3. Importing Events...");
    for (const row of events) {
      try {
        await prisma.event.create({
          data: {
            id: row.id,
            title: row.title,
            description: row.description || "",
            date: new Date(row.date),
            venue: row.venue || "",
            category: row.category || null,
            creatorId: row.creatorId,
            posterUrl: row.posterUrl || null,
            additionalImages: row.additionalImages || [],
            registrationOpen: row.registrationOpen ?? true,
            fee: row.fee || "Free",
            price: row.price || 0,
            maxCapacity: row.maxCapacity || 100,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            certificateIssuedAt: row.certificateIssuedAt
              ? new Date(row.certificateIssuedAt)
              : null,
            certificateStatus: row.certificateStatus || "DRAFT",
            certificateTemplates: row.certificateTemplates || null,
            certificateTheme: row.certificateTheme || null,
            customFields: row.customFields || null,
            documents: row.documents || null,
            eligibility: row.eligibility || null,
            endDate: row.endDate ? new Date(row.endDate) : null,
            endTime: row.endTime || null,
            eventType: row.eventType || null,
            locationType: row.locationType || "physical",
            minParticipants: row.minParticipants || null,
            prizes: row.prizes || null,
            rules: row.rules || null,
            shortDescription: row.shortDescription || null,
            startTime: row.startTime || null,
            teamSizeMax: row.teamSizeMax || null,
            teamSizeMin: row.teamSizeMin || null,
            time: row.time || null,
            waitlistEnabled: row.waitlistEnabled ?? false,
            status: mapEventStatus(row.status),
            paymentGateway: row.paymentGateway || "All Methods",
          },
        });
      } catch (err) {
        errors.push(`Event "${row.title}": ${err.message}`);
      }
    }
    console.log(`   ✅ ${events.length} events`);

    // ── 4. Registrations ───────────────────────────────────────
    console.log("4. Importing Registrations...");
    let regOk = 0;
    for (const row of registrations) {
      try {
        await prisma.registration.create({
          data: {
            id: row.id,
            eventId: row.eventId,
            userId: row.userId || null,
            studentName: row.studentName,
            studentId: row.studentId,
            status: row.status || "PENDING",
            paymentStatus: row.paymentStatus || "PENDING",
            amount: row.amount || 0,
            transactionId: row.transactionId || null,
            screenshotUrl: row.screenshotUrl || null,
            createdAt: new Date(row.createdAt),
            certificateIssuedAt: row.certificateIssuedAt
              ? new Date(row.certificateIssuedAt)
              : null,
            certificateType: row.certificateType || null,
            certificateUrl: row.certificateUrl || null,
            rank: row.rank || null,
            email: row.email || null,
            phone: row.phone || null,
            branch: row.branch || null,
            year: row.year || null,
            section: row.section || null,
          },
        });
        regOk++;
      } catch (err) {
        if (!err.message.includes("Unique constraint"))
          errors.push(`Reg ${row.studentId}: ${err.message}`);
      }
    }
    console.log(`   ✅ ${regOk} registrations`);
  } else {
    console.log(
      "1-4. SKIPPED (admins, users, events, registrations already in DB)",
    );
    console.log("     Registrations imported via Supabase CSV.\n");
  }

  // ── 5. Teams ───────────────────────────────────────────────
  console.log("5. Importing Teams...");
  const teams = loadJSON("teams.json");
  for (const row of teams) {
    try {
      await prisma.team.create({
        data: {
          id: row.id,
          teamName: row.teamName,
          teamCode: row.teamCode,
          eventId: row.eventId || null,
          leaderId: row.leaderId,
          leaderName: row.leaderName,
          leaderEmail: row.leaderEmail,
          leaderPhone: row.leaderPhone || null,
          status: row.status || "PENDING",
          paymentStatus: row.paymentStatus || "PENDING",
          amount: row.amount || 0,
          transactionId: row.transactionId || null,
          screenshotUrl: row.screenshotUrl || null,
          registrationId: row.registrationId || null,
          isLocked: row.isLocked ?? false,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
    } catch (err) {
      errors.push(`Team ${row.teamCode}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${teams.length} teams`);

  // ── 6. TeamMembers ─────────────────────────────────────────
  console.log("6. Importing TeamMembers...");
  const teamMembers = loadJSON("team-members.json");
  for (const row of teamMembers) {
    try {
      await prisma.teamMember.create({
        data: {
          id: row.id,
          teamId: row.teamId,
          userId: row.userId || null,
          name: row.name,
          email: row.email,
          phone: row.phone || null,
          rollNumber: row.rollNumber || null,
          department: row.department || null,
          year: row.year || null,
          section: row.section || null,
          role: row.role || "MEMBER",
          status: row.status || "ACCEPTED",
          joinedAt: new Date(row.joinedAt),
        },
      });
    } catch (err) {
      if (!err.message.includes("Unique constraint"))
        errors.push(`Member ${row.email}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${teamMembers.length} team members`);

  // ── 7. Create Sport records from sports events ─────────────
  console.log("\n7. Creating Sport records from sports events...");
  const sportEvents = events.filter(
    (e) =>
      (e.category && e.category.toLowerCase() === "sports") ||
      admins.find(
        (a) =>
          a.id === e.creatorId &&
          ["SPORTS_ADMIN", "SPORTS_COORDINATOR"].includes(a.role),
      ),
  );
  console.log(`   Found ${sportEvents.length} sport events`);

  const eventToSportId = new Map();
  for (const event of sportEvents) {
    const cf = event.customFields || {};
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
      console.log(`   ✅ Sport: "${sportName}" (${gender}) → ${sport.id}`);
    } catch (err) {
      if (err.message.includes("Unique constraint")) {
        const existing = await prisma.sport.findFirst({
          where: { name: sportName, gender },
        });
        if (existing) eventToSportId.set(event.id, existing.id);
        console.log(`   ⏭️  "${sportName}" (${gender}) already exists`);
      } else {
        errors.push(`Sport "${sportName}": ${err.message}`);
      }
    }
  }
  console.log(`   Created ${eventToSportId.size} sports\n`);

  // ── 8. SportTeam (link Team → Sport 1:1) ──────────────────
  console.log("8. Creating SportTeam records...");
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

  // ── 9. SportRegistration ───────────────────────────────────
  console.log("9. Creating SportRegistrations...");
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

  // ── 10. Matches (link to Sport, convert date/winner) ──────
  console.log("10. Importing Matches...");
  const matches = loadJSON("matches.json");

  // Build lookup: old string "sportName||genderString" → sportId
  const sportLookup = new Map();
  for (const event of sportEvents) {
    const sportId = eventToSportId.get(event.id);
    if (!sportId) continue;
    const cf = event.customFields || {};
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

  // ── 11. Remaining tables (no schema changes) ──────────────
  console.log("11. Importing remaining tables...");

  // Announcements
  const ann = loadJSON("announcements.json");
  for (const r of ann) {
    try {
      await prisma.announcement.create({
        data: {
          id: r.id,
          title: r.title,
          content: r.content,
          category: r.category,
          isPinned: r.isPinned ?? false,
          targetAudience: r.targetAudience,
          expiryDate: new Date(r.expiryDate),
          status: r.status || "active",
          viewCount: r.viewCount || 0,
          creatorId: r.creatorId,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Ann: ${e.message}`);
    }
  }
  console.log(`   ✅ ${ann.length} announcements`);

  // Winner Announcements
  const wa = loadJSON("winner-announcements.json");
  for (const r of wa) {
    try {
      await prisma.winnerAnnouncement.create({
        data: {
          id: r.id,
          eventId: r.eventId,
          isPublished: r.isPublished ?? false,
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
          positions: r.positions,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`WA: ${e.message}`);
    }
  }
  console.log(`   ✅ ${wa.length} winner announcements`);

  // Tasks
  const tasks = loadJSON("tasks.json");
  for (const r of tasks) {
    try {
      await prisma.task.create({
        data: {
          ...r,
          date: new Date(r.date),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Task: ${e.message}`);
    }
  }
  console.log(`   ✅ ${tasks.length} tasks`);

  // Notifications
  const notifs = loadJSON("notifications.json");
  for (const r of notifs) {
    try {
      await prisma.notification.create({
        data: {
          id: r.id,
          senderId: r.senderId,
          senderName: r.senderName,
          senderRole: r.senderRole,
          senderBranch: r.senderBranch || null,
          recipientId: r.recipientId,
          recipientName: r.recipientName || null,
          recipientRole: r.recipientRole || null,
          message: r.message,
          isRead: r.isRead ?? false,
          isStarred: r.isStarred ?? false,
          isArchived: r.isArchived ?? false,
          priority: r.priority || "medium",
          type: r.type || "admin",
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Notif: ${e.message}`);
    }
  }
  console.log(`   ✅ ${notifs.length} notifications`);

  // Audit Logs
  const al = loadJSON("audit-logs.json");
  for (const r of al) {
    try {
      await prisma.auditLog.create({
        data: {
          id: r.id,
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId,
          metadata: r.metadata || null,
          performedBy: r.performedBy,
          ipAddress: r.ipAddress || null,
          userAgent: r.userAgent || null,
          timestamp: new Date(r.timestamp),
        },
      });
    } catch (e) {
      errors.push(`AL: ${e.message}`);
    }
  }
  console.log(`   ✅ ${al.length} audit logs`);

  // Analytics Snapshots
  const snap = loadJSON("analytics-snapshots.json");
  for (const r of snap) {
    try {
      await prisma.analyticsSnapshot.create({
        data: {
          ...r,
          snapshotDate: new Date(r.snapshotDate),
          createdAt: new Date(r.createdAt),
        },
      });
    } catch (e) {
      errors.push(`Snap: ${e.message}`);
    }
  }
  console.log(`   ✅ ${snap.length} analytics snapshots`);

  // Promo Videos
  const pv = loadJSON("promo-videos.json");
  for (const r of pv) {
    try {
      await prisma.promoVideo.create({
        data: {
          ...r,
          uploadDate: new Date(r.uploadDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`PV: ${e.message}`);
    }
  }
  console.log(`   ✅ ${pv.length} promo videos`);

  // Gallery Albums + Images
  const ga = loadJSON("gallery-albums.json");
  for (const r of ga) {
    try {
      await prisma.galleryAlbum.create({
        data: {
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Album: ${e.message}`);
    }
  }
  console.log(`   ✅ ${ga.length} gallery albums`);

  const gi = loadJSON("gallery-images.json");
  for (const r of gi) {
    try {
      await prisma.galleryImage.create({
        data: { ...r, uploadedAt: new Date(r.uploadedAt) },
      });
    } catch (e) {
      errors.push(`Img: ${e.message}`);
    }
  }
  console.log(`   ✅ ${gi.length} gallery images`);

  // Brand Logos
  const bl = loadJSON("brand-logos.json");
  for (const r of bl) {
    try {
      await prisma.brandLogo.create({
        data: {
          ...r,
          uploadDate: new Date(r.uploadDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Logo: ${e.message}`);
    }
  }
  console.log(`   ✅ ${bl.length} brand logos`);

  // FestSettings
  const fs2 = loadJSON("fest-settings.json");
  for (const r of fs2) {
    try {
      await prisma.festSettings.create({
        data: {
          id: r.id || "singleton",
          festName: r.festName || "ORNATE 2K26",
          tagline: r.tagline || null,
          logoUrl: r.logoUrl || null,
          brochureUrl: r.brochureUrl || null,
          description: r.description || null,
          startDate: r.startDate ? new Date(r.startDate) : null,
          endDate: r.endDate ? new Date(r.endDate) : null,
          venue: r.venue || null,
          registrationOpen: r.registrationOpen ?? true,
          maintenanceMode: r.maintenanceMode ?? false,
          guestRegistration: r.guestRegistration ?? true,
          emailNotifications: r.emailNotifications ?? true,
          instagramUrl: r.instagramUrl || null,
          youtubeUrl: r.youtubeUrl || null,
          supportEmail: r.supportEmail || null,
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`Fest: ${e.message}`);
    }
  }
  console.log(`   ✅ ${fs2.length} fest settings`);

  // Certificate Themes
  const ct = loadJSON("certificate-themes.json");
  for (const r of ct) {
    try {
      await prisma.certificateTheme.create({
        data: {
          id: r.id,
          name: r.name,
          preview: r.preview,
          colors: r.colors || [],
          style: r.style,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt || r.createdAt),
        },
      });
    } catch (e) {
      errors.push(`CT: ${e.message}`);
    }
  }
  console.log(`   ✅ ${ct.length} certificate themes`);

  // Best Outgoing Students
  const bos = loadJSON("best-outgoing-students.json");
  for (const r of bos) {
    try {
      await prisma.bestOutgoingStudent.create({
        data: {
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      });
    } catch (e) {
      errors.push(`BOS: ${e.message}`);
    }
  }
  console.log(`   ✅ ${bos.length} best outgoing students`);

  // Stalls (autoincrement id)
  const stalls = loadJSON("stalls.json");
  for (const r of stalls) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Stall" (id, name, type, owner, "bidAmount", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        r.id,
        r.name,
        r.type,
        r.owner,
        r.bidAmount,
        r.status,
        new Date(r.createdAt),
        new Date(r.updatedAt),
      );
    } catch (e) {
      errors.push(`Stall: ${e.message}`);
    }
  }
  console.log(`   ✅ ${stalls.length} stalls`);

  // ── Summary ────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("  IMPORT SUMMARY");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log("\n  ERRORS (first 30):");
    errors.slice(0, 30).forEach((e) => console.log(`     - ${e}`));
    if (errors.length > 30)
      console.log(`     ... and ${errors.length - 30} more`);
  }
  console.log("\n═══════════════════════════════════════════════");
  console.log("Import complete!");
  console.log("═══════════════════════════════════════════════");
}

importData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal import error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
