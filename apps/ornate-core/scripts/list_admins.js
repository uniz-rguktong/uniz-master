const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAdmins() {
    console.log('Listing all admins from database...');
    const admins = await prisma.admin.findMany({ select: { id: true, name: true, branch: true, role: true } });
    console.log(JSON.stringify(admins, null, 2));
}

listAdmins().catch(console.error).finally(async () => await prisma.$disconnect());
