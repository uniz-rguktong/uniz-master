import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();
        if (!email || !otp) return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });

        const emailLower = email.toLowerCase().trim();
        const storedOtp = await redis.get(`otp:${emailLower}`);

        if (!storedOtp) {
            return NextResponse.json({ error: 'Verification code expired. Resend required.' }, { status: 400 });
        }

        if (storedOtp !== otp) {
            return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
        }

        // Store verification status in Redis for 1 hour
        await redis.set(`verified:${emailLower}`, 'true', 'EX', 3600);

        return NextResponse.json({ verified: true, message: 'Email link authenticated.' });
    } catch (error) {
        console.error('[OTP_VERIFY]', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
