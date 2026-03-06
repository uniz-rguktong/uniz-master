
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting registration seeding...');

    // 1. Get or Create a Sports Admin (creator)
    const creator = await prisma.admin.findFirst({
        where: { role: 'SPORTS_ADMIN' }
    });

    if (!creator) {
        console.log('No Sports Admin found, please seed admins first.');
        return;
    }

    // 2. Get or Create Events
    // We need at least one team sport and one individual sport for better testing
    let teamEvent = await prisma.event.findFirst({
        where: {
            category: 'Sports',
            teamSizeMax: { gt: 1 }
        }
    });

    if (!teamEvent) {
        console.log('Creating a sample Team Sport Event...');
        teamEvent = await prisma.event.create({
            data: {
                title: 'Inter-Branch Basketball Championship',
                description: 'Annual basketball tournament for all branches.',
                date: new Date('2025-11-15'),
                venue: 'Main Court',
                category: 'Sports',
                creatorId: creator.id,
                teamSizeMin: 5,
                teamSizeMax: 12,
                registrationOpen: true,
                status: 'Upcoming'
            }
        });
    }

    let soloEvent = await prisma.event.findFirst({
        where: {
            category: 'Sports',
            teamSizeMax: 1
        }
    });

    if (!soloEvent) {
        console.log('Creating a sample Solo Sport Event...');
        soloEvent = await prisma.event.create({
            data: {
                title: 'Badminton Singles Open',
                description: 'Badminton singles championship.',
                date: new Date('2025-11-10'),
                venue: 'Indoor Stadium',
                category: 'Sports',
                creatorId: creator.id,
                teamSizeMin: 1,
                teamSizeMax: 1,
                registrationOpen: true,
                status: 'Upcoming'
            }
        });
    }

    // 3. Create Sample Students
    const students = [];
    for (let i = 1; i <= 20; i++) {
        const email = `student${i}@college.edu`;
        const student = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name: `Student ${i}`,
                email,
                password: 'password123', // Dummy
                role: 'STUDENT',
                branch: ['CSE', 'ECE', 'MECH', 'CIVIL'][Math.floor(Math.random() * 4)],
                currentYear: ['I', 'II', 'III', 'IV'][Math.floor(Math.random() * 4)],
                phone: `98765432${i.toString().padStart(2, '0')}`
            }
        });
        students.push(student);
    }

    console.log(`✅ Ensure ${students.length} students exist.`);

    // 4. Create Registrations for Solo Event
    // Let's register 5 students for the solo event
    console.log(`Creating registrations for ${soloEvent.title}...`);
    for (let i = 0; i < 5; i++) {
        const student = students[i];

        // Check if already registered
        const existing = await prisma.registration.findFirst({
            where: { eventId: soloEvent.id, userId: student.id }
        });

        if (!existing) {
            await prisma.registration.create({
                data: {
                    eventId: soloEvent.id,
                    userId: student.id,
                    studentName: student.name,
                    studentId: `ROLL-${student.id.substring(0, 5).toUpperCase()}`,
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    amount: 0
                }
            });
        }
    }

    // 5. Create Team Registrations
    // We need "5 teams" as per request.
    // Each team needs a leader and members.
    console.log(`Creating 5 teams for ${teamEvent.title}...`);

    // We'll use remaining students to form teams.
    // We need 5 leaders.
    const teamLeaders = students.slice(5, 10);
    const poolMembers = students.slice(10, 20);

    for (let i = 0; i < teamLeaders.length; i++) {
        const leader = teamLeaders[i];
        const teamName = `${leader.branch} Warriors ${i + 1}`;

        // Check if team exists
        let team = await prisma.team.findFirst({
            where: { eventId: teamEvent.id, leaderId: leader.id }
        });

        if (!team) {
            // Create Registration first (Team leader registers the team)
            const registration = await prisma.registration.create({
                data: {
                    eventId: teamEvent.id,
                    userId: leader.id,
                    studentName: leader.name,
                    studentId: `ROLL-${leader.id.substring(0, 5).toUpperCase()}`,
                    status: 'CONFIRMED',
                    paymentStatus: 'PENDING'
                }
            });

            // Create Team
            team = await prisma.team.create({
                data: {
                    teamName,
                    teamCode: `TEAM-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    eventId: teamEvent.id,
                    leaderId: leader.id,
                    leaderName: leader.name,
                    leaderEmail: leader.email,
                    leaderPhone: leader.phone,
                    status: 'CONFIRMED',
                    registrationId: registration.id
                }
            });

            console.log(`Created Team: ${teamName}`);

            // Add Leader as Member
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: leader.id,
                    name: leader.name,
                    email: leader.email,
                    role: 'LEADER',
                    status: 'ACCEPTED'
                }
            });

            // Add 2-3 random members from pool
            const teamMembersCount = 3;
            for (let j = 0; j < teamMembersCount; j++) {
                const member = poolMembers[Math.floor(Math.random() * poolMembers.length)];
                // Check uniqueness in team simple way (omitted for brevity, assume random enough or okay to fail unique constraint in seed)
                // Ideally checking if member already in team
                const existingMember = await prisma.teamMember.findFirst({
                    where: { teamId: team.id, email: member.email }
                });

                if (!existingMember) {
                    await prisma.teamMember.create({
                        data: {
                            teamId: team.id,
                            userId: member.id,
                            name: member.name,
                            email: member.email,
                            role: 'MEMBER',
                            status: 'ACCEPTED'
                        }
                    });
                }
            }
        }
    }

    console.log('✅ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
