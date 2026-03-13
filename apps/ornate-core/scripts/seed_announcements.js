const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.admin.findFirst({
        where: { role: 'HHO' }
    }) || await prisma.admin.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
        console.error("No HHO or SUPER_ADMIN found.");
        return;
    }

    // 1. Delete existing announcements (mock data)
    await prisma.announcement.deleteMany({});
    console.log("Cleared existing announcements.");

    // 2. Add real announcements
    const announcements = [
        {
            title: "HHO Annual Fest Postponed",
            content: "Due to unforeseen circumstances, the annual fest scheduled for next week has been postponed. New dates will be announced soon.",
            category: "Important",
            isPinned: true,
            targetAudience: "All Students",
            expiryDate: new Date("2025-05-30"),
            creatorId: admin.id,
            status: "active",
            viewCount: 154
        },
        {
            title: "Hackathon Registration Opening",
            content: "Get ready for CodeQuest 2025! Registrations open tomorrow morning at 9:00 AM. Total prize pool of ₹50,000.",
            category: "Events",
            isPinned: false,
            targetAudience: "All Students",
            expiryDate: new Date("2025-04-10"),
            creatorId: admin.id,
            status: "active",
            viewCount: 890
        },
        {
            title: "Library Timings Extended",
            content: "To support students during exam preparation, library hours have been extended till 10:00 PM on weekdays.",
            category: "Updates",
            isPinned: false,
            targetAudience: "All Students",
            expiryDate: new Date("2025-06-15"),
            creatorId: admin.id,
            status: "active",
            viewCount: 432
        }
    ];

    await prisma.announcement.createMany({
        data: announcements
    });

    console.log(`Added ${announcements.length} new announcements.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
