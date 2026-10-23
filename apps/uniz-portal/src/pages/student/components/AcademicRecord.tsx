import { Grade, Attendance, Student } from "../../../types";
import { Percent, Award } from "lucide-react";
import { motion } from "framer-motion";
import {
  asAttendanceList,
  asGradeList,
  gradeSemesterLabel,
} from "../../../utils/bootstrapNormalize";

interface AcademicRecordProps {
  student: Student;
}

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

  if (semesters.length === 0) return null;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
      {semesters.map((sem, idx) => (
        <div key={sem} className="space-y-10 group/sem">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-navy-900 rounded-full" />
              <div>
                <h2 className="text-3xl font-semibold tracking-tighter text-navy-900 leading-none">
                  {sem}
                </h2>
                <p className="text-[10px] font-semibold tracking-[0.14em] text-navy-400 mt-2">
                  Terminal Records • Academic Unit {idx + 1}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-100 rounded-[2px] text-[10px] font-semibold tracking-[0.14em] text-navy-400">
              Performance Score:{" "}
              <span className="text-navy-900">High Resolution</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Grades Unit */}
            {gradesBySemester[sem] && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-xl bg-navy-50 flex items-center justify-center text-navy-900">
                    <Award size={16} />
                  </div>
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-navy-500">
                    Transcripts
                  </h3>
                </div>
                <div className="bg-white border border-navy-100 rounded-[2px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-navy-200/40 transition-all duration-700">
                  <div className="divide-y divide-navy-50">
                    {gradesBySemester[sem].map((g: Grade) => (
                      <div
                        key={g.id}
                        className="p-6 md:p-8 flex items-center justify-between group hover:bg-navy-50/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span className="text-base font-semibold text-navy-900 group-hover:text-navy-900 transition-colors tracking-tight leading-none">
                            {g.subject.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold tracking-[0.14em] text-navy-300 font-mono">
                              {g.subject?.id ||
                                (g.subject as { code?: string })?.code ||
                                "—"}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-navy-200" />
                            <span className="text-[10px] font-bold text-navy-400 tracking-[0.14em]">
                              {g.subject.credits} Credits
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div
                            className={`w-14 h-14 rounded-[2px] flex items-center justify-center text-xl font-semibold ${g.grade === 0 ? "bg-rose-50 text-rose-500" : "bg-navy-900 text-white shadow-xl shadow-navy-100"}`}
                          >
                            {g.grade === 0 ? "F" : g.grade}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Unit */}
            {attendanceBySemester[sem] && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Percent size={16} />
                  </div>
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-navy-500">
                    Engagement Matrix
                  </h3>
                </div>
                <div className="bg-white border border-navy-100 rounded-[2px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-navy-200/40 transition-all duration-700">
                  <div className="divide-y divide-navy-100">
                    {attendanceBySemester[sem].map((att: Attendance) => {
                      const percentage =
                        att.totalClasses > 0
                          ? (
                              (att.attendedClasses / att.totalClasses) *
                              100
                            ).toFixed(1)
                          : "0.0";
                      const isLow = parseFloat(percentage) < 75;
                      return (
                        <div
                          key={att.id}
                          className="p-6 md:p-8 flex flex-col gap-5 hover:bg-navy-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5 min-w-0">
                              <span className="text-base font-semibold text-navy-900 tracking-tight leading-none truncate">
                                {att.subject.name}
                              </span>
                              <span className="text-[10px] font-semibold tracking-[0.15em] text-navy-300">
                                {att.attendedClasses} / {att.totalClasses} Units
                              </span>
                            </div>
                            <span
                              className={`text-xl font-semibold tabular-nums tracking-tighter ${isLow ? "text-rose-500" : "text-navy-900"}`}
                            >
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-navy-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              transition={{
                                duration: 1.5,
                                ease: [0.19, 1, 0.22, 1],
                              }}
                              className={`h-full rounded-full ${isLow ? "bg-rose-500" : "bg-navy-900"}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
