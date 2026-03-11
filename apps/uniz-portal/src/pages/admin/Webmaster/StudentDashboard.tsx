/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    User,
    Mail,
    Calendar,
    Target,
    Phone,
    Shield,
    Heart,
    Zap,
    Scale,
    ShieldAlert,
    History,
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
import { cn } from "../../../utils/cn";

interface StudentDashboardProps {
    data: any;
    onSuspendToggle?: (username: string, currentStatus: boolean) => void;
    isActionLoading?: boolean;
}

export default function StudentDashboard({ data, onSuspendToggle, isActionLoading }: StudentDashboardProps) {
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
            className="space-y-6 pb-20"
        >
            {/* Centered Profile Hero */}
            <div className={`bg-white rounded-[2rem] border-2 ${student.is_suspended ? 'border-red-500/20' : 'border-emerald-500/20'} p-10 flex flex-col items-center text-center relative overflow-hidden shadow-none`}>
                <div className="relative mb-8">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-slate-50 border-2 ${student.is_suspended ? 'border-red-500/50 bg-red-50/50' : 'border-emerald-500/50 bg-emerald-50/50'} shadow-xl overflow-hidden transition-all duration-500 ring-4 ring-white`}>
                        {student.profile_url ? (
                            <img
                                src={student.profile_url}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className={`text-4xl font-black ${student.is_suspended ? 'text-red-300' : 'text-emerald-300'} uppercase`}>
                                {(student.name || 'S')[0]}
                            </span>
                        )}
                    </div>

                    {!student.is_suspended ? (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-md animate-pulse" title="Active Account" />
                    ) : (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                            Suspended
                        </div>
                    )}
                </div>

                <div className="space-y-4 mb-10">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">
                            {(student.name || '').split(' ')[0]} <span className="text-blue-600">{(student.name || '').split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{student.username}</p>
                    </div>

                    {/* Compact Suspension Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => onSuspendToggle?.(student.username, student.is_suspended)}
                            disabled={isActionLoading}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl border font-bold uppercase tracking-widest text-[10px] transition-all group active:scale-95 shadow-sm",
                                student.is_suspended 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white" 
                                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                            )}
                        >
                            {isActionLoading ? (
                                <Zap className="animate-spin w-3.5 h-3.5" />
                            ) : student.is_suspended ? (
                                <Shield className="w-4 h-4" />
                            ) : (
                                <ShieldAlert className="w-4 h-4" />
                            )}
                            {student.is_suspended ? 'Restore Access' : 'Suspend Access'}
                        </button>
                    </div>
                </div>

                {/* Structured Info Grid (No Cards) */}
                <div className="w-full pt-10 border-t border-slate-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-4">
                        <HeroInfo label="OFFICIAL EMAIL" value={student.email} icon={<Mail size={16} />} />
                        <HeroInfo label="ACADEMIC BRANCH" value={student.branch} icon={<Target size={16} />} />
                        <HeroInfo label="BATCH" value={student.batch || "O21"} icon={<Zap size={16} />} />
                        <HeroInfo label="ENROLLMENT" value={`${student.year} - ${student.section || 'N/A'}`} icon={<Calendar size={16} />} />
                        <HeroInfo label="GENDER" value={student.gender || "Male"} icon={<User size={16} />} />

                        <HeroInfo label="EMERGENCY" value={student.phone_number || "N/A"} icon={<Phone size={16} />} />
                        <HeroInfo label="BLOOD GROUP" value={student.blood_group || "N/A"} icon={<Heart size={16} />} />
                        <HeroInfo label="BACKLOGS" value={student.total_backlogs || 0} icon={<Scale size={16} />} />
                        <HeroInfo label="ACTIVITY" value={student.is_in_campus ? "IN CAMPUS" : "OUTSIDE"} icon={<History size={16} />} />
                        <HeroInfo label="STANDING" value={student.is_suspended ? "RESTRICTED" : "GOOD"} icon={<Shield size={16} />} />
                    </div>
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

            {/* Bottom Intelligence */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Motivation Quote */}
                <div className="w-full bg-slate-50 border border-slate-100 p-8 rounded-[2rem] text-center flex flex-col justify-center shadow-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Institutional Motivation</p>
                    <p className="text-base font-black text-slate-600 italic leading-relaxed max-w-2xl mx-auto">"{student.motivation}"</p>
                </div>
            </div>
        </motion.div>
    );
}

function HeroInfo({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-black text-slate-800 tracking-tight leading-none text-center">{value}</p>
        </div>
    );
}


function GraphCard({ title, subtitle, value, label, data, dataKey, color }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col">
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
