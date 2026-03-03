/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Eye,
  Loader2,
  AlertCircle,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  DEAN_REVIEW,
  APPROVE_ALLOCATION,
  ACADEMIC_FACULTY,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

interface Allocation {
  id: string;
  semesterId: string;
  branch: string;
  subjectId: string;
  facultyId: string | null;
  customName: string | null;
  customCredits: number | null;
  isApproved: boolean;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
    department: string;
    semester: string;
  };
  faculty?: {
    id: string;
    name: string;
  };
}

export default function DeanReview() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Allocation | null>(null);

  // Get department from localStorage (AdminInfo)
  const adminInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("admin_info") || "{}");
    } catch {
      return {};
    }
  })();

  const department = adminInfo.department;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocData, facData] = await Promise.all([
        apiClient<any[]>(DEAN_REVIEW(department)),
        apiClient<any[]>(ACADEMIC_FACULTY),
      ]);
      setAllocations(allocData || []);
      setFaculties(facData || []);
    } catch (error) {
      toast.error("Failed to fetch branch allocations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [department]);

  const handleApprove = async (allocationId: string) => {
    setApproving(allocationId);
    try {
      await apiClient(APPROVE_ALLOCATION, {
        method: "POST",
        body: JSON.stringify({ allocationId }),
      });
      toast.success("Subject allocation approved");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await apiClient(`/academics/dean/allocation/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(editing),
      });
      toast.success("Allocation updated");
      setEditing(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleExport = async () => {
    // Disabled until EXPORT_ACADEMIC_DATA is implemented
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            {department} Branch Review
          </h2>
          <p className="text-slate-500 font-medium">
            Review and finalize subject-faculty mappings for the current
            semester
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            disabled={allocations.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            Export XLS
          </button>
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle className="text-amber-500" size={18} />
            <p className="text-amber-700 text-xs font-black uppercase tracking-widest">
              {allocations.filter((a: any) => !a.isApproved).length} Pending
              Approvals
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
      ) : allocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className={`bg-white border-2 rounded-[32px] p-8 transition-all ${
                alloc.isApproved
                  ? "border-emerald-50 opacity-80"
                  : "border-slate-100 shadow-xl hover:border-blue-200"
              } group`}
            >
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                      alloc.isApproved
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    }`}
                  >
                    <BookOpen size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {alloc.subject.code}
                      </span>
                      {alloc.isApproved && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Check size={8} strokeWidth={4} /> Approved
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight italic">
                      {alloc.subject.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        Assigned Faculty
                      </p>
                      <p className="font-bold text-slate-700 text-sm">
                        {alloc.faculty?.name || "None Assigned"}
                      </p>
                    </div>
                  </div>

                  {!alloc.isApproved ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditing(alloc)}
                        className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        title="Edit Subject (Electives)"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        disabled={approving === alloc.id}
                        onClick={() => handleApprove(alloc.id)}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {approving === alloc.id ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-100">
                      <ShieldCheck size={24} />
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Meta (Secondary info) */}
              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Credits
                  </span>
                  <span className="font-bold text-slate-600 text-xs">
                    {alloc.subject.credits} Units
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Semester
                  </span>
                  <span className="font-bold text-slate-600 text-xs">
                    {alloc.subject.semester}
                  </span>
                </div>
                {!alloc.isApproved && (
                  <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    Ready for Review <ArrowRight size={12} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
            <Eye size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900">All caught up!</h3>
          <p className="text-slate-400 font-medium max-w-sm font-outfit mt-2">
            No subject-faculty allocations are pending for your branch review at
            this time.
          </p>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                  {editing.subject.code}
                </span>
                <h3 className="text-3xl font-black text-slate-900 italic">
                  Adjust Allocation
                </h3>
                <p className="text-slate-400 font-medium text-sm">
                  Update elective details or reassign faculty
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <Download className="rotate-45" size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Subject Name (Custom for Electives)
                </label>
                <input
                  value={editing.customName || editing.subject.name}
                  onChange={(e) =>
                    setEditing({ ...editing, customName: e.target.value })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-sm"
                  placeholder="e.g. ELECTIVE (NPTEL - Deep Learning)"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={editing.customCredits || editing.subject.credits}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        customCredits: parseInt(e.target.value) || null,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Assign Faculty
                  </label>
                  <select
                    value={editing.facultyId || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, facultyId: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-600 outline-none transition-all shadow-sm"
                  >
                    <option value="">Select Faculty</option>
                    {faculties
                      .filter((f) => f.department === department)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
