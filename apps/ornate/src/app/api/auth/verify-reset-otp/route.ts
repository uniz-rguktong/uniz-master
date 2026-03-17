import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();
        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
        }

        const emailLower = email.toLowerCase().trim();
        const otpKey = `reset-otp:${emailLower}`;

        // Brute-force guard
        const attemptKey = `reset-otp-attempts:${emailLower}`;
        const attemptsRaw = await redis.get(attemptKey);
        const attempts = attemptsRaw ? parseInt(String(attemptsRaw), 10) : 0;
        if (attempts >= 10) {
            return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
        }

        const stored = await redis.get(otpKey);
        if (!stored) {
            return NextResponse.json({ error: 'Verification expired. Request new code.' }, { status: 400 });
        }

        if (String(stored) !== String(otp)) {
            // Increment attempt counter (TTL: 5 min)
            await redis.set(attemptKey, String(attempts + 1), 'EX', 300);
            return NextResponse.json({ error: 'Authentication code incorrect.' }, { status: 400 });
        }

        // OTP is valid — delete OTP, set verified session key (15 min window to reset)
        await redis.del(otpKey);
        await redis.del(attemptKey);
        await redis.del(`reset-otp-count:${emailLower}`);
        await redis.set(`reset-verified:${emailLower}`, '1', 'EX', 900); // 15 min

        return NextResponse.json({ success: true, message: 'Identity confirmed.' });
    } catch (error: any) {
        console.error('[RESET_OTP_VERIFY]', error);
        return NextResponse.json({ error: 'Server error. Try again.', details: error?.message }, { status: 500 });
    }
}
