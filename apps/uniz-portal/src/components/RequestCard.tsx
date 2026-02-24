import { calculateDuration, formatDuration } from "../utils/timeUtils";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  History,
} from "lucide-react";

export default function RequestCard({
  request,
  type,
}: {
  request: any;
  type: "outing" | "outpass";
}) {
  const isApproved = request.is_approved;
  const isRejected = request.is_rejected;
  const isPending = !isApproved && !isRejected;

  const StatusBadge = () => {
    if (isApproved)
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-lg shadow-blue-100 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5" /> Approved
        </span>
      );
    if (isRejected)
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white border border-red-50 text-red-600 uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white border border-slate-200 text-slate-800 uppercase tracking-wider">
        <AlertCircle className="w-3.5 h-3.5" /> Pending
      </span>
    );
  };

  return (
    <div className="group bg-white border border-slate-100 hover:border-blue-100 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 border-b border-slate-50 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            {type === "outing" ? (
              <Clock className="w-6 h-6" />
            ) : (
              <Calendar className="w-6 h-6" />
            )}
          </div>
          <div>
            <h4 className="font-black text-slate-900 capitalize text-lg tracking-tight">
              {type} Request
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                ID: {request._id.slice(-6).toUpperCase()}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span className="text-xs font-semibold text-slate-400">
                {new Date(request.requested_time).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge />
          {isPending && request.current_level && (
            <div className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-300 flex items-center gap-1.5">
              Pending at {request.current_level.replace(/_/g, " ")}{" "}
              <ArrowRight className="w-3 h-3 text-blue-600/50" />
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 text-[15px] mb-5">
        <div className="col-span-1 md:col-span-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">
            Reason for Leave
          </p>
          <p className="text-slate-800 font-bold leading-relaxed px-1">
            {request.reason}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">
            {type === "outing" ? "Time Window" : "Duration Period"}
          </p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {type === "outing"
              ? `${request.from_time} - ${request.to_time}`
              : `${new Date(request.from_day).toLocaleDateString()} - ${new Date(request.to_day).toLocaleDateString()}`}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">
            Total Breakdown
          </p>
          <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-wider border border-blue-100">
            {formatDuration(
              calculateDuration(
                type === "outing" ? request.from_time : request.from_day,
                type === "outing" ? request.to_time : request.to_day,
              ),
            )}
          </div>
        </div>

        {isRejected && request.message && (
          <div className="col-span-full p-5 bg-red-50/30 border border-red-100/50 rounded-2xl text-red-900 text-[14px]">
            <span className="font-black text-[10px] uppercase tracking-[0.2em] block mb-2 flex items-center gap-2 text-red-500">
              <XCircle className="w-3.5 h-3.5" /> Rejection Feedback
            </span>
            <p className="font-bold text-red-800/80">{request.message}</p>
          </div>
        )}
      </div>

      {/* Logs Accordion (Simplified) */}
      {request.approval_logs && request.approval_logs.length > 0 && (
        <div className="pt-5 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Activity Audit Log
            </span>
          </div>
          <div className="relative pl-4 space-y-4 border-l border-slate-100 ml-1.5">
            {request.approval_logs.map((log: any, i: number) => (
              <div key={i} className="text-[13px] relative group/log">
                <span
                  className={`absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-slate-100 transition-all duration-300 ${log.action === "approve"
                      ? "bg-blue-600"
                      : log.action === "reject"
                        ? "bg-red-500"
                        : "bg-slate-200"
                    }`}
                ></span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-slate-600 font-semibold group-hover/log:text-slate-900 transition-colors">
                    <span className={`font-black uppercase text-[11px] tracking-widest ${log.action === "approve" ? "text-blue-600" : log.action === "reject" ? "text-red-500" : "text-slate-400"
                      }`}>
                      {log.action}
                    </span>{" "}
                    by <span className="text-slate-900">{log.role}</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-tighter">
                    {new Date(log.time).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
