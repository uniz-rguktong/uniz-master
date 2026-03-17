
import { PrismaClient } from '../src/lib/generated/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Energy Data Cleanup ---');

  // 1. Find all users with their transactions
  const profiles = await prisma.cadetProfile.findMany({
    include: {
      User: {
        include: {
          EnergyTransaction: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  for (const profile of profiles) {
    const userId = profile.userId;
    const transactions = profile.User.EnergyTransaction;
    
    const seenNotes = new Set<string>();
    const toDeleteIds: string[] = [];
    let correctTotalEnergy = 0;

    for (const tx of transactions) {
      if (tx.note) {
        if (seenNotes.has(tx.note)) {
          console.log(`User ${profile.User.name}: Duplicate found for note "${tx.note}" (+${tx.amount}) - ID: ${tx.id}`);
          toDeleteIds.push(tx.id);
        } else {
          seenNotes.add(tx.note);
          correctTotalEnergy += tx.amount;
        }
      } else {
        // Transactions without notes are always kept (or we could dedupe by reason+amount+date if needed)
        correctTotalEnergy += tx.amount;
      }
    }

    if (toDeleteIds.length > 0) {
      console.log(`User ${profile.User.name}: Deleting ${toDeleteIds.length} duplicates. Correcting energy from ${profile.totalEnergy} to ${correctTotalEnergy}`);
      
      // Delete duplicates
      await prisma.energyTransaction.deleteMany({
        where: { id: { in: toDeleteIds } }
      });

      // Update total energy
      await prisma.cadetProfile.update({
        where: { userId },
        data: { totalEnergy: correctTotalEnergy }
      });
      
      console.log(`User ${profile.User.name}: Fixed.`);
    } else if (profile.totalEnergy !== correctTotalEnergy) {
       console.log(`User ${profile.User.name}: No duplicates but energy mismatch. Stored: ${profile.totalEnergy}, Calculated: ${correctTotalEnergy}. Fixing...`);
       await prisma.cadetProfile.update({
        where: { userId },
        data: { totalEnergy: correctTotalEnergy }
      });
    }
  }

  console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
