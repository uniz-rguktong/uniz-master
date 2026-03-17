import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized({ req, token }) {
                const path = req.nextUrl.pathname;

                // /login and / (landing) are always accessible
                if (path === '/' || path === '/login') return true;

                // All /home/* routes require authentication
                if (path.startsWith('/home')) {
                    return !!token;
                }

                return true;
            },
        },
        pages: {
            signIn: "/login",
        },
        cookies: {
            sessionToken: {
                name: `next-auth.session-token.ornate`,
            },
        },
    }
);

export const config = {
    // Match all routes except static files, _next, api/auth, api/register, and public assets
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|fonts|images|space|textures|api/auth|api/health|api/register).*)',
    ],
};
