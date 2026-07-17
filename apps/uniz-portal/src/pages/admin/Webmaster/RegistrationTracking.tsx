/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Loader2,
  Search,
  Users,
  UserX,
} from "lucide-react";
import { apiClient, downloadFile } from "../../../api/apiClient";
import { DOWNLOAD_BULK_REGISTRATION, REGISTRATION_TRACKING } from "../../../api/endpoints";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import { Pagination } from "../../../components/Pagination";
import { cn } from "../../../utils/cn";
import { parseJwt } from "../../../utils/security";
import { resolveAdminPortalRole, resolveHodBranch } from "../../../utils/adminRole";
import {
  adminCardClass,
  adminChipClass,
  adminGhostButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPageWrapClass,
  adminPrimaryButtonClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";

const BRANCH_OPTIONS = [...ENGINEERING_BRANCH_OPTIONS];
const YEAR_OPTIONS = ["ALL", "E1", "E2", "E3", "E4"];
const STATUS_OPTIONS = [
  { v: "all", l: "All students" },
  { v: "registered", l: "Registered" },
  { v: "pending", l: "Not yet registered" },
];

type TrackingRow = {
  username: string;
  name: string;
  email?: string;
  branch: string;
  year: string;
  batch?: string;
  section?: string;
  registered: boolean;
  subjectCount: number;
  submittedAt?: string | null;
};

export default function RegistrationTracking({
  semester,
  onBack,
}: {
  semester: { id: string; name: string; status?: string; batch?: string };
  onBack: () => void;
}) {
  const adminToken = localStorage.getItem("admin_token");
  const decoded = adminToken ? parseJwt(adminToken) : null;
  const username = (localStorage.getItem("username") || "").replace(/"/g, "");
  const portalRole = resolveAdminPortalRole(decoded, username);
  const isHod = portalRole === "hod";
  const hodBranch = isHod ? resolveHodBranch(decoded, username) : "";

  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState(() =>
    isHod && hodBranch ? hodBranch : "ALL",
  );
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState(semester.batch ? semester.batch.toUpperCase() : "ALL");
  const [availableBatches, setAvailableBatches] = useState<string[]>(() =>
    semester.batch ? [semester.batch.toUpperCase()] : [],
  );
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [summary, setSummary] = useState({
    eligible: 0,
    registered: 0,
    pending: 0,
    percent: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchTracking = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          semesterId: semester.id,
          page: String(page),
          limit: "25",
          status,
        });
        if (branch !== "ALL") params.set("branch", branch);
        if (year !== "ALL") params.set("year", year);
        if (batch !== "ALL") params.set("batch", batch);
        if (query.trim()) params.set("query", query.trim());

        const data = await apiClient<any>(
          `${REGISTRATION_TRACKING}?${params.toString()}`,
          {},
          false,
        );
        setRows(data?.students || []);
        setSummary(
          data?.summary || { eligible: 0, registered: 0, pending: 0, percent: 0 },
        );
        const batches = Array.isArray(data?.filterOptions?.batches)
          ? data.filterOptions.batches
              .map((value: unknown) => String(value).toUpperCase())
              .filter(Boolean)
          : [];
        if (batches.length) {
          setAvailableBatches((current) =>
            [...new Set([...current, ...batches])].sort(),
          );
        }
        if (data?.pagination) setPagination(data.pagination);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [semester.id, branch, year, batch, status, query],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchTracking(1), query ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchTracking, query]);

  const fmtDate = (d?: string | null) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const progressPct = useMemo(
    () => Math.min(100, Math.max(0, summary.percent)),
    [summary.percent],
  );

  const handleBulkPdfDownload = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams({ semesterId: semester.id });
      if (branch !== "ALL") params.set("branch", branch);
      if (year !== "ALL") params.set("year", year);
      if (batch !== "ALL") params.set("batch", batch);
      if (query.trim()) params.set("query", query.trim());

      const safeSem = semester.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filterSuffix = [batch, branch, year]
        .filter((value) => value !== "ALL")
        .map((value) => value.replace(/[^a-zA-Z0-9_-]/g, "_"))
        .join("_");
      await downloadFile(
        `${DOWNLOAD_BULK_REGISTRATION}?${params.toString()}`,
        `REGISTRATION_BULK_${safeSem}${filterSuffix ? `_${filterSuffix}` : ""}.pdf`,
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <button
        type="button"
        onClick={onBack}
        className={cn(adminGhostButtonClass, "mb-4 -ml-1")}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <SectionHeader
        icon={<Users size={18} />}
        eyebrow="Registration"
        title="Registration progress"
        subtitle={`Who has completed course registration for ${semester.name}.`}
        actions={
          <button
            type="button"
            onClick={() => void handleBulkPdfDownload()}
            disabled={downloadingPdf || summary.registered === 0}
            className={cn(
              adminPrimaryButtonClass,
              "inline-flex items-center gap-2 shrink-0",
              (downloadingPdf || summary.registered === 0) &&
                "opacity-60 cursor-not-allowed",
            )}
          >
            {downloadingPdf ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {branch !== "ALL" || batch !== "ALL" || year !== "ALL"
              ? "Download filtered forms (PDF)"
              : "Download all forms (PDF)"}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cn(adminCardClass, "p-5")}>
          <p className={adminLabelClass}>Eligible</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-1">
            {summary.eligible.toLocaleString()}
          </p>
        </div>
        <div className={cn(adminCardClass, "p-5 border-emerald-100 bg-emerald-50/30")}>
          <p className={cn(adminLabelClass, "text-emerald-700")}>Registered</p>
          <p className="text-2xl font-semibold text-emerald-800 mt-1 flex items-center gap-2">
            <CheckCircle2 size={22} />
            {summary.registered.toLocaleString()}
          </p>
        </div>
        <div className={cn(adminCardClass, "p-5 border-amber-100 bg-amber-50/30")}>
          <p className={cn(adminLabelClass, "text-amber-700")}>Pending</p>
          <p className="text-2xl font-semibold text-amber-800 mt-1 flex items-center gap-2">
            <UserX size={22} />
            {summary.pending.toLocaleString()}
          </p>
        </div>
      </div>

      <div className={cn(adminCardClass, "p-4")}>
        <div className="flex items-center justify-between text-sm font-medium text-zinc-600 mb-2">
          <span>Completion</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className={cn(adminCardClass, "p-5 space-y-4")}>
        <div className="relative">
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
          {loading && (
            <Loader2
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
            />
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "Branch",
              value: branch,
              onChange: setBranch,
              options: isHod && hodBranch ? [hodBranch] : BRANCH_OPTIONS,
              locked: isHod,
            },
            {
              label: "Year",
              value: year,
              onChange: setYear,
              options: YEAR_OPTIONS,
            },
            {
              label: "Batch",
              value: batch,
              onChange: setBatch,
              options: ["ALL", ...availableBatches].filter(
                (v, i, a) => a.indexOf(v) === i,
              ),
            },
            {
              label: "Status",
              value: status,
              onChange: setStatus,
              options: STATUS_OPTIONS,
            },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <span className={adminLabelClass}>{f.label}</span>
              <div className="relative">
                <select
                  value={f.value}
                  onChange={(e) =>
                    "options" in f && Array.isArray(f.options) && typeof f.options[0] === "string"
                      ? f.onChange(e.target.value)
                      : f.onChange(e.target.value)
                  }
                  disabled={"locked" in f && f.locked}
                  className={cn(
                    adminSelectClass,
                    "h-9 text-[11px]",
                    "locked" in f && f.locked && "opacity-70 cursor-not-allowed bg-zinc-50",
                  )}
                >
                  {Array.isArray(f.options) &&
                    (typeof f.options[0] === "string"
                      ? (f.options as string[]).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))
                      : (f.options as { v: string; l: string }[]).map((o) => (
                          <option key={o.v} value={o.v}>
                            {o.l}
                          </option>
                        )))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={cn(adminCardClass, "overflow-hidden p-0")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[720px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold tracking-wide text-zinc-500">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Student ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-left">Sec</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Subjects</th>
                <th className="px-4 py-3 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-zinc-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-zinc-500">
                    No students match these filters
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={row.username}
                    className={cn(
                      "border-b border-zinc-100",
                      !row.registered && "bg-amber-50/40",
                    )}
                  >
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {(pagination.page - 1) * 25 + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {row.username}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800">{row.name || "—"}</div>
                      {row.email && (
                        <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                          {row.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.branch}</td>
                    <td className="px-4 py-3">{row.year}</td>
                    <td className="px-4 py-3">{row.section || "—"}</td>
                    <td className="px-4 py-3">
                      {row.registered ? (
                        <span
                          className={cn(
                            adminChipClass,
                            "bg-emerald-50 text-emerald-700 border-emerald-100",
                          )}
                        >
                          <CheckCircle2 size={12} className="inline mr-1" />
                          Done
                        </span>
                      ) : (
                        <span
                          className={cn(
                            adminChipClass,
                            "bg-amber-50 text-amber-700 border-amber-100",
                          )}
                        >
                          <Clock size={12} className="inline mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.registered ? row.subjectCount : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {fmtDate(row.submittedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={25}
          onPageChange={(p) => fetchTracking(p)}
        />
      </div>
    </div>
  );
}
