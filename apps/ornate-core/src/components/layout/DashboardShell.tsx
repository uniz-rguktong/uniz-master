'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { signOut } from 'next-auth/react';
import type { User } from 'next-auth';

interface DashboardShellProps {
    children: React.ReactNode;
    user: User;
    branding?: any;
}

export function DashboardShell({ children, user: initialUser, branding }: DashboardShellProps) {
    const handleLogout = async () => {
        const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
        await signOut({ callbackUrl });
    };

    // Memoize the user object to prevent unnecessary re-renders in DashboardLayout
    const userMemo = useMemo(() => initialUser, [initialUser]);

    return (
        <DashboardLayout
            user={userMemo}
            onLogout={handleLogout}
            branding={branding}
        >
            {children}
        </DashboardLayout>
    );
}
