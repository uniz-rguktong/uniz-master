const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting bulk registration...");

    // 1. Find the Cricket Event
    const cricketEvent = await prisma.event.findFirst({
        where: {
            OR: [
                { title: { contains: 'Cricket', mode: 'insensitive' } },
                { description: { contains: 'Cricket', mode: 'insensitive' } }
            ]
        }
    });

    if (!cricketEvent) {
        console.error("❌ Cricket event not found!");
        return;
    }

    console.log(`✅ Found Cricket Event: ${cricketEvent.title} (${cricketEvent.id})`);

    /*
     * User Request:
     * - EEE: Main ID '900' and 10 more students
     * - ECE: Main ID '193' and 10 more students
     * - CSE: Main ID '250' and 10 more students
     * - MECH: Main ID/Name 'SWAG RAJA' and 10 more
     * - CIVIL: Main ID/Name 'mayifsk' and 10 more
     */

    const teams = [
        { branch: 'EEE', mainId: '900', count: 10 },
        { branch: 'ECE', mainId: '193', count: 10 },
        { branch: 'CSE', mainId: '250', count: 10 },
        { branch: 'MECH', mainName: 'SWAG RAJA', mainId: 'MECH-KING', count: 10 },
        { branch: 'CIVIL', mainName: 'mayifsk', mainId: 'CIVIL-QUEEN', count: 10 }
    ];

    for (const team of teams) {
        console.log(`Processing team ${team.branch}...`);
        
        // Register Main Student
        let mainStudentName = team.mainName || `${team.branch} Captain`;
        let mainStudentId = team.mainId;

        await registerStudent(cricketEvent.id, mainStudentName, mainStudentId, team.branch);

        // Register "10 more"
        for (let i = 1; i <= team.count; i++) {
             await registerStudent(
                 cricketEvent.id, 
                 `${team.branch} Player ${i}`, 
                 `${team.branch}-00${i}`, 
                 team.branch
             );
        }
    }

    console.log("✅ Bulk registration complete!");
}

async function registerStudent(eventId, name, studentId, branch) {
    if (!studentId) {
        console.error(`  ❌ Skipping ${name}: Missing Student ID`);
        return;
    }

    const studentIdStr = studentId.toString();

    // Check if already registered
    const existing = await prisma.registration.findFirst({
        where: { 
            eventId: eventId, 
            studentId: studentIdStr 
        }
    });

    // If it exists but we want to confirm the name is correct (e.g. updating 'MECH Captain' to 'SWAG RAJA')
    // we could update it. But for now let's just skip if ID matches to be safe.
    if (existing) {
        // Optional: Update name if it was a placeholder?
        // Let's force update name if it matches specific user requests to ensure they see "SWAG RAJA"
        if (name === 'SWAG RAJA' || name === 'mayifsk') {
             await prisma.registration.update({
                 where: { id: existing.id },
                 data: { studentName: name }
             });
             console.log(`  ~ Updated name for ${studentIdStr} to ${name}`);
             return;
        }

        console.log(`  - Skipping ${name} (${studentIdStr}): Already registered.`);
        return;
    }

    try {
        await prisma.registration.create({
            data: {
                eventId: eventId,
                studentName: name,
                studentId: studentIdStr,
                status: 'ATTENDED', 
                paymentStatus: 'PAID',
                amount: 0,
            }
        });
        console.log(`  + Registered: ${name} (${studentIdStr})`);
    } catch (err) {
        console.error(`  ❌ Failed to register ${name}:`, err.message);
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
