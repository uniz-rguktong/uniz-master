import { Calendar, Clock, Globe, Rocket, MoreVertical, RefreshCw } from 'lucide-react';

const QUEUE = [
    { id: 1, name: 'Hackathon Rulebook', type: 'Update', target: 'Technical Portal', scheduledFor: 'Today, 18:00', status: 'Pending', color: 'bg-blue-50 text-blue-700' },
    { id: 2, name: 'Cultural Night Lineup', type: 'New Event', target: 'Main Website', scheduledFor: 'Tomorrow, 09:00', status: 'Scheduled', color: 'bg-green-50 text-green-700' },
    { id: 3, name: 'Sports Fixtures (Round 1)', type: 'Data Sync', target: 'Sports Portal', scheduledFor: 'Feb 13, 08:00', status: 'Queued', color: 'bg-purple-50 text-purple-700' },
];

export default function PublishingQueuePage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Publishing Queue</h1>
                        <p className="text-sm text-[#6B7280]">Manage scheduled updates and content releases.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                        <Rocket className="w-4 h-4" />
                        Publish All Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Queue List */}
                <div className="lg:col-span-2 space-y-6">
                    {QUEUE.map((item: any) => (
                        <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 flex items-start justify-between group hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                    <Clock className="w-6 h-6" />
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
                            <button className="p-2 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                        <div className="bg-white rounded-[14px] p-6">
                            <h3 className="font-bold text-[#1A1A1A] mb-4">Auto-Publish Status</h3>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-sm font-medium text-gray-700">System Active</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Next Run In</span>
                                <span className="text-3xl font-mono font-bold text-[#1A1A1A]">04:12:59</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] text-white rounded-[18px] p-6 text-center space-y-4">
                        <Globe className="w-8 h-8 mx-auto text-gray-400" />
                        <div>
                            <div className="text-2xl font-bold">12</div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">Items Published Today</div>
                        </div>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            View History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
