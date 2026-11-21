/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  AlertTriangle,
  AlertCircle,
  Filter,
  ChevronDown,
  Download,
  CheckCircle2,
} from "lucide-react";
import { ADMIN_UPLOAD_HISTORY, TRIGGER_CRON } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/utils/cn";
import { useRecoilState } from "recoil";
import { systemLogsAtom } from "../../../store/atoms";

import { Activity } from "lucide-react";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminInputClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { formatDisplayText } from "@/utils/displayText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";

export default function SystemLogsSection() {
  const [logsState, setLogsState] = useRecoilState(systemLogsAtom);
  const history = logsState.data;
  const [loading, setLoading] = useState(!logsState.fetched);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!logsState.fetched) setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_UPLOAD_HISTORY, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogsState({
          fetched: true,
          data: data.history || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerMaintenance = async () => {
    setIsMaintenanceLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(TRIGGER_CRON, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Maintenance cron triggered successfully");
      } else {
        toast.error(data.msg || "Trigger failed");
      }
    } catch (error) {
      toast.error("Network error triggering cron");
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  // Filter and Paginate logic
  const filteredHistory = history.filter((log: any) => {
    const matchesSearch =
      log.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "ALL" || log.type === filterType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const logColumns: TableColumn<any>[] = [
    {
      id: "activity",
      header: "Activity & Resource",
      primary: true,
      cell: (log) => {
        const errorsJson =
          typeof log.errors === "string" ? JSON.parse(log.errors) : log.errors;
        const downloadUrl =
          log.fileUrl ||
          errorsJson?.fileUrl ||
          (log.filename?.startsWith("http") ? log.filename : null);
        const displayFilename =
          errorsJson?.originalName ||
          (log.filename?.startsWith("http") ? "Uploaded_File" : log.filename);
        return (
          <span className="block min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-dense font-semibold text-text" title={displayFilename}>
                {displayFilename || "Automated sync"}
              </span>
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Download Source File"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-border p-1.5 text-text-3 hover:text-text"
                >
                  <Download size={14} />
                </a>
              ) : null}
            </span>
            <span className="mt-1 inline-flex">
              <Badge tone="neutral">{formatDisplayText(log.type, "None")}</Badge>
            </span>
          </span>
        );
      },
    },
    {
      id: "metrics",
      header: "Data Metrics",
      meta: true,
      numeric: true,
      cell: (log) => (
        <span className="block">
          <span className="text-dense font-semibold tabular-nums text-text">
            {log.totalRows || 0} Rows
          </span>
          <span className="mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-caption font-medium text-success tabular-nums">
              <CheckCircle2 size={14} aria-hidden />
              {log.successCount || 0}
            </span>
            <span className="inline-flex items-center gap-1 text-caption font-medium text-error tabular-nums">
              <AlertCircle size={14} aria-hidden />
              {log.failCount || 0}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (log) => {
        const tone =
          log.status === "COMPLETED"
            ? "success"
            : /fail|error/i.test(String(log.status || ""))
              ? "error"
              : "warning";
        return (
          <Badge tone={tone}>
            {log.status === "COMPLETED"
              ? "Completed"
              : formatDisplayText(log.status, "Processing")}
          </Badge>
        );
      },
    },
    {
      id: "time",
      header: "Timestamp",
      meta: true,
      cell: (log) => (
        <span className="tabular-nums text-dense text-text">
          {new Date(log.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          {new Date(log.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<Activity size={18} />}
        eyebrow="Management"
        title="System & Audit Logs"
        subtitle="Institutional data synchronization and event history across all portals."
        actions={
          <>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" onClick={fetchHistory} title="Refresh Logs">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={triggerMaintenance}
                disabled={isMaintenanceLoading}
                title="Trigger Maintenance"
              >
                <AlertTriangle size={16} />
              </Button>
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none z-10"
                size={13}
              />
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(adminSelectClass, "w-full pl-10 sm:w-44")}
              >
                <option value="ALL">All Assets</option>
                <option value="STUDENTS">Students</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="GRADES">Grades</option>
              </select>
              <ChevronDown
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                size={14}
              />
            </div>

            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
                size={15}
              />
              <input
                type="text"
                placeholder="Search history…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(adminInputClass, "w-full pl-10 sm:w-60")}
              />
            </div>
          </>
        }
      />

      {loading ? (
        <p className="text-body text-text-2">Loading logs…</p>
      ) : (
        <Table
          rows={paginatedHistory}
          getRowId={(log: any) => String(log.id || log.createdAt || log.filename)}
          empty={<EmptyState title="No logs found matching your criteria." icon={AlertCircle} />}
          footer={
            filteredHistory.length > 0 ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-small text-text-2 tabular-nums">
                  Showing {Math.min(filteredHistory.length, (currentPage - 1) * itemsPerPage + 1)}–
                  {Math.min(filteredHistory.length, currentPage * itemsPerPage)} of {filteredHistory.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="compact" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <span className="text-small tabular-nums text-text">{currentPage} / {totalPages}</span>
                  <Button type="button" variant="outline" size="compact" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null
          }
          columns={logColumns}
        />
      )}
    </div>
  );
}
