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
import axios from "axios";
import {
  SEMESTERS,
  INIT_SEMESTER,
  UPDATE_SEMESTER_STATUS,
  DEAN_REVIEW,
  APPROVE_ALLOCATION,
  BASE_URL,
} from "../../../api/endpoints";

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

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(SEMESTERS, { headers: authHeaders });
      setSemesters(res.data);
    } catch (err) {
      console.error("Failed to fetch semesters");
    }
  };

  const initSemester = async () => {
    setLoading(true);
    try {
      await axios.post(
        INIT_SEMESTER,
        {
          academicSemester: newName,
          branches: selectedBranches.map((b) => ({ branchName: b })),
        },
        { headers: authHeaders },
      );
      setShowNewModal(false);
      fetchSemesters();
      alert("Registration Event Initialized & Notifications Sent!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to initialize");
    } finally {
      setLoading(false);
    }
  };

  const deleteSemester = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure? This will delete all allocations and registrations for this event.",
      )
    )
      return;
    try {
      await axios.delete(`${SEMESTERS}/${id}`, { headers: authHeaders });
      fetchSemesters();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(
        UPDATE_SEMESTER_STATUS(id),
        { status },
        { headers: authHeaders },
      );
      fetchSemesters();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const viewDetails = async (sem: Semester) => {
    setSelectedSem(sem);
    setActiveTab("details");
    fetchAllocations();
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const targetBranch = branch || "CSE";
      const res = await axios.get(DEAN_REVIEW(targetBranch), {
        headers: authHeaders,
      });
      setAllocations(res.data);
    } catch (err) {
      console.error("Failed to fetch allocations");
    } finally {
      setLoading(false);
    }
  };

  const approveAll = async () => {
    if (!selectedSem) return;
    try {
      await axios.post(
        APPROVE_ALLOCATION,
        {
          branch: branch || "CSE",
          semesterId: selectedSem.id,
        },
        { headers: authHeaders },
      );
      fetchAllocations();
    } catch (err) {
      alert("Approval failed");
    }
  };

  const downloadExport = async (type: string) => {
    if (!selectedSem) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/academics/export?type=${type}&semesterId=${selectedSem.id}&branch=${branch || "CSE"}`,
        {
          headers: authHeaders,
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedSem.name}_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Export failed");
    }
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
            {(!isAdmin || branch) && (
              <button
                onClick={approveAll}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[20px] font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                <ShieldCheck size={18} />
                Approve Course List
              </button>
            )}
          </div>
        </div>

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
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-all bg-slate-50 rounded-xl border border-transparent hover:border-blue-100">
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
    </div>
  );
}
