import { X, GraduationCap, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Grade {
    id: string;
    semesterId: string;
    grade: number;
    isRemedial: boolean;
    updatedAt: string;
    subject: {
        code: string;
        name: string;
        credits: number;
        department: string;
    };
}

interface Attendance {
    id: string;
    studentId: string;
    subjectId: string;
    semesterId: string;
    totalClasses: number;
    attendedClasses: number;
    batch: string;
    percentage: number;
    subject: {
        id: string;
        code: string;
        name: string;
        credits: number;
        department: string;
        semester: string;
    };
}

interface PerformanceData {
    grades: Grade[];
    gpa_stats: Record<string, { gpa: number; status: string }>;
    cgpa: number;
    total_backlogs: number;
    motivation: string;
    attendance: Attendance[];
    attendance_summary: Record<string, { total: number; attended: number; percentage: number }>;
}

interface StudentPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentId: string;
    data: PerformanceData;
}

export default function StudentPerformanceModal({
    isOpen,
    onClose,
    studentName,
    studentId,
    data,
}: StudentPerformanceModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-condensed"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Centralized Header */}
                    <div className="p-10 pb-4 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="p-1 bg-white ring-4 ring-navy-50 rounded-full shadow-sm">
                                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-none border-2 border-white ring-1 ring-slate-100">
                                    <GraduationCap size={40} />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none mb-3">
                            {studentName}
                        </h3>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Student ID: <span className="text-slate-900">{studentId}</span>
                        </p>

                        <div className="flex items-center justify-center gap-6 mt-6">
                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
                                Academic Year 2025-26
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                                Profile Synchronized
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                icon={<TrendingUp className="text-navy-900" />}
                                label="Cumulative GPA"
                                value={data.cgpa.toFixed(2)}
                                subValue="Institutional Average: 7.8"
                                color="blue"
                            />
                            <StatCard
                                icon={<Clock className="text-emerald-600" />}
                                label="Overall Attendance"
                                value={`${(Object.values(data.attendance_summary).reduce((acc, curr) => acc + curr.percentage, 0) / Object.keys(data.attendance_summary).length).toFixed(1)}%`}
                                subValue="Mandatory Min: 75%"
                                color="emerald"
                            />
                            <StatCard
                                icon={<AlertCircle className={data.total_backlogs > 0 ? "text-red-500" : "text-slate-400"} />}
                                label="Active Backlogs"
                                value={data.total_backlogs.toString()}
                                subValue={data.total_backlogs === 0 ? "Perfect Record" : "Requires Attention"}
                                color={data.total_backlogs > 0 ? "red" : "slate"}
                            />
                        </div>

                        {/* Motivation Alert */}
                        <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-4 flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} className="text-navy-900" />
                            </div>
                            <p className="text-sm font-medium text-navy-800 italic">"{data.motivation}"</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Grades Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Recent Grades</h4>
                                    <span className="text-[10px] font-bold text-slate-400">SESSION: 2025-26</span>
                                </div>
                                <div className="space-y-3">
                                    {data.grades.slice(0, 6).map((grade) => (
                                        <div key={grade.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="font-bold text-slate-900 text-[13px] group-hover:text-navy-900 transition-colors">{grade.subject.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{grade.subject.code} • {grade.semesterId}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {grade.isRemedial && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[9px] font-black uppercase tracking-widest border border-red-100">Remedial</span>
                                                )}
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-900 shadow-none">
                                                    {grade.grade}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Course Attendance</h4>
                                    <span className="text-[10px] font-bold text-slate-400">SEM: E4-SEM-2</span>
                                </div>
                                <div className="space-y-3">
                                    {data.attendance.map((att) => (
                                        <div key={att.id} className="p-4 rounded-xl border border-slate-50 bg-white shadow-none space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-bold text-slate-800 text-[13px]">{att.subject.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{att.attendedClasses}/{att.totalClasses} Classes Attended</p>
                                                </div>
                                                <span className={`text-sm font-black ${att.percentage >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                                                    {att.percentage}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${att.percentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${att.percentage >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Semester GPA Stats */}
                        <div className="space-y-4 pt-4">
                            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs px-2">Semester Performance Tracking</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(data.gpa_stats).map(([sem, stats]) => (
                                    <div key={sem} className="p-4 rounded-xl bg-slate-900 text-white flex flex-col gap-1 shadow-none">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{sem}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xl font-black">{stats.gpa}</p>
                                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-400/10 px-1.5 py-0.5 rounded">Pass</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">
                        <span>Academic Record Verified by University Registrar</span>
                        <span>CONFIDENTIAL: INTERNAL ONLY</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function StatCard({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-navy-50 border-navy-100",
        emerald: "bg-emerald-50 border-emerald-100",
        red: "bg-red-50 border-red-100",
        slate: "bg-slate-50 border-slate-100",
    };

    return (
        <div className={`p-6 rounded-xl border ${colors[color]} flex flex-col gap-4 shadow-none`}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <div className="w-8 h-8 rounded-full bg-white shadow-none flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div className="flex flex-col gap-0.5">
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subValue}</p>
            </div>
        </div>
    );
}
