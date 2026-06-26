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
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Pencil,
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
  adminDangerButtonClass,
} from "../../../components/admin/admin-ui";
import {
  ADMIN_VIEW_STUDENT,
  SEARCH_STUDENTS,
  ADMIN_SUSPEND_STUDENT,
  ADMIN_GLOBAL_RESET_PASS,
  GET_AVAILABLE_BATCHES,
  ADMIN_STUDENT_EXPORT,
  ADMIN_DELETE_STUDENT,
  ADMIN_BULK_DELETE_STUDENTS,
  ADMIN_UPDATE_STUDENT,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 450;
const ENRICH_CONCURRENCY = 4;

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
    <div className={cn(adminCardClass, "overflow-hidden p-0 animate-pulse")}>
      <div className="h-11 bg-zinc-50 border-b border-zinc-200" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-11 border-b border-zinc-200 flex gap-4 px-4 items-center",
            i % 2 === 1 && "bg-zinc-50/40",
          )}
        >
          <div className="h-3 w-16 bg-zinc-100 rounded" />
          <div className="h-3 w-32 bg-zinc-100 rounded" />
          <div className="h-3 w-24 bg-zinc-100 rounded flex-1" />
        </div>
      ))}
      <div className="h-14 bg-zinc-50/80 border-t border-zinc-200" />
    </div>
  );
}

type SortKey =
  | "username"
  | "name"
  | "email"
  | "branch"
  | "year"
  | "batch"
  | "section"
  | "cgpa"
  | "total_backlogs";

const SORTABLE_KEYS = new Set<string>([
  "username",
  "name",
  "email",
  "branch",
  "year",
  "batch",
  "section",
  "cgpa",
  "total_backlogs",
]);

const EDITABLE_KEYS = new Set<string>([
  "name",
  "email",
  "branch",
  "year",
  "batch",
  "section",
  "phone_number",
  "gender",
  "blood_group",
  "roomno",
  "cgpa",
  "total_backlogs",
]);

const COLUMN_API_FIELD: Record<string, string> = {
  name: "name",
  email: "email",
  branch: "branch",
  year: "year",
  batch: "batch",
  section: "section",
  phone_number: "phone",
  gender: "gender",
  blood_group: "bloodGroup",
  roomno: "roomno",
  cgpa: "cgpa",
  total_backlogs: "totalBacklogs",
};

const BRANCH_OPTIONS = ["ALL", "CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME", "AI&ML"];
const YEAR_OPTIONS = ["ALL", "E1", "E2", "E3", "E4"];
const GENDER_OPTIONS = ["ALL", "M", "F", "Other"];
const CATEGORY_OPTIONS = ["ALL", "GENERAL", "OBC", "SC", "ST", "EWS"];
const CAMPUS_OPTIONS = ["ALL", "ONGOLE", "NIDADAVOLE"];

const STICKY_COLS: Record<string, { left: string; z: string }> = {
  checkbox: { left: "left-0", z: "z-20" },
  row: { left: "left-10", z: "z-20" },
  username: { left: "left-[5.5rem]", z: "z-20" },
  name: { left: "left-[11.75rem]", z: "z-20" },
};

function stickyCellClass(
  key: string,
  extra?: string,
  isHeader = false,
) {
  const sticky = STICKY_COLS[key];
  if (!sticky) return extra;
  return cn(
    extra,
    "sticky",
    sticky.left,
    sticky.z,
    isHeader ? "bg-zinc-50" : "bg-inherit",
    key === "name" && "shadow-[4px_0_12px_-6px_rgba(10,10,10,0.12)]",
  );
}

