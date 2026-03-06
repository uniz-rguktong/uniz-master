const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding winner announcements...');

    // Clear existing winners to avoid conflicts
    await prisma.winnerAnnouncement.deleteMany({});

    // Fetch existing events
    const events = await prisma.event.findMany({
        take: 3,
        orderBy: { date: 'desc' }
    });

    if (events.length === 0) {
        console.log('No events found to seed winners for.');
        return;
    }

    const sampleWinners = [
        {
            eventId: events[0].id,
            isPublished: true,
            publishedAt: new Date(),
            positions: [
                {
                    rank: 1,
                    teamName: 'Byte Busters',
                    members: ['Rahul Kumar', 'Sneha Reddy'],
                    project: 'Smart Attendance System',
                    prize: '₹15,000 + Trophy',
                    certificate: true
                },
                {
                    rank: 2,
                    teamName: 'Code Alchemists',
                    members: ['Amit Singh', 'Priya Sharma'],
                    project: 'Virtual Campus Tour',
                    prize: '₹10,000',
                    certificate: true
                },
                {
                    rank: 3,
                    teamName: 'Innovators',
                    members: ['Suresh Raina', 'Deepika Padukon'],
                    project: 'E-Waste Management',
                    prize: '₹5,000',
                    certificate: true
                }
            ]
        },
        {
            eventId: events[1].id,
            isPublished: true,
            publishedAt: new Date(),
            positions: [
                {
                    rank: 1,
                    teamName: 'Team Alpha',
                    members: ['John Doe'],
                    project: null,
                    prize: 'Gold Medal',
                    certificate: true
                },
                {
                    rank: 2,
                    teamName: 'Team Beta',
                    members: ['Jane Smith'],
                    project: null,
                    prize: 'Silver Medal',
                    certificate: true
                }
            ]
        }
    ];

    if (events.length > 2) {
        sampleWinners.push({
            eventId: events[2].id,
            isPublished: false,
            publishedAt: null,
            positions: [
                {
                    rank: 1,
                    teamName: 'Draft Winner',
                    members: ['Draft Student'],
                    project: 'Draft Project',
                    prize: 'Draft Prize',
                    certificate: false
                }
            ]
        });
    }

    for (const winner of sampleWinners) {
        await prisma.winnerAnnouncement.create({
            data: winner
        });
    }

    console.log(`Seeded ${sampleWinners.length} winner announcements.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
