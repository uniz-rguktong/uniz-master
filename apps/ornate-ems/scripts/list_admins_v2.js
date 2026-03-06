const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Listing all admins:');
    const admins = await prisma.admin.findMany();
    console.log('---------------------------');
    admins.forEach(a => {
        console.log(`[${a.role}] ${a.name} (${a.email}) - Branch: ${a.branch}`);
    });
    console.log('---------------------------');
    console.log(`Total: ${admins.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
