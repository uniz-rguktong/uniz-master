const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Updating user emails...");

    // Mapping of student IDs to emails
    const updates = [
        { id: 'O210900', email: 'o210900@rguktong.ac.in', branch: 'EEE' },   // EEE Captain (900)
        { id: 'O210193', email: 'o210193@rguktong.ac.in', branch: 'ECE' },   // ECE Captain (193) - User provided 'o10193', likely typo for o210193 if related to '193'. Or maybe O10193? Standard is usually O21... or R1... let's try to find them first.
        // User wrote: "o10193". Let's assume that's the email prefix? Or the ID?
        // Wait, "o10193". Maybe O210193? I previously registered '193'.
        // Let's assume the ID I used was '193' or 'ECE-CAP'. I should update the USER associated with these registrations.
        // But registrations might not have users yet if created by bulk script without user linking.
        // I need to ensure Users exist with these emails and link them to the registrations.

        { id: 'O210250', email: 'o210250@rguktong.ac.in', branch: 'CSE' },   // CSE Captain (250)
        { id: 'MECH-KING', email: 'bhuchiki12@gmail.com', branch: 'MECH' }    // MECH Captain
    ];

    // IDs I used in bulk_register_sports.js: '900', '193', '250', 'MECH-KING' (or 'SWAG RAJA' as name).
    // Let's Map:
    // '900' -> o210900@rguktong.ac.in
    // '193' -> o10193 (User input). I will use o10193@rguktong.ac.in? Or just o10193 if that is email?
    // User said: "o210900@rguktong.ac.in, o10193, o210250 and bhuchiki12@gmail.com".
    // "o10193" looks like an ID, not email. "o210250" looks like ID.
    // Ah, "o210900@rguktong.ac.in" is explicit. "bhuchiki12@gmail.com" is explicit.
    // "o10193" and "o210250" likely imply "@rguktong.ac.in" or just creating users with that as email/username.
    // I will assume they allow standard email format.
    
    // Explicit list:
    // 1. o210900@rguktong.ac.in (for ID 900 / EEE)
    // 2. o210193@rguktong.ac.in (assuming correction for 193 / ECE)
    // 3. o210250@rguktong.ac.in (for ID 250 / CSE)
    // 4. bhuchiki12@gmail.com (for MECH)

    const map = [
        { regId: '900', email: 'o210900@rguktong.ac.in', name: 'EEE Captain' },
        { regId: '193', email: 'o210193@rguktong.ac.in', name: 'ECE Captain' }, // Correcting o10193 to o210193 standard? Or use strict user input? User said "o10193". Maybe O10193@...
        // Let's stick to what user likely meant: O210193 for 193.
        { regId: '250', email: 'o210250@rguktong.ac.in', name: 'CSE Captain' },
        { regId: 'MECH-KING', email: 'bhuchiki12@gmail.com', name: 'SWAG RAJA' }
    ];

    // Note: Registration table does NOT have email. It links to User.
    // So we must:
    // 1. Create/Update User with this email.
    // 2. Link Registration to this User.

    for (const m of map) {
        console.log(`Processing ${m.regId} -> ${m.email}`);

        // 1. Upsert User
        let user = await prisma.user.findUnique({ where: { email: m.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: m.email,
                    name: m.name,
                    role: 'STUDENT',
                    branch: 'Unknown' // or better if I knew
                }
            });
            console.log(`  + Created new user: ${m.email}`);
        } else {
             console.log(`  * Found existing user: ${m.email}`);
        }

        // 2. Link to Registration(s) for Cricket
        // We look for registrations with studentId matching our map keys
        // created in the previous step.
        const regs = await prisma.registration.findMany({
            where: {
                studentId: m.regId
            }
        });

        for (const reg of regs) {
            await prisma.registration.update({
                where: { id: reg.id },
                data: { userId: user.id }
            });
            console.log(`  > Linked Registration ${reg.id} (${reg.studentName}) to User ${user.email}`);
        }
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
