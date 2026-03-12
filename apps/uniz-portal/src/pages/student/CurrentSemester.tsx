import { useState, useEffect } from "react";
import { apiClient } from "../../api/apiClient";
import { GET_SEMESTER_OVERVIEW } from "../../api/endpoints";
import { Book, ChevronRight, Layers } from "lucide-react";

export default function CurrentSemester() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient<any>(GET_SEMESTER_OVERVIEW);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to fetch semester overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            Loading Semester Data...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.semester) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <div className="md:bg-white p-12 md:rounded-3xl md:border md:border-slate-100 md:shadow-sm bg-transparent">
          <Layers className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            No Active Semester
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            The administration has not yet activated a semester session for your
            batch.
          </p>
        </div>
      </div>
    );
  }

  const { semester, data: studentData } = data;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              {semester.status.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">
            {semester.name}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Current Academic Registration Details
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="md:bg-white p-4 px-6 md:rounded-2xl md:border md:border-slate-100 md:shadow-sm bg-transparent flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Subjects
            </span>
            <span className="text-2xl font-black text-slate-900">
              {studentData?.summary?.subjectCount || 0}
            </span>
          </div>
          <div className="md:bg-white p-4 px-6 md:rounded-2xl md:border md:border-slate-100 md:shadow-sm bg-transparent flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Credits
            </span>
            <span className="text-2xl font-black text-blue-600">
              {studentData?.summary?.totalCredits || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentData?.registrations?.map((reg: any) => (
          <div
            key={reg.id}
            className="group md:bg-white p-5 md:rounded-3xl md:border md:border-slate-100 md:shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden bg-transparent border-b border-slate-100 last:border-0"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Book className="w-20 h-20" />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Book className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Credits
                </span>
                <span className="text-lg font-black text-slate-900 leading-none">
                  {reg.credits}.0
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                {reg.subjectCode}
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                {reg.subjectName}
              </h3>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Verified Registration
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {(!studentData?.registrations ||
        studentData.registrations.length === 0) && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-10 text-center">
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            No Registered Subjects
          </h3>
          <p className="text-amber-700/70 text-sm max-w-sm mx-auto font-medium">
            You haven't completed your registration for the current semester
            yet. Please visit the registration portal if open.
          </p>
        </div>
      )}
    </div>
  );
}
