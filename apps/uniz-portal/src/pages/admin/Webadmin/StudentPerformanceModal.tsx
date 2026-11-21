import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/tile";
import { adminNumsClass } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

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

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

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

  const grades = data.grades || [];
  const attendance = data.attendance || [];
  const gpaEntries = Object.entries(data.gpa_stats || {});
  const backlogCount = data.total_backlogs ?? 0;

  return (
    <AdminDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      maxWidth="max-w-3xl"
      className="max-h-[90vh] overflow-y-auto"
      title={studentName}
      description={`Student ID ${studentId}`}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2">
          <Badge>Academic record</Badge>
          <Badge tone="success">Synchronized</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="CGPA"
            value={data.cgpa?.toFixed(2) ?? "0.00"}
            line="Cumulative"
            icon={TrendingUp}
          />
          <StatTile
            label="Attendance"
            value={`${overallAttendance}%`}
            line="Average across semesters"
            icon={Clock}
          />
          <StatTile
            label="Backlogs"
            value={String(backlogCount)}
            line={backlogCount === 0 ? "Clear" : "Needs attention"}
            status={backlogCount > 0 ? "error" : "success"}
            icon={backlogCount > 0 ? AlertCircle : CheckCircle2}
          />
        </div>

        {data.motivation && (
          <p className="text-dense leading-6 text-text-2">{data.motivation}</p>
        )}

        <div className="grid grid-cols-1 gap-8 min-[821px]:grid-cols-2">
          <section className="space-y-4">
            <h2 className={sectionTitleClass}>Recent grades</h2>
            {grades.length === 0 ? (
              <EmptyState title="No grades yet" body="Grades appear here after they are recorded." />
            ) : (
              <ul className="space-y-3">
                {grades.slice(0, 6).map((grade) => (
                  <li
                    key={grade.id}
                    className="flex items-center justify-between gap-3 border-b border-border py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-dense font-medium text-text">
                        {grade.subject.name}
                      </p>
                      <p className="mt-0.5 text-caption text-text-3">
                        {grade.subject.code} · {grade.semesterId}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {grade.isRemedial && <Badge tone="error">Remedial</Badge>}
                      <span className={cn("text-dense font-medium text-text", adminNumsClass)}>
                        {grade.grade}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4 border-t border-border pt-8 min-[821px]:border-t-0 min-[821px]:pt-0">
            <h2 className={sectionTitleClass}>Attendance by subject</h2>
            {attendance.length === 0 ? (
              <EmptyState title="No attendance yet" body="Subject attendance appears here once classes are marked." />
            ) : (
              <ul className="space-y-4">
                {attendance.slice(0, 6).map((att) => {
                  const clear = att.percentage >= 75;
                  return (
                    <li key={att.id} className="space-y-2 border-b border-border pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-dense font-medium text-text">
                            {att.subject.name}
                          </p>
                          <p className="text-caption text-text-3">
                            {att.attendedClasses}/{att.totalClasses} classes
                          </p>
                        </div>
                        <Badge tone={clear ? "success" : "error"}>{att.percentage}%</Badge>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, att.percentage)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {gpaEntries.length > 0 && (
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className={sectionTitleClass}>Semester GPA</h2>
            <div className="grid grid-cols-2 gap-3 min-[821px]:grid-cols-4">
              {gpaEntries.map(([sem, stats]) => (
                <div key={sem} className="rounded-lg border border-border bg-tile p-4">
                  <p className="text-caption text-text-3">{sem}</p>
                  <p className={cn("mt-1 text-[24px] font-semibold leading-8 text-head", adminNumsClass)}>
                    {stats.gpa}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-caption text-text-3">Academic record · internal use only</p>
      </div>
    </AdminDialog>
  );
}
