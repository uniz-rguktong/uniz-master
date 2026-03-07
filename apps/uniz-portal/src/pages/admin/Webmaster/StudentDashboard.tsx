import {
    Mail,
    Calendar,
    Target,
    ShieldOff,
    RotateCcw,
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
    onStatusToggle?: (username: string, currentStatus: boolean) => void;
}

export default function StudentDashboard({ data, onStatusToggle }: StudentDashboardProps) {
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
            <div className="bg-white rounded-xl border border-slate-100 p-10 flex flex-col items-center text-center relative overflow-hidden transition-all">
                <div className="relative mb-6">
                    <div className={`w-44 h-44 rounded-full p-1 bg-white border-4 ${student.is_suspended ? 'border-red-500' : 'border-emerald-500'} shadow-xl overflow-hidden transition-all duration-500`}>
                        <img
                            src={student.profile_url}
                            alt={student.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">
                        {student.name.split(' ')[0]} <span className="text-blue-600">{student.name.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[11px]">{student.username}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10 mb-10">
                    <HeroInfo label="OFFICIAL EMAIL" value={student.email} icon={<Mail size={16} />} />
                    <div className="w-px h-8 bg-slate-100 hidden md:block" />
                    <HeroInfo label="ACADEMIC BRANCH" value={student.branch} icon={<Target size={16} />} />
                    <div className="w-px h-8 bg-slate-100 hidden md:block" />
                    <HeroInfo label="CURRENT ENROLLMENT" value={`${student.year} - ${student.section}`} icon={<Calendar size={16} />} />
                </div>

                {/* Account Status Action */}
                <div className="w-full max-w-xs">
                    <button
                        onClick={() => onStatusToggle?.(student.username, !!student.is_suspended)}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border ${student.is_suspended
                            ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                            : 'bg-red-500 text-white border-red-400 hover:bg-red-600'
                            }`}
                    >
                        {student.is_suspended ? (
                            <>
                                <RotateCcw size={18} />
                                Restore Student Access
                            </>
                        ) : (
                            <>
                                <ShieldOff size={18} />
                                Suspend Student Account
                            </>
                        )}
                    </button>
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




