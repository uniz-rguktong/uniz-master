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
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-navy-50 text-navy-900 border-navy-100 uppercase tracking-widest">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    if (isRejected)
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-widest">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-widest">
        <AlertCircle className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className="group bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 md:p-6 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-slate-50 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-navy-900 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all duration-300">
            {type === "outing" ? <Clock size={18} /> : <Calendar size={18} />}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 capitalize text-[16px] tracking-tight">
              {type} Protocol Record
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                ID: {request._id.slice(-8).toUpperCase()}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span className="text-[11px] font-medium text-slate-400">
                {new Date(request.requested_time).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge />
          {isPending && request.current_level && (
            <div className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-300 flex items-center gap-1.5">
              Pending at {request.current_level.replace(/_/g, " ")}{" "}
              <ArrowRight className="w-3 h-3 text-navy-900/50" />
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10 text-[14px] mb-4">
        <div className="col-span-1 md:col-span-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Reason for Leave
          </p>
          <p className="text-slate-600 font-medium italic leading-relaxed px-1">
            "{request.reason}"
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            {type === "outing" ? "Time Window" : "Duration Period"}
          </p>
          <p className="text-lg font-semibold text-slate-900 tracking-tight">
            {type === "outing"
              ? `${request.from_time} - ${request.to_time}`
              : `${new Date(request.from_day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${new Date(request.to_day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Interval Net
          </p>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-navy-50 text-navy-900 font-bold text-[10px] uppercase tracking-wider border border-navy-100">
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
                  className={`absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-slate-100 transition-all duration-300 ${
                    log.action === "approve"
                      ? "bg-slate-900"
                      : log.action === "reject"
                        ? "bg-red-500"
                        : "bg-slate-200"
                  }`}
                ></span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-slate-600 font-semibold group-hover/log:text-slate-900 transition-colors">
                    <span
                      className={`font-black uppercase text-[11px] tracking-widest ${
                        log.action === "approve"
                          ? "text-navy-900"
                          : log.action === "reject"
                            ? "text-red-500"
                            : "text-slate-400"
                      }`}
                    >
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
