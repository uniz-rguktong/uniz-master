import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"

// Extend built-in types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            branch?: string | null;
            clubId?: string | null;
            profilePicture?: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        }
    }
    interface User {
        id: string;
        role: string;
        branch?: string | null;
        clubId?: string | null;
        profilePicture?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        branch?: string | null;
        clubId?: string | null;
        profilePicture?: string | null;
    }
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password')
                }

                // 1. Check Admin Table
                const user = await prisma.admin.findUnique({
                    where: { email: credentials.email }
                });


                if (!user || !user.password) {
                    throw new Error('No user found with this email')
                }

                const passwordMatch = await bcrypt.compare(credentials.password, user.password);

                if (!passwordMatch) {
                    throw new Error('Incorrect password')
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    branch: user.branch,
                    clubId: user.clubId || null,
                    profilePicture: user.profilePicture || null,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.branch = user.branch ?? null;
                token.id = user.id;
                token.clubId = user.clubId ?? null;
                token.profilePicture = user.profilePicture ?? null;
            }

            // Handle manual session updates
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name;
                const newImage = session.profilePicture || session.image;
                if (newImage) token.profilePicture = newImage;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.branch = token.branch ?? null;
                session.user.id = token.id;
                session.user.clubId = token.clubId ?? null;
                session.user.profilePicture = token.profilePicture ?? null;
                session.user.image = token.profilePicture ?? null;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    debug: false,
    cookies: {
        sessionToken: {
            name: `next-auth.session-token.ornate-core`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
}
