const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting High Volume Registration Seeding Only...');

    // 1. Fetch Students
    const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' }
    });

    if (allStudents.length === 0) {
        console.log('❌ No students found.');
        return;
    }

    // 2. Fetch Events
    const allEvents = await prisma.event.findMany({
        select: { id: true, price: true, title: true }
    });

    if (allEvents.length === 0) {
        console.log('❌ No events found.');
        return;
    }

    console.log(`Found ${allStudents.length} students and ${allEvents.length} total events in DB.`);

    // 3. Existing Check
    const existingRegs = await prisma.registration.findMany({
        select: { userId: true, eventId: true }
    });
    const regSet = new Set(existingRegs.map(r => `${r.userId}-${r.eventId}`));
    console.log(`Existing registrations: ${existingRegs.length}`);

    const newRegistrations = [];
    const statuses = ['CONFIRMED', 'ATTENDED', 'PENDING', 'WAITLISTED', 'CANCELLED'];

    // 4. Generate Registrations per Student (At least 15 per student)
    for (const student of allStudents) {
        // Target: Randomly between 15 and 25 events per student (or max events available)
        // This ensures every student joins "at least any 15 events"
        const minEvents = 15;
        const maxEvents = Math.min(25, allEvents.length);
        const targetCount = Math.floor(Math.random() * (maxEvents - minEvents + 1)) + minEvents;

        // Shuffle events to pick random ones for this student
        const shuffledEvents = [...allEvents].sort(() => 0.5 - Math.random());
        let joinedCount = 0;

        for (const event of shuffledEvents) {
            if (joinedCount >= targetCount) break;

            const pairKey = `${student.id}-${event.id}`;

            // If already registered, count it towards the target and skip creating new one
            if (regSet.has(pairKey)) {
                joinedCount++;
                continue;
            }

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            let paymentStatus = 'PENDING';
            let txnId = null;

            if (status === 'CONFIRMED' || status === 'ATTENDED') {
                paymentStatus = 'PAID';
            } else if (event.price === 0) {
                paymentStatus = 'PAID';
            }

            if (paymentStatus === 'PAID') {
                txnId = `TXN${Math.floor(Math.random() * 10000000)}`;
            }

            newRegistrations.push({
                eventId: event.id,
                userId: student.id,
                studentName: student.name || 'Student',
                studentId: student.email.split('@')[0].toUpperCase(),
                status: status,
                paymentStatus: paymentStatus,
                amount: event.price,
                transactionId: txnId,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
            });

            regSet.add(pairKey);
            joinedCount++;
        }
    }

    if (newRegistrations.length > 0) {
        console.log(`\nInserting ${newRegistrations.length} new registrations...`);
        const batchSize = 25; // Smaller batch size to prevent connection drops
        for (let i = 0; i < newRegistrations.length; i += batchSize) {
            const batch = newRegistrations.slice(i, i + batchSize);
            await prisma.registration.createMany({ data: batch });
            process.stdout.write('.');
            // Tiny delay to help connection
            await new Promise(r => setTimeout(r, 100));
        }
        console.log('\n✅ High Volume Seeding Complete!');
    } else {
        console.log('\nNo new registrations needed (saturation reached).');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
