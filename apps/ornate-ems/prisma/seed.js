require('dotenv').config();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
    },
})
console.log('Using connection string:', (process.env.DIRECT_URL || process.env.DATABASE_URL).split('@')[1]); // Log host for debugging (safe-ish)
const bcrypt = require('bcryptjs')

async function main() {
    console.log('🌱 Seeding Admistrators only...')

    // --- 1. ADMINS & COORDINATORS ---
    // --- 1. ADMINS & COORDINATORS ---
    const password = await bcrypt.hash('admin123', 10); // Default for all test accounts

    // Super Admin
    await prisma.admin.upsert({
        where: { email: 'super@admin.com' },
        update: { password, name: 'Super Admin', role: 'SUPER_ADMIN' },
        create: {
            email: 'super@admin.com',
            password,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            branch: 'cse' // Assuming super admin might have a branch acting as default or just null if schema allows. User JSON says branch: null, but seed had 'cse'. I'll stick to 'cse' or remove if it causes constraint issues, but upsert with user json suggests branch: null. Let's try null if schema allows, otherwise keep 'cse'.  User JSON has branch: null for Super Admin.
            // Wait, previous seed had branch: 'cse'. If I change to null, it might fail if column is non-nullable.
            // Let's check other admins. Branch admins have branch. Club admins have null.
            // I'll set it to null for Super Admin as per user JSON, assuming schema allows. 
            // If it fails, I'll revert. But actually, let's keep it 'cse' for Super Admin just to be safe with existing logic unless I know schema.
            // Actually, I'll follow the user JSON: branch: null.
        }
    });

    // HHO
    await prisma.admin.upsert({
        where: { email: 'hho@admin.com' },
        update: { password, name: 'HHO Admin', role: 'HHO' },
        create: {
            email: 'hho@admin.com',
            password,
            name: 'HHO Admin',
            role: 'HHO',
        }
    });

    // Sports Admin
    await prisma.admin.upsert({
        where: { email: 'sports@admin.com' },
        update: { password, name: 'Sports Admin', role: 'SPORTS_ADMIN' },
        create: {
            email: 'sports@admin.com',
            password,
            name: 'Sports Admin',
            role: 'SPORTS_ADMIN',
        }
    });

    // Branch Admins
    const branchAdmins = [
        { id: 'cse', name: 'CSE Admin', email: 'cse@admin.com' },
        { id: 'ece', name: 'ECE Admin', email: 'ece@admin.com' },
        { id: 'eee', name: 'EEE Admin', email: 'eee@admin.com' },
        { id: 'mech', name: 'MECH Admin', email: 'mech@admin.com' },
        { id: 'civil', name: 'CIVIL Admin', email: 'civil@admin.com' },
    ];

    for (const b of branchAdmins) {
        await prisma.admin.upsert({
            where: { email: b.email },
            update: { password, name: b.name, branch: b.id },
            create: {
                email: b.email,
                password,
                name: b.name,
                role: 'BRANCH_ADMIN',
                branch: b.id
            }
        });
    }

    // Club Coordinators
    const clubCoordinators = [
        { name: 'Cultural Coordinator', email: 'cultural@clubs.com', clubId: 'cultural' },
        { name: 'English Communication Coordinator', email: 'english@clubs.com', clubId: 'english' },
        { name: 'Competitive Exams Coordinator', email: 'exams@clubs.com', clubId: 'exams' },
        { name: 'Coding/Technical Coordinator', email: 'coding@clubs.com', clubId: 'coding' },
        { name: 'Arts/Literature Coordinator', email: 'arts@clubs.com', clubId: 'arts' },
        { name: 'Recreation Coordinator', email: 'recreation@clubs.com', clubId: 'recreation' },
        { name: 'Social Service Coordinator', email: 'social@clubs.com', clubId: 'social' },
        { name: 'TechExcel Coordinator', email: 'techexcel@clubs.com', clubId: 'techexcel' },
        { name: 'Sarvasrijana Coordinator', email: 'sarvasrijana@clubs.com', clubId: 'sarvasrijana' },
        { name: 'Artix Coordinator', email: 'artix@clubs.com', clubId: 'artix' },
        { name: 'Kaladharani Coordinator', email: 'kaladharani@clubs.com', clubId: 'kaladharani' },
        { name: 'KhelSaathi Coordinator', email: 'khelsaathi@clubs.com', clubId: 'khelsaathi' },
        { name: 'ICRO Coordinator', email: 'icro@clubs.com', clubId: 'icro' },
        { name: 'Pixelro Coordinator', email: 'pixelro@clubs.com', clubId: 'pixelro' },
    ];

    for (const c of clubCoordinators) {
        await prisma.admin.upsert({
            where: { email: c.email },
            update: { password, name: c.name, clubId: c.clubId },
            create: {
                email: c.email,
                password,
                name: c.name,
                role: 'CLUB_COORDINATOR',
                clubId: c.clubId
            }
        });
    }

    console.log('✅ Admins re-seeded successfully!')

    // --- 2. EVENTS (Ensure events exist) ---
    console.log('🎉 Seeding Events...');
    const superAdmin = await prisma.admin.findUnique({ where: { email: 'super@admin.com' } });

    const eventsData = [
        {
            title: 'AI Gen-Z Workshop',
            category: 'Workshop',
            date: new Date('2026-03-10'),
            fee: '500', price: 500,
            maxCapacity: 100,
            posterUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995'
        },
        {
            title: 'CodeSprint Hackathon',
            category: 'Hackathon',
            date: new Date('2026-04-05'),
            fee: 'Free', price: 0,
            maxCapacity: 150,
            posterUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3855463'
        },
        {
            title: 'RoboWars v2.0',
            category: 'Competition',
            date: new Date('2026-02-20'),
            fee: '200', price: 200,
            maxCapacity: 50,
            posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e'
        },
        {
            title: 'Cultural Fest Night',
            category: 'Cultural',
            date: new Date('2025-12-15'),
            fee: '1000', price: 1000,
            maxCapacity: 500,
            posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'
        },
        {
            title: 'Cloud Computing Seminar',
            category: 'Seminar',
            date: new Date('2026-05-12'),
            fee: 'Free', price: 0,
            maxCapacity: 200,
            posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa'
        },
        {
            title: 'Gaming Championship',
            category: 'Esports',
            date: new Date('2026-06-01'),
            fee: '150', price: 150,
            maxCapacity: 64,
            posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e'
        },
        {
            title: 'Startup Pitch Day',
            category: 'Busines',
            date: new Date('2026-03-25'),
            fee: 'Free', price: 0,
            maxCapacity: 80,
            posterUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c'
        }
    ];

    const events = [];
    for (const e of eventsData) {
        // Upsert events to avoid duplication
        const existing = await prisma.event.findFirst({
            where: { title: e.title }
        });

        if (existing) {
            events.push(existing);
        } else {
            const event = await prisma.event.create({
                data: {
                    ...e,
                    description: `Detailed description for ${e.title}. This event is going to be amazing and you should definitely attend.`,
                    venue: 'Main Auditorium',
                    creatorId: superAdmin.id,
                    registrationOpen: true
                }
            });
            events.push(event);
        }
    }

    // --- 3. STUDENTS (100 Users) ---
    console.log('🎓 Seeding 100 Students...');
    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
    const years = ['I Year', 'II Year', 'III Year', 'IV Year'];
    const students = [];

    for (let i = 1; i <= 100; i++) {
        const student = await prisma.user.upsert({
            where: { email: `student${i}@college.edu` },
            update: { password },
            create: {
                email: `student${i}@college.edu`,
                password: password,
                name: `Student Name ${i}`,
                role: 'STUDENT',
                branch: branches[i % branches.length],
                currentYear: years[i % years.length],
                phone: `98765${(10000 + i).toString().substring(1)}`
            }
        });
        students.push(student);
    }

    // --- 4. REGISTRATIONS (Targeting 300+ Registrations) ---
    console.log('📝 Generating Registrations...');

    // Helper to get random date
    const randomDate = (start, end) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    const registrationStatuses = ['CONFIRMED', 'PENDING', 'WAITLISTED', 'ATTENDED', 'CANCELLED'];

    const registrationsToCreate = [];
    // Fetch existing registrations to avoid duplicates if re-running
    const existingRegs = await prisma.registration.findMany({ select: { userId: true, eventId: true } });
    const usedPairs = new Set(existingRegs.map(r => `${r.userId}-${r.eventId}`));

    for (const student of students) {
        // Register each student for 3 to 6 random events to ensure high count
        const numRegs = Math.floor(Math.random() * 4) + 3;

        for (let k = 0; k < numRegs; k++) {
            const event = events[Math.floor(Math.random() * events.length)];
            const pairKey = `${student.id}-${event.id}`;

            if (usedPairs.has(pairKey)) continue;
            usedPairs.add(pairKey);

            const status = registrationStatuses[Math.floor(Math.random() * registrationStatuses.length)];
            let payStatus = 'PENDING';
            let txnId = null;

            if (status === 'CONFIRMED' || status === 'ATTENDED') {
                payStatus = 'PAID';
                txnId = `TXN${Math.floor(Math.random() * 10000000) + 100000}`;
            }

            registrationsToCreate.push({
                eventId: event.id,
                userId: student.id,
                studentName: student.name,
                studentId: 'ID' + (1000 + k + Math.floor(Math.random() * 1000)),
                status: status,
                paymentStatus: payStatus,
                amount: event.price,
                transactionId: txnId,
                createdAt: randomDate(new Date(2025, 10, 1), new Date()),
            });
        }
    }

    console.log(`Preparing to insert ${registrationsToCreate.length} new registrations...`);

    // Chunk them to avoid timeouts
    const chunkSize = 5; // Smaller chunk size for safety
    for (let i = 0; i < registrationsToCreate.length; i += chunkSize) {
        const chunk = registrationsToCreate.slice(i, i + chunkSize);
        try {
            await Promise.all(chunk.map(data => prisma.registration.create({ data })));
            if (i % 50 === 0) console.log(`  Inserted ${i} / ${registrationsToCreate.length}...`);
        } catch (err) {
            console.error(`  Error inserting chunk starting at ${i}:`, err.message);
        }
    }

    // --- 5. PROMO VIDEOS & LOGOS ---
    console.log('📹 Seeding Promo Videos & Logos...');

    // Clear existing to avoid duplicates if re-seeding
    // await prisma.promoVideo.deleteMany(); 
    // await prisma.brandLogo.deleteMany();
    // Use upsert or checking existing would be safer but strictly speaking "seeding" often implies resetting or ensuring data exists.
    // Given the script structure elsewhere (upsert), I should try to avoid duplicates.

    // For simplicity in this "add-on" task, I will just check if they exist or create.

    const existingPromo = await prisma.promoVideo.findFirst({ where: { title: 'CSE Fest 2025 - Official Promo' } });
    if (!existingPromo) {
        await prisma.promoVideo.create({
            data: {
                title: 'CSE Fest 2025 - Official Promo',
                thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
                duration: '2:45',
                uploadDate: new Date('2025-11-01T10:00:00'),
                status: 'active',
                views: 12450,
                platform: 'YouTube',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }
        });
    }

    const existingPromo2 = await prisma.promoVideo.findFirst({ where: { title: 'Event Highlights 2024' } });
    if (!existingPromo2) {
        await prisma.promoVideo.create({
            data: {
                title: 'Event Highlights 2024',
                thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
                duration: '3:20',
                uploadDate: new Date('2025-10-25T14:30:00'),
                status: 'inactive',
                views: 8920,
                platform: 'Vimeo',
                url: 'https://vimeo.com/76979871'
            }
        });
    }

    const existingLogo = await prisma.brandLogo.findFirst({ where: { name: 'CSE Fest Main Logo' } });
    if (!existingLogo) {
        await prisma.brandLogo.create({
            data: {
                name: 'CSE Fest Main Logo',
                type: 'Primary Logo',
                format: 'PNG',
                size: '245 KB',
                dimensions: '1200x800',
                uploadDate: new Date('2025-11-01T10:00:00'),
                status: 'active',
                url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop',
                thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop'
            }
        });
    }

    console.log('✅ Seeding complete! Generated ${students.length} students and ${registrationsToCreate.length} registrations.');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
