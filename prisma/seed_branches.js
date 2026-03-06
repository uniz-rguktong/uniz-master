const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Branch Data with generative events...');

    // Load JSON data from backups/latest
    const backupDir = path.join(__dirname, 'backups', 'latest');
    const adminsPath = path.join(backupDir, 'admins.json');

    if (!fs.existsSync(adminsPath)) {
        console.error("❌ Admin backup file not found in prisma/backups/latest. Please run exported-data.js first.");
        return;
    }

    const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));

    // Define target branches to seed
    const targetBranches = ['ece', 'eee', 'mech', 'civil'];
    const branchNames = {
        'ece': 'ECE',
        'eee': 'EEE',
        'mech': 'MECH',
        'civil': 'CIVIL'
    };

    // Define branch-specific event templates
    const branchEventTemplates = {
        'ece': [
            { title: 'Circuit Design Workshop', category: 'Workshop', fee: '200' },
            { title: 'VLSI Symposium', category: 'Seminar', fee: 'Free' },
            { title: 'Embedded Systems Hackathon', category: 'Hackathon', fee: 'Free' },
            { title: 'Signal Processing Expo', category: 'Expo', fee: '100' },
            { title: 'Robotics Control Systems', category: 'Competition', fee: '300' }
        ],
        'eee': [
            { title: 'Green Energy Summit', category: 'Seminar', fee: 'Free' },
            { title: 'Power Systems Simulation', category: 'Workshop', fee: '250' },
            { title: 'Electric Vehicle Design', category: 'Project Expo', fee: '500' },
            { title: 'Circuit Debugging Contest', category: 'Competition', fee: '150' },
            { title: 'Renewable Tech Talk', category: 'Seminar', fee: 'Free' }
        ],
        'mech': [
            { title: 'CAD/CAM Masterclass', category: 'Workshop', fee: '400' },
            { title: 'Automobile Engineering Expo', category: 'Expo', fee: 'Free' },
            { title: 'Robotics Arm Challenge', category: 'Competition', fee: '300' },
            { title: 'Thermodynamics Quiz', category: 'Competition', fee: '50' },
            { title: '3D Printing Workshop', category: 'Workshop', fee: '600' }
        ],
        'civil': [
            { title: 'Sustainable Infrastructure', category: 'Seminar', fee: 'Free' },
            { title: 'Bridge Building Competition', category: 'Competition', fee: '200' },
            { title: 'AutoCAD for Civil Engineers', category: 'Workshop', fee: '350' },
            { title: 'Surveying Camp', category: 'Field Trip', fee: '1000' },
            { title: 'Concrete Technology Expo', category: 'Expo', fee: 'Free' }
        ]
    };

    // Common random descriptions
    const descriptions = [
        "Join us for an immersive experience in the field of {topic}. Learn from industry experts and network with peers.",
        "A hands-on session designed to boost your skills in {topic}. Certificates provided upon completion.",
        "Compete with the best minds in {topic}. exciting prizes to be won!",
        "Explore the latest trends and innovations in {topic}. Open to all years.",
        "An introductory workshop on {topic}, perfect for beginners and enthusiasts alike."
    ];

    // Posters (Generic Unsplash images)
    const genericPosters = [
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
        "https://images.unsplash.com/photo-1552664730-d307ca884978",
        "https://images.unsplash.com/photo-1544531586-fde5298cdd40",
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952"
    ];

    for (const branchCode of targetBranches) {
        const branchName = branchNames[branchCode];
        console.log(`\nProcessing ${branchName} (${branchCode})...`);

        // 1. Find or Create Branch Admin
        const adminEmail = `${branchCode}@admin.com`;
        let admin = await prisma.admin.findUnique({ where: { email: adminEmail } });

        if (!admin) {
            console.log(`  Admin ${adminEmail} not found in DB. Searching backup...`);
            const jsonAdmin = admins.find(a => a.email === adminEmail);

            if (jsonAdmin) {
                try {
                    admin = await prisma.admin.create({
                        data: {
                            name: jsonAdmin.name,
                            email: jsonAdmin.email,
                            password: jsonAdmin.password,
                            role: jsonAdmin.role,
                            branch: branchCode // Ensure branch matches loop
                        }
                    });
                    console.log(`  -> Created Admin: ${admin.email}`);
                } catch (e) {
                    console.error(`  -> Failed to create admin ${adminEmail}: ${e.message}`);
                    continue;
                }
            } else {
                // Create a fresh admin if not in backup but we know we need it
                console.log(`  -> Creating fresh admin for ${branchCode}`);
                // Use a default hash or fetch from existing admin if possible? 
                // We'll use the hash from the first admin in json as fallback or hardcode a known hash
                // Hardcoded hash for 'password123' (example) or reuse from backup
                const fallbackPassword = admins[0]?.password || "$2b$10$Pg1mDaz2Yysjgxu.w90yOeI7/hiDt/GE.0osooLyMARjsTcAz33rC";

                admin = await prisma.admin.create({
                    data: {
                        name: `${branchName} Admin`,
                        email: adminEmail,
                        password: fallbackPassword,
                        role: 'BRANCH_ADMIN',
                        branch: branchCode
                    }
                });
                console.log(`  -> Created New Admin: ${admin.email}`);
            }
        } else {
            console.log(`  -> Found Admin: ${admin.id}`);
        }

        // 2. Get Students for this branch
        const branchStudents = await prisma.user.findMany({
            where: {
                branch: { equals: branchCode, mode: 'insensitive' }
            }
        });
        console.log(`  -> Found ${branchStudents.length} students for ${branchName}`);

        // 3. Generate Unique Events
        const templates = branchEventTemplates[branchCode] || [];

        for (const template of templates) {
            // Check if event exists
            const existingEvent = await prisma.event.findFirst({
                where: { title: template.title, creatorId: admin.id }
            });

            if (existingEvent) {
                continue;
            }

            // Generate random date within March 2026
            const marchStart = new Date('2026-03-01');
            const marchEnd = new Date('2026-03-31');
            const randomDay = Math.floor(Math.random() * 31) + 1;
            const eventDate = new Date(`2026-03-${String(randomDay).padStart(2, '0')}`);

            const description = descriptions[Math.floor(Math.random() * descriptions.length)]
                .replace('{topic}', template.title);

            const poster = genericPosters[Math.floor(Math.random() * genericPosters.length)];

            const newEvent = await prisma.event.create({
                data: {
                    title: template.title,
                    description: description,
                    date: eventDate,
                    venue: ['Auditorium', 'Seminar Hall', 'Lab 1', 'Conference Room'][Math.floor(Math.random() * 4)],
                    category: template.category,
                    posterUrl: poster,
                    registrationOpen: true, // Open for March 2026 events
                    fee: template.fee,
                    price: template.fee === 'Free' ? 0 : Number(template.fee),
                    maxCapacity: [50, 100, 150, 200][Math.floor(Math.random() * 4)],
                    creatorId: admin.id
                }
            });
            console.log(`  + Created Event: ${template.title}`);

            // 4. Generate Registrations
            if (branchStudents.length > 0) {
                const numRegs = Math.floor(Math.random() * Math.min(20, branchStudents.length)) + 5;
                const shuffled = [...branchStudents].sort(() => 0.5 - Math.random());
                const selectedStudents = shuffled.slice(0, numRegs);

                const regData = selectedStudents.map(student => ({
                    eventId: newEvent.id,
                    userId: student.id,
                    studentName: student.name || 'Student',
                    studentId: student.email.split('@')[0].toUpperCase(),
                    status: 'CONFIRMED',
                    paymentStatus: newEvent.price > 0 ? 'PAID' : 'PENDING',
                    amount: newEvent.price
                }));

                if (regData.length > 0) {
                    await prisma.registration.createMany({ data: regData });
                    console.log(`    -> Registered ${regData.length} students.`);
                }
            }
        }
    }

    console.log('\n✅ Branch seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
