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
import { toast } from "react-toastify";

export default function SystemLogsSection() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_UPLOAD_HISTORY, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            System & Audit Logs
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Institutional data synchronization and event history across all
            portals.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm shadow-none">
            <button
              onClick={fetchHistory}
              title="Refresh Logs"
              className={`p-2.5 text-slate-500 hover:text-navy-900 transition-all ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={triggerMaintenance}
              disabled={isMaintenanceLoading}
              title="Trigger Maintenance"
              className={`p-2.5 text-slate-500 hover:text-red-600 transition-all ${isMaintenanceLoading ? "animate-pulse" : ""}`}
            >
              <AlertTriangle size={18} />
            </button>
          </div>

          <div className="relative group">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors pointer-events-none"
              size={13}
            />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all w-[160px] shadow-none appearance-none cursor-pointer text-slate-600"
            >
              <option value="ALL">All Assets</option>
              <option value="STUDENTS">Students</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="GRADES">Grades</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors pointer-events-none"
              size={14}
            />
          </div>

          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 pr-5 h-12 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all w-[240px] shadow-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-none overflow-hidden text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Operator
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Activity & Resource
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Data Metrics
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Status
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={5}
                        className="px-10 py-8 bg-slate-50/20"
                      ></td>
                    </tr>
                  ))
              ) : paginatedHistory.length > 0 ? (
                paginatedHistory.map((log: any, idx: number) => {
                  const errorsJson =
                    typeof log.errors === "string"
                      ? JSON.parse(log.errors)
                      : log.errors;
                  const downloadUrl =
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
                      className="hover:bg-slate-50/30 transition-all group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm border-2 border-white ring-1 ring-slate-100 uppercase shadow-none">
                            {log.uploadedBy?.[0] || "U"}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-semibold text-slate-900 tracking-tight leading-none mb-1">
                              {log.uploadedBy || "System"}
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
                              ID: {log.id?.slice(0, 8) || "AUDIT"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm font-semibold text-slate-800 tracking-tight truncate max-w-[200px]"
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
                                className="text-slate-400 hover:text-navy-900 transition-colors bg-white hover:bg-slate-50 p-1.5 rounded-md border border-slate-200"
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                          <span className="px-2 py-0.5 bg-navy-50 text-navy-900 rounded text-[9px] font-bold uppercase tracking-wider w-fit border border-navy-100">
                            {log.type || "NONE"}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              {log.totalRows || 0}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                              Rows
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>{" "}
                              {log.successCount || 0}
                            </span>
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-red-400"></span>{" "}
                              {log.failCount || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="w-fit">
                          {log.status === "COMPLETED" ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                              <span className="text-[9px] font-bold uppercase tracking-widest">
                                Completed
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-navy-900 bg-navy-50 px-3 py-1 rounded-xl border border-navy-100">
                              <span className="text-[9px] font-bold uppercase tracking-widest">
                                {log.status || "PROCESSING"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold tracking-tight text-slate-700">
                            {new Date(log.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
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
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-5">
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-none text-slate-300">
                        <AlertCircle size={40} />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm tracking-tight">
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
          <div className="px-10 py-5 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Showing{" "}
              <span className="text-slate-900">
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${currentPage === num ? "bg-slate-900 text-white shadow-none" : "text-slate-500 hover:bg-slate-100"}`}
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:pointer-events-none"
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
