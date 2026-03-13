const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Admin Table ---');
    const admins = await prisma.admin.findMany();
    if (admins.length === 0) console.log('No Admins found.');
    else admins.forEach(a => console.log(`[Admin] ${a.email} (${a.role}) - ${a.branch}`));

    console.log('\n--- Checking User Table (potential admins) ---');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { role: { in: ['ADMIN', 'BRANCH_ADMIN', 'SPORTS_ADMIN'] } },
                { email: { contains: 'admin' } }
            ]
        },
        take: 10
    });
    if (users.length === 0) console.log('No Admin-like Users found.');
    else users.forEach(u => console.log(`[User] ${u.email} (${u.role})`));
}

main()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });
