import "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        studentId?: string | null;
        branch?: string | null;
        currentYear?: string | null;
    }
    interface Session {
        user: {
            id: string;
            studentId?: string | null;
            name?: string | null;
            email?: string | null;
            branch?: string | null;
            currentYear?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        studentId?: string | null;
        branch?: string | null;
        currentYear?: string | null;
    }
}
