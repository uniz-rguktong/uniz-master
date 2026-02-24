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
  ].sort();

  if (semesters.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {semesters.map((sem) => (
        <div key={sem} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1.5 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900">
              {sem}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Grades Table */}
            {gradesBySemester[sem] && (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                    <Award className="w-4 h-4 text-blue-600" /> Grades
                  </h3>
                  {/* Calculate GPA if needed */}
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    CGPA: 0.00
                  </div>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-400 border-b border-slate-50 text-[10px] uppercase tracking-[0.2em] font-black">
                    <tr>
                      <th className="px-5 py-3">Subject</th>
                      <th className="px-5 py-3 text-center">Credit</th>
                      <th className="px-5 py-3 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {gradesBySemester[sem].map((g: Grade) => (
                      <tr
                        key={g.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-[15px] text-slate-900">
                          {g.subject.name}
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-500 font-semibold">
                          {g.subject.credits}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                            {g.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attendance List */}
            {attendanceBySemester[sem] && (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                    <Percent className="w-4 h-4 text-blue-600" /> Attendance
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
                        className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                          ></div>
                          <span className="font-bold text-[15px] text-slate-900">
                            {att.subject.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-black text-[15px] block leading-none ${isLow ? "text-red-600" : "text-slate-900"}`}
                          >
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {att.attendedClasses}/{att.totalClasses} Classes
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
