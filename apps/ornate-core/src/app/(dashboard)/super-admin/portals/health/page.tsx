'use client';
import { Activity, Server, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HEALTH_DATA = [
  { name: '00:00', latency: 45, error: 0.1 },
  { name: '04:00', latency: 42, error: 0.1 },
  { name: '08:00', latency: 120, error: 0.5 },
  { name: '12:00', latency: 180, error: 1.2 },
  { name: '16:00', latency: 150, error: 0.8 },
  { name: '20:00', latency: 90, error: 0.3 },
  { name: '23:59', latency: 50, error: 0.1 },
];

const METRICS = [
    { label: 'System Uptime', value: '99.98%', status: 'Healthy', color: 'text-green-600', bg: 'bg-green-50', icon: Server },
    { label: 'Avg Response Time', value: '124ms', status: 'Optimal', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    { label: 'Error Rate', value: '0.45%', status: 'Attention', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle },
    { label: 'Active Sessions', value: '842', status: 'High Load', color: 'text-purple-600', bg: 'bg-purple-50', icon: Activity },
];

const INCIDENTS = [
    { id: 1, portal: 'CSE Portal', issue: 'High Latency detected', time: '10 mins ago', severity: 'Warning' },
    { id: 2, portal: 'Sports DB', issue: 'Connection timeout', time: '2 hours ago', severity: 'Resolved' },
    { id: 3, portal: 'Gallery API', issue: 'Storage quota warning', time: '昨天', severity: 'Critical' },
];

export default function PortalHealthPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">System Health Monitor</h1>
                        <p className="text-sm text-[#6B7280]">Real-time performance metrics across all portal instances.</p>
                    </div>
                     <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Refresh Diagnostics
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {METRICS.map((metric: any, i: any) => (
                    <div key={i} className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[#6B7280] font-medium mb-1">{metric.label}</p>
                            <h3 className="text-2xl font-bold text-[#1A1A1A]">{metric.value}</h3>
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs font-semibold ${metric.bg} ${metric.color}`}>
                                {metric.status === 'Healthy' && <CheckCircle className="w-3 h-3" />}
                                {metric.status}
                            </span>
                        </div>
                        <div className={`p-3 rounded-xl ${metric.bg}`}>
                            <metric.icon className={`w-6 h-6 ${metric.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Chart */}
                 <div className="lg:col-span-2 bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6 h-full">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Aggregate Latency (Global)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={HEALTH_DATA}>
                                    <defs>
                                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="latency" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 </div>

                 {/* Incident Log */}
                 <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6 h-full">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Recent Incidents</h3>
                        <div className="space-y-4">
                            {INCIDENTS.map((inc: any) => (
                                <div key={inc.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className={`w-2 h-full rounded-full shrink-0 self-stretch my-1 
                                        ${inc.severity === 'Critical' ? 'bg-red-500' : 
                                          inc.severity === 'Warning' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-[#1A1A1A]">{inc.portal}</span>
                                            <span className="text-[10px] text-gray-500">{inc.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium">{inc.issue}</p>
                                        <span className={`text-[10px] uppercase font-bold mt-1 inline-block
                                             ${inc.severity === 'Critical' ? 'text-red-600' : 
                                               inc.severity === 'Warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {inc.severity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                            View All Logs
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
}
