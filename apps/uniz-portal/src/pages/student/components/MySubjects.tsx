import { useState, useEffect } from "react";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  MapPin,
  User,
  Info,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "../../../api/apiClient";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  faculty?: string;
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

import CourseRegistration from "./CourseRegistration";

export default function MySubjects({ studentId }: { studentId: string }) {
  const [data, setData] = useState<CurrentSubjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient<CurrentSubjectsResponse>(
        `/academics/student/current/${studentId}`,
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data || data.subjects.length === 0) {
    return <CourseRegistration onComplete={fetchSubjects} />;
  }

  return (
    <div className="space-y-8">
      {/* Semester Header Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-blue-100 text-xs font-black uppercase tracking-[0.2em]">
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
                {data.subjects.reduce((acc, curr) => acc + curr.credits, 0)}
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
            className="group bg-white border border-slate-100 p-6 rounded-[24px] hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
          >
            {/* Background Polish */}
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-24 h-24 -mr-8 -mt-8" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.15em] py-0.5 px-2 bg-blue-50 rounded-md">
                    {subject.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {subject.name}
                  </h3>
                </div>
                <div className="text-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Credits
                  </span>
                  <span className="text-lg font-black text-slate-800 group-hover:text-blue-600 leading-none">
                    {subject.credits}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 mt-auto">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {subject.department}
                  </span>
                </div>
                {subject.faculty && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="p-1.5 bg-slate-50 rounded-lg">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                      {subject.faculty}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">
            Academic Registration Policy
          </h4>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
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
