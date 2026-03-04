import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Download,
  Edit3,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { apiClient, downloadFile } from "../../../api/apiClient";
import {
  SEMESTERS,
  INIT_SEMESTER,
  UPDATE_SEMESTER_STATUS,
  DELETE_SEMESTER,
  DEAN_REVIEW,
  DEAN_APPROVE,
  GET_REGISTRATIONS,
  ACADEMIC_FACULTY,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

interface Semester {
  id: string;
  name: string;
  status:
    | "DRAFT"
    | "DEAN_REVIEW"
    | "APPROVED"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED";
  _count?: { registrations: number };
  createdAt: string;
}

interface Allocation {
  id: string;
  branch: string;
  subject: { name: string; code: string; credits: number };
  faculty?: { name: string; username: string };
  facultyId?: string;
  isApproved: boolean;
  customName?: string;
  customCredits?: number;
}

export default function SemesterRegistrationSection({
  isAdmin = true,
  branch = "",
}: {
  isAdmin?: boolean;
  branch?: string;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "details">("list");
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    customName: "",
    customCredits: 0,
    facultyId: "",
  });
  const [activeViewTab, setActiveViewTab] = useState<
    "allocations" | "registrations"
  >("allocations");
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [branchFilter, setBranchFilter] = useState(branch || "all");
  const [faculties, setFaculties] = useState<any[]>([]);

  // For New Semester Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("AY 2024-25 SEM-2");
  const [selectedBranches, setSelectedBranches] = useState([
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL",
    "CHEM",
  ]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (activeTab === "details" && selectedSem) {
      if (activeViewTab === "allocations") {
        fetchAllocations();
      } else {
        fetchRegistrations();
      }
    }
  }, [activeTab, branchFilter, selectedSem?.id, activeViewTab]);

  const fetchSemesters = async () => {
    try {
      const res = await apiClient<any[]>(SEMESTERS);
      if (res) setSemesters(res);
    } catch (err) {
      console.error("Failed to fetch semesters");
    }
  };

  const initSemester = async () => {
    setLoading(true);
    try {
      const res = await apiClient(INIT_SEMESTER, {
        method: "POST",
        body: JSON.stringify({
          academicSemester: newName,
          branches: selectedBranches.map((b) => ({ branchName: b })),
        }),
      });
      if (res) {
        toast.success("Semester Initialized Successfully");
        setShowNewModal(false);
        fetchSemesters();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSemester = async (id: string) => {
    if (!window.confirm("Are you sure? This is IRREVERSIBLE.")) return;
    try {
      await apiClient(DELETE_SEMESTER(id), { method: "DELETE" });
      toast.success("Semester Deleted");
      fetchSemesters();
    } catch (err) {
      toast.error("Deletion Failed");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiClient(UPDATE_SEMESTER_STATUS(id), {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (res) {
        toast.success("Status Updated");
        fetchSemesters();
      }
    } catch (err) {
      toast.error("Update Failed");
    }
  };

  const viewDetails = async (sem: Semester) => {
    setSelectedSem(sem);
    setActiveTab("details");
  };

  const fetchRegistrations = async () => {
    if (!selectedSem) return;
    setLoading(true);
    try {
      const res = await apiClient<any[]>(
        `${GET_REGISTRATIONS}?semesterId=${selectedSem.id}&branch=${branchFilter}`,
      );
      if (res) setRegisteredStudents(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    if (!selectedSem) return;

    setLoading(true);
    try {
      const res = await apiClient<any>(
        `${DEAN_REVIEW(branchFilter)}?semesterId=${selectedSem.id}`,
      );
      if (res) setAllocations(res);
    } finally {
      setLoading(false);
    }
  };

  const approveAllocation = async () => {
    setLoading(true);
    try {
      const res = await apiClient(DEAN_APPROVE, {
        method: "POST",
        body: JSON.stringify({
          branch: branchFilter === "all" ? "all" : branchFilter,
          semesterId: selectedSem?.id,
        }),
      });
      if (res) {
        toast.success("Review Completed Successfully");
        fetchAllocations();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async (dept?: string) => {
    try {
      const url =
        dept && dept !== "all"
          ? `${ACADEMIC_FACULTY}?department=${dept}`
          : ACADEMIC_FACULTY;
      const res = await apiClient<any[]>(url);
      if (res) setFaculties(res);
    } catch (err) {
      console.error("Failed to fetch faculties");
    }
  };

  const openEditModal = (item: Allocation) => {
    setEditingAllocation(item);
    setEditFormData({
      customName: item.customName || item.subject.name,
      customCredits: item.customCredits || item.subject.credits,
      facultyId: item.facultyId || "",
    });
    // Fetch faculties for the relevant branch
    fetchFaculties(item.branch);
  };

  const saveAllocation = async () => {
    if (!editingAllocation) return;
    setLoading(true);
    try {
      await apiClient(`/academics/allocation/${editingAllocation.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      });
      toast.success("Allocation Updated");
      setEditingAllocation(null);
      fetchAllocations();
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (type: string) => {
    if (!selectedSem) return;
    const url = `/academics/export`;
    await downloadFile(url, `${selectedSem.name}_${type}.xlsx`, {
      type,
      semesterId: selectedSem.id,
      branch: branchFilter,
    });
  };

  if (activeTab === "details" && selectedSem) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("list")}
              className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-1 opacity-70">
                Department Review • {branch || "ALL BRANCHES"}
              </p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {selectedSem.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => downloadExport("allocations")}
              className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[20px] font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              <Download size={18} />
              Export XLSX
            </button>
            {(isAdmin ||
              (branchFilter !== "all" && !isAdmin) ||
              // @ts-ignore
              (branchFilter === "all" && !isAdmin && role === "dean")) && (
              <button
                onClick={approveAllocation}
                className={`flex items-center gap-3 px-8 py-4 ${branchFilter === "all" ? "bg-slate-900 border border-slate-700" : "bg-blue-600 shadow-blue-100"} text-white rounded-[20px] font-bold text-sm hover:opacity-90 transition-all shadow-xl`}
              >
                <ShieldCheck size={18} />
                {branchFilter === "all"
                  ? "Global Approval Override"
                  : "Approve Course List"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveViewTab("allocations")}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeViewTab === "allocations" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
            >
              Subject Allocations
            </button>
            <button
              onClick={() => {
                setActiveViewTab("registrations");
                fetchRegistrations();
              }}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeViewTab === "registrations" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
            >
              Registered Students
            </button>
          </div>

          {isAdmin && (
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                // Trigger fresh fetch
                if (activeViewTab === "allocations") {
                  setTimeout(() => fetchAllocations(), 10);
                } else {
                  setTimeout(() => fetchRegistrations(), 10);
                }
              }}
              className="bg-white border border-slate-100 rounded-full px-4 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Every Branch</option>
              {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                <option key={b} value={b}>
                  {b} Department
                </option>
              ))}
            </select>
          )}
        </div>

        {activeViewTab === "allocations" ? (
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Subject Details
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Assignment
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 uppercase">
                {allocations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-all group font-bold"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p className="text-slate-900 text-[13px] tracking-tight">
                            {item.customName || item.subject.name}
                          </p>
                          <p className="text-[9px] text-slate-400 tracking-widest">
                            {item.subject.code} •{" "}
                            {item.customCredits || item.subject.credits} CREDITS
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Users size={14} className="text-slate-300" />
                        <span className="text-[12px] text-slate-500">
                          {item.faculty?.name || "NOT ASSIGNED"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {item.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] border border-emerald-100 uppercase">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] border border-amber-100 uppercase">
                          <Clock size={10} /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-all bg-slate-50 rounded-xl border border-transparent hover:border-blue-100"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allocations.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  No subjects allocated yet for this branch.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50">
            <table className="w-full text-left font-bold">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Student ID
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Subject
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 uppercase">
                {registeredStudents.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <Users size={18} />
                        </div>
                        <span className="text-slate-900">{reg.studentId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-900 leading-tight">
                          {reg.subject?.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {reg.subject?.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] ${reg.status === "REGISTERED" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-xs">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {registeredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-8 py-20 text-center text-slate-400 italic"
                    >
                      No registrations found yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Semester Events
          </h1>
          <p className="text-slate-500 font-medium">
            Coordinate registration rollouts and monitor subject allocations.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-200 border-2 border-white/20"
          >
            <Zap size={18} />
            Start New Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {semesters.map((sem) => (
          <div
            key={sem.id}
            className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all group relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-1000 group-hover:rotate-12 ${sem.status === "REGISTRATION_OPEN" ? "text-emerald-500" : "text-blue-500"}`}
            >
              <Zap size={120} />
            </div>

            <div className="flex items-start justify-between mb-8">
              <div
                className={`p-4 rounded-[20px] shadow-inner ${sem.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
              >
                <Clock size={28} />
              </div>
              <span
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  sem.status === "REGISTRATION_OPEN"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : sem.status === "DEAN_REVIEW"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                {sem.status.replace("_", " ")}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-blue-600 transition-colors uppercase">
              {sem.name}
            </h3>

            <div className="flex items-center gap-6 mb-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Registrations
                </p>
                <p className="text-xl font-black text-slate-900">
                  {sem._count?.registrations || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Created
                </p>
                <p className="text-sm font-bold text-slate-600">
                  {new Date(sem.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => viewDetails(sem)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-600 rounded-[20px] font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                Review Allocations <ChevronRight size={16} />
              </button>

              {isAdmin && (
                <div className="flex items-center gap-3 mt-2">
                  {sem.status !== "REGISTRATION_OPEN" && (
                    <button
                      onClick={() => updateStatus(sem.id, "REGISTRATION_OPEN")}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-[20px] font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      Open Enrollment
                    </button>
                  )}
                  {sem.status === "REGISTRATION_OPEN" && (
                    <button
                      onClick={() =>
                        updateStatus(sem.id, "REGISTRATION_CLOSED")
                      }
                      className="flex-1 py-4 bg-slate-900 text-white rounded-[20px] font-bold text-xs hover:bg-slate-800 transition-all"
                    >
                      Close Enrollment
                    </button>
                  )}
                  <button
                    onClick={() => deleteSemester(sem.id)}
                    className="p-4 bg-red-50 text-red-500 rounded-[24px] hover:bg-red-500 hover:text-white transition-all border border-red-100 flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {semesters.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="text-slate-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Ready to start the semester?
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">
              Click the button above to rollout the registration event to all
              students and branches.
            </p>
          </div>
        )}
      </div>

      {/* New Semester Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                <Plus size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  New Event
                </h2>
                <p className="text-slate-400 font-medium">
                  Rollout registration for upcoming semester.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                  Semester Label
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. AY 2024-25 SEM-2"
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] font-bold text-slate-900 outline-none transition-all"
                />
                <p className="mt-2 text-[9px] text-blue-500 font-bold uppercase tracking-wider">
                  Note: Must end with SEM-1 or SEM-2 for auto-rollout.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                  Target Branches
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                    <button
                      key={b}
                      onClick={() =>
                        selectedBranches.includes(b)
                          ? setSelectedBranches(
                              selectedBranches.filter((x) => x !== b),
                            )
                          : setSelectedBranches([...selectedBranches, b])
                      }
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all ${selectedBranches.includes(b) ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-[24px] font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={initSemester}
                  disabled={loading}
                  className="flex-2 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? "Initializing..." : "Launch Event 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {editingAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Edit Allocation
                </h3>
                <p className="text-slate-400 text-sm font-medium italic">
                  Apply custom overrides for {editingAllocation.subject.code}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.customName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        customName: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-slate-900 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      Credits
                    </label>
                    <input
                      type="number"
                      value={editFormData.customCredits}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          customCredits: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      Assigned Faculty
                    </label>
                    <select
                      value={editFormData.facultyId}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          facultyId: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-slate-900 outline-none transition-all px-6 py-4 appearance-none"
                    >
                      <option value="">Select Faculty (Optional)</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingAllocation(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold"
                >
                  Discard
                </button>
                <button
                  onClick={saveAllocation}
                  disabled={loading}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
