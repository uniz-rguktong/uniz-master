import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthUser {
    id: string;
    role: string;
    email: string;
    name?: string | null;
    profilePicture?: string | null;
    branch?: string | null;
    clubId?: string | null;
}

export interface ScopeUser {
    id: string;
    role: string;
    email: string;
    branch?: string | null;
    clubId?: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;
    return session.user as AuthUser;
}
