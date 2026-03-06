import EventPerformanceChart from './EventPerformanceChart';
import { EventFilters } from './EventFilters';
import { getEventAnalytics } from '@/actions/analyticsGetters';

export default async function EventsAnalyticsPage() {
    const res = await getEventAnalytics();
    let chartData: Array<{ name: string; Participations: number; 'Total Registrations': number }> = [];

    const CATEGORIES = [
        'Technical Events',
        'Technical Fun Games',
        'Hackathons',
        'Quizzes',
        'Workshops',
        'Project Expo',
        'Fun Games',
        'Pre-events',
        'Sports',
        'Cultural'
    ];

    const normalizeCategory = (rawCategory: string | null | undefined): string | null => {
        const normalized = String(rawCategory || '').trim().toLowerCase();

        const mapping: Record<string, string> = {
            'technical events': 'Technical Events',
            'technical': 'Technical Events',
            'technical fun games': 'Technical Fun Games',
            'technical fun game': 'Technical Fun Games',
            'hackathons': 'Hackathons',
            'hackathon': 'Hackathons',
            'quizzes': 'Quizzes',
            'quiz': 'Quizzes',
            'workshops': 'Workshops',
            'workshop': 'Workshops',
            'project expo': 'Project Expo',
            'fun games': 'Fun Games',
            'fun game': 'Fun Games',
            'pre-events': 'Pre-events',
            'pre events': 'Pre-events',
            'sports': 'Sports',
            'cultural': 'Cultural'
        };

        return mapping[normalized] || null;
    };

    if (res.success && res.data && res.data.events) {
        // Group by category to match the category-level performance metric design
        const categoryMap: Record<string, { Participations: number; 'Total Registrations': number }> = {};

        // Initialize all known categories with 0 values
        CATEGORIES.forEach(cat => {
            categoryMap[cat] = { Participations: 0, 'Total Registrations': 0 };
        });

        res.data.events.forEach(event => {
            const cat = normalizeCategory(event.category);
            if (!cat) return;
            const bucket = categoryMap[cat];
            if (!bucket) return;

            bucket.Participations += event.attendance || 0;
            bucket['Total Registrations'] += (event.onlineRegistrations || 0) + (event.offlineRegistrations || 0);
        });

        chartData = Object.entries(categoryMap).map(([name, metrics]) => ({
            name,
            Participations: metrics.Participations,
            'Total Registrations': metrics['Total Registrations']
        }));
    } else {
        // Provide empty fallback array if API fails entirely
        chartData = CATEGORIES.map(name => ({ name, Participations: 0, 'Total Registrations': 0 }));
    }


    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Event Performance</h1>
                        <p className="text-sm text-[#6B7280]">Participation and engagement metrics across categories.</p>
                    </div>
                    <EventFilters />
                </div>
            </div>

            <div className="bg-[#F4F2F0] rounded-[18px] p-2.5 mb-8 animate-card-entrance">
                <div className="flex items-center gap-2 mb-4 px-3 mt-1">
                    <h3 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Total Registrations vs Participations</h3>
                </div>
                <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm">
                    <EventPerformanceChart data={chartData} />
                </div>
            </div>
        </div>
    );
}
