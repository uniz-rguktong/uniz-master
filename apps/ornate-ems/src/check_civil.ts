import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCivilEvents() {
    const events = await prisma.event.findMany({
        where: {
            organizer: {
                contains: 'CIVIL',
                mode: 'insensitive'
            }
        }
    });

    console.log('Events found for CIVIL:', JSON.stringify(events, null, 2));

    const allOrganizers = await prisma.event.findMany({
        select: { organizer: true },
        distinct: ['organizer']
    });

    console.log('All Organizers:', JSON.stringify(allOrganizers, null, 2));
}

checkCivilEvents()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
