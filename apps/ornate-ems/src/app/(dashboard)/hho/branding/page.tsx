"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { BranchLogosPage } from '@/components/features/sports/views/BranchLogosPage';

export default function HHOBrandingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const activeTab = tabParam === 'videos' ? 'videos' : 'logos';

    return (
        <BranchLogosPage
            defaultTab={activeTab}
            showTabNavigation
            tabOrder={['logos', 'videos']}
            tabLabels={{ logos: 'Brand Logos', videos: 'Promo Videos' }}
            onTabChange={(tab) => router.replace(`/hho/branding?tab=${tab}`)}
        />
    );
}