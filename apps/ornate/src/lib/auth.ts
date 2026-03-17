import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimiters } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Student Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                // Rate limit login attempts by IP
                const ip = req?.headers?.["x-forwarded-for"] ?? "unknown";
                try {
                    const strIp = Array.isArray(ip) ? ip[0] : ip;
                    console.log(`[NextAuth] Checking rate limit for IP: ${strIp}`);
                    const rl = await rateLimiters.login(strIp);
                    if (!rl.success) {
                        console.warn(`[NextAuth] Rate limit exceeded for IP: ${strIp}`);
                        return null;
                    }
                } catch (err) {
                    console.error("[NextAuth] Rate limit error (Redis might be down or not configured):", err);
                    // allow login to proceed if redis is down locally
                }

                console.log(`[NextAuth] Searching for user with email: ${credentials.email}`);
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    console.warn(`[NextAuth] User not found for email: ${credentials.email}`);
                    return null;
                }

                if (user.role !== "STUDENT") {
                    console.warn(`[NextAuth] User ${credentials.email} role is not STUDENT (current role: ${user.role})`);
                    return null;
                }

                const valid = await bcrypt.compare(credentials.password, user.password);
                if (!valid) {
                    console.warn(`[NextAuth] Invalid password for user: ${credentials.email}`);
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    branch: user.branch,
                    currentYear: user.currentYear,
                    studentId: user.stdid || user.email.split('@')[0].toUpperCase(),
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // refresh session age every 24h
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.branch = (user as any).branch;
                token.currentYear = (user as any).currentYear;
                token.studentId = (user as any).studentId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).email = token.email;
                (session.user as any).branch = token.branch;
                (session.user as any).currentYear = token.currentYear;
                (session.user as any).studentId = token.studentId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: `next-auth.session-token.ornate`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
};

export async function getSession() {
    return getServerSession(authOptions);
}

export async function requireAuth() {
    const session = await getSession();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user;
}
