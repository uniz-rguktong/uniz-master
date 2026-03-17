import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/mail/aws-ses';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, branch, currentYear, phone } = body;

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required.' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters.' },
                { status: 400 }
            );
        }

        // Domain validation has been removed to allow all email accounts
        const emailLower = email.toLowerCase().trim();
        if (!emailLower.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return NextResponse.json(
                { error: 'Enter a valid email address.' },
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
                name: name.trim().toUpperCase(),
                email: emailLower,
                password: hashedPassword,
                role: 'STUDENT',
                branch: branch?.trim() || null,
                currentYear: currentYear?.trim() || null,
                phone: phone?.trim() || null,
                stdid: stdid.toUpperCase(),
            },
        });

        // Do not block account creation if SES send fails.
        void sendWelcomeEmail({
            to: user.email,
            name: user.name,
            studentId: user.stdid,
        }).catch((mailError) => {
            console.error('[REGISTER][WELCOME_MAIL]', mailError);
        });

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
