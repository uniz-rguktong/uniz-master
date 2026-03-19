import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { sendOTPEmail } from '@/lib/mail/aws-ses';
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

        const emailLower = email.toLowerCase().trim();

        // Domain validation has been removed to allow all email accounts
        if (!emailLower.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
        }
        const cooldownKey = `otp-cooldown:${emailLower}`;
        const isOnCooldown = await redis.get(cooldownKey);
        if (isOnCooldown) {
            return NextResponse.json({ error: 'Verification signal already in transit. Wait 60s.' }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(`otp:${emailLower}`, otp, 'EX', 600); // 10 minutes TTL
        
        // Anti-spam cooldown
        await redis.set(cooldownKey, 'true', 'EX', 60);

        await sendOTPEmail(emailLower, otp);

        return NextResponse.json({ success: true, message: 'Verification signal transmitted.' });
    } catch (error: any) {
        console.error('[OTP_SEND]', error);
        return NextResponse.json({ 
            error: 'Failed to send OTP', 
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
