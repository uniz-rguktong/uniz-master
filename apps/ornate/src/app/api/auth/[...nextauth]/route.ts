import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { loginRateLimiter } from "@/lib/rate-limit";

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

                // Rate limit login attempts by IP using Upstash Redis
                const forwarded = req?.headers?.["x-forwarded-for"];
                const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : "127.0.0.1";
                const { success } = await loginRateLimiter.limit(ip);
                if (!success) {
                    throw new Error("Too many authentication attempts. Please wait 10 minutes.");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase().trim() },
                });

                if (!user || user.role !== "STUDENT") return null;

                const valid = await bcrypt.compare(credentials.password, user.password);
                if (!valid) return null;

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
        maxAge: 7 * 24 * 60 * 60, // 7 days
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
        signIn: "/",
        error: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
