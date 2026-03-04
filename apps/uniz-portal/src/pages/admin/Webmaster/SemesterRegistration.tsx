/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  BookOpen,
  Users,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  SEMESTERS,
  INIT_SEMESTER,
  UPDATE_SEMESTER_STATUS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function SemesterRegistration() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInitModal, setShowInitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Init Modal
  const [academicSemester, setAcademicSemester] = useState("AY 2024-25 E4 S2");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([
    "CSE",
    "ECE",
    "CIVIL",
    "MECH",
    "EEE",
  ]);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any>(SEMESTERS);
      setSemesters(data || []);
    } catch (error) {
      toast.error("Failed to fetch semesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiClient(UPDATE_SEMESTER_STATUS(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Semester status updated to ${status}`);
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this semester session?")
    )
      return;
    try {
      await apiClient(`${SEMESTERS}/${id}`, {
        method: "DELETE",
      });
      toast.success("Semester deleted successfully");
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleInitSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic implementation: Webmaster defines semester and branches.
      // The backend then maps standard subjects for those branches for that semester label.
      // We'll pass a simplified branch structure that the backend can expand.
      const branches = selectedBranches.map((branch) => ({
        branchName: branch,
        subjects: [], // Let backend auto-map based on semester label and branch
      }));

      await apiClient(INIT_SEMESTER, {
        method: "POST",
        body: JSON.stringify({ academicSemester, branches }),
      });

      toast.success("Semester initialized successfully");
      setShowInitModal(false);
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message || "Initialization failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "DEAN_REVIEW":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "REGISTRATION":
      case "REGISTRATION_OPEN":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "ONGOING":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "COMPLETED":
        return "bg-purple-50 text-purple-600 border-purple-100";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Registration Workflow
          </h2>
          <p className="text-slate-500 font-medium font-outfit">
            Orchestrate semester lifecycle and student subject allocations
          </p>
        </div>
        <button
          onClick={() => setShowInitModal(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center gap-2.5 hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-100 active:scale-95 active:translate-y-0"
        >
          <Plus size={18} /> Initialize New Semester
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2
            className="animate-spin text-blue-600"
            size={48}
            strokeWidth={3}
          />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            Loading Workflows...
          </p>
        </div>
      ) : semesters.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {semesters.map((sem: any) => (
            <div
              key={sem.id}
              className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div
                    className={`p-5 rounded-[24px] border-2 ${getStatusColor(sem.status)} transition-all duration-300 group-hover:scale-105`}
                  >
                    <Calendar size={32} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">
                      {sem.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(sem.status)}`}
                      >
                        {sem.status.replace("_", " ")}
                      </span>
                      <span className="text-slate-300 font-bold">•</span>
                      <p className="text-xs font-bold text-slate-400 font-outfit tracking-wide">
                        Created{" "}
                        {new Date(sem.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {(sem.status === "DEAN_REVIEW" ||
                    sem.status === "UPCOMING") && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(sem.id, "REGISTRATION_OPEN")
                      }
                      className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Play size={14} fill="currentColor" /> Open Registration
                    </button>
                  )}
                  {(sem.status === "REGISTRATION" ||
                    sem.status === "REGISTRATION_OPEN") && (
                    <button
                      onClick={() => handleStatusUpdate(sem.id, "ONGOING")}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      <RotateCcw size={14} /> Start Classes
                    </button>
                  )}
                  {sem.status === "ONGOING" && (
                    <button
                      onClick={() => handleStatusUpdate(sem.id, "COMPLETED")}
                      className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <CheckCircle2 size={14} /> Close Semester
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(sem.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 active:scale-90"
                    title="Delete Session"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="h-10 w-[1px] bg-slate-100 hidden lg:block mx-2" />

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Active Branches
                      </p>
                      <div className="flex -space-x-2 mt-1">
                        {sem.branches?.map((b: any, i: number) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-600 shadow-sm"
                          >
                            {b.branchName.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      className="text-slate-300 group-hover:text-blue-500 transition-colors"
                      size={24}
                    />
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-slate-50 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
            <Clock size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 mt-2">
            No Active Workflow
          </h3>
          <p className="text-slate-400 font-medium max-w-sm mb-8 font-outfit">
            Start the academic session by initializing a new semester with
            branch-level subject allocations.
          </p>
          <button
            onClick={() => setShowInitModal(true)}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl"
          >
            Start Initialization
          </button>
        </div>
      )}

      {/* Initialize Modal */}
      {showInitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-100">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Semester Initialization
                  </h3>
                  <p className="text-slate-400 font-semibold text-sm">
                    Configure branch-level subject mappings
                  </p>
                </div>
              </div>

              <form onSubmit={handleInitSemester} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Academic Semester Label
                  </label>
                  <div className="relative group">
                    <Calendar
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                      size={20}
                    />
                    <input
                      required
                      value={academicSemester}
                      onChange={(e) => setAcademicSemester(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-black text-slate-700 placeholder:text-slate-300"
                      placeholder="e.g. AY 2024-25 E4 S2"
                    />
                  </div>
                  <div className="flex items-start gap-2 ml-1 text-[10px] font-bold text-slate-400 italic">
                    <AlertCircle size={10} className="mt-0.5" />
                    <span>
                      This label must match the semester format in your Subjects
                      repository (e.g. E4-SEM-2)
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Active Branches
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["CSE", "ECE", "CIVIL", "MECH", "EEE", "CHEM", "MME"].map(
                      (branch) => (
                        <button
                          key={branch}
                          type="button"
                          onClick={() =>
                            setSelectedBranches((prev) =>
                              prev.includes(branch)
                                ? prev.filter((b) => b !== branch)
                                : [...prev, branch],
                            )
                          }
                          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            selectedBranches.includes(branch)
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105"
                              : "bg-slate-50 text-slate-400 border border-slate-100 hover:border-blue-200"
                          }`}
                        >
                          {branch}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
                  <div className="p-3 bg-white rounded-2xl text-amber-500 shrink-0 shadow-sm border border-amber-100">
                    <BookOpen size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-amber-900 text-sm italic">
                      Automated mapping
                    </h4>
                    <p className="text-xs font-medium text-amber-700 leading-relaxed font-outfit">
                      Initializing will automatically pull matching subjects
                      from the repository. Branch Deans will be notified to
                      review faculty assignments.
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowInitModal(false)}
                    className="flex-1 px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Discard
                  </button>
                  <button
                    disabled={isSubmitting || selectedBranches.length === 0}
                    type="submit"
                    className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        <Users size={18} /> Deploy Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
