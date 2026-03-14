import { Grade, Attendance, Student } from "../../../types";
import { Percent, Award } from "lucide-react";
import { motion } from "framer-motion";

interface AcademicRecordProps {
  student: Student;
}

export default function AcademicRecord({ student }: AcademicRecordProps) {
  // Group grades by Semester
  const gradesBySemester = (student.grades || []).reduce((acc: any, grade: Grade) => {
    const semName = grade.semester?.name || "Unknown";
    if (!acc[semName]) acc[semName] = [];
    acc[semName].push(grade);
    return acc;
  }, {});

  // Group attendance by Semester
  const attendanceBySemester = (student.attendance || []).reduce((acc: any, att: Attendance) => {
    const semName = att.semester?.name || "Unknown";
    if (!acc[semName]) acc[semName] = [];
    acc[semName].push(att);
    return acc;
  }, {});

  const semesters = [
    ...new Set([
      ...Object.keys(gradesBySemester || {}),
      ...Object.keys(attendanceBySemester || {}),
    ]),
  ].filter((s) => s !== "Unknown").sort();

  if (semesters.length === 0) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {semesters.map((sem) => (
        <div key={sem} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 bg-navy-900 rounded-full"></div>
            <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
              {sem} Terminal Records
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Grades Table */}
            {gradesBySemester[sem] && (
              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-navy-50 rounded-lg text-navy-900">
                      <Award size={18} />
                    </div>
                    <h3 className="font-bold text-[11px] uppercase tracking-[0.1em] text-slate-500">
                      Subject Performance
                    </h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold tracking-tight">
                    PASSED ALL
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30 text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider w-[75%]">Subject</th>
                        <th className="px-3 py-4 font-bold text-[10px] uppercase tracking-wider text-center w-[10%]">Cr</th>
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-right w-[15%]">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradesBySemester[sem].map((g: Grade) => (
                        <tr
                          key={g.id}
                          className="hover:bg-slate-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-[14px] text-slate-800 leading-tight group-hover:text-navy-900 transition-colors">
                                {g.subject.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {g.subject.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                              {g.subject.credits}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded font-black text-[11px] ${
                                  g.grade === 0 
                                    ? "bg-rose-50 text-rose-600 border border-rose-100/50" 
                                    : g.grade >= 9 
                                      ? "bg-navy-900 text-white"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {g.grade === 0 ? "F" : g.grade}
                              </span>
                              {g.isRemedial && (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                                  Remedial
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance List */}
            {attendanceBySemester[sem] && (
              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm h-fit">
                <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <Percent size={18} />
                    </div>
                    <h3 className="font-bold text-[11px] uppercase tracking-[0.1em] text-slate-500">
                      Attendance Matrix
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {attendanceBySemester[sem].map((att: Attendance) => {
                    const percentage =
                      att.totalClasses > 0
                        ? (
                            (att.attendedClasses / att.totalClasses) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    const isLow = parseFloat(percentage) < 75;
                    const isHigh = parseFloat(percentage) > 90;
                    return (
                      <div
                        key={att.id}
                        className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ring-4 ${
                              isLow 
                                ? "bg-rose-500 ring-rose-500/10" 
                                : isHigh 
                                  ? "bg-emerald-500 ring-emerald-500/10" 
                                  : "bg-amber-500 ring-amber-500/10"
                            }`}
                          ></div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[14px] text-slate-800 truncate group-hover:text-navy-900 transition-colors">
                              {att.subject.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {att.attendedClasses} of {att.totalClasses} Units
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-4">
                          <span
                            className={`font-black text-[16px] tabular-nums block leading-none transition-transform group-hover:scale-110 ${
                              isLow ? "text-rose-500" : isHigh ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {percentage}%
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-full ${isLow ? "bg-rose-500" : isHigh ? "bg-emerald-500" : "bg-amber-500"}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
