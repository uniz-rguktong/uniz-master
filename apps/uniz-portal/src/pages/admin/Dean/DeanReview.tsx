/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Eye,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
  Users,
  BookText,
} from "lucide-react";
import { Spinner } from "../../../components/ui/ios-spinner";
import {
  DEAN_REVIEW,
  APPROVE_ALLOCATION,
  BASE_URL,
  GET_SUBJECTS,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
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
  batch?: string;
  academicYear: string;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
    department: string;
    semester: string;
  };
}

export default function DeanReview() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [filterYear, setFilterYear] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [newAllocData, setNewAllocData] = useState({
    subjectId: "",
    academicYear: "E4",
    batch: "",
  });

  // Get department from localStorage (AdminInfo)
  const adminInfo = (() => {
    try {
      const stored = localStorage.getItem("admin_info");
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return typeof parsed === "string" ? { department: parsed } : parsed;
    } catch {
      return { department: localStorage.getItem("department") || "CSE" };
    }
  })();

  const department = adminInfo.department;

  const fetchData = async () => {
    setLoading(true);
    try {
      const yearQuery = filterYear !== "all" ? `year=${filterYear}` : "";
      const batchQuery = filterBatch !== "all" ? `batch=${filterBatch}` : "";
      const query = [yearQuery, batchQuery].filter(Boolean).join("&");

      const [allocData, subjectsData, batchesData] = await Promise.all([
        apiClient<any[]>(
          `${DEAN_REVIEW(department)}${query ? `?${query}` : ""}`,
        ),
        apiClient<any[]>(GET_SUBJECTS),
        apiClient<string[]>(GET_AVAILABLE_BATCHES),
      ]);
      setAllocations(allocData || []);
      setAllSubjects(subjectsData || []);
      setAvailableBatches(batchesData || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [department, filterYear, filterBatch]);

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
      await apiClient(`${BASE_URL}/academics/dean/allocation/${editing.id}`, {
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllocData.subjectId) return;

    // Find active semester
    const activeSem = allocations[0]?.semesterId;
    if (!activeSem) {
      toast.error("No active semester group found. Cannot add manually.");
      return;
    }

    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation`, {
        method: "POST",
        body: JSON.stringify({
          ...newAllocData,
          semesterId: activeSem,
          branch: department,
        }),
      });
      toast.success("Subject added to rollout");
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add subject");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this subject from registration?")) return;
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation/${id}`, {
        method: "DELETE",
      });
      toast.success("Subject removed");
      fetchData();
    } catch (error: any) {
      toast.error("Deletion failed");
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
            Review and finalize subjects for the current semester registration
            rollout.
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <Users size={14} className="text-slate-400" />
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none border-none bg-transparent"
              >
                <option value="all">All Years</option>
                {["E1", "E2", "E3", "E4"].map((y) => (
                  <option key={y} value={y}>
                    {y} Engineering
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <BookText size={14} className="text-slate-400" />
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none border-none bg-transparent"
              >
                <option value="all">All Batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 text-white rounded-2xl font-bold text-xs hover:bg-navy-800 transition-all shadow-xl"
          >
            <Plus size={16} />
            Add Subject
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
          <Spinner size="lg" />
        </div>
      ) : allocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className={`bg-white border-2 rounded-[32px] p-8 transition-all ${
                alloc.isApproved
                  ? "border-emerald-50 opacity-80"
                  : "border-slate-100 shadow-xl hover:border-navy-100"
              } group`}
            >
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                      alloc.isApproved
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-navy-50 text-navy-900 group-hover:bg-navy-900 group-hover:text-white"
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

                <div className="flex items-center gap-3">
                  {!alloc.isApproved ? (
                    <>
                      <button
                        onClick={() => setEditing(alloc)}
                        className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        title="Edit Subject"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(alloc.id)}
                        className="p-3.5 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        disabled={approving === alloc.id}
                        onClick={() => handleApprove(alloc.id)}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {approving === alloc.id ? (
                          <Spinner size="sm" className="brightness-200" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                    </>
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
                {alloc.batch && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      Batch
                    </span>
                    <span className="font-bold text-slate-600 text-xs">
                      {alloc.batch}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Year
                  </span>
                  <span className="font-bold text-slate-600 text-xs text-navy-900">
                    {alloc.academicYear}
                  </span>
                </div>
                {!alloc.isApproved && (
                  <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-navy-900 uppercase tracking-widest">
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
            No subjects are pending for your branch review at this time.
          </p>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-navy-900 uppercase tracking-[0.2em]">
                  {editing.subject.code}
                </span>
                <h3 className="text-3xl font-black text-slate-900 italic">
                  Adjust Allocation
                </h3>
                <p className="text-slate-400 font-medium text-sm">
                  Update elective details or credit values
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
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 focus:bg-white focus:border-navy-100 outline-none transition-all shadow-sm"
                  placeholder="e.g. ELECTIVE (NPTEL - Deep Learning)"
                />
              </div>

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
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 focus:bg-white focus:border-navy-100 outline-none transition-all shadow-sm"
                />
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
                  className="flex-2 bg-navy-900 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all shadow-xl shadow-navy-100/20 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 italic">
                  Manual Allocation
                </h3>
                <p className="text-slate-400 font-medium text-sm">
                  Add a subject from the curriculum to this rollout
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Select Subject
                </label>
                <select
                  required
                  value={newAllocData.subjectId}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
                      subjectId: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 appearance-none focus:bg-white focus:border-navy-100 outline-none transition-all shadow-sm"
                >
                  <option value="">Choose a subject...</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} ({s.credits} Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Academic Year
                </label>
                <select
                  value={newAllocData.academicYear}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
                      academicYear: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 appearance-none focus:bg-white focus:border-navy-100 outline-none transition-all shadow-sm"
                >
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <option key={y} value={y}>
                      {y} Engineering
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Student Batch (Optional)
                </label>
                <select
                  value={newAllocData.batch}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
                      batch: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-4 font-bold text-slate-700 appearance-none focus:bg-white focus:border-navy-100 outline-none transition-all shadow-sm"
                >
                  <option value="">Infer from Year</option>
                  {availableBatches.map((b) => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-navy-900 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all shadow-xl shadow-navy-100/20 active:scale-95"
                >
                  Deploy Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
