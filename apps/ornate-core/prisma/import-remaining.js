// Import remaining tables AFTER notifications
// (admins, users, events, registrations, teams, team members, announcements,
//  winner announcements, tasks, notifications are already imported)

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

async function importRemaining() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Importing Remaining Tables (after notifications)");
  console.log(`  Source: ${backupDir}`);
  console.log("═══════════════════════════════════════════════\n");

  const errors = [];

  // Audit Logs
  console.log("1. Importing Audit Logs...");
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
      errors.push(`AuditLog: ${e.message}`);
    }
  }
  console.log(`   ✅ ${al.length} audit logs`);

  // Analytics Snapshots
  console.log("2. Importing Analytics Snapshots...");
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
      errors.push(`Snapshot: ${e.message}`);
    }
  }
  console.log(`   ✅ ${snap.length} analytics snapshots`);

  // Promo Videos
  console.log("3. Importing Promo Videos...");
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
      errors.push(`PromoVideo: ${e.message}`);
    }
  }
  console.log(`   ✅ ${pv.length} promo videos`);

  // Gallery Albums
  console.log("4. Importing Gallery Albums...");
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

  // Gallery Images
  console.log("5. Importing Gallery Images...");
  const gi = loadJSON("gallery-images.json");
  for (const r of gi) {
    try {
      await prisma.galleryImage.create({
        data: { ...r, uploadedAt: new Date(r.uploadedAt) },
      });
    } catch (e) {
      errors.push(`Image: ${e.message}`);
    }
  }
  console.log(`   ✅ ${gi.length} gallery images`);

  // Brand Logos
  console.log("6. Importing Brand Logos...");
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
  console.log("7. Importing FestSettings...");
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
      errors.push(`FestSettings: ${e.message}`);
    }
  }
  console.log(`   ✅ ${fs2.length} fest settings`);

  // Certificate Themes
  console.log("8. Importing Certificate Themes...");
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
      errors.push(`CertTheme: ${e.message}`);
    }
  }
  console.log(`   ✅ ${ct.length} certificate themes`);

  // Best Outgoing Students
  console.log("9. Importing Best Outgoing Students...");
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

  // Stalls (has autoincrement id)
  console.log("10. Importing Stalls...");
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

  // Summary
  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log("\n  ERRORS:");
    errors.forEach((e) => console.log(`     - ${e}`));
  }
  console.log("═══════════════════════════════════════════════");
  console.log("Remaining import complete!");
}

importRemaining()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
