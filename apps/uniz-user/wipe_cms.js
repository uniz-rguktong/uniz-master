const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tDel = await prisma.tender.deleteMany({});
  const uDel = await prisma.publicNotification.deleteMany({});
  console.log('Deleted tenders: ' + tDel.count + ' updates: ' + uDel.count);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.());
