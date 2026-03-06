import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import logger from '@/lib/logger';

export interface FileDetail {
    name: string;
    size: string;
    createdAt: Date;
    url: string;
}

/**
 * Branch-isolated export listing.
 *
 * SUPER_ADMIN → sees all exports.
 * Any other admin → only sees files prefixed with their branch
 * (e.g., "MUMBAI__registrations-2025-01-27.csv").
 *
 * The branch prefix is injected by the save route (see save/route.ts).
 * Legacy files without a branch prefix are only visible to SUPER_ADMIN.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Admin role + branch check ──
        const adminCheck = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, branch: true }
        });
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const isSuperAdmin = adminCheck.role === 'SUPER_ADMIN';
        const adminBranch = adminCheck.branch;

        const exportsDir = path.join(process.cwd(), 'public', 'exports');

        if (!fs.existsSync(exportsDir)) {
            return NextResponse.json({ success: true, files: [] });
        }

        const files = fs.readdirSync(exportsDir);

        const fileDetails: FileDetail[] = files
            .filter(file => {
                // Ignore hidden files
                if (file.startsWith('.')) return false;

                // SUPER_ADMIN can see all files
                if (isSuperAdmin) return true;

                // Branch admins only see files belonging to their branch.
                // Files are prefixed as "BRANCH__filename.csv".
                // If admin has no branch set, they can only see files with no branch prefix.
                if (adminBranch) {
                    const branchPrefix = `${adminBranch}__`;
                    return file.startsWith(branchPrefix);
                }

                // Admin without a branch (shouldn't normally happen) sees no exports
                return false;
            })
            .map(file => {
                const filePath = path.join(exportsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: (stats.size / 1024).toFixed(2) + ' KB',
                    createdAt: stats.birthtime,
                    url: `/exports/${file}`
                };
            })
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json({ success: true, files: fileDetails });
    } catch (error: any) {
        logger.error({ err: error }, 'List Exports Error');
        const message = process.env.NODE_ENV === 'production'
            ? 'Failed to list exports'
            : ((error as Error).message || 'Failed to list exports');
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

