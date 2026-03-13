// import { useRecoilValue } from "recoil";
// import { student } from "../../store";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { STUDENT_HISTORY } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";

import {
  Clock,
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

type requestProps = {
  request: "outing" | "outpass";
};

export function OutButton({ request }: requestProps) {
  const navigateTo = useNavigate();
  return (
    <div className="flex justify-center items-center w-full md:w-auto mt-2 md:mt-0">
      <button
        onClick={() => navigateTo(`/student/${request}/request${request}`)}
        className="w-full md:w-auto px-10 h-[48px] bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-md shadow-navy-100 flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>New {request.charAt(0).toUpperCase() + request.slice(1)}</span>
      </button>
    </div>
  );
}

export default function Outpass_Outing({ request }: requestProps) {
  // const Student = useRecoilValue(student);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ success: boolean; history: any[] }>(
        STUDENT_HISTORY,
        {
          method: "GET",
        },
      );

      if (data && data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter requests based on the current page type
  const requests = history.filter((item) => item.type === request);

  // Calculate pending count from the fetched history
  const pendingCount = requests.filter(
    (r) => !r.isApproved && !r.isRejected && !r.isExpired,
  ).length;

  const getStatusParams = (req: any) => {
    if (req.isApproved || req.is_approved)
      return {
        label: "Approved",
        color: "bg-navy-900 text-white shadow-lg shadow-navy-100/10",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    if (req.isRejected || req.is_rejected)
      return {
        label: "Rejected",
        color: "bg-white border border-red-50 text-red-600",
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    if (req.isExpired || req.is_expired)
      return {
        label: "Expired",
        color: "bg-slate-100 text-slate-500",
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    return {
      label: "Pending",
      color: "bg-white border border-slate-200 text-slate-800",
      icon: <Clock className="w-3.5 h-3.5 animate-pulse" />,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 pb-24 md:pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10 mt-4 md:mt-0">
        <div className="flex flex-col gap-1.5 text-center md:text-left">
          <p className="text-slate-400 font-medium text-[12px] uppercase tracking-widest leading-none mb-1">
            Institutional Permission Records
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            {request === "outing" ? "Outing" : "Outpass"} Logs & History
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100/50">
                <Clock className="w-3 h-3 animate-pulse" />
                {pendingCount} Pending Requests
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <OutButton request={request} />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/30 rounded-xl border border-slate-100 border-dashed">
            <div className="mx-auto h-20 w-20 bg-white rounded-xl flex items-center justify-center mb-6 border border-slate-50 shadow-sm">
              <Clock className="h-8 w-8 text-slate-100" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2 tracking-tight">
              No History Found
            </h3>
            <p className="text-slate-400 font-medium text-[13px] max-w-[240px] mx-auto leading-relaxed">
              Your past {request} requests will be archived here once you start.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-8 py-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                        Request Detail
                      </th>
                      <th className="px-8 py-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                        Period & Interval
                      </th>
                      <th className="px-8 py-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                        Reason for Leave
                      </th>
                      <th className="px-8 py-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/60">
                    {requests.map((req: any) => {
                      const status = getStatusParams(req);
                      const startDate = new Date(
                        request === "outing" ? req.fromTime : req.fromDay,
                      );
                      const endDate = new Date(
                        request === "outing" ? req.toTime : req.toDay,
                      );

                      let durationText = "";
                      if (request === "outing") {
                        durationText = req.hours ? `${req.hours}hr` : "";
                        if (!durationText) {
                          const diff = endDate.getTime() - startDate.getTime();
                          const h = Math.ceil(diff / (1000 * 60 * 60));
                          durationText = `${h}hr`;
                        }
                      } else {
                        durationText = req.days ? `${req.days}d` : "";
                        if (!durationText) {
                          const diff = endDate.getTime() - startDate.getTime();
                          const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          durationText = `${d}d`;
                        }
                      }

                      const dateStr = startDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      });
                      const timeRange =
                        request === "outing"
                          ? `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

                      return (
                        <tr
                          key={req._id}
                          className="hover:bg-slate-50/30 transition-all group"
                        >
                          <td className="px-8 py-5 text-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all duration-300">
                                {request === "outing" ? (
                                  <Clock size={16} />
                                ) : (
                                  <Calendar size={16} />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <p className="font-bold text-slate-900 tracking-tight leading-none mb-1.5 capitalize text-[15px]">
                                  {request} Protocol
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                                  ID:{" "}
                                  {req._id?.slice(-8).toUpperCase() || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[14px] font-bold text-slate-800 tracking-tight">
                                {timeRange}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  {dateStr}
                                </span>
                                <span className="px-1.5 py-0.5 bg-navy-900 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                                  {durationText}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p
                              className="text-[13px] font-medium text-slate-500 italic line-clamp-1 max-w-[200px]"
                              title={req.reason}
                            >
                              "{req.reason}"
                            </p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-current opacity-80 ${status.color.includes("bg-navy-900") ? "text-navy-900 bg-navy-50 border-navy-100" : status.color.includes("bg-white border border-red-50") ? "text-red-500 bg-red-50 border-red-100" : "text-slate-400 bg-slate-50 border-slate-100"}`}
                            >
                              {status.label}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {requests.map((req: any) => {
                const status = getStatusParams(req);
                const startDate = new Date(
                  request === "outing" ? req.fromTime : req.fromDay,
                );
                const endDate = new Date(
                  request === "outing" ? req.toTime : req.toDay,
                );

                let durationText = "";
                if (request === "outing") {
                  const diff = endDate.getTime() - startDate.getTime();
                  const h = Math.ceil(diff / (1000 * 60 * 60));
                  durationText = `${h}hr`;
                } else {
                  const diff = endDate.getTime() - startDate.getTime();
                  const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  durationText = `${d}d`;
                }

                const dateStr = startDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const timeRange =
                  request === "outing"
                    ? `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

                return (
                  <div
                    key={req._id}
                    className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm active:scale-[0.99] transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
                          {request === "outing" ? (
                            <Clock size={18} />
                          ) : (
                            <Calendar size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 capitalize text-[15px] tracking-tight">
                            {request} Protocol
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ID: {req._id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-current ${status.color.includes("bg-navy-900") ? "text-navy-900 bg-navy-50 border-navy-100" : status.color.includes("bg-white border border-red-50") ? "text-red-500 bg-red-50 border-red-100" : "text-slate-400 bg-slate-50 border-slate-100"}`}
                      >
                        {status.label}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-50">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                            Interval Period
                          </p>
                          <p className="text-[14px] font-bold text-slate-800 tracking-tight">
                            {timeRange}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">
                            {dateStr}
                          </p>
                          <span className="px-2 py-0.5 bg-navy-900 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                            {durationText}
                          </span>
                        </div>
                      </div>

                      {req.reason && (
                        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-50">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                            Reason Statement
                          </p>
                          <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed">
                            "{req.reason}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
