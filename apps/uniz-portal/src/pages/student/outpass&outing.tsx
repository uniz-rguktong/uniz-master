import { useRecoilValue } from "recoil";
import { student } from "../../store";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { STUDENT_HISTORY } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";

import {
  Clock,
  Calendar,
  AlertCircle,
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
    <div className="flex justify-center items-center w-full md:w-auto mt-4 md:mt-0">
      <button
        onClick={() => navigateTo(`/student/${request}/request${request}`)}
        className="uniz-primary-btn w-full md:w-auto px-6 h-[48px]"
      >
        <Plus className="w-4 h-4" />
        <span>New {request.charAt(0).toUpperCase() + request.slice(1)}</span>
      </button>
    </div>
  );
}

export default function Outpass_Outing({ request }: requestProps) {
  const Student = useRecoilValue(student);
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
        color: "bg-blue-600 text-white shadow-lg shadow-blue-50",
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
    <div className="max-w-7xl mx-auto px-4 md:px-10 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mb-8 mt-2 md:mt-6">
        <div className="flex-1 text-center md:text-left">
          <p className="text-lg md:text-xl font-medium text-slate-400 mb-1">
            Permission Records
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-3">
            {request === "outing" ? "Outing" : "Outpass"} Logs
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-100/50 shadow-sm transition-all animate-in fade-in slide-in-from-left-2">
                <Clock className="w-3 h-3 animate-pulse" />
                {pendingCount} Pending
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 mb-1">
          <OutButton request={request} />
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 transition-all">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="text-blue-600 flex-shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-0.5">
              <p className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Notification Channel
              </p>
              <p className="text-slate-500 font-medium text-[14px]">
                Updates for all requests are sent to{" "}
                <span className="text-blue-600 font-black">
                  {Student?.email}
                </span>
              </p>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Status Sync: Real-time
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/20 rounded-[3rem] border border-slate-100 border-dashed">
            <div className="mx-auto h-24 w-24 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100/50 shadow-sm">
              <Clock className="h-10 w-10 text-slate-100" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">
              No History Found
            </h3>
            <p className="text-slate-400 font-bold text-sm max-w-[280px] mx-auto opacity-80 tracking-tight leading-relaxed">
              Your past {request} requests will be archived here once you start.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
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
                  <div
                    key={req._id}
                    className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-blue-100 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-600 group-hover:scale-110 transition-all duration-300">
                          {request === "outing" ? (
                            <Clock className="w-6 h-6" />
                          ) : (
                            <Calendar className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-base leading-tight tracking-tight">
                            {request === "outing" ? "Outing" : "Outpass"}
                          </h5>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5 opacity-70">
                            <span>ID: {req.studentId?.slice(-6) || "N/A"}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-200"></span>
                            <span>{dateStr}</span>
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                            Period
                          </p>
                          <p className="font-bold text-slate-700 text-[13px] tracking-tight truncate">
                            {timeRange}
                          </p>
                        </div>
                        {durationText && (
                          <div className="text-right border-l border-slate-100 pl-3 min-w-[50px]">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                              Net
                            </p>
                            <p className="font-black text-blue-600 text-sm tracking-tighter uppercase">
                              {durationText}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="px-0.5">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                          Reason
                        </p>
                        <p className="text-sm font-medium text-slate-500 line-clamp-1 italic px-1">
                          "{req.reason}"
                        </p>
                      </div>
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
