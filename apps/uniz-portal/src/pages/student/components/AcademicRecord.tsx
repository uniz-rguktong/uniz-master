import { Grade, Attendance, Student } from "../../../types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import {
  asAttendanceList,
  asGradeList,
  gradeSemesterLabel,
} from "../../../utils/bootstrapNormalize";

interface AcademicRecordProps {
  student: Student;
}

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-h2 min-[821px]:leading-9";

export default function AcademicRecord({ student }: AcademicRecordProps) {
  const gradeRows = asGradeList(student.grades) as Grade[];
  const attendanceRows = asAttendanceList(student.attendance) as Attendance[];

  // Group grades by Semester
  const gradesBySemester = gradeRows.reduce(
    (acc: Record<string, Grade[]>, grade: Grade) => {
      const semName = gradeSemesterLabel(grade);
      if (!acc[semName]) acc[semName] = [];
      acc[semName].push(grade);
      return acc;
    },
    {},
  );

  // Group attendance by Semester
  const attendanceBySemester = attendanceRows.reduce(
    (acc: Record<string, Attendance[]>, att: Attendance) => {
      const semName = gradeSemesterLabel(att);
      if (!acc[semName]) acc[semName] = [];
      acc[semName].push(att);
      return acc;
    },
    {},
  );

  const semesters = [
    ...new Set([
      ...Object.keys(gradesBySemester || {}),
      ...Object.keys(attendanceBySemester || {}),
    ]),
  ]
    .filter((s) => s !== "Unknown")
    .sort();

  if (semesters.length === 0) {
    return (
      <EmptyState
        title="No academic records"
        body="Grades and attendance will show here once they are published."
      />
    );
  }

  return (
    <div className="space-y-12">
      {semesters.map((sem) => (
        <section key={sem} className="space-y-8">
          <h2 className={sectionTitleClass}>{sem}</h2>

          <div className="space-y-8">
            {/* Grades Unit */}
            {gradesBySemester[sem] && (
              <div className="space-y-3">
                <h3 className="text-h3 text-head">Grades</h3>
                <Table<Grade>
                  columns={[
                    {
                      id: "subject",
                      header: "Subject",
                      primary: true,
                      cell: (g) => g.subject?.name || "—",
                    },
                    {
                      id: "code",
                      header: "Code",
                      meta: true,
                      cell: (g) =>
                        g.subject?.id ||
                        (g.subject as { code?: string })?.code ||
                        "—",
                    },
                    {
                      id: "credits",
                      header: "Credits",
                      numeric: true,
                      meta: true,
                      cell: (g) =>
                        g.subject?.credits != null ? g.subject.credits : "—",
                    },
                    {
                      id: "grade",
                      header: "Grade",
                      numeric: true,
                      cell: (g) =>
                        g.grade === 0 ? (
                          <Badge tone="error">Fail</Badge>
                        ) : (
                          <span className="font-sans tabular-nums">{g.grade}</span>
                        ),
                    },
                  ]}
                  rows={gradesBySemester[sem]}
                  getRowId={(g) => String(g.id)}
                />
              </div>
            )}

            {/* Attendance Unit */}
            {attendanceBySemester[sem] && (
              <div className="space-y-3">
                <h3 className="text-h3 text-head">Attendance</h3>
                <Table<Attendance>
                  columns={[
                    {
                      id: "subject",
                      header: "Subject",
                      primary: true,
                      cell: (att) => att.subject?.name || "—",
                    },
                    {
                      id: "classes",
                      header: "Classes",
                      meta: true,
                      cell: (att) => (
                        <span className="font-sans tabular-nums">
                          {att.attendedClasses} / {att.totalClasses}
                        </span>
                      ),
                    },
                    {
                      id: "percent",
                      header: "Attendance",
                      numeric: true,
                      cell: (att) => {
                        const percentage =
                          att.totalClasses > 0
                            ? (
                                (att.attendedClasses / att.totalClasses) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        const isLow = parseFloat(percentage) < 75;
                        return (
                          <span className="inline-flex items-center justify-end gap-2">
                            <span className="font-sans tabular-nums">{percentage}%</span>
                            {isLow ? <Badge tone="warning">Low</Badge> : null}
                          </span>
                        );
                      },
                    },
                  ]}
                  rows={attendanceBySemester[sem]}
                  getRowId={(att) => String(att.id)}
                />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