const COLUMNS: { key: string; label: string; className?: string }[] = [
  { key: "row", label: "#", className: "w-12 text-center" },
  { key: "username", label: "Student ID", className: "min-w-[100px]" },
  { key: "name", label: "Name", className: "min-w-[200px] max-w-[240px]" },
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const detailRequestRef = useRef(0);
  const fetchGenRef = useRef(0);
  const enrichGenRef = useRef(0);
  const skipAutoSearchRef = useRef(true);

  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [intelligenceFilters, setIntelligenceFilters] = useState({
    hasRemedials: "all",
    minCgpa: "",
    maxCgpa: "",
    minBacklogs: "",
    maxBacklogs: "",
    isPresentInCampus: "ALL",
    isSuspended: "ALL",
    isApplicationPending: "ALL",
    gender: "ALL",
    section: "ALL",
    category: "ALL",
    campus: "ALL",
  });
  const [sortBy, setSortBy] = useState<SortKey>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ username: string; key: string } | null>(
    null,
  );
  const [cellDraft, setCellDraft] = useState("");
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${(localStorage.getItem("admin_token") || "").replace(/"/g, "")}`,
    "Content-Type": "application/json",
  });

  const enrichAttendance = useCallback(async (students: StudentRow[]) => {
    if (!students.length) return;
    const gen = ++enrichGenRef.current;
    setEnriching(true);
    const token = localStorage.getItem("admin_token");
    const auth = `Bearer ${(token || "").replace(/"/g, "")}`;
    const enriched = [...students];

    for (let i = 0; i < students.length; i += ENRICH_CONCURRENCY) {
      if (gen !== enrichGenRef.current) return;
      const chunk = students.slice(i, i + ENRICH_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (s) => {
          try {
            const res = await fetch(ADMIN_VIEW_STUDENT(s.username), {
              headers: { Authorization: auth },
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
      chunkResults.forEach((row, idx) => {
        enriched[i + idx] = row;
      });
    }

    if (gen !== enrichGenRef.current) return;
    setRows(enriched);
    setEnriching(false);
  }, []);

  const fetchStudents = useCallback(
    async (page = 1, overrides?: { query?: string }) => {
      const gen = ++fetchGenRef.current;
      const q = (overrides?.query ?? query).trim();
      setLoading(true);
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            username: q ? q.toUpperCase() : undefined,
            branch,
            year,
            batch,
            ...intelligenceFilters,
            sortBy,
            sortDir,
            page,
            limit: PAGE_SIZE,
          }),
        });
        if (gen !== fetchGenRef.current) return;
        const data = await res.json();
        if (data.success) {
          const list: StudentRow[] = data.students || [];
          setRows(list);
          if (data.pagination) setPagination(data.pagination);
          if (list.length === 0 && page === 1) toast.info("No students match these filters");
          else if (list.length > 0) enrichAttendance(list);
        } else {
          toast.error(data.msg || data.message || "Search failed");
          setRows([]);
        }
      } catch {
        if (gen === fetchGenRef.current) toast.error("Error loading students");
      } finally {
        if (gen === fetchGenRef.current) setLoading(false);
      }
    },
    [query, branch, year, batch, intelligenceFilters, sortBy, sortDir, enrichAttendance],
  );

  useEffect(() => {
    fetchBatches();
    fetchStudents(1);
    const t = setTimeout(() => {
      skipAutoSearchRef.current = false;
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipAutoSearchRef.current) return;
    const t = setTimeout(() => fetchStudents(1), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, branch, year, batch, intelligenceFilters, sortBy, sortDir, fetchStudents]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setRecommendations([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ username: query.trim().toUpperCase(), limit: 6 }),
        });
        const data = await res.json();
        if (data.success) setRecommendations(data.students || []);
      } catch {
        /* ignore */
      }
    }, 300);
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

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (resetModalOpen || editModalOpen || performanceModalOpen || deleteModalOpen) return;
      setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, resetModalOpen, editModalOpen, performanceModalOpen, deleteModalOpen]);

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
    const requestId = ++detailRequestRef.current;
    setSelectedRow(row);
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(row.username), {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (requestId !== detailRequestRef.current) return;
      if (data.success) setDetailData(data.student);
      else toast.error(data.msg || "Could not load student");
    } catch {
      if (requestId !== detailRequestRef.current) return;
      toast.error("Failed to load student details");
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    detailRequestRef.current += 1;
    setDrawerOpen(false);
    setDetailData(null);
    setSelectedRow(null);
  };

  const drawerStudentName =
    detailData && selectedRow && detailData.username === selectedRow.username
      ? detailData.name || selectedRow.name || selectedRow.username
      : selectedRow?.name || selectedRow?.username || "";

  const pageUsernames = rows.map((r) => r.username);
  const allPageSelected =
    pageUsernames.length > 0 && pageUsernames.every((id) => selectedIds.has(id));
  const somePageSelected = pageUsernames.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageUsernames.forEach((id) => next.delete(id));
      else pageUsernames.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRowSelect = (username: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const handleSort = (key: string) => {
    if (!SORTABLE_KEYS.has(key)) return;
    const k = key as SortKey;
    if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortDir("asc");
    }
  };

  const clearAllFilters = () => {
    setQuery("");
    setBranch("ALL");
    setYear("ALL");
    setBatch("ALL");
    setIntelligenceFilters({
      hasRemedials: "all",
      minCgpa: "",
      maxCgpa: "",
      minBacklogs: "",
      maxBacklogs: "",
      isPresentInCampus: "ALL",
      isSuspended: "ALL",
      isApplicationPending: "ALL",
      gender: "ALL",
      section: "ALL",
      category: "ALL",
      campus: "ALL",
    });
    setSortBy("username");
    setSortDir("asc");
  };

  const activeFilterCount = [
    branch !== "ALL",
    year !== "ALL",
    batch !== "ALL",
    query.trim().length > 0,
    intelligenceFilters.gender !== "ALL",
    intelligenceFilters.section !== "ALL",
    intelligenceFilters.category !== "ALL",
    intelligenceFilters.campus !== "ALL",
    intelligenceFilters.hasRemedials !== "all",
    intelligenceFilters.isPresentInCampus !== "ALL",
    intelligenceFilters.isSuspended !== "ALL",
    intelligenceFilters.isApplicationPending !== "ALL",
    intelligenceFilters.minCgpa !== "",
    intelligenceFilters.maxCgpa !== "",
    intelligenceFilters.minBacklogs !== "",
    intelligenceFilters.maxBacklogs !== "",
  ].filter(Boolean).length;

  const startCellEdit = (row: StudentRow, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!EDITABLE_KEYS.has(key)) return;
    const raw = row[key];
    setEditingCell({ username: row.username, key });
    setCellDraft(
      key === "cgpa"
        ? raw != null
          ? String(raw)
          : ""
        : key === "total_backlogs"
          ? String(raw ?? 0)
          : String(raw ?? ""),
    );
  };

  const saveCellEdit = async (username: string, key: string) => {
    const apiField = COLUMN_API_FIELD[key];
    if (!apiField) return;

    let payloadValue: string | number = cellDraft.trim();
    if (key === "cgpa") payloadValue = Number(cellDraft) || 0;
    if (key === "total_backlogs") payloadValue = parseInt(cellDraft, 10) || 0;

    setSavingCell(`${username}:${key}`);
    try {
      const res = await fetch(ADMIN_UPDATE_STUDENT(username), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ [apiField]: payloadValue }),
      });
      const data = await res.json();
      if (data.success) {
        setRows((prev) =>
          prev.map((r) =>
            r.username === username
              ? { ...r, ...(data.student || {}), [key]: payloadValue }
              : r,
          ),
        );
        if (detailData?.username === username && data.student) {
          setDetailData(data.student);
        }
        toast.success("Cell updated");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Failed to save cell");
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellDraft("");
  };

  const renderSortIcon = (key: string) => {
    if (!SORTABLE_KEYS.has(key)) return null;
    if (sortBy !== key) return <ArrowUpDown size={11} className="text-zinc-300" />;
    return sortDir === "asc" ? (
      <ArrowUp size={11} className="text-zinc-700" />
    ) : (
      <ArrowDown size={11} className="text-zinc-700" />
    );
  };

  const renderEditableCell = (row: StudentRow, col: (typeof COLUMNS)[number]) => {
    const isEditing =
      editingCell?.username === row.username && editingCell?.key === col.key;
    const isSaving = savingCell === `${row.username}:${col.key}`;

    if (isEditing) {
      if (col.key === "branch") {
        return (
          <select
            autoFocus
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, col.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, col.key);
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(adminSelectClass, "h-7 text-[11px] min-w-[72px]")}
          >
            {BRANCH_OPTIONS.filter((b) => b !== "ALL").map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        );
      }
      if (col.key === "year") {
        return (
          <select
            autoFocus
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, col.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, col.key);
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(adminSelectClass, "h-7 text-[11px]")}
          >
            {YEAR_OPTIONS.filter((y) => y !== "ALL").map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={col.key === "cgpa" || col.key === "total_backlogs" ? "number" : "text"}
          step={col.key === "cgpa" ? "0.01" : undefined}
          value={cellDraft}
          onChange={(e) => setCellDraft(e.target.value)}
          onBlur={() => saveCellEdit(row.username, col.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveCellEdit(row.username, col.key);
            if (e.key === "Escape") cancelCellEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(adminInputClass, "h-7 text-[11px] py-1")}
        />
      );
    }

    return (
      <span className="inline-flex items-center gap-1 group/cell">
        {cellValue(row, col.key, 0)}
        {EDITABLE_KEYS.has(col.key) && (
          <Pencil
            size={10}
            className="opacity-0 group-hover/cell:opacity-40 text-zinc-400 shrink-0"
          />
        )}
        {isSaving && <Loader2 size={10} className="animate-spin text-zinc-400" />}
      </span>
    );
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

  const handleDeleteStudent = (username: string) => {
    setDeleteTargetUser(username);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== deleteTargetUser.toUpperCase()) {
      toast.error("Student ID does not match");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(ADMIN_DELETE_STUDENT(deleteTargetUser), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Student ${deleteTargetUser} permanently deleted`);
        setDeleteModalOpen(false);
        setRows((prev) => prev.filter((s) => s.username !== deleteTargetUser));
        closeDrawer();
        fetchStudents(pagination.page);
      } else {
        toast.error(data.message || data.msg || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const openBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirmText("");
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    const count = selectedIds.size;
    const confirmPhrase = `Delete ${count}`;
    if (bulkDeleteConfirmText.trim().toLowerCase() !== confirmPhrase.toLowerCase()) {
      toast.error(`Type "${confirmPhrase}" to confirm`);
      return;
    }
    setBulkDeleting(true);
    const ids = [...selectedIds];
    try {
      const res = await fetch(ADMIN_BULK_DELETE_STUDENTS, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ usernames: ids }),
      });
      const data = await res.json();
      if (data.success || data.summary?.deleted > 0) {
        toast.success(data.message || `Deleted ${data.summary?.deleted ?? 0} student(s)`);
        setBulkDeleteModalOpen(false);
        setSelectedIds(new Set());
        const deletedSet = new Set(
          (data.results || [])
            .filter((r: { status: string }) => r.status === "deleted")
            .map((r: { username: string }) => r.username),
        );
        setRows((prev) => prev.filter((s) => !deletedSet.has(s.username)));
        if (selectedRow && deletedSet.has(selectedRow.username)) closeDrawer();
        fetchStudents(pagination.page);
      } else {
        toast.error(data.message || "Bulk delete failed");
      }
    } catch {
      toast.error("Failed to delete selected students");
    } finally {
      setBulkDeleting(false);
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
              onChange={(e) => setQuery(e.target.value)}
              className={cn(adminInputClass, "pl-10")}
            />
            {(loading || enriching) && (
              <Loader2
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
              />
            )}
            <AnimatePresence>
              {recommendations.length > 0 && query.trim().length >= 2 && (
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
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={cn(
                adminGhostButtonClass,
                "h-10",
                showAdvancedFilters && "bg-zinc-100 border-zinc-300",
              )}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAllFilters} className={adminGhostButtonClass}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { label: "Branch", value: branch, onChange: setBranch, options: BRANCH_OPTIONS },
            { label: "Year", value: year, onChange: setYear, options: YEAR_OPTIONS },
            {
              label: "Batch",
              value: batch,
              onChange: setBatch,
              options: ["ALL", ...availableBatches],
            },
            {
              label: "Gender",
              value: intelligenceFilters.gender,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, gender: v })),
              options: GENDER_OPTIONS,
            },
            {
              label: "Section",
              value: intelligenceFilters.section,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, section: v })),
              options: ["ALL", "A", "B", "C", "D"],
            },
            {
              label: "Sort by",
              value: sortBy,
              onChange: (v: string) => setSortBy(v as SortKey),
              options: [
                { v: "username", l: "Student ID" },
                { v: "name", l: "Name" },
                { v: "branch", l: "Branch" },
                { v: "year", l: "Year" },
                { v: "batch", l: "Batch" },
                { v: "cgpa", l: "CGPA" },
                { v: "total_backlogs", l: "Backlogs" },
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
            <span className={adminLabelClass}>Order</span>
            <div className="relative">
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className={cn(adminSelectClass, "h-9 text-[11px]")}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
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
                    label: "On campus",
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
                    label: "Account",
                    value: intelligenceFilters.isSuspended,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, isSuspended: v })),
                    options: [
                      { v: "ALL", l: "Any" },
                      { v: "false", l: "Active" },
                      { v: "true", l: "Suspended" },
                    ],
                  },
                  {
                    label: "Application",
                    value: intelligenceFilters.isApplicationPending,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, isApplicationPending: v })),
                    options: [
                      { v: "ALL", l: "Any" },
                      { v: "true", l: "Pending" },
                      { v: "false", l: "Clear" },
                    ],
                  },
                  {
                    label: "Category",
                    value: intelligenceFilters.category,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, category: v })),
                    options: CATEGORY_OPTIONS,
                  },
                  {
                    label: "Campus site",
                    value: intelligenceFilters.campus,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, campus: v })),
                    options: CAMPUS_OPTIONS,
                  },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <span className={adminLabelClass}>{f.label}</span>
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
                  </div>
                ))}
                {[
                  { label: "Min CGPA", key: "minCgpa" as const, max: "10" },
                  { label: "Max CGPA", key: "maxCgpa" as const, max: "10" },
                  { label: "Min BL", key: "minBacklogs" as const, max: "20" },
                  { label: "Max BL", key: "maxBacklogs" as const, max: "20" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1">
                    <span className={adminLabelClass}>{f.label}</span>
                    <input
                      type="number"
                      step={f.key.includes("Cgpa") ? "0.01" : "1"}
                      placeholder="—"
                      value={intelligenceFilters[f.key]}
                      onChange={(e) =>
                        setIntelligenceFilters((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                      className={cn(adminInputClass, "h-9 text-[11px]")}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sheet toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
          {selectedIds.size > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold">
                {selectedIds.size} selected
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
              <button
                type="button"
                onClick={openBulkDelete}
                className={cn(
                  adminDangerButtonClass,
                  "h-8 px-3 text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50",
                )}
              >
                <Trash2 size={13} />
                Delete selected
              </button>
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-400">
          Click row for profile · Double-click for charts · Click cell to edit inline
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
        <div className={cn(adminCardClass, "overflow-hidden p-0")}>
          <div className="overflow-x-auto custom-sidebar-scroll max-h-[calc(100vh-22rem)] border-b border-zinc-200">
            <table className="w-full border-collapse text-[12px] min-w-[1500px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th
                    className={stickyCellClass(
                      "checkbox",
                      "w-10 px-2 py-2.5 border-r border-zinc-200",
                      true,
                    )}
                  >
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center w-full text-zinc-500 hover:text-zinc-900"
                      title={allPageSelected ? "Deselect page" : "Select page"}
                    >
                      {allPageSelected ? (
                        <CheckSquare size={15} />
                      ) : somePageSelected ? (
                        <CheckSquare size={15} className="text-zinc-400" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        stickyCellClass(
                          col.key,
                          "px-3 py-2.5 text-left text-[10px] font-semibold tracking-wide text-zinc-500 whitespace-nowrap border-r border-zinc-200 last:border-r-0",
                          true,
                        ),
                        SORTABLE_KEYS.has(col.key) &&
                          "cursor-pointer hover:bg-zinc-100 select-none",
                        col.className,
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {renderSortIcon(col.key)}
                      </span>
                    </th>
                  ))}
                  <th className="w-10 px-2 py-2.5 border-l border-zinc-200 bg-zinc-50" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.username}
                    onClick={() => openDetail(row)}
                    onDoubleClick={() => handleOpenPerformance(row)}
                    className={cn(
                      "border-b border-zinc-200 cursor-pointer transition-colors",
                      selectedIds.has(row.username) && "bg-zinc-100/90",
                      selectedRow?.username === row.username && !selectedIds.has(row.username)
                        ? "bg-zinc-100/80"
                        : !selectedIds.has(row.username) && "hover:bg-zinc-50",
                      idx % 2 === 1 && !selectedIds.has(row.username) && "bg-zinc-50/40",
                    )}
                  >
                    <td
                      className={stickyCellClass(
                        "checkbox",
                        "px-2 py-2 border-r border-zinc-200",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRowSelect(row.username)}
                        className="flex items-center justify-center w-full text-zinc-400 hover:text-zinc-900"
                      >
                        {selectedIds.has(row.username) ? (
                          <CheckSquare size={15} className="text-zinc-900" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        onClick={(e) => {
                          if (EDITABLE_KEYS.has(col.key)) startCellEdit(row, col.key, e);
                        }}
                        className={cn(
                          stickyCellClass(
                            col.key,
                            "px-3 py-2.5 text-zinc-800 whitespace-nowrap border-r border-zinc-200 last:border-r-0 font-medium",
                          ),
                          col.key === "name" && "truncate max-w-[240px]",
                          col.key === "username" && "font-semibold text-zinc-900 tabular-nums",
                          col.key === "email" && "text-zinc-500 text-[11px]",
                          col.key === "cgpa" && adminNumsClass,
                          col.key === "attendance_pct" && adminNumsClass,
                          EDITABLE_KEYS.has(col.key) &&
                            "hover:bg-zinc-100/60 hover:ring-1 hover:ring-inset hover:ring-zinc-300/80",
                          col.className,
                        )}
                      >
                        {EDITABLE_KEYS.has(col.key)
                          ? renderEditableCell(row, col)
                          : cellValue(row, col.key, rangeStart + idx)}
                      </td>
                    ))}
                    <td className="px-2 py-2.5 border-l border-zinc-200 text-zinc-300">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => {
              setSelectedIds(new Set());
              fetchStudents(p);
            }}
          />
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-zinc-900/30 backdrop-blur-sm"
              onClick={() => {
                if (resetModalOpen || editModalOpen || deleteModalOpen) return;
                closeDrawer();
              }}
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
                  <p className="text-[10px] font-semibold tracking-wide text-zinc-400">
                    Student profile
                  </p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {drawerStudentName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
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
                ) : detailData && detailData.username === selectedRow?.username ? (
                  <StudentDashboard
                    key={detailData.username}
                    data={detailData}
                    onSuspendToggle={handleToggleSuspension}
                    onResetPassword={handleGlobalResetPassword}
                    onDeleteStudent={handleDeleteStudent}
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
        elevated
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

      <AdminDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        elevated
        title="Permanently delete student"
        description="This cannot be undone. Profile, login, grades, attendance, and request history will be removed."
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className={adminGhostButtonClass}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteStudent}
              disabled={
                deleting ||
                deleteConfirmText.trim().toUpperCase() !== deleteTargetUser.toUpperCase()
              }
              className={adminDangerButtonClass}
            >
              {deleting ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              Delete permanently
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-zinc-600">
            Type <span className="font-semibold text-zinc-900">{deleteTargetUser}</span> to confirm.
          </p>
          <div className="space-y-2">
            <label className={adminLabelClass}>Student ID</label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTargetUser}
              className={adminInputClass}
              autoComplete="off"
            />
          </div>
        </div>
      </AdminDialog>

      <AdminDialog
        open={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        elevated
        title={`Delete ${selectedIds.size} student(s)`}
        description="Permanent removal of profiles, logins, grades, attendance, and request history for every selected student."
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className={adminGhostButtonClass}
              disabled={bulkDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={
                bulkDeleting ||
                bulkDeleteConfirmText.trim().toLowerCase() !==
                `Delete ${selectedIds.size}`.toLowerCase()
              }
              className={adminDangerButtonClass}
            >
              {bulkDeleting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete {selectedIds.size} permanently
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-zinc-600">
            You are about to delete{" "}
            <span className="font-semibold text-zinc-900">{selectedIds.size}</span>{" "}
            student record(s). Type{" "}
            <span className="font-semibold text-rose-600">
              Delete {selectedIds.size}
            </span>{" "}
            to confirm.
          </p>
          <div className="max-h-32 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-[11px] font-mono text-zinc-600 space-y-0.5">
            {[...selectedIds].slice(0, 12).map((id) => (
              <div key={id}>{id}</div>
            ))}
            {selectedIds.size > 12 && (
              <div className="text-zinc-400">+ {selectedIds.size - 12} more…</div>
            )}
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>Confirmation</label>
            <input
              type="text"
              value={bulkDeleteConfirmText}
              onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
              placeholder={`Delete ${selectedIds.size}`}
              className={adminInputClass}
              autoComplete="off"
            />
          </div>
        </div>
      </AdminDialog>

      <StudentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        student={editingStudent}
        elevated={drawerOpen}
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
