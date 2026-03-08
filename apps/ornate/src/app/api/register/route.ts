import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerRateLimiter } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';
import { redis } from '@/lib/redis';


export async function POST(req: NextRequest) {
    // Rate limit registrations by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : "127.0.0.1";
    const { success } = await registerRateLimiter.limit(ip);
    if (!success) {
        return NextResponse.json(
            { error: 'Too many registrations. Please try again in an hour.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { name, email, password, branch, currentYear, phone } = body;

        const emailLower = email.toLowerCase().trim();

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required.' },
                { status: 400 }
            );
        }

        // Check verification status in Redis
        const verified = await redis.get(`verified:${emailLower}`);
        if (!verified) {
            return NextResponse.json(
                { error: 'Email verification required.' },
                { status: 401 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters.' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email: emailLower } });
        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists.' },
                { status: 409 }
            );
        }

        // Derive student ID from email prefix (e.g. o210900@rguktong.ac.in → O210900)
        const stdid = emailLower.split('@')[0].toUpperCase();

        // Check stdid uniqueness
        const existingStdid = await prisma.user.findUnique({ where: { stdid } });
        if (existingStdid) {
            return NextResponse.json(
                { error: 'A student with this ID already exists.' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = crypto.randomUUID();

        const user = await prisma.user.create({
            data: {
                id,
                name: name.trim(),
                email: emailLower,
                password: hashedPassword,
                role: 'STUDENT',
                branch: branch?.trim() || null,
                currentYear: currentYear?.trim() || null,
                phone: phone?.trim() || null,
                stdid,
            },
        });

        // Send welcome email (asynchronously, don't block the response)
        sendWelcomeEmail(user.email, user.name || 'Cadet', stdid).catch(console.error);

        // Remove verification status after successful registration
        await redis.del(`verified:${emailLower}`);

        return NextResponse.json(
            { message: 'Account created successfully.', id: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error('[REGISTER]', error);
        return NextResponse.json(
            { error: 'Server error. Please try again.' },
            { status: 500 }
        );
    }
}
