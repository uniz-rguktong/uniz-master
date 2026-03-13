'use client';
import { OverviewPage } from '@/components/features/hho/views/OverviewPage';
import { WelcomeToast } from '@/components/dashboard/WelcomeToast';
import { useSession } from 'next-auth/react';

export default function HHODashboardPage() {
    const { data: session } = useSession();
    return (
        <>
            <WelcomeToast title="HHO Dashboard" />
            <OverviewPage user={session?.user as any} />
        </>
    );
}
