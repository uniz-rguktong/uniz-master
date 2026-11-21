/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
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
  adminInputClass,
  adminLabelClass,
  adminPageWrapClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";

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

  const trackingColumns: TableColumn<TrackingRow>[] = [
    {
      id: "index",
      header: "#",
      numeric: true,
      cell: (row) => (pagination.page - 1) * 25 + rows.indexOf(row) + 1,
    },
    {
      id: "username",
      header: "Student ID",
      meta: true,
      cell: (row) => <span className="font-semibold">{row.username}</span>,
    },
    {
      id: "name",
      header: "Name",
      primary: true,
      cell: (row) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium">{row.name || "—"}</span>
          {row.email ? (
            <span className="block truncate text-caption text-text-3">{row.email}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "branch",
      header: "Branch",
      meta: true,
      cell: (row) => row.branch,
    },
    {
      id: "year",
      header: "Year",
      cell: (row) => row.year,
    },
    {
      id: "section",
      header: "Sec",
      cell: (row) => row.section || "—",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) =>
        row.registered ? (
          <Badge tone="success">Done</Badge>
        ) : (
          <Badge tone="warning">Pending</Badge>
        ),
    },
    {
      id: "subjects",
      header: "Subjects",
      numeric: true,
      cell: (row) => (row.registered ? row.subjectCount : "—"),
    },
    {
      id: "submitted",
      header: "Submitted",
      cell: (row) => fmtDate(row.submittedAt),
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <Button type="button" variant="ghost" size="compact" onClick={onBack} className="mb-4">
        <ArrowLeft size={16} /> Back
      </Button>

      <SectionHeader
        icon={<Users size={18} />}
        eyebrow="Registration"
        title="Registration progress"
        subtitle={`Who has completed course registration for ${semester.name}.`}
        actions={
          <Button
            type="button"
            onClick={() => void handleBulkPdfDownload()}
            disabled={downloadingPdf || summary.registered === 0}
          >
            {downloadingPdf ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {branch !== "ALL" || batch !== "ALL" || year !== "ALL"
              ? "Download filtered forms (PDF)"
              : "Download all forms (PDF)"}
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cn(adminCardClass, "p-5")}>
          <p className={adminLabelClass}>Eligible</p>
          <p className="text-2xl font-semibold text-text mt-1">
            {summary.eligible.toLocaleString()}
          </p>
        </div>
        <div className={cn(adminCardClass, "p-5 border-success bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]")}>
          <p className={cn(adminLabelClass, "text-success")}>Registered</p>
          <p className="text-2xl font-semibold text-success mt-1 flex items-center gap-2">
            <CheckCircle2 size={22} />
            {summary.registered.toLocaleString()}
          </p>
        </div>
        <div className={cn(adminCardClass, "p-5 border-warning bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))]")}>
          <p className={cn(adminLabelClass, "text-warning")}>Pending</p>
          <p className="text-2xl font-semibold text-warning mt-1 flex items-center gap-2">
            <UserX size={22} />
            {summary.pending.toLocaleString()}
          </p>
        </div>
      </div>

      <div className={cn(adminCardClass, "p-4")}>
        <div className="flex items-center justify-between text-sm font-medium text-text-2 mb-2">
          <span>Completion</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-success transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className={cn(adminCardClass, "p-5 space-y-4")}>
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-text-3"
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
                    "locked" in f && f.locked && "opacity-70 cursor-not-allowed bg-surface-2",
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-text-3">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-caption">Loading…</p>
        </div>
      ) : (
        <Table
          columns={trackingColumns}
          rows={rows}
          getRowId={(row) => row.username}
          empty={<EmptyState title="No students match these filters" />}
          footer={
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={25}
              onPageChange={(p) => fetchTracking(p)}
            />
          }
        />
      )}
    </div>
  );
}
