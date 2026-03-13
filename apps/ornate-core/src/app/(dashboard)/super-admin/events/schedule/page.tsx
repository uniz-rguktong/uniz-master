import { Calendar, Clock, MapPin, Tag, Activity, Archive, CheckCircle2 } from 'lucide-react';
import { getGlobalSchedule } from '@/actions/superAdminGetters';

export default async function EventSchedulePage() {
    const scheduleItems = await getGlobalSchedule();

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'technical': return 'bg-blue-50 border-blue-100 text-blue-700';
            case 'cultural': return 'bg-cyan-50 border-cyan-100 text-cyan-700';
            case 'sports': return 'bg-indigo-50 border-indigo-100 text-indigo-700';
            case 'ornate': return 'bg-rose-50 border-rose-100 text-rose-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'live':
            case 'ongoing':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Activity className="w-3 h-3 animate-pulse" /> Live
                    </span>
                );
            case 'published':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Archive className="w-3 h-3" /> Draft
                    </span>
                );
        }
    };

    // Group items by date
    const groupedSchedule = (scheduleItems as any[]).reduce((acc: any, item: any) => {
        const dateKey = new Date(item.date).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const dates = Object.keys(groupedSchedule);

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-h-screen">
            <div className="flex flex-col gap-4 mb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Timeline & Schedule</h1>
                        <p className="text-[#6B7280] mt-1">Real-time schedule of all events across the fest across all categories.</p>
                    </div>
                </div>
            </div>

            {dates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-[24px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No events have been scheduled yet.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {dates.map((date) => (
                        <div key={date} className="relative">
                            <div className="sticky top-0 z-10 py-3 mb-6 bg-[#FAFAFA]/80 backdrop-blur-md">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-gray-200"></span>
                                    {date}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 ml-4 md:ml-8 border-l-2 border-gray-100 pl-6 md:pl-10 py-2">
                                {groupedSchedule[date].map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="group bg-white hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 relative"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getStatusBadge(item.status)}
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getTypeColor(item.type)} uppercase tracking-wider`}>
                                                        <Tag className="w-3 h-3" />
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:text-black transition-colors">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                                                    Event ID: {item.id}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timing</div>
                                                    <div className="flex items-center gap-2 text-[#1A1A1A] font-bold">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        {item.time} {item.endTime && item.endTime !== 'TBD' ? ` - ${item.endTime}` : ''}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue</div>
                                                    <div className="flex items-center gap-2 text-[#1A1A1A] font-bold">
                                                        <MapPin className="w-4 h-4 text-rose-500" />
                                                        {item.venue}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dot on the timeline */}
                                        <div className="absolute -left-[35px] md:-left-[51px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-[#FAFAFA] bg-white ring-2 ring-gray-100 group-hover:ring-indigo-400 transition-all duration-300"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
