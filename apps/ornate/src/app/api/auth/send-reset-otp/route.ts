import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { sendOTPEmail } from '@/lib/mail/aws-ses';
const MAX_RESEND = 5;

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const emailLower = email.toLowerCase().trim();

        // Basic email format check (all domains allowed for password reset)
        if (!emailLower.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
        }

        // Rate-limit resend attempts
        const countKey = `reset-otp-count:${emailLower}`;
        const countRaw = await redis.get(countKey);
        const count = countRaw ? parseInt(String(countRaw), 10) : 0;
        if (count >= MAX_RESEND) {
            return NextResponse.json({ error: 'Maximum resend attempts reached. Try again later.' }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 5min TTL
        const otpKey = `reset-otp:${emailLower}`;
        await redis.set(otpKey, otp, 'EX', 300);

        // Increment resend count with 1hr TTL
        await redis.set(countKey, String(count + 1), 'EX', 3600);

        // Send OTP via AWS SES
        await sendOTPEmail(emailLower, otp);

        return NextResponse.json({ success: true, message: 'Verification signal transmitted.' });
    } catch (error: any) {
        console.error('[RESET_OTP_SEND]', error);
        return NextResponse.json({ error: 'Server error. Try again.', details: error?.message }, { status: 500 });
    }
}
