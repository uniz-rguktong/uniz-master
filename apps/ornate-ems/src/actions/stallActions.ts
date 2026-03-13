'use server';

import prisma from '@/lib/prisma';
import { revalidateStalls } from '@/lib/revalidation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeAction } from '@/lib/api-utils';

export interface StallInput {
    id?: number;
    stallNo?: string;
    name: string;
    type?: string;
    owner?: string;
    bidAmount?: string;
    description?: string;
    status?: string;
    menuItems?: any[];
    timings?: string;
    venue?: string;
    recommendedItem?: string;
    qrCodeUrl?: string;
    qrTargetUrl?: string;
    teamName?: string;
}

export async function getStalls() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const stalls = await prisma.stall.findMany({
            orderBy: { id: 'asc' }
        });
        return { success: true, stalls: JSON.parse(JSON.stringify(stalls)) };
    }, 'getStalls');
}

export async function saveStall(data: StallInput) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    return executeAction(async () => {
        // Ensure menuItems is a valid JSON array
        const menuItems = Array.isArray(data.menuItems) ? data.menuItems : [];

        const payload: any = {
            stallNo: data.stallNo || '-',
            name: data.name,
            type: data.type || 'Other',
            owner: data.owner || '-',
            bidAmount: data.bidAmount || '-',
            description: data.description || 'No description available.',
            menuItems: menuItems,
            timings: data.timings || '-',
            venue: data.venue || '-',
            recommendedItem: data.recommendedItem || '-',
            qrCodeUrl: data.qrCodeUrl || null,
            qrTargetUrl: data.qrTargetUrl || null,
            teamName: data.teamName || '-',
            // Sync status based on owner
            status: (data.owner && data.owner !== '-') ? 'Allocated' : 'Vacant',
        };

        let stall;
        if (data.id) {
            stall = await prisma.stall.update({
                where: { id: Number(data.id) },
                data: payload
            });
        } else {
            stall = await prisma.stall.create({
                data: payload
            });
        }

        await revalidateStalls();
        return { success: true, stall: JSON.parse(JSON.stringify(stall)) };
    }, 'saveStall');
}

export async function deleteStall(id: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    return executeAction(async () => {
        await prisma.stall.delete({
            where: { id: Number(id) }
        });
        await revalidateStalls();
        return { success: true };
    }, 'deleteStall');
}

export async function seedStalls(stalls: any[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    return executeAction(async () => {
        await prisma.stall.createMany({
            data: stalls.map(s => ({
                stallNo: s.stallNo || '-',
                name: s.name,
                type: s.type || 'Other',
                owner: s.owner || '-',
                bidAmount: s.bidAmount || '-',
                description: s.description || 'No description available.',
                status: s.status || 'Vacant',
                teamName: s.teamName || '-',
            }))
        });
        await revalidateStalls();
        return { success: true };
    }, 'seedStalls');
}
