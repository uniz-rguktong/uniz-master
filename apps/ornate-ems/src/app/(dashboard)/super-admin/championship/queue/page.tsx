import { Calendar, Clock, Globe, Rocket, MoreVertical, RefreshCw } from 'lucide-react';

const QUEUE = [
    { id: 1, name: 'Day 1 Standings', type: 'Leaderboard Update', target: 'Main Website', scheduledFor: 'Today, 20:00', status: 'Pending', color: 'bg-yellow-50 text-yellow-700' },
    { id: 2, name: 'Cricket Finals Result', type: 'Winner Announcement', target: 'Sports Portal', scheduledFor: 'Tomorrow, 10:00', status: 'Scheduled', color: 'bg-green-50 text-green-700' },
];

export default function ChampionshipQueuePage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Championship Publishing</h1>
                        <p className="text-sm text-[#6B7280]">Schedule when result and leaderboard updates go live.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {QUEUE.map((item: any) => (
                    <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 flex items-start justify-between group hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1A1A1A]">{item.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{item.target}</p>
                                <div className="flex items-center gap-3 text-xs font-medium">
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{item.type}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-indigo-600 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {item.scheduledFor}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Reschedule</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
