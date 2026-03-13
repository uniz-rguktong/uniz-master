import { EventAnalyticsPage } from '@/components/features/admin/views/EventAnalyticsPage';
import { getEventAnalytics } from '@/actions/analyticsGetters';

export default async function HHOEventAnalyticsPage() {
    const result = await getEventAnalytics();
    const initialEvents = result.success ? result.data : [];

    return <EventAnalyticsPage />;
}