import { Grade, Attendance, Student } from "../../../types";
import { Percent, Award } from "lucide-react";

interface AcademicRecordProps {
  student: Student;
}

export default function AcademicRecord({ student }: AcademicRecordProps) {
  // Group grades by Semester
  const gradesBySemester = (student.grades || []).reduce((acc: any, grade) => {
    const semName = grade.semester?.name || "Unknown";
    if (!acc[semName]) acc[semName] = [];
    acc[semName].push(grade);
    return acc;
  }, {});

  // Group attendance by Semester
  const attendanceBySemester = student.attendance?.reduce((acc: any, att) => {
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
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-400">
                    <Award size={14} className="text-navy-900" /> Subject
                    Performance
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    CGPA: 0.00
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-white text-slate-400 border-b border-slate-50 text-[10px] uppercase tracking-widest font-bold">
                      <tr>
                        <th className="px-5 py-3 w-[60%]">Descriptor</th>
                        <th className="px-3 py-3 text-center w-[20%]">Cr</th>
                        <th className="px-5 py-3 text-right w-[20%]">Gr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {gradesBySemester[sem].map((g: Grade) => (
                        <tr
                          key={g.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-4 font-semibold text-[14px] text-slate-900 leading-tight">
                            {g.subject.name}
                          </td>
                          <td className="px-3 py-4 text-center text-slate-400 font-bold text-[11px]">
                            {g.subject.credits}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${g.grade === 0 ? "bg-red-50 text-red-600 border-red-100/50" : "bg-navy-50 text-navy-900 border-navy-100/50"}`}
                              >
                                {g.grade === 0 ? "R" : g.grade}
                              </span>
                              {g.isRemedial && (
                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                                  Remedial Pass
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
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm h-fit">
                <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-400">
                    <Percent size={14} className="text-navy-900" /> Attendance
                    Matrix
                  </h3>
                </div>
                <div className="divide-y divide-slate-50">
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
                        className="px-5 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-red-500" : "bg-emerald-500"}`}
                          ></div>
                          <span className="font-semibold text-[14px] text-slate-800">
                            {att.subject.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold text-[15px] block leading-none ${isLow ? "text-red-500" : "text-slate-900"}`}
                          >
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                            {att.attendedClasses} / {att.totalClasses} Units
                          </span>
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
