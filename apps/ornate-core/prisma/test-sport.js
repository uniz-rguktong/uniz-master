const { PrismaClient } = require('../src/lib/generated/client');
const p = new PrismaClient();

async function test() {
    try {
        const sport = await p.sport.create({
            data: {
                name: 'TestSport',
                gender: 'MALE',
                category: 'TEAM',
                format: 'KNOCKOUT',
                status: 'UPCOMING',
                winnerPoints: 0,
                runnerUpPoints: 0,
                participationPoints: 0,
                awards: [],
                eligibility: [],
                coordinatorId: 'cml93kk900002qzzg9lay8wso',
            }
        });
        console.log('OK:', sport.id);
        await p.sport.delete({ where: { id: sport.id } });
        console.log('Cleaned up');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await p.$disconnect();
    }
}
test();
