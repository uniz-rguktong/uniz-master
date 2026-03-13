import { useState, useEffect } from "react";
import {
  BookText,
  GraduationCap,
  CheckCircle2,
  User,
  Info,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "../../../api/apiClient";

interface Subject {
  id: string;
  subject: {
    code: string;
    name: string;
    credits: number;
    department: string;
  };
  faculty?: {
    name: string;
  };
}

interface Semester {
  id: string;
  name: string;
  status: string;
}

interface CurrentSubjectsResponse {
  semester: Semester;
  subjects: Subject[];
}

import { GET_CURRENT_SUBJECTS } from "../../../api/endpoints";
import CourseRegistration from "./CourseRegistration";

export default function MySubjects({
  studentId,
  branch,
  year,
}: {
  studentId: string;
  branch: string;
  year: string;
}) {
  const [data, setData] = useState<CurrentSubjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient<CurrentSubjectsResponse>(
        GET_CURRENT_SUBJECTS(studentId),
        {},
        false,
      );
      setData(res);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchSubjects();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-navy-900 animate-spin" />
      </div>
    );
  }

  if (!data || data.subjects.length === 0) {
    return (
      <CourseRegistration
        branch={branch}
        year={year}
        onComplete={fetchSubjects}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Semester Header Card */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-[32px] p-8 text-white shadow-xl shadow-navy-100/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-navy-100 text-xs font-black uppercase tracking-[0.2em]">
              Active Semester
            </span>
            <h2 className="text-3xl font-black tracking-tight">
              {data.semester.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3" /> Status:{" "}
                {data.semester.status.replace("_", " ")}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <GraduationCap className="w-3 h-3" /> Total Credits:{" "}
                {data.subjects.reduce(
                  (acc, curr) => acc + (curr.subject?.credits || 0),
                  0,
                )}
              </span>
            </div>
          </div>
          <div className="hidden lg:block opacity-20">
            <GraduationCap className="w-24 h-24" />
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.subjects.map((subject, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={subject.id}
            className="group bg-white border border-slate-100 p-4 rounded-xl hover:border-navy-100 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-navy-50 rounded-lg text-navy-900 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all duration-300">
                <BookText size={16} />
              </div>
              <span className="px-2 py-0.5 bg-slate-50 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                {subject.subject?.code}
              </span>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
              <h3 className="text-[13px] font-bold text-slate-800 leading-snug mb-2 min-h-[40px] line-clamp-2 group-hover:text-navy-900 transition-colors">
                {subject.subject?.name}
              </h3>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  {subject.subject?.department} • {subject.subject?.credits} Credits
                </div>
                {subject.faculty && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[80px]">
                      {subject.faculty?.name?.split(' ')[0] || "Staff"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-4 p-6 bg-navy-50/50 rounded-2xl border border-navy-100/50">
        <div className="p-2 bg-navy-100 rounded-xl text-navy-900">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-900 mb-1">
            Academic Registration Policy
          </h4>
          <p className="text-xs text-navy-800 leading-relaxed font-medium">
            These are your officially registered subjects for the current
            academic session. Any discrepancies should be reported to the
            Academic Affairs or Branch Dean office immediately. Changes to
            subject registration are only allowed during the "Registration Open"
            window.
          </p>
        </div>
      </div>
    </div>
  );
}
