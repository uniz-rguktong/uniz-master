import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting DB migration to remove EVENT_REGISTER points...');

  // 1. Delete all transactions with reason 'EVENT_REGISTER'
  const txDelete = await prisma.energyTransaction.deleteMany({
    where: { reason: 'EVENT_REGISTER' }
  });
  console.log(`Deleted ${txDelete.count} EVENT_REGISTER transactions.`);

  // 2. Recalculate totalEnergy for all users based on remaining transactions
  const aggregatedEnergieTransactions = await prisma.energyTransaction.groupBy({
    by: ['userId'],
    _sum: { amount: true }
  });

  let profilesUpdated = 0;
  for (const agg of aggregatedEnergieTransactions) {
    if (agg.userId) {
      await prisma.cadetProfile.updateMany({
        where: { userId: agg.userId },
        data: { totalEnergy: agg._sum.amount || 0 }
      });
      profilesUpdated++;
    }
  }
  
  // Also clean up Redis cache to clear throttles and ranks
  console.log(`Updated totalEnergy for ${profilesUpdated} cadet profiles.`);
  
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
