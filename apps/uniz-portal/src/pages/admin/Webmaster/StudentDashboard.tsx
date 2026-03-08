import {
    User,
    Mail,
    Calendar,
    MapPin,
    AlertCircle,
    CreditCard,
    Target,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface StudentDashboardProps {
    data: any;
}

export default function StudentDashboard({ data }: StudentDashboardProps) {
    const student = data;
    if (!student) return null;

    // Prepare graph data
    const gpaData = Object.entries(student.gpa_stats || {}).map(([name, stats]: [string, any]) => ({
        name,
        gpa: stats.gpa,
    })).reverse();


    const attendanceSeries = Object.entries(student.attendance_summary || {}).map(([name, stats]: [string, any]) => ({
        name,
        percentage: stats.percentage,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 pb-10"
        >
            {/* Centered Profile Hero */}
            <div className="bg-white rounded-xl border border-slate-100 p-10 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

                <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full p-1 bg-slate-50 border border-slate-100 shadow-none">
                        <img
                            src={student.profile_url}
                            alt={student.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    {student.is_in_campus && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full border-2 border-white text-[9px] font-black uppercase tracking-widest shadow-none">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            ON CAMPUS
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">
                        {student.name.split(' ')[0]} <span className="text-blue-600">{student.name.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[11px]">{student.username}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
                    <HeroInfo label="OFFICIAL EMAIL" value={student.email} icon={<Mail size={16} />} />
                    <div className="w-px h-8 bg-slate-100 hidden md:block" />
                    <HeroInfo label="ACADEMIC BRANCH" value={student.branch} icon={<Target size={16} />} />
                    <div className="w-px h-8 bg-slate-100 hidden md:block" />
                    <HeroInfo label="CURRENT ENROLLMENT" value={`${student.year} - ${student.section}`} icon={<Calendar size={16} />} />
                </div>
            </div>

            {/* Performance Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Academic Results Graph */}
                <GraphCard
                    title="Results Overview"
                    subtitle="Semester-wise Grade Point Average"
                    value={student.cgpa}
                    label="CGPA"
                    data={gpaData}
                    dataKey="gpa"
                    color="#2563eb"
                />

                {/* Attendance Graph */}
                <GraphCard
                    title="Attendance Trends"
                    subtitle="Percentage of sessions logged"
                    value={`${(Object.values(student.attendance_summary || {})[0] as any)?.percentage || 0}%`}
                    label="LATEST"
                    data={attendanceSeries}
                    dataKey="percentage"
                    color="#10b981"
                />
            </div>

            {/* Analytics Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Live Backlogs" value={student.total_backlogs} icon={<AlertCircle />} color={student.total_backlogs > 0 ? "red" : "emerald"} />
                <StatCard label="Gender ID" value={student.gender} icon={<User />} color="blue" />
                <StatCard label="Campus Transit" value={student.is_in_campus ? "AUTHORIZED" : "NOT LOGGED"} icon={<MapPin />} color={student.is_in_campus ? "emerald" : "amber"} />
                <StatCard label="Request Queue" value={student.has_pending_requests ? "PENDING" : "CLEAR"} icon={<CreditCard />} color={student.has_pending_requests ? "amber" : "slate"} />
            </div>

            {/* Motivation Quote */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Institutional Motivation</p>
                <p className="text-sm font-black text-slate-600 italic">"{student.motivation}"</p>
            </div>
        </motion.div>
    );
}

function HeroInfo({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
        </div>
    );
}

function GraphCard({ title, subtitle, value, label, data, dataKey, color }: any) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h4 className="text-base font-black text-slate-900 leading-none mb-1">{title}</h4>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{subtitle}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
                </div>
            </div>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                fontSize: '11px',
                                fontWeight: '900',
                                textTransform: 'uppercase'
                            }}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ fill: color, strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}



function StatCard({ label, value, icon, color }: { label: string, value: any, icon: any, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50/50 text-blue-600 border-blue-100/50",
        emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100/50",
        red: "bg-red-50/50 text-red-600 border-red-100/50",
        amber: "bg-amber-50/50 text-amber-600 border-amber-100/50",
        slate: "bg-slate-50/50 text-slate-600 border-slate-100/50",
    };

    return (
        <div className={`p-5 rounded-xl border ${colors[color]} flex flex-col gap-3 transition-colors hover:bg-white`}>
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-inherit shadow-none">
                    {icon}
                </div>
            </div>
            <p className="text-xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
    );
}
