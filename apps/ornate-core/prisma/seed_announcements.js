const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📢 Seeding Announcements...');

    // 1. Fetch an admin to be the creator (e.g., CSE Admin)
    const creator = await prisma.admin.findUnique({
        where: { email: 'cse@admin.com' }
    });

    if (!creator) {
        console.error('❌ Creator (cse@admin.com) not found. Please run individual seed first.');
        return;
    }

    const announcementsData = [
        {
            title: 'End Semester Exam Schedule Released',
            content: 'The end semester examination schedule for all years has been released. Please check the college website for detailed subject-wise timtetable.',
            category: 'Important',
            targetAudience: 'All Students',
            expiryDate: new Date('2026-05-30'),
            status: 'active',
            isPinned: true,
            viewCount: 1250,
            createdAt: new Date('2026-04-10')
        },
        {
            title: 'CodeSprint Hackathon Registration',
            content: 'Registrations for the annual CodeSprint Hackathon are now open! Teams of 3-4 members can register. exciting prizes to be won.',
            category: 'Events',
            targetAudience: 'All Students',
            expiryDate: new Date('2026-04-05'),
            status: 'active',
            isPinned: false,
            viewCount: 856,
            createdAt: new Date('2026-03-20')
        },
        {
            title: 'Library Maintenance Holiday',
            content: 'The central library will remain closed on 15th March for scheduled maintenance and stock verification.',
            category: 'Information',
            targetAudience: 'All Students',
            expiryDate: new Date('2026-03-16'),
            status: 'active',
            isPinned: false,
            viewCount: 430,
            createdAt: new Date('2026-03-12')
        },
        {
            title: 'Inter-Department Sports Meet',
            content: 'The sports meet kicks off next week. Interested participants should report to the PE department by Friday.',
            category: 'Updates',
            targetAudience: 'All Students',
            expiryDate: new Date('2026-02-28'),
            status: 'archived',
            isPinned: false,
            viewCount: 1100,
            createdAt: new Date('2026-02-10')
        },
        {
            title: 'Workshop on AI & ML',
            content: 'A 3-day workshop on Artificial Intelligence and Machine Learning will be conducted by industry experts.',
            category: 'Events',
            targetAudience: 'III Year',
            expiryDate: new Date('2026-03-25'),
            status: 'active',
            isPinned: false,
            viewCount: 560,
            createdAt: new Date('2026-03-18')
        },
        {
            title: 'Scholarship Application Deadline Extended',
            content: 'The deadline for submission of merit scholarship applications has been extended to 30th April.',
            category: 'Important',
            targetAudience: 'All Students',
            expiryDate: new Date('2026-04-30'),
            status: 'active',
            isPinned: true,
            viewCount: 2100,
            createdAt: new Date('2026-04-15')
        }
    ];

    for (const ann of announcementsData) {
        await prisma.announcement.create({
            data: {
                ...ann,
                creatorId: creator.id
            }
        });
    }

    console.log(`✅ Successfully added ${announcementsData.length} announcements.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
