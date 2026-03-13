'use client';

import dynamic from 'next/dynamic';

const SidebarMenu = dynamic(() => import('./SidebarMenu'), { ssr: false });

export default function SidebarWrapper() {
    return <SidebarMenu />;
}
