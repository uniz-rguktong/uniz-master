const { PrismaClient } = require('../src/lib/generated/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Admin Table ---');
    try {
        const admins = await prisma.admin.findMany();
        if (admins.length === 0) console.log('No Admins found.');
        else admins.forEach(a => console.log(`[Admin] ${a.email} (${a.role}) - ${a.branch}`));
    } catch (e) {
        console.error('Error fetching admins:', e);
    }

    console.log('\n--- Checking User Table ---');
    try {
        const users = await prisma.user.findMany({ take: 5 });
        users.forEach(u => console.log(`[User] ${u.email} (${u.role})`));
    } catch (e) {
        console.error('Error fetching users:', e);
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
