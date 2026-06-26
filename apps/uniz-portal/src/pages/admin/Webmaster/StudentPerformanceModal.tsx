import {
  X,
  GraduationCap,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminModalCloseClass,
  adminCardClass,
  adminChipClass,
  adminSectionTitleClass,
  adminNumsClass,
} from "@/components/admin/admin-ui";
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
  attendance_summary: Record<
    string,
    { total: number; attended: number; percentage: number }
  >;
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
  if (!isOpen || !data) return null;

  const overallAttendance = (
    Object.values(data.attendance_summary || {}).reduce(
      (acc, curr) => acc + curr.percentage,
      0,
    ) / (Object.keys(data.attendance_summary || {}).length || 1)
  ).toFixed(1);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        className={cn("max-w-4xl", adminModalShellClass)}
      >
        <div className="relative flex flex-col max-h-[90vh]">
          <button
            type="button"
            onClick={onClose}
            className={adminModalCloseClass}
          >
            <X size={20} />
          </button>

          <AlertDialogHeader className="p-8 pb-4 flex flex-col items-start text-left gap-3 border-b border-zinc-200/70">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                <GraduationCap size={22} />
              </div>
              <div>
                <AlertDialogTitle className={adminModalTitleClass}>
                  {studentName}
                </AlertDialogTitle>
                <AlertDialogDescription className={adminModalDescClass}>
                  Student ID: <span className="font-medium text-zinc-700">{studentId}</span>
                </AlertDialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={adminChipClass}>Academic record</span>
              <span className={cn(adminChipClass, "text-emerald-600 border-emerald-200 bg-emerald-50")}>
                Synchronized
              </span>
            </div>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-sidebar-scroll">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<TrendingUp size={16} className="text-zinc-700" />}
                label="CGPA"
                value={data.cgpa?.toFixed(2) ?? "0.00"}
                subValue="Cumulative"
              />
              <StatCard
                icon={<Clock size={16} className="text-emerald-600" />}
                label="Attendance"
                value={`${overallAttendance}%`}
                subValue="Average across semesters"
              />
              <StatCard
                icon={
                  <AlertCircle
                    size={16}
                    className={data.total_backlogs > 0 ? "text-rose-500" : "text-zinc-400"}
                  />
                }
                label="Backlogs"
                value={String(data.total_backlogs ?? 0)}
                subValue={data.total_backlogs === 0 ? "Clear" : "Needs attention"}
              />
            </div>

            {data.motivation && (
              <div className={cn(adminCardClass, "p-4 flex gap-3 items-start")}>
                <CheckCircle2 size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-zinc-600 leading-relaxed italic">
                  {data.motivation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className={adminSectionTitleClass}>Recent grades</h4>
                <div className="space-y-2">
                  {(data.grades || []).slice(0, 6).map((grade) => (
                    <div
                      key={grade.id}
                      className={cn(
                        adminCardClass,
                        "p-4 flex items-center justify-between",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 text-[13px] truncate">
                          {grade.subject.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {grade.subject.code} · {grade.semesterId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {grade.isRemedial && (
                          <span className="text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                            Remedial
                          </span>
                        )}
                        <span className={cn("text-sm font-semibold text-zinc-900", adminNumsClass)}>
                          {grade.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className={adminSectionTitleClass}>Attendance by subject</h4>
                <div className="space-y-2">
                  {(data.attendance || []).slice(0, 6).map((att) => (
                    <div key={att.id} className={cn(adminCardClass, "p-4 space-y-3")}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 text-[13px] truncate">
                            {att.subject.name}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {att.attendedClasses}/{att.totalClasses} classes
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[13px] font-semibold shrink-0",
                            adminNumsClass,
                            att.percentage >= 75 ? "text-emerald-600" : "text-rose-500",
                          )}
                        >
                          {att.percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${att.percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            att.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500",
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {Object.keys(data.gpa_stats || {}).length > 0 && (
              <div className="space-y-3">
                <h4 className={adminSectionTitleClass}>Semester GPA</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(data.gpa_stats).map(([sem, stats]) => (
                    <div key={sem} className={cn(adminCardClass, "p-4")}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        {sem}
                      </p>
                      <p className={cn("text-2xl font-semibold text-zinc-900 mt-1", adminNumsClass)}>
                        {stats.gpa}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-4 border-t border-zinc-200/70 text-[11px] text-zinc-400 font-medium bg-zinc-50/50">
            Academic record · internal use only
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div className={cn(adminCardClass, "p-5 flex flex-col gap-3")}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("text-2xl font-semibold text-zinc-900", adminNumsClass)}>
          {value}
        </p>
        <p className="text-[11px] text-zinc-400 mt-0.5">{subValue}</p>
      </div>
    </div>
  );
}
