/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Search,
  Loader2,
  ChevronRight,
  MoreHorizontal,
  Activity,
  CheckCircle2,
  Shield,
  ShieldAlert,
  KeyRound,
  Lock,
} from "lucide-react";
import StudentPerformanceModal from "./StudentPerformanceModal";
import StudentDashboard from "./StudentDashboard";
import { Pagination } from "../../../components/Pagination";
import { cn } from "../../../utils/cn";

import {
  ADMIN_VIEW_STUDENT,
  SEARCH_STUDENTS,
  ADMIN_SUSPEND_STUDENT,
  ADMIN_GLOBAL_RESET_PASS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

function StudentTableSkeleton() {
  return (
    <div className="w-full animate-pulse px-2">
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="h-3 w-48 bg-slate-100 rounded-full"></div>
      </div>
      <div className="bg-white rounded-[2rem] border-2 border-slate-50 overflow-hidden mb-10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                {["Student", "Credentials", "Status", "Contact"].map((h) => (
                  <th key={h} className="px-8 py-6">
                    <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                <tr key={row}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-slate-50 shrink-0 border border-slate-100"></div>
                      <div className="space-y-2">
                        <div className="h-3.5 w-32 bg-slate-100 rounded-full"></div>
                        <div className="h-2.5 w-20 bg-slate-50 rounded-full"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <div className="h-5 w-12 bg-slate-50 rounded-lg border border-slate-100"></div>
                      <div className="h-5 w-12 bg-slate-50 rounded-lg border border-slate-100"></div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="h-6 w-20 bg-slate-50 rounded-full border border-slate-100"></div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="h-3 w-40 bg-slate-100 rounded-full opacity-60"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StudentDetails() {
  const [searchMode, setSearchMode] = useState<"id" | "filter" | "none">("id");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudentFullData, setSelectedStudentFullData] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Filter Search State
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E2");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchStudentById = async (idToFetch?: string) => {
    const id = idToFetch || studentId.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setSelectedStudentFullData(null);
    setSearchResults([]);

    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setSelectedStudentFullData(data.student);
      } else {
        toast.error(data.msg || "Student not found");
      }
    } catch (error) {
      toast.error("Failed to fetch student details");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByFilter = async (page = 1) => {
    setLoading(true);
    setSelectedStudentFullData(null);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(SEARCH_STUDENTS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch,
          year,
          page,
          limit: 10,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.students || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (data.students?.length === 0) toast.info("No students found");
      } else {
        toast.error(data.msg || "Search failed");
      }
    } catch (error) {
      toast.error("Error searching students");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspension = async (
    username: string,
    currentSuspendedStatus: boolean,
  ) => {
    if (
      !window.confirm(
        `${currentSuspendedStatus ? "Restore" : "Suspend"} access for ${username}?`,
      )
    )
      return;
    setIsActionLoading(username + "_suspend");
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_SUSPEND_STUDENT(username), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspended: !currentSuspendedStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Account status updated`);
        setSearchResults((prev) =>
          prev.map((s) =>
            s.username === username
              ? { ...s, is_suspended: !currentSuspendedStatus }
              : s,
          ),
        );
        if (selectedStudentFullData?.username === username) {
          setSelectedStudentFullData((prev: any) => ({
            ...prev,
            is_suspended: !currentSuspendedStatus,
          }));
        }
      } else {
        toast.error(data.msg || "Action failed");
      }
    } catch (error) {
      toast.error("Error updating suspension status");
    } finally {
      setIsActionLoading(null);
    }
  };

  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [performanceData, setPerformanceData] = useState<any>(null);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("temporary-password-123");

  const handleGlobalResetPassword = (username: string) => {
    setResetTargetUser(username);
    setResetPasswordValue("temporary-password-123");
    setResetModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordValue) {
      toast.error("Password cannot be empty");
      return;
    }

    setIsActionLoading(resetTargetUser + "_reset");
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_GLOBAL_RESET_PASS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUsername: resetTargetUser,
          newPassword: resetPasswordValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Password reset successful for ${resetTargetUser}`);
        setResetModalOpen(false);
      } else {
        toast.error(data.msg || "Reset failed");
      }
    } catch (error) {
      toast.error("Error resetting password");
    } finally {
      setIsActionLoading(null);
    }
  };

  const MOCK_PERFORMANCE_DATA = {
    grades: [
      {
        id: "25365db4-497b-4269-b584-a265b4093b6b",
        semesterId: "E4-SEM-2",
        grade: 7,
        isRemedial: false,
        updatedAt: "2026-03-06T18:33:38.719Z",
        subject: {
          code: "CSE-E4-SEM-2-04",
          name: "Project-II",
          credits: 6,
          department: "CSE",
        },
      },
      {
        id: "1ff4ec5b-1fcf-4317-9854-11050c96f8a8",
        semesterId: "E4-SEM-2",
        grade: 9,
        isRemedial: false,
        updatedAt: "2026-03-06T18:33:38.718Z",
        subject: {
          code: "CSE-E4-SEM-2-02",
          name: "Open Elective-III",
          credits: 3,
          department: "CSE",
        },
      },
      {
        id: "fabbf3ef-59d0-420c-8dd4-90adddc34ea6",
        semesterId: "E4-SEM-2",
        grade: 6,
        isRemedial: false,
        updatedAt: "2026-03-06T18:33:38.719Z",
        subject: {
          code: "CSE-E4-SEM-2-03",
          name: "Open Elective-IV",
          credits: 3,
          department: "CSE",
        },
      },
      {
        id: "c557c920-5bcf-4a9b-a1c8-5c3607310d77",
        semesterId: "E4-SEM-2",
        grade: 6,
        isRemedial: false,
        updatedAt: "2026-03-06T18:33:38.718Z",
        subject: {
          code: "CSE-E4-SEM-2-01",
          name: "Elective-VI",
          credits: 3,
          department: "CSE",
        },
      },
      {
        id: "18e77db3-f935-4f2e-bbd3-9dba16f44144",
        semesterId: "E4-SEM-2",
        grade: 8,
        isRemedial: false,
        updatedAt: "2026-03-06T18:33:38.719Z",
        subject: {
          code: "CSE-E4-SEM-2-05",
          name: "Community Service",
          credits: 2,
          department: "CSE",
        },
      },
    ],
    gpa_stats: {
      "E4-SEM-2": { gpa: 7.12, status: "PASSED" },
      "E4-SEM-1": { gpa: 9.12, status: "PASSED" },
      "E3-SEM-2": { gpa: 8.04, status: "PASSED" },
      "E3-SEM-1": { gpa: 8.53, status: "PASSED" },
      "E2-SEM-2": { gpa: 8.11, status: "PASSED" },
      "E2-SEM-1": { gpa: 7.9, status: "PASSED" },
      "E1-SEM-2": { gpa: 9.65, status: "PASSED" },
      "E1-SEM-1": { gpa: 7.78, status: "PASSED" },
    },
    cgpa: 8.26,
    total_backlogs: 0,
    motivation: "You're on the right track. Keep refining your study habits.",
    attendance: [
      {
        id: "4fe63da6-47ec-4bd6-83e5-0f247c688b74",
        studentId: "O210329",
        subjectId: "6d73c70f-8363-477c-90b6-3575f4a7efe0",
        semesterId: "E4-SEM-2",
        totalClasses: 50,
        attendedClasses: 49,
        batch: "O21",
        createdAt: "2026-03-06T18:35:37.004Z",
        updatedAt: "2026-03-06T18:35:37.004Z",
        subject: {
          id: "6d73c70f-8363-477c-90b6-3575f4a7efe0",
          code: "CSE-E4-SEM-2-02",
          name: "Open Elective-III",
          credits: 3,
          department: "CSE",
          semester: "SEM-2",
        },
        percentage: 98,
      },
      {
        id: "11e0c592-e339-41b9-b0d7-4ef625ad6069",
        studentId: "O210329",
        subjectId: "f407c66f-131d-45d0-bb2b-e7f1d4b844ea",
        semesterId: "E4-SEM-2",
        totalClasses: 50,
        attendedClasses: 44,
        batch: "O21",
        createdAt: "2026-03-06T18:35:37.005Z",
        updatedAt: "2026-03-06T18:35:37.005Z",
        subject: {
          id: "f407c66f-131d-45d0-bb2b-e7f1d4b844ea",
          code: "CSE-E4-SEM-2-04",
          name: "Project-II",
          credits: 6,
          department: "CSE",
          semester: "SEM-2",
        },
        percentage: 88,
      },
      {
        id: "dd6ce30b-b33e-410b-9b5c-24b78e05cb9c",
        studentId: "O210329",
        subjectId: "fa3f4efe-cbf1-4fbc-a0c5-aa62edc658bd",
        semesterId: "E4-SEM-2",
        totalClasses: 50,
        attendedClasses: 49,
        batch: "O21",
        createdAt: "2026-03-06T18:35:37.003Z",
        updatedAt: "2026-03-06T18:35:37.003Z",
        subject: {
          id: "fa3f4efe-cbf1-4fbc-a0c5-aa62edc658bd",
          code: "CSE-E4-SEM-2-01",
          name: "Elective-VI",
          credits: 3,
          department: "CSE",
          semester: "SEM-2",
        },
        percentage: 98,
      },
      {
        id: "c72217b3-f342-4e3b-a49f-ae2ad20f275d",
        studentId: "O210329",
        subjectId: "45d053bf-8eea-4996-8040-f8bc5e2b6b6f",
        semesterId: "E4-SEM-2",
        totalClasses: 50,
        attendedClasses: 42,
        batch: "O21",
        createdAt: "2026-03-06T18:35:37.004Z",
        updatedAt: "2026-03-06T18:35:37.004Z",
        subject: {
          id: "45d053bf-8eea-4996-8040-f8bc5e2b6b6f",
          code: "CSE-E4-SEM-2-03",
          name: "Open Elective-IV",
          credits: 3,
          department: "CSE",
          semester: "SEM-2",
        },
        percentage: 84,
      },
      {
        id: "66661118-5788-4106-b452-dc7e890a6bff",
        studentId: "O210329",
        subjectId: "f3dace70-f70d-4e1d-a5b1-e100f322bcf8",
        semesterId: "E4-SEM-2",
        totalClasses: 50,
        attendedClasses: 43,
        batch: "O21",
        createdAt: "2026-03-06T18:35:37.005Z",
        updatedAt: "2026-03-06T18:35:37.005Z",
        subject: {
          id: "f3dace70-f70d-4e1d-a5b1-e100f322bcf8",
          code: "CSE-E4-SEM-2-05",
          name: "Community Service",
          credits: 2,
          department: "CSE",
          semester: "SEM-2",
        },
        percentage: 86,
      },
    ],
    attendance_summary: {
      "E4-SEM-2": { total: 250, attended: 227, percentage: 90.8 },
      "E4-SEM-1": { total: 245, attended: 213, percentage: 86.94 },
      "E3-SEM-2": { total: 390, attended: 332, percentage: 85.13 },
      "E3-SEM-1": { total: 444, attended: 365, percentage: 82.21 },
      "E2-SEM-2": { total: 384, attended: 327, percentage: 85.16 },
      "E2-SEM-1": { total: 375, attended: 303, percentage: 80.8 },
      "E1-SEM-2": { total: 260, attended: 224, percentage: 86.15 },
      "E1-SEM-1": { total: 335, attended: 282, percentage: 84.18 },
    },
  };

  const handleOpenPerformance = (std: any) => {
    setSelectedStudentName(std.name);
    setSelectedStudentId(std.username);
    setPerformanceData(MOCK_PERFORMANCE_DATA);
    setPerformanceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20">
      {/* Top Header / Search Bar Section */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-[80px]">
            <span className="text-sm font-bold text-slate-900">Overview</span>
          </div>

          <div className="flex-1 flex items-center gap-2 w-full">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                className="w-full h-9 pl-10 pr-4 bg-[#f3f4f6]/50 border border-slate-200 rounded-md text-[13px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchMode === "id" ? fetchStudentById() : handleSearchByFilter(1);
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
               <button 
                onClick={() => {
                  setSearchMode("filter");
                  setSearchResults([]);
                  setSelectedStudentFullData(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all", 
                  searchMode === "filter" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Filter
              </button>
              <button 
                onClick={() => {
                  setSearchMode("id");
                  setSearchResults([]);
                  setSelectedStudentFullData(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all", 
                  searchMode === "id" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Individual
              </button>
            </div>

            <button 
              onClick={() => {
                searchMode === "id" ? fetchStudentById() : handleSearchByFilter(1);
              }}
              className="ml-4 h-9 px-4 bg-slate-900 text-white rounded-md text-[13px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">Syncing Records...</h3>
              <StudentTableSkeleton />
            </div>
          ) : selectedStudentFullData ? (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
               <StudentDashboard
                data={selectedStudentFullData}
                onSuspendToggle={(username, status) => {
                  handleToggleSuspension(username, status);
                }}
                onResetPassword={(username) => {
                  handleGlobalResetPassword(username);
                }}
                isActionLoading={
                  isActionLoading === selectedStudentFullData.username + "_suspend" ||
                  isActionLoading === selectedStudentFullData.username + "_reset"
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">Student Explorer</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="bg-transparent border-none text-[12px] font-bold text-slate-500 outline-none cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      <option value="">All Branches</option>
                      {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(b => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronRight size={12} className="text-slate-300 rotate-90" />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="bg-transparent border-none text-[12px] font-bold text-slate-500 outline-none cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      <option value="">All Batches</option>
                      {["E1", "E2", "E3", "E4", "P1", "P2"].map(y => (
                        <option key={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronRight size={12} className="text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {searchResults.map((std) => (
                    <div 
                      key={std.username}
                      onClick={() => handleOpenPerformance(std)}
                      className="p-6 hover:bg-[#fafafa] transition-all cursor-pointer group flex items-start justify-between"
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-[11px] font-black border-2 border-white shadow-sm overflow-hidden shrink-0">
                          {std.profile_url ? <img src={std.profile_url} alt="" className="w-full h-full object-cover" /> : (std.name?.[0] || 'U')}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                             <div className="flex items-center gap-3 mb-0.5">
                              <h4 className="text-[15px] font-bold text-slate-900 leading-none group-hover:underline underline-offset-4 decoration-slate-300">{std.username}</h4>
                              <span className="text-[13px] font-medium text-slate-400">{std.email}</span>
                            </div>
                            <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-2">
                              <span className="inline-block w-3 h-3 bg-slate-100 rounded-[2px] border border-slate-200" />
                              <span className="uppercase tracking-tighter">{std.name}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f3f4f6] border border-slate-200 rounded-full">
                              <Activity size={10} className="text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-700">{std.branch}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={12} className={cn(std.is_suspended ? "text-slate-300" : "text-emerald-500")} />
                              <span className="text-[11px] font-medium text-slate-500">
                                {std.is_suspended ? "Restricted on " : "Active on "} 
                                <span className="font-bold text-slate-900 uppercase">main</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                           {std.is_suspended ? <ShieldAlert size={14} className="text-red-500" /> : <Shield size={14} className="text-emerald-500" />}
                        </div>
                        <button className="p-1 px-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-32 text-center space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={20} className="text-slate-300" />
                  </div>
                  <p className="text-[15px] font-bold text-slate-900 tracking-tight">Search for a student to begin</p>
                  <p className="text-[12px] text-slate-400 font-medium italic">Records will appear in high-fidelity list view</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => handleSearchByFilter(p)}
                  className="mt-10"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {performanceModalOpen && (
        <StudentPerformanceModal
          isOpen={performanceModalOpen}
          onClose={() => setPerformanceModalOpen(false)}
          studentName={selectedStudentName}
          studentId={selectedStudentId}
          data={performanceData}
        />
      )}

      {/* Reset Password Custom Popup */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                  <KeyRound size={32} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Reset Password
                  </h3>
                  <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tighter">
                    Target: {resetTargetUser}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Temporary Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                    <input 
                      type="text"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[12px] uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetPassword}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 flex items-center justify-center gap-2"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

