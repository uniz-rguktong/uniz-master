// import { useRecoilValue } from "recoil";
// import { student } from "../../store";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { STUDENT_HISTORY } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/Skeleton";

type requestProps = {
  request: "outing" | "outpass";
};

type StatusTone = "success" | "warning" | "error" | "neutral";

export function OutButton({ request }: requestProps) {
  const navigateTo = useNavigate();
  const label = request.charAt(0).toUpperCase() + request.slice(1);
  return (
    <Button
      type="button"
      variant="primary"
      onClick={() => navigateTo(`/student/${request}/request${request}`)}
    >
      New {label}
    </Button>
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

  const getStatusParams = (req: any): { label: string; tone: StatusTone } => {
    if (req.isApproved || req.is_approved)
      return { label: "Approved", tone: "success" };
    if (req.isRejected || req.is_rejected)
      return { label: "Rejected", tone: "error" };
    if (req.isExpired || req.is_expired)
      return { label: "Expired", tone: "neutral" };
    return { label: "Pending", tone: "warning" };
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const rows = requests.map((req: any) => {
    const status = getStatusParams(req);
    const startDate = new Date(request === "outing" ? req.fromTime : req.fromDay);
    const endDate = new Date(request === "outing" ? req.toTime : req.toDay);

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
      year: "numeric",
    });
    const timeRange =
      request === "outing"
        ? `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

    return {
      id: req._id,
      status,
      durationText,
      dateStr,
      timeRange,
      reason: req.reason,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PageHeader
        className="mb-0"
        title={request === "outing" ? "Outing history" : "Outpass history"}
        meta={
          pendingCount > 0 ? (
            <Badge tone="warning">
              {pendingCount} pending {pendingCount === 1 ? "request" : "requests"}
            </Badge>
          ) : (
            "Leave requests you have submitted"
          )
        }
        action={<OutButton request={request} />}
      />

      {/* Main Content */}
      {rows.length === 0 ? (
        <EmptyState
          title="No history found"
          body={`Your past ${request} requests will be archived here once you start.`}
        />
      ) : (
        <div>
          {rows.map((row) => (
            <article key={row.id} className="border-b border-border py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-body font-medium capitalize text-head">{request}</h3>
                  <p className="mt-1 font-sans text-small tabular-nums text-text-2">
                    {row.id?.slice(-8).toUpperCase() || "N/A"}
                  </p>
                </div>
                <Badge tone={row.status.tone}>{row.status.label}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-dense font-medium text-text-2">Period</dt>
                  <dd className="mt-1 font-sans text-body tabular-nums text-head">
                    {row.timeRange}
                  </dd>
                  <p className="font-sans text-small tabular-nums text-text-2">{row.dateStr}</p>
                </div>
                <div>
                  <dt className="text-dense font-medium text-text-2">Duration</dt>
                  <dd className="mt-1 font-sans text-body tabular-nums text-head">
                    {row.durationText}
                  </dd>
                </div>
                <div>
                  <dt className="text-dense font-medium text-text-2">Reason</dt>
                  <dd className="mt-1 text-body text-head">{row.reason}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
