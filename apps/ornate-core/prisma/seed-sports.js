require('dotenv').config();
const { PrismaClient } = require('../src/lib/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('🌱 Seeding Sports Admins...');

    const defaultPassword = await bcrypt.hash('admin123', 10);

    // Original hashed password from reference
    const mainAdminPassword = "$2b$10$Pg1mDaz2Yysjgxu.w90yOeI7/hiDt/GE.0osooLyMARjsTcAz33rC";

    const branches = [
        { id: 'cse', name: 'Computer Science' },
        { id: 'ece', name: 'Electronics & Comm.' },
        { id: 'eee', name: 'Electrical & Electronics' },
        { id: 'mech', name: 'Mechanical' },
        { id: 'civil', name: 'Civil Engineering' },
    ];

    // Main Sports Admin based on reference data
    const mainSportsAdminPayload = {
        id: "cml93kk900002qzzg9lay8wso",
        name: "Sports Admin",
        role: "SPORTS_ADMIN",
        branch: null,
        clubId: null,
        createdAt: new Date("2026-02-05T06:50:32.964Z"),
        // Prisma expects JS objects for Json/jsonb fields if they represent a JSON object in DB. 
        // Parsing the stringified JSON from the reference list:
        notificationSettings: JSON.parse("{\"securityAlerts\": true, \"tournamentUpdates\": true, \"systemAnnouncements\": false, \"registrationSummaries\": false}"),
        preferences: JSON.parse("{\"darkMode\": false, \"language\": \"English (International)\", \"timezone\": \"Asia/Kolkata\", \"compactView\": false, \"passkeyEnabled\": false, \"advancedProtection\": true}")
    };

    await prisma.admin.upsert({
        where: { email: 'sports@admin.com' },
        update: mainSportsAdminPayload,
        create: {
            email: 'sports@admin.com',
            password: mainAdminPassword,
            ...mainSportsAdminPayload
        }
    });
    console.log(`✅ Upserted Main Sports Admin (sports@admin.com)`);

    // Branch Sports Admins (Dynamic from LoginPage.tsx branch mapping)
    for (const b of branches) {
        const email = `sports_${b.id}@admin.com`;
        const name = `${b.name} Sports Admin`;

        await prisma.admin.upsert({
            where: { email },
            update: {
                password: defaultPassword,
                name,
                role: 'SPORTS_ADMIN',
                branch: b.id
            },
            create: {
                email,
                password: defaultPassword,
                name,
                role: 'SPORTS_ADMIN',
                branch: b.id
            }
        });
        console.log(`✅ Upserted ${name} (${email})`);
    }

    console.log('🎉 Sports Admins seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
