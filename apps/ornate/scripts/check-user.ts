
import { PrismaClient } from '../src/lib/generated/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: { contains: 'LEELADHAR', mode: 'insensitive' }
    },
    include: {
      CadetProfile: true,
      EnergyTransaction: {
        orderBy: { createdAt: 'asc' }
      },
    }
  });

  for (const user of users) {
    console.log(`User: ${user.name} (${user.id})`);
    console.log(`Total Energy: ${user.CadetProfile?.totalEnergy}`);
    console.log('Transactions:');
    user.EnergyTransaction.forEach(t => {
      console.log(`- ${t.reason} | ${t.amount} | Note: ${t.note} | Created: ${t.createdAt}`);
    });
    console.log('---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
