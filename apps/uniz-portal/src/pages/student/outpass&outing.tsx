import { useRecoilValue } from "recoil";
import { student } from "../../store";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

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
        className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
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
      const token = localStorage
        .getItem("student_token")
        ?.replace(/^"|"$/g, "");
      if (!token) return;

      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      // Using the prescribed URL
      const response = await fetch(
        "https://api.uniz.rguktong.in/api/v1/requests/history",
        requestOptions,
      );
      const result = await response.json();

      if (result.success && Array.isArray(result.history)) {
        setHistory(result.history);
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
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    if (req.isRejected || req.is_rejected)
      return {
        label: "Rejected",
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-4 h-4" />,
      };
    if (req.isExpired || req.is_expired)
      return {
        label: "Expired",
        color: "bg-gray-100 text-gray-700",
        icon: <Clock className="w-4 h-4" />,
      };
    return {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
      icon: <Clock className="w-4 h-4 animate-pulse" />,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8 border border-neutral-200">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h4 className="text-3xl md:text-4xl font-black text-black tracking-tighter mb-2">
                {request === "outing" ? "Outing" : "Outpass"} Requests
              </h4>
              <p className="text-neutral-500 font-medium">
                Manage and track your permission requests
              </p>
            </div>
            <OutButton request={request} />
          </div>

          {pendingCount > 0 && (
            <div className="mb-6 flex items-center gap-3 bg-neutral-100 p-4 rounded-xl border border-neutral-200">
              <Clock className="w-5 h-5 text-black animate-pulse" />
              <span className="font-bold text-black text-sm uppercase tracking-wide">
                {pendingCount} Pending Request{pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-black text-white rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-sm text-neutral-600 space-y-2">
                <p className="font-bold text-black text-base">
                  Important Notes
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 marker:text-black">
                  <li>
                    Updates will be sent to{" "}
                    <span className="font-bold text-black">
                      {Student?.email}
                    </span>
                  </li>
                  <li>Check back regularly for status updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-neutral-100 border-dashed">
            <div className="mx-auto h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-neutral-300" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">
              No Requests Found
            </h3>
            <p className="text-neutral-500 font-medium">
              You haven't made any {request} requests yet.
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
                    className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-neutral-100 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                          {request === "outing" ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-black text-base leading-tight">
                            {request === "outing" ? "Outing" : "Outpass"}
                          </h5>
                          <p className="text-xs text-neutral-500 font-medium mt-0.5">
                            ID: {req.studentId?.slice(-6) || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                        <div className="flex-1">
                          <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-0.5">
                            Time Window
                          </p>
                          <p className="font-bold text-neutral-800 text-xs sm:text-sm">
                            {request === "outing" && (
                              <span className="mr-1.5 text-neutral-500">
                                {dateStr} •
                              </span>
                            )}
                            {timeRange}
                          </p>
                        </div>
                        {durationText && (
                          <div className="text-right border-l border-neutral-200 pl-2.5 min-w-[50px]">
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-0.5">
                              Dur.
                            </p>
                            <p className="font-bold text-black">
                              {durationText}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">
                          Reason
                        </p>
                        <p className="text-sm font-medium text-neutral-700 line-clamp-1">
                          {req.reason}
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
