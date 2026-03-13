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
        const [{ schema }] = await prisma.$queryRawUnsafe("SELECT current_schema() AS schema");
        const baseTables = await prisma.$queryRawUnsafe(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_type = 'BASE TABLE'
            ORDER BY table_name ASC
        `);

        const tableSummary = {};
        let total = 0;

        for (const row of baseTables) {
            const tableName = row.table_name;
            const filename = `${tableName}.json`;
            const rows = await exportTable(tableName, filename);
            tableSummary[tableName] = rows.length;
            total += rows.length;
        }

        const summary = {
            exportedAt: new Date().toISOString(),
            schema,
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
