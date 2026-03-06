const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function notifyAdmins(winner, runnerUp, eventName, sport) {
    if (!winner) return;

    // Branches to notify
    const extractBranch = (name) => {
        if (!name) return null;
        const potential = name.split(' ')[0].toUpperCase();
        if (['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'].includes(potential)) return potential;
        return null; // or throw/handle errors
    };

    const winnerBranch = extractBranch(winner);
    const runnerBranch = extractBranch(runnerUp);

    const notifications = [];

    // Notify Winner's Branch Admin
    if (winnerBranch) {
        const winnerAdmin = await prisma.admin.findFirst({
            where: { branch: winnerBranch, role: 'BRANCH_ADMIN' } 
        });
        if (winnerAdmin) {
            notifications.push({
                recipientId: winnerAdmin.id,
                recipientName: winnerAdmin.name || 'Branch Admin',
                recipientRole: 'BRANCH_ADMIN',
                message: `🎓 Certificates Distributed! Your ${sport} team (Champions) can now collect their certificates for ${eventName}.`,
                type: 'achievement',
                priority: 'high',
                senderId: 'system',
                senderName: 'System',
                senderRole: 'SYSTEM'
            });
            console.log(`Prepared notification for ${winnerBranch} Admin`);
        }
    }

    // Notify Runner-Up's Branch Admin
    if (runnerBranch) {
        const runnerAdmin = await prisma.admin.findFirst({
            where: { branch: runnerBranch, role: 'BRANCH_ADMIN' }
        });
        if (runnerAdmin) {
             notifications.push({
                recipientId: runnerAdmin.id,
                recipientName: runnerAdmin.name || 'Branch Admin',
                recipientRole: 'BRANCH_ADMIN',
                message: `🎓 Certificates Distributed! Your ${sport} team (Runner-Ups) can now collect their certificates for ${eventName}.`,
                type: 'achievement',
                priority: 'normal',
                senderId: 'system',
                senderName: 'System',
                senderRole: 'SYSTEM'
            });
            console.log(`Prepared notification for ${runnerBranch} Admin`);
        }
    }

    if (notifications.length > 0) {
         await prisma.notification.createMany({ data: notifications });
         console.log("✅ Notifications sent successfully!");
    } else {
        console.log("⚠️ No admins found to notify.");
    }
}
// This function needs to be exported or called. 
// For now, I'm just creating the script to demonstrate logic I will embed.
