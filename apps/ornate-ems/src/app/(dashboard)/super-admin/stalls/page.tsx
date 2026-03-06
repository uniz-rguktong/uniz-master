import { getStalls } from '@/actions/stallActions';
import StallsPageClient from './StallsPageClient';

export default async function StallsPage() {
    const response = await getStalls();
    const initialStalls = 'stalls' in response ? (response.stalls || []) : [];

    return <StallsPageClient initialStalls={initialStalls} />;
}
