'use client';

import { useSearchParams } from 'next/navigation';
import { AllRegistrationsPage } from '@/components/features/sports/views/AllRegistrationsPage';

export default function Page() {
    const searchParams = useSearchParams();
    const filterSport = searchParams.get('filterSport') || 'all';

    return <AllRegistrationsPage initialFilterSport={filterSport} />;
}
