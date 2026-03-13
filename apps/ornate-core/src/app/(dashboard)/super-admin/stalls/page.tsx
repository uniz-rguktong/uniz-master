import { getStalls } from '@/actions/stallActions';
import StallsPageClient from './StallsPageClient';

export default async function StallsPage() {
    const response = await getStalls();

    if ('error' in response) {
        return (
            <div className="p-8 text-center text-red-500 font-medium">
                Error Loading Stalls: {response.error}
            </div>
        );
    }

    const initialStalls = 'stalls' in response ? (response.stalls || []) : [];

    return <StallsPageClient initialStalls={initialStalls} />;
}
