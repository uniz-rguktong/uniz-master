// Script to export all database tables to JSON files
// Run with: node prisma/export-data.js

// Use the generated client from the OLD schema (still in place before db push)
let PrismaClient;
try {
    PrismaClient = require('../src/lib/generated/client').PrismaClient;
} catch {
    PrismaClient = require('@prisma/client').PrismaClient;
}
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
    const backupDir = path.join(__dirname, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFolder = path.join(backupDir, `backup-${timestamp}`);

    // Create backup directories
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    console.log(`\n📦 Exporting database to: ${backupFolder}\n`);

    // Helper: export via raw SQL to bypass enum validation mismatches
    async function exportTable(name, filename) {
        console.log(`Exporting ${name}...`);
        try {
            const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${name}"`);
            // Convert BigInt to Number for JSON serialization
            const safe = JSON.parse(JSON.stringify(rows, (_, v) => typeof v === 'bigint' ? Number(v) : v));
            fs.writeFileSync(path.join(backupFolder, filename), JSON.stringify(safe, null, 2));
            console.log(`  ✅ ${safe.length} ${name} rows exported`);
            return safe;
        } catch (err) {
            console.warn(`  ⚠️  ${name}: ${err.message}`);
            fs.writeFileSync(path.join(backupFolder, filename), JSON.stringify([], null, 2));
            return [];
        }
    }

    try {
        const admins = await exportTable('Admin', 'admins.json');
        const users = await exportTable('User', 'users.json');
        const events = await exportTable('Event', 'events.json');
        const registrations = await exportTable('Registration', 'registrations.json');
        const snapshots = await exportTable('AnalyticsSnapshot', 'analytics-snapshots.json');
        const teams = await exportTable('Team', 'teams.json');
        const teamMembers = await exportTable('TeamMember', 'team-members.json');
        const announcements = await exportTable('Announcement', 'announcements.json');
        const winners = await exportTable('WinnerAnnouncement', 'winner-announcements.json');
        const tasks = await exportTable('Task', 'tasks.json');
        const notifications = await exportTable('Notification', 'notifications.json');
        const auditLogs = await exportTable('AuditLog', 'audit-logs.json');
        const promoVideos = await exportTable('PromoVideo', 'promo-videos.json');
        const galleryAlbums = await exportTable('GalleryAlbum', 'gallery-albums.json');
        const galleryImages = await exportTable('GalleryImage', 'gallery-images.json');
        const brandLogos = await exportTable('BrandLogo', 'brand-logos.json');

        const matches = await exportTable('Match', 'matches.json');
        const festSettings = await exportTable('FestSettings', 'fest-settings.json');
        const certThemes = await exportTable('CertificateTheme', 'certificate-themes.json');
        const bestStudents = await exportTable('BestOutgoingStudent', 'best-outgoing-students.json');
        const stalls = await exportTable('Stall', 'stalls.json');

        // Create a summary file
        const allCounts = {
            admins, users, events, registrations, snapshots: snapshots,
            teams, teamMembers, announcements, winners, tasks,
            notifications, auditLogs, promoVideos, galleryAlbums,
            galleryImages, brandLogos, matches, festSettings,
            certThemes, bestStudents, stalls
        };
        const tableSummary = {};
        let total = 0;
        for (const [k, v] of Object.entries(allCounts)) {
            tableSummary[k] = v.length;
            total += v.length;
        }
        const summary = {
            exportedAt: new Date().toISOString(),
            tables: tableSummary,
            totalRecords: total
        };
        fs.writeFileSync(
            path.join(backupFolder, '_summary.json'),
            JSON.stringify(summary, null, 2)
        );

        console.log('\n✨ Export complete!');
        console.log(`📁 Backup location: ${backupFolder}`);
        console.log(`📊 Total records: ${summary.totalRecords}`);

        // Also create a "latest" copy for easy access
        const latestFolder = path.join(backupDir, 'latest');
        if (fs.existsSync(latestFolder)) {
            fs.rmSync(latestFolder, { recursive: true });
        }
        fs.cpSync(backupFolder, latestFolder, { recursive: true });
        console.log(`📌 Latest backup also saved to: ${latestFolder}`);

    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
