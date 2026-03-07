/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Loader2,
  User,
  BookOpen,
  ChevronDown,
  Calendar,
} from "lucide-react";
import {
  ADD_MANUAL_GRADE,
  GET_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function GradesSection() {
  const [loading, setLoading] = useState(false);

  const [manualGrade, setManualGrade] = useState({
    studentId: "",
    subjectId: "",
    semesterId: "SEM-1",
    grade: "",
  });
  const [manualDept, setManualDept] = useState("CSE");
  const [manualYear, setManualYear] = useState("E1");

  const [manualSubjects, setManualSubjects] = useState<
    { code: string; name: string }[]
  >([]);
  const [manualSubjectsLoading, setManualSubjectsLoading] = useState(false);

  useEffect(() => {
    const fetchManualSubjects = async () => {
      setManualSubjectsLoading(true);
      setManualGrade((prev) => ({ ...prev, subjectId: "" }));
      try {
        const token = (
          localStorage.getItem("admin_token") ||
          localStorage.getItem("faculty_token") ||
          ""
        ).replace(/"/g, "");
        const url = `${GET_SUBJECTS}?department=${manualDept}&semester=${encodeURIComponent(manualGrade.semesterId)}&limit=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.subjects) {
          const filtered = data.subjects.filter((s: any) =>
            s.code.toUpperCase().includes(`-${manualYear}-`),
          );
          setManualSubjects(
            filtered.map((s: any) => ({ code: s.code, name: s.name })),
          );
        } else {
          setManualSubjects([]);
        }
      } catch {
        setManualSubjects([]);
      } finally {
        setManualSubjectsLoading(false);
      }
    };
    fetchManualSubjects();
  }, [manualDept, manualYear, manualGrade.semesterId]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient<any>(ADD_MANUAL_GRADE, {
        method: "POST",
        body: JSON.stringify(manualGrade),
      });
      if (res && res.success) {
        toast.success("Grade added successfully");
        setManualGrade({
          ...manualGrade,
          studentId: "",
          grade: "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
          Manual Grade upload
        </h2>
        <p className="text-slate-500 font-medium text-[15px]">
          Rapid individual record provisioning and performance entry.
        </p>
      </div>

      <div className="max-w-4xl bg-white rounded-2xl border border-slate-100 p-10 space-y-10 shadow-none">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-none">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 text-blue-600 uppercase">
              System Commitment
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Ledger level grade provisioning
            </p>
          </div>
        </div>

        <form onSubmit={handleManualAdd} className="space-y-10">
          {/* Row 1: Student & Dept */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Student ID
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                <input
                  required
                  value={manualGrade.studentId}
                  onChange={(e) =>
                    setManualGrade({
                      ...manualGrade,
                      studentId: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 text-xs tracking-wider"
                  placeholder="E.G. O210329"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Department
              </label>
              <div className="relative group">
                <select
                  value={manualDept}
                  onChange={(e) => setManualDept(e.target.value)}
                  className="w-full h-14 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                >
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MATHEMATICS", "PHYSICS", "IT", "ENGLISH"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Academic Year
              </label>
              <div className="relative group">
                <select
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                  className="w-full h-14 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                >
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          {/* Row 2: Semester & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Academic Semester
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <select
                  value={manualGrade.semesterId}
                  onChange={(e) =>
                    setManualGrade({
                      ...manualGrade,
                      semesterId: e.target.value,
                    })
                  }
                  className="w-full h-14 pl-12 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`SEM-${s}`}>Semester {s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Subject Selection
                {manualSubjectsLoading && (
                  <span className="ml-2 text-blue-500 normal-case tracking-normal font-bold text-[9px] animate-pulse">
                    (Querying Pool...)
                  </span>
                )}
              </label>
              <div className="relative group">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 z-10" />
                <select
                  required
                  value={manualGrade.subjectId}
                  onChange={(e) =>
                    setManualGrade({
                      ...manualGrade,
                      subjectId: e.target.value,
                    })
                  }
                  className="w-full h-14 pl-12 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none disabled:opacity-50"
                  disabled={manualSubjectsLoading}
                >
                  <option value="">
                    {manualSubjectsLoading
                      ? "Querying subjects..."
                      : manualSubjects.length === 0
                        ? "No subjects available"
                        : "Choose Subject"}
                  </option>
                  {manualSubjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          {/* Row 3: Grade Input */}
          <div className="w-full p-8 bg-slate-900 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 ml-1">
                Performance Result
              </label>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Alpha grade protocol
              </span>
            </div>
            <div className="relative group max-w-sm">
              <input
                required
                value={manualGrade.grade}
                onChange={(e) =>
                  setManualGrade({
                    ...manualGrade,
                    grade: e.target.value.toUpperCase(),
                  })
                }
                className="w-full h-16 px-6 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 outline-none transition-all font-black text-2xl text-white placeholder-white/20 tracking-tighter"
                placeholder="EX, A, B, C..."
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Note: System commitments are final. Cross-verify student ID and subject mapping before execution.</p>
          </div>

          <button
            type="submit"
            disabled={loading || !manualGrade.subjectId}
            className="w-full bg-blue-600 text-white h-16 rounded-2xl font-black uppercase tracking-[0.25em] text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-none"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
            {loading ? "PROVISIONING..." : "COMMIT GRADE TO LEDGER"}
          </button>
        </form>
      </div>
    </div>
  );
}
