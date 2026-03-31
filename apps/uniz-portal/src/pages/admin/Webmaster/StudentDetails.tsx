/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ChevronRight,
  ChevronDown,
  Shield,
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
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";

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
  const [searchMode, setSearchMode] = useState<
    "id" | "filter" | "intelligence"
  >("id");
  const [studentId, setStudentId] = useState("O210008");
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudentFullData, setSelectedStudentFullData] =
    useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter Search State
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E3");
  const [batch, setBatch] = useState("ALL");
  const [intelligenceFilters, setIntelligenceFilters] = useState({
    hasRemedials: "all", // "all" | "active" | "cleared"
    minCgpa: "",
    maxCgpa: "",
    isPresentInCampus: "ALL",
    isSuspended: "ALL",
  });
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    if (searchMode === "id") {
      fetchStudentById("O210008");
    } else if (searchMode === "filter" || searchMode === "intelligence") {
      handleSearchByFilter(1);
    }
  }, [searchMode]);

  // Debounced Recommendations
  useEffect(() => {
    if (!studentId || studentId.length < 3) {
      setRecommendations([]);
      return;
    }

    setIsTyping(true);
    const delayDebounceFn = setTimeout(async () => {
      const token = localStorage.getItem("admin_token");
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: studentId, limit: 5 }),
        });
        const data = await res.json();
        if (data.success) {
          setRecommendations(data.students || []);
        }
      } catch (e) {
      } finally {
        setIsTyping(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [studentId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setRecommendations([]);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(GET_AVAILABLE_BATCHES, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const data = await res.json();
      if (data.success) {
        setAvailableBatches(data.batches || []);
      }
    } catch (e) {}
  };

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
          batch,
          ...(searchMode === "intelligence" ? intelligenceFilters : {}),
          page,
          limit: searchMode === "intelligence" ? 50 : 10,
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
  const [resetPasswordValue, setResetPasswordValue] = useState("");

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

  const handleOpenPerformance = async (std: any) => {
    setSelectedStudentName(std.name);
    setSelectedStudentId(std.username);

    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(std.username), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
      });

      const data = await res.json();
      if (data.success && data.student) {
        setPerformanceData(data.student);
        setPerformanceModalOpen(true);
      } else {
        toast.error(data.msg || "Failed to fetch performance records");
      }
    } catch (error) {
      toast.error("Error retrieving student performance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-20 text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Student Intelligence
          </h2>
          <p className="text-slate-500 font-medium text-[13px]">
            Manage individual identities or explore batch-wide cohorts.
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 backdrop-blur-sm shadow-none">
          <button
            onClick={() => {
              setSearchMode("id");
              setSearchResults([]);
              setSelectedStudentFullData(null);
            }}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all",
              searchMode === "id"
                ? "bg-white text-slate-900 shadow-none border border-slate-200/50"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            Individual Search
          </button>
          <button
            onClick={() => {
              setSearchMode("intelligence");
              setSearchResults([]);
              setSelectedStudentFullData(null);
            }}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all",
              searchMode === "intelligence"
                ? "bg-white text-slate-900 shadow-none border border-slate-200/50"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            Intelligence Filter
          </button>
        </div>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex flex-col md:flex-row gap-4">
          {searchMode === "id" ? (
            <div className="flex-1 relative group" ref={dropdownRef}>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Enter Student ID (e.g. O210001)..."
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                className="w-full h-11 pl-11 pr-11 bg-slate-100/50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-[13px] outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-400 tracking-wider shadow-none"
                onKeyDown={(e) => e.key === "Enter" && fetchStudentById()}
                onFocus={() =>
                  studentId.length >= 3 &&
                  setRecommendations([...recommendations])
                }
              />
              {isTyping && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                </div>
              )}

              <AnimatePresence>
                {recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {recommendations.map((rec) => (
                        <button
                          key={rec.username}
                          onClick={() => {
                            setStudentId(rec.username);
                            setRecommendations([]);
                            fetchStudentById(rec.username);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-left group/result"
                        >
                          <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                            {rec.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-slate-900 truncate leading-tight">
                              {rec.name}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {rec.username} • {rec.branch}
                            </p>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 group-hover/result:text-navy-900 group-hover/result:translate-x-1 transition-all"
                          />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="relative">
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl font-black text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase tracking-widest appearance-none shadow-none"
                  >
                    <option value="ALL">All Branches</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                      (b) => (
                        <option key={b}>{b}</option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl font-black text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase tracking-widest appearance-none shadow-none"
                  >
                    <option value="ALL">All Years</option>
                    {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
                <div className="relative">
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl font-black text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase tracking-widest appearance-none shadow-none"
                  >
                    <option value="ALL">All Batches</option>
                    {availableBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>

                {searchMode === "intelligence" && (
                  <>
                    <div className="relative">
                      <select
                        value={intelligenceFilters.hasRemedials}
                        onChange={(e) =>
                          setIntelligenceFilters({
                            ...intelligenceFilters,
                            hasRemedials: e.target.value,
                          })
                        }
                        className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl font-black text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase tracking-widest appearance-none shadow-none"
                      >
                        <option value="all">Remedials: All</option>
                        <option value="cleared">Cleared Subjects</option>
                        <option value="active">Active Remedials</option>
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                    <div className="flex gap-2 min-w-[200px]">
                      <input
                        type="number"
                        placeholder="MIN CGPA"
                        step="0.01"
                        value={intelligenceFilters.minCgpa}
                        onChange={(e) =>
                          setIntelligenceFilters({
                            ...intelligenceFilters,
                            minCgpa: e.target.value,
                          })
                        }
                        className="w-1/2 h-11 px-4 bg-slate-100/50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 transition-all uppercase tracking-tighter"
                      />
                      <input
                        type="number"
                        placeholder="MAX CGPA"
                        step="0.01"
                        value={intelligenceFilters.maxCgpa}
                        onChange={(e) =>
                          setIntelligenceFilters({
                            ...intelligenceFilters,
                            maxCgpa: e.target.value,
                          })
                        }
                        className="w-1/2 h-11 px-4 bg-slate-100/50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-[10px] outline-none focus:bg-white focus:border-slate-400 transition-all uppercase tracking-tighter"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={() => handleSearchByFilter(1)}
                  disabled={loading}
                  className="px-6 h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[9px] shadow-none hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Intelligence Map
                </button>
              </div>

              {searchMode === "intelligence" && (
                <div className="flex gap-4 items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Presence
                    </span>
                    <select
                      value={intelligenceFilters.isPresentInCampus}
                      onChange={(e) =>
                        setIntelligenceFilters({
                          ...intelligenceFilters,
                          isPresentInCampus: e.target.value,
                        })
                      }
                      className="bg-transparent border-none text-[10px] font-black text-slate-900 uppercase tracking-widest focus:ring-0 cursor-pointer"
                    >
                      <option value="ALL">Any</option>
                      <option value="true">In Campus</option>
                      <option value="false">Outside</option>
                    </select>
                  </div>
                  <div className="w-px h-3 bg-slate-200 mx-2" />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Status
                    </span>
                    <select
                      value={intelligenceFilters.isSuspended}
                      onChange={(e) =>
                        setIntelligenceFilters({
                          ...intelligenceFilters,
                          isSuspended: e.target.value,
                        })
                      }
                      className="bg-transparent border-none text-[10px] font-black text-slate-900 uppercase tracking-widest focus:ring-0 cursor-pointer"
                    >
                      <option value="ALL">Any</option>
                      <option value="false">Active Only</option>
                      <option value="true">Suspended Only</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full mt-8">
        {loading ? (
          <div className="space-y-6">
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
              Pulling encrypted cloud records...
            </p>
            <StudentTableSkeleton />
          </div>
        ) : selectedStudentFullData ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <StudentDashboard
              data={selectedStudentFullData}
              onSuspendToggle={(username, status) => {
                handleToggleSuspension(username, status);
              }}
              onResetPassword={(username) => {
                handleGlobalResetPassword(username);
              }}
              isActionLoading={
                isActionLoading ===
                  selectedStudentFullData.username + "_suspend" ||
                isActionLoading === selectedStudentFullData.username + "_reset"
              }
            />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-8">
            <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table
                  className={cn(
                    "w-full text-left border-collapse",
                    searchMode === "intelligence" &&
                      "table-fixed min-w-[1200px]",
                  )}
                >
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th
                        className={cn(
                          "px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400",
                          searchMode === "intelligence" ? "w-[250px]" : "",
                        )}
                      >
                        Student Identity
                      </th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Credentials
                      </th>
                      {searchMode === "intelligence" && (
                        <>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                            CGPA
                          </th>
                          <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                            Backlogs
                          </th>
                        </>
                      )}
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Status
                      </th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Contact Pool
                      </th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {searchResults.map((std) => (
                      <tr
                        key={std.username}
                        onClick={() => handleOpenPerformance(std)}
                        className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center text-white text-[12px] font-black border border-white shadow-sm overflow-hidden shrink-0",
                                std.profile_url
                                  ? "bg-slate-50"
                                  : "bg-emerald-900",
                              )}
                            >
                              {std.profile_url ? (
                                <img
                                  src={std.profile_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (std.name?.[0] || "U").toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="font-bold text-slate-900 tracking-tight leading-none truncate uppercase">
                                {std.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 truncate">
                                {std.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                              {std.branch}
                            </span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                              {std.year || "E1"}
                            </span>
                          </div>
                        </td>

                        {searchMode === "intelligence" && (
                          <>
                            <td className="px-8 py-5 text-center">
                              <span
                                className={cn(
                                  "text-[13px] font-black tracking-tighter",
                                  (std.cgpa || 0) >= 8
                                    ? "text-emerald-600"
                                    : (std.cgpa || 0) >= 6
                                      ? "text-blue-600"
                                      : "text-slate-400",
                                )}
                              >
                                {std.cgpa?.toFixed(2) || "0.00"}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black",
                                  (std.total_backlogs || 0) > 0
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-emerald-50 text-emerald-600 border border-emerald-100",
                                )}
                              >
                                {std.total_backlogs || 0}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="px-8 py-5">
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-1 rounded-xl border w-fit font-bold uppercase tracking-widest text-[9px]",
                              std.is_suspended
                                ? "bg-rose-50 border-rose-100 text-rose-500"
                                : "bg-emerald-50 border-emerald-100 text-emerald-500",
                            )}
                          >
                            <div
                              className={cn(
                                "w-1 h-1 rounded-full",
                                std.is_suspended
                                  ? "bg-rose-500"
                                  : "bg-emerald-500 animate-pulse",
                              )}
                            />
                            {std.is_suspended ? "Restricted" : "Active"}
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <p className="text-[11px] font-bold text-slate-900 tracking-tight">
                              {std.email}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 lowercase opacity-60">
                              {std.is_in_campus ? "In Campus" : "Outside"}
                            </p>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex justify-end pr-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => handleSearchByFilter(p)}
              className="mt-8"
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-2xl mx-auto py-20 text-center space-y-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                <Search size={32} className="text-slate-300" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-slate-100 flex items-center justify-center text-navy-900 shadow-sm">
                <Shield size={14} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">
                Ready for <span className="text-blue-600">analysis</span>
              </h4>
              <p className="text-slate-400 font-medium text-[15px] leading-relaxed">
                Enter a student ID or use filters to fetch student records from
                the centralized university Database.
              </p>
            </div>
          </div>
        )}
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

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 p-10">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-navy-900 flex items-center justify-center text-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <KeyRound size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Credentials Reset
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Target Identity:{" "}
                  <span className="text-navy-900">{resetTargetUser}</span>
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left block ml-4">
                  Temporary Key
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full h-14 pl-14 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all tracking-wider"
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full mt-6">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetPassword}
                  className="flex-1 h-14 rounded-2xl bg-navy-900 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-navy-200 transition-all hover:bg-navy-800 active:scale-95 flex items-center justify-center gap-2"
                >
                  Apply Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
