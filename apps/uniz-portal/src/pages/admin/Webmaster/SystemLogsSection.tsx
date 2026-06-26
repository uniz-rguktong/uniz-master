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
} from "lucide-react";
import { ADMIN_UPLOAD_HISTORY, TRIGGER_CRON } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { useRecoilState } from "recoil";
import { systemLogsAtom } from "../../../store/atoms";

import { Skeleton } from "@/components/ui/Skeleton";
import { Activity } from "lucide-react";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminInputClass,
  adminSelectClass,
  adminSegmentWrapClass,
  adminSegmentInactiveClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

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

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<Activity size={18} />}
        eyebrow="Management"
        title="System & Audit Logs"
        subtitle="Institutional data synchronization and event history across all portals."
        actions={
          <>
            <div className={adminSegmentWrapClass}>
              <button
                onClick={fetchHistory}
                title="Refresh Logs"
                className={cn(
                  adminSegmentInactiveClass,
                  "px-2.5 py-1.5",
                  loading && "animate-spin",
                )}
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={triggerMaintenance}
                disabled={isMaintenanceLoading}
                title="Trigger Maintenance"
                className={cn(
                  adminSegmentInactiveClass,
                  "px-2.5 py-1.5 hover:!text-rose-600",
                  isMaintenanceLoading && "animate-pulse",
                )}
              >
                <AlertTriangle size={16} />
              </button>
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10"
                size={13}
              />
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(adminSelectClass, "pl-9 w-[160px]")}
              >
                <option value="ALL">All Assets</option>
                <option value="STUDENTS">Students</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="GRADES">Grades</option>
              </select>
              <ChevronDown
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={14}
              />
            </div>

            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
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
                className={cn(adminInputClass, "pl-10 w-[240px]")}
              />
            </div>
          </>
        }
      />

      <div className={cn(adminCardClass, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/70">
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Activity & Resource
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Data Metrics
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(itemsPerPage)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-20 opacity-50" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-12 rounded-lg" />
                          <Skeleton className="h-2 w-16 opacity-50" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <Skeleton className="h-7 w-20 rounded-full" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-2 w-16 opacity-50" />
                        </div>
                      </td>
                    </tr>
                  ))
              ) : paginatedHistory.length > 0 ? (
                paginatedHistory.map((log: any, idx: number) => {
                  const errorsJson =
                    typeof log.errors === "string"
                      ? JSON.parse(log.errors)
                      : log.errors;
                  const downloadUrl =
                    log.fileUrl ||
                    errorsJson?.fileUrl ||
                    (log.filename?.startsWith("http") ? log.filename : null);
                  const displayFilename =
                    errorsJson?.originalName ||
                    (log.filename?.startsWith("http")
                      ? "Uploaded_File"
                      : log.filename);

                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-zinc-50/60 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <p
                              className="text-[13px] font-semibold text-zinc-800 tracking-tight truncate max-w-[200px]"
                              title={displayFilename}
                            >
                              {displayFilename || "Automated sync"}
                            </p>
                            {downloadUrl && (
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Download Source File"
                                className="text-zinc-400 hover:text-zinc-900 transition-colors bg-white hover:border-zinc-300 p-1.5 rounded-lg border border-zinc-200"
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-medium uppercase tracking-wide w-fit">
                            {log.type || "NONE"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-zinc-900 tabular-nums">
                              {log.totalRows || 0}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.12em]">
                              Rows
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 tabular-nums">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                              {log.successCount || 0}
                            </span>
                            <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1 tabular-nums">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>{" "}
                              {log.failCount || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="w-fit">
                          {log.status === "COMPLETED" ? (
                            <div className="inline-flex items-center gap-1.5 text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[11px] font-medium">
                                Completed
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              <span className="text-[11px] font-medium">
                                {log.status || "PROCESSING"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <p className="text-[13px] font-medium tracking-tight text-zinc-700 tabular-nums">
                            {new Date(log.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.12em] mt-0.5 tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-300">
                        <AlertCircle size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-500 tracking-tight">
                        No logs found matching your criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredHistory.length > 0 && (
          <div className="px-8 py-4 bg-zinc-50/50 border-t border-zinc-200/70 flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.12em]">
              Showing{" "}
              <span className="text-zinc-900">
                {Math.min(
                  filteredHistory.length,
                  (currentPage - 1) * itemsPerPage + 1,
                )}
                -{Math.min(filteredHistory.length, currentPage * itemsPerPage)}
              </span>{" "}
              of {filteredHistory.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3.5 border border-zinc-200 bg-white rounded-lg text-[12px] font-semibold text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-semibold tabular-nums transition-all ${currentPage === num ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
                    >
                      {num}
                    </button>
                  ))
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2),
                  )}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-8 px-3.5 border border-zinc-200 bg-white rounded-lg text-[12px] font-semibold text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
