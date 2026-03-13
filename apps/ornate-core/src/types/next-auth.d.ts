import "next-auth";
import "next-auth/jwt";

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
