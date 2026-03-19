import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();
        if (!email || !newPassword) {
            return NextResponse.json({ error: 'Email and new password are required.' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Access code must be at least 6 characters.' }, { status: 400 });
        }

        const emailLower = email.toLowerCase().trim();

        const verified = await redis.get(`reset-verified:${emailLower}`);
        if (!verified) {
            return NextResponse.json(
                { error: 'Verification session expired. Please verify your email again.' },
                { status: 403 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email: emailLower } });
        if (!user) {
            // Don't reveal whether user exists — return success anyway
            return NextResponse.json({ success: true });
        }

        // Hash and update password
        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { email: emailLower },
            data: { password: hashed },
        });

        // Clean up verified session key
        await redis.del(`reset-verified:${emailLower}`);

        return NextResponse.json({ success: true, message: 'Access credentials updated.' });
    } catch (error: any) {
        console.error('[RESET_PASSWORD]', error);
        return NextResponse.json({ error: 'Server error. Try again.', details: error?.message }, { status: 500 });
    }
}
