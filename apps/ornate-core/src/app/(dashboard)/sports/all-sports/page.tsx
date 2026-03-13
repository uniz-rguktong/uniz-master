'use client';

import { AllSportsPage } from '@/components/features/sports/views/AllSportsPage';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();

    const handleNavigate = (path: string, params?: any) => {
        if (params && params.mode === 'edit' && params.initialData) {
            router.push(`/sports/${path}?mode=edit&id=${params.initialData.id}`);
        } else if (params && params.mode === 'view' && params.initialData) {
            router.push(`/sports/${path}?mode=view&id=${params.initialData.id}`);
        } else if (path === 'all-registrations' && (params?.eventId || params?.filterSport)) {
            const query = new URLSearchParams();
            if (params.eventId) query.set('eventId', params.eventId);
            if (params.filterSport) query.set('filterSport', params.filterSport);
            router.push(`/sports/${path}?${query.toString()}`);
        } else {
            router.push(`/sports/${path}`);
        }
    };

    return <AllSportsPage onNavigate={handleNavigate} calendarVariant="sports-admin" />;
}
