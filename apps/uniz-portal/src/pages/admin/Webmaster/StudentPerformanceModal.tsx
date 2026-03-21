import { X, GraduationCap, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { cn } from "@/utils/cn";

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

    const overallAttendance = (Object.values(data.attendance_summary).reduce((acc, curr) => acc + curr.percentage, 0) / (Object.keys(data.attendance_summary).length || 1)).toFixed(1);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-slate-100 rounded-[2.5rem] shadow-2xl flex flex-col font-sans">
                <div className="relative flex flex-col max-h-[90vh]">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
                    >
                        <X size={20} />
                    </button>

                    <AlertDialogHeader className="p-10 pb-4 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="p-1 bg-white ring-4 ring-navy-50 rounded-full shadow-sm">
                                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-none border-2 border-white ring-1 ring-slate-100">
                                    <GraduationCap size={32} />
                                </div>
                            </div>
                        </div>

                        <AlertDialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none mb-2">
                            {studentName}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Student ID: <span className="text-slate-900">{studentId}</span>
                        </AlertDialogDescription>

                        <div className="flex items-center justify-center gap-4 mt-6">
                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
                                Academic Session 2025-26
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-50 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                                Records Synchronized
                            </span>
                        </div>
                    </AlertDialogHeader>

                    <div className="flex-1 overflow-y-auto p-10 pt-6 space-y-10 custom-scrollbar">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                icon={<TrendingUp size={18} className="text-navy-900" />}
                                label="Cumulative GPA"
                                value={data.cgpa.toFixed(2)}
                                subValue="Institutional Average: 7.8"
                                color="blue"
                            />
                            <StatCard
                                icon={<Clock size={18} className="text-emerald-600" />}
                                label="Overall Attendance"
                                value={`${overallAttendance}%`}
                                subValue="Mandatory Min: 75%"
                                color="emerald"
                            />
                            <StatCard
                                icon={<AlertCircle size={18} className={data.total_backlogs > 0 ? "text-red-500" : "text-slate-400"} />}
                                label="Active Backlogs"
                                value={data.total_backlogs.toString()}
                                subValue={data.total_backlogs === 0 ? "Perfect Record" : "Requires Attention"}
                                color={data.total_backlogs > 0 ? "red" : "slate"}
                            />
                        </div>

                        {/* Motivation Alert */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                <CheckCircle2 size={18} className="text-navy-900" />
                            </div>
                            <p className="text-[13px] font-bold text-slate-600 italic leading-relaxed">"{data.motivation}"</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Grades Section */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Recent Results</h4>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grading Cycle 25-26</span>
                                </div>
                                <div className="space-y-3">
                                    {data.grades.slice(0, 6).map((grade) => (
                                        <div key={grade.id} className="p-4 rounded-2xl border border-slate-100 bg-white flex items-center justify-between hover:border-slate-300 transition-all group cursor-default shadow-sm hover:shadow-md">
                                            <div className="flex flex-col gap-1">
                                                <p className="font-black text-slate-900 text-[12px] uppercase">{grade.subject.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{grade.subject.code} • {grade.semesterId}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {grade.isRemedial && (
                                                    <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-100">Remedial</span>
                                                )}
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[14px]">
                                                    {grade.grade}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Attendance Metrics</h4>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Semesters</span>
                                </div>
                                <div className="space-y-3">
                                    {data.attendance.slice(0, 6).map((att) => (
                                        <div key={att.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-black text-slate-800 text-[12px] uppercase">{att.subject.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{att.attendedClasses}/{att.totalClasses} Sessions logged</p>
                                                </div>
                                                <span className={cn(
                                                    "text-[13px] font-black tracking-tighter",
                                                    att.percentage >= 75 ? "text-emerald-600" : "text-red-500"
                                                )}>
                                                    {att.percentage}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${att.percentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        att.percentage >= 75 ? "bg-emerald-500" : "bg-red-500"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Semester GPA Stats */}
                        <div className="space-y-5 pt-4">
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] px-2">Chronological Semester Performance</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(data.gpa_stats).map(([sem, stats]) => (
                                    <div key={sem} className="p-5 rounded-2xl bg-white border border-slate-100 flex flex-col gap-2 shadow-sm hover:border-slate-300 transition-all">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{sem}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.gpa}</p>
                                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">Pass</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                        <span className="flex items-center gap-2">
                             Academic Record Verified by University Registrar
                        </span>
                        <span className="text-slate-300 uppercase italic">Confidential • Internal Only</span>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function StatCard({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-slate-50 border-slate-100",
        emerald: "bg-emerald-50 border-emerald-100",
        red: "bg-rose-50 border-rose-100",
        slate: "bg-slate-50 border-slate-100",
    };

    return (
        <div className={cn("p-6 rounded-2xl border flex flex-col gap-4 shadow-sm", colors[color])}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-50">
                    {icon}
                </div>
            </div>
            <div className="flex flex-col gap-0.5">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-80">{subValue}</p>
            </div>
        </div>
    );
}
