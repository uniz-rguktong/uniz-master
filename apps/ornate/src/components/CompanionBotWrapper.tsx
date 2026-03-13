'use client';

import dynamic from 'next/dynamic';

const CompanionBot = dynamic(() => import('@/components/CompanionBot'), { ssr: false });

export default function CompanionBotWrapper() {
    return <CompanionBot />;
}
