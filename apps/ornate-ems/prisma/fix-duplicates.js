const { PrismaClient } = require('../src/lib/generated/client');
const p = new PrismaClient();

async function fix() {
    // Find duplicates
    const dupes = await p.$queryRawUnsafe(`
        SELECT "eventId", "studentId", COUNT(*) as cnt 
        FROM "Registration" 
        GROUP BY "eventId", "studentId" 
        HAVING COUNT(*) > 1
    `);
    console.log(`Found ${dupes.length} duplicate (eventId, studentId) pairs`);

    for (const d of dupes) {
        console.log(`  ${d.eventId} / ${d.studentId} → ${d.cnt} rows`);
        // Keep the earliest one, delete the rest
        const rows = await p.$queryRawUnsafe(`
            SELECT id, "createdAt" FROM "Registration" 
            WHERE "eventId" = $1 AND "studentId" = $2 
            ORDER BY "createdAt" ASC
        `, d.eventId, d.studentId);
        const toDelete = rows.slice(1).map(r => r.id);
        if (toDelete.length > 0) {
            await p.$executeRawUnsafe(
                `DELETE FROM "Registration" WHERE id = ANY($1::text[])`,
                toDelete
            );
            console.log(`    Deleted ${toDelete.length} duplicate(s)`);
        }
    }

    const totalAfter = await p.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "Registration"`);
    console.log(`\nRegistrations remaining: ${totalAfter[0].c}`);
}

fix().catch(e => console.error(e)).finally(() => p.$disconnect());
