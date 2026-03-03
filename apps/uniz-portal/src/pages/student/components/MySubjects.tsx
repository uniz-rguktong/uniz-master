import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  CreditCard,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "../../../api/apiClient";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
}

interface Semester {
  id: string;
  name: string;
  status: string;
}

export default function MySubjects({ studentId }: { studentId: string }) {
  const [data, setData] = useState<{
    semester: Semester;
    subjects: Subject[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubjects = async () => {
      try {
        const res = await apiClient<{
          semester: Semester;
          subjects: Subject[];
        }>(`/academics/student/current/${studentId}`);
        setData(res);
      } catch (error) {
        // Quietly fail if no semester is active
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchMySubjects();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!data || data.subjects.length === 0) {
    return (
      <div className="bg-slate-50/50 rounded-3xl p-12 border border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm">
          <BookOpen className="text-slate-300" size={40} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            No Active Registrations
          </h3>
          <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto">
            You are not currently registered for any subjects in the active
            semester.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Semester Header Card */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Calendar size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50">
              Active Academic Session
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {data.semester.name}
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                Status: {data.semester.status.replace("_", " ")}
              </span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="flex items-center gap-2">
                <BookOpen size={14} className="text-blue-500" />
                {data.subjects.length} Subjects Linked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.subjects.map((subject, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={subject.id}
            className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 transform translate-x-12 -translate-y-12 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500 opacity-5 text-blue-600">
              <BookOpen size={80} />
            </div>

            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-900 font-black text-xs border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                {subject.code}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100/50 text-[10px] font-black uppercase tracking-widest">
                <CreditCard size={12} />
                {subject.credits} Credits
              </div>
            </div>

            <h4 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
              {subject.name}
            </h4>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <Clock size={12} /> Registered
              </div>
              <div className="text-green-500 flex items-center gap-1">
                Verified <CheckCircle2 size={12} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
