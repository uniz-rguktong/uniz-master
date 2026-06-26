/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ChevronRight,
  ChevronDown,
  Lock,
  UserPlus,
  RefreshCw,
  Download,
  X,
  FileSpreadsheet,
} from "lucide-react";
import StudentPerformanceModal from "./StudentPerformanceModal";
import StudentDashboard from "./StudentDashboard";
import StudentEditModal from "./StudentEditModal";
import CohortPromotionModal from "./CohortPromotionModal";
import { Pagination } from "../../../components/Pagination";
import { cn } from "../../../utils/cn";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import { AdminDialog } from "../../../components/admin/AdminDialog";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminChipClass,
  adminNumsClass,
} from "../../../components/admin/admin-ui";
import {
  ADMIN_VIEW_STUDENT,
  SEARCH_STUDENTS,
  ADMIN_SUSPEND_STUDENT,
  ADMIN_GLOBAL_RESET_PASS,
  GET_AVAILABLE_BATCHES,
  ADMIN_STUDENT_EXPORT,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";

const PAGE_SIZE = 25;

const EXPORT_FIELDS =
  "username,name,email,gender,phone,fatherName,motherName,fatherOccupation,motherOccupation,fatherEmail,motherEmail,fatherAddress,motherAddress,bloodGroup,dateOfBirth,year,semester,branch,section,batch,roomno,isPresentInCampus,isApplicationPending,isSuspended,category,campus,cgpa,totalBacklogs";

type StudentRow = Record<string, any> & {
  username: string;
  attendance_pct?: number | null;
};

function avgAttendance(summary: Record<string, { percentage?: number }> | undefined) {
  if (!summary || typeof summary !== "object") return null;
  const vals = Object.values(summary)
    .map((s) => s?.percentage)
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function TableSkeleton() {
  return (
    <div className={cn(adminCardClass, "overflow-hidden animate-pulse")}>
      <div className="h-10 bg-zinc-50 border-b border-zinc-200" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-11 border-b border-zinc-100 flex gap-4 px-4 items-center">
          <div className="h-3 w-16 bg-zinc-100 rounded" />
          <div className="h-3 w-32 bg-zinc-100 rounded" />
          <div className="h-3 w-24 bg-zinc-100 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

const COLUMNS: { key: string; label: string; className?: string }[] = [
  { key: "row", label: "#", className: "w-12 text-center" },
  { key: "username", label: "Student ID", className: "min-w-[100px]" },
  { key: "name", label: "Name", className: "min-w-[160px]" },
  { key: "email", label: "Email", className: "min-w-[200px]" },
  { key: "branch", label: "Branch", className: "w-20" },
  { key: "year", label: "Year", className: "w-16" },
  { key: "batch", label: "Batch", className: "w-16" },
  { key: "section", label: "Sec", className: "w-14" },
  { key: "cgpa", label: "CGPA", className: "w-16 text-right" },
  { key: "total_backlogs", label: "BL", className: "w-12 text-center" },
  { key: "attendance_pct", label: "Att %", className: "w-16 text-right" },
  { key: "phone_number", label: "Phone", className: "min-w-[110px]" },
  { key: "gender", label: "Gender", className: "w-16" },
  { key: "blood_group", label: "Blood", className: "w-14" },
  { key: "roomno", label: "Room", className: "w-16" },
  { key: "is_in_campus", label: "Campus", className: "w-20" },
  { key: "is_suspended", label: "Status", className: "w-20" },
];

function cellValue(row: StudentRow, key: string, rowIndex: number) {
  switch (key) {
    case "row":
      return rowIndex;
    case "cgpa":
      return row.cgpa != null ? Number(row.cgpa).toFixed(2) : "—";
    case "total_backlogs":
      return row.total_backlogs ?? 0;
    case "attendance_pct":
      if (row.attendance_pct === undefined) return "…";
      return row.attendance_pct != null ? `${row.attendance_pct}%` : "—";
    case "is_in_campus":
      return row.is_in_campus ? "In" : "Out";
    case "is_suspended":
      return row.is_suspended ? "Suspended" : "Active";
    case "gender":
    case "blood_group":
    case "section":
    case "roomno":
      return row[key] || "—";
    default:
      return row[key] ?? "—";
  }
}

export default function StudentDetails() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [rows, setRows] = useState<StudentRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<StudentRow | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [intelligenceFilters, setIntelligenceFilters] = useState({
    hasRemedials: "all",
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [performanceData, setPerformanceData] = useState<any>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${(localStorage.getItem("admin_token") || "").replace(/"/g, "")}`,
    "Content-Type": "application/json",
  });

  const enrichAttendance = useCallback(async (students: StudentRow[]) => {
    if (!students.length) return;
    setEnriching(true);
    const token = localStorage.getItem("admin_token");
    const results = await Promise.all(
      students.map(async (s) => {
        try {
          const res = await fetch(ADMIN_VIEW_STUDENT(s.username), {
            headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
          });
          const data = await res.json();
          if (data.success && data.student) {
            return {
              ...s,
              attendance_pct: avgAttendance(data.student.attendance_summary),
              cgpa: data.student.cgpa ?? s.cgpa,
              total_backlogs: data.student.total_backlogs ?? s.total_backlogs,
            };
          }
        } catch {
          /* keep row */
        }
        return { ...s, attendance_pct: null };
      }),
    );
    setRows(results);
    setEnriching(false);
  }, []);

  const fetchStudents = async (
    page = 1,
    overrides?: { query?: string },
  ) => {
    const q = overrides?.query ?? query;
    setLoading(true);
    setSelectedRow(null);
    setDrawerOpen(false);
    try {
      const res = await fetch(SEARCH_STUDENTS, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          username: q.trim() || undefined,
          branch,
          year,
          batch,
          ...intelligenceFilters,
          page,
          limit: PAGE_SIZE,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const list: StudentRow[] = data.students || [];
        setRows(list);
        if (data.pagination) setPagination(data.pagination);
        if (list.length === 0) toast.info("No students match these filters");
        else enrichAttendance(list);
      } else {
        toast.error(data.msg || data.message || "Search failed");
        setRows([]);
      }
    } catch {
      toast.error("Error loading students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setRecommendations([]);
      return;
    }
    setIsTyping(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ username: query, limit: 6 }),
        });
        const data = await res.json();
        if (data.success) setRecommendations(data.students || []);
      } catch {
        /* ignore */
      } finally {
        setIsTyping(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRecommendations([]);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch(GET_AVAILABLE_BATCHES, {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (data.success) setAvailableBatches(data.batches || []);
    } catch {
      /* ignore */
    }
  };

  const openDetail = async (row: StudentRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(row.username), {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (data.success) setDetailData(data.student);
      else toast.error(data.msg || "Could not load student");
    } catch {
      toast.error("Failed to load student details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const url = ADMIN_STUDENT_EXPORT(
      branch === "ALL" ? undefined : branch,
      year === "ALL" ? undefined : year,
      EXPORT_FIELDS,
      batch === "ALL" ? undefined : batch,
    );
    try {
      const res = await fetch(url, {
        headers: { Authorization: authHeaders().Authorization },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `students_${branch}_${year}_${batch}_${Date.now()}.xlsx`;
      a.click();
      toast.success("Excel export downloaded");
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleToggleSuspension = async (username: string, current: boolean) => {
    if (!window.confirm(`${current ? "Restore" : "Suspend"} access for ${username}?`)) return;
    setIsActionLoading(username + "_suspend");
    try {
      const res = await fetch(ADMIN_SUSPEND_STUDENT(username), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ suspended: !current }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account status updated");
        setRows((prev) =>
          prev.map((s) =>
            s.username === username ? { ...s, is_suspended: !current } : s,
          ),
        );
        if (detailData?.username === username) {
          setDetailData((p: any) => ({ ...p, is_suspended: !current }));
        }
      } else toast.error(data.msg || "Action failed");
    } catch {
      toast.error("Error updating suspension");
    } finally {
      setIsActionLoading(null);
    }
  };

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
    try {
      const res = await fetch(ADMIN_GLOBAL_RESET_PASS, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          targetUsername: resetTargetUser,
          newPassword: resetPasswordValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Password reset for ${resetTargetUser}`);
        setResetModalOpen(false);
      } else toast.error(data.msg || "Reset failed");
    } catch {
      toast.error("Error resetting password");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleOpenPerformance = async (std: StudentRow) => {
    setSelectedStudentName(std.name);
    setSelectedStudentId(std.username);
    setLoading(true);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(std.username), {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (data.success && data.student) {
        setPerformanceData(data.student);
        setPerformanceModalOpen(true);
      } else toast.error(data.msg || "Failed to fetch records");
    } catch {
      toast.error("Error retrieving performance");
    } finally {
      setLoading(false);
    }
  };

  const rangeStart = rows.length ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <div className={cn(adminPageWrapClass, "pb-24")}>
      <SectionHeader
        icon={<FileSpreadsheet size={18} />}
        eyebrow="Students"
        title="Student Details"
        subtitle="Spreadsheet view with attendance, grades, and full profile data. 25 students per page."
        actions={
          <>
            <button
              type="button"
              onClick={() => setPromotionModalOpen(true)}
              className={adminGhostButtonClass}
            >
              <RefreshCw size={14} /> Bulk Promote
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={adminGhostButtonClass}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setEditModalOpen(true);
              }}
              className={adminPrimaryButtonClass}
            >
              <UserPlus size={14} /> Add Student
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className={cn(adminCardClass, "p-5 space-y-4")}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative" ref={dropdownRef}>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by Student ID or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && fetchStudents(1)}
              className={cn(adminInputClass, "pl-10")}
            />
            {isTyping && (
              <Loader2
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
              />
            )}
            <AnimatePresence>
              {recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden"
                >
                  {recommendations.map((rec) => (
                    <button
                      key={rec.username}
                      type="button"
                      onClick={() => {
                        setQuery(rec.username);
                        setRecommendations([]);
                        fetchStudents(1, { query: rec.username });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-left text-[13px]"
                    >
                      <span className="font-semibold text-zinc-900">{rec.username}</span>
                      <span className="text-zinc-500 truncate">{rec.name}</span>
                      <span className="ml-auto text-zinc-400 text-[11px]">{rec.branch}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={() => fetchStudents(1)}
            disabled={loading}
            className={adminPrimaryButtonClass}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            {
              label: "Branch",
              value: branch,
              onChange: setBranch,
              options: ["ALL", "CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"],
            },
            {
              label: "Year",
              value: year,
              onChange: setYear,
              options: ["ALL", "E1", "E2", "E3", "E4"],
            },
            {
              label: "Batch",
              value: batch,
              onChange: setBatch,
              options: ["ALL", ...availableBatches],
            },
            {
              label: "Remedials",
              value: intelligenceFilters.hasRemedials,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, hasRemedials: v })),
              options: [
                { v: "all", l: "All" },
                { v: "active", l: "Active BL" },
                { v: "cleared", l: "Cleared" },
              ],
            },
            {
              label: "Campus",
              value: intelligenceFilters.isPresentInCampus,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, isPresentInCampus: v })),
              options: [
                { v: "ALL", l: "Any" },
                { v: "true", l: "In" },
                { v: "false", l: "Out" },
              ],
            },
            {
              label: "Status",
              value: intelligenceFilters.isSuspended,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, isSuspended: v })),
              options: [
                { v: "ALL", l: "Any" },
                { v: "false", l: "Active" },
                { v: "true", l: "Suspended" },
              ],
            },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <span className={adminLabelClass}>{f.label}</span>
              <div className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className={cn(adminSelectClass, "h-9 text-[11px]")}
                >
                  {(f.options as any[]).map((o) =>
                    typeof o === "string" ? (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ) : (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            </div>
          ))}
          <div className="space-y-1">
            <span className={adminLabelClass}>Min CGPA</span>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={intelligenceFilters.minCgpa}
              onChange={(e) =>
                setIntelligenceFilters((f) => ({ ...f, minCgpa: e.target.value }))
              }
              className={cn(adminInputClass, "h-9 text-[11px]")}
            />
          </div>
          <div className="space-y-1">
            <span className={adminLabelClass}>Max CGPA</span>
            <input
              type="number"
              step="0.01"
              placeholder="10"
              value={intelligenceFilters.maxCgpa}
              onChange={(e) =>
                setIntelligenceFilters((f) => ({ ...f, maxCgpa: e.target.value }))
              }
              className={cn(adminInputClass, "h-9 text-[11px]")}
            />
          </div>
        </div>
      </div>

      {/* Sheet toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={adminChipClass}>
            {pagination.total.toLocaleString()} students
          </span>
          {rows.length > 0 && (
            <span className="text-[12px] text-zinc-500 font-medium">
              Showing {rangeStart}–{rangeEnd}
              {enriching && (
                <span className="ml-2 text-zinc-400 inline-flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> loading attendance…
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-400">
          Click a row for full profile · Double-click for grades & attendance charts
        </p>
      </div>

      {/* Spreadsheet */}
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <div className={cn(adminCardClass, "py-16 text-center")}>
          <FileSpreadsheet className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600">No students to display</p>
          <p className="text-[12px] text-zinc-400 mt-1">Adjust filters or search by ID</p>
        </div>
      ) : (
        <div className={cn(adminCardClass, "overflow-hidden")}>
          <div className="overflow-x-auto custom-sidebar-scroll">
            <table className="w-full border-collapse text-[12px] min-w-[1400px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500 whitespace-nowrap border-r border-zinc-100 last:border-r-0",
                        col.className,
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-10 px-2 py-2.5 border-l border-zinc-100" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.username}
                    onClick={() => openDetail(row)}
                    onDoubleClick={() => handleOpenPerformance(row)}
                    className={cn(
                      "border-b border-zinc-100 cursor-pointer transition-colors",
                      selectedRow?.username === row.username
                        ? "bg-zinc-100/80"
                        : "hover:bg-zinc-50/80",
                      idx % 2 === 0 ? "bg-white" : "bg-zinc-50/30",
                    )}
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2 text-zinc-800 whitespace-nowrap border-r border-zinc-50 last:border-r-0 font-medium",
                          col.key === "username" && "font-semibold text-zinc-900 tabular-nums",
                          col.key === "email" && "text-zinc-500 text-[11px]",
                          col.key === "cgpa" && adminNumsClass,
                          col.key === "attendance_pct" && adminNumsClass,
                          col.className,
                        )}
                      >
                        {cellValue(row, col.key, rangeStart + idx)}
                      </td>
                    ))}
                    <td className="px-2 py-2 border-l border-zinc-50 text-zinc-300">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchStudents(p)}
      />

      {/* Detail drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-zinc-900/30 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-[101] h-full w-full max-w-2xl bg-[#fafafa] shadow-2xl overflow-y-auto custom-sidebar-scroll"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200/70">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Student profile
                  </p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {selectedRow?.name || selectedRow?.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(adminGhostButtonClass, "w-10 h-10 px-0")}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-zinc-400" size={28} />
                  </div>
                ) : detailData ? (
                  <StudentDashboard
                    data={detailData}
                    onSuspendToggle={handleToggleSuspension}
                    onResetPassword={handleGlobalResetPassword}
                    onEditDetails={(std) => {
                      setEditingStudent(std);
                      setEditModalOpen(true);
                    }}
                    isActionLoading={
                      isActionLoading === detailData.username + "_suspend" ||
                      isActionLoading === detailData.username + "_reset"
                    }
                  />
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {performanceModalOpen && (
        <StudentPerformanceModal
          isOpen={performanceModalOpen}
          onClose={() => setPerformanceModalOpen(false)}
          studentName={selectedStudentName}
          studentId={selectedStudentId}
          data={performanceData}
        />
      )}

      <AdminDialog
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        title="Reset password"
        description={resetTargetUser}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className={adminGhostButtonClass}
            >
              Cancel
            </button>
            <button type="button" onClick={confirmResetPassword} className={adminPrimaryButtonClass}>
              Apply
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className={adminLabelClass}>Temporary password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className={cn(adminInputClass, "pl-10")}
            />
          </div>
        </div>
      </AdminDialog>

      <StudentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        student={editingStudent}
        onSuccess={() => fetchStudents(pagination.page)}
      />

      <CohortPromotionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        onSuccess={() => fetchStudents(pagination.page)}
      />
    </div>
  );
}
