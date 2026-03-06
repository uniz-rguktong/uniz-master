import { getServerSession } from 'next-auth';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AuthProvider } from '@/context/AuthContext';

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    // Pass user to the client shell which handles the sidebar/header
    return (
        <AuthProvider>
            <DashboardShell user={session.user}>
                {children}
            </DashboardShell>
        </AuthProvider>
    );
}
