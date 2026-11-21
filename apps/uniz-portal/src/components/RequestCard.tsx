import { calculateDuration, formatDuration } from "../utils/timeUtils";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
  const tone = isApproved ? "success" : isRejected ? "error" : "warning";
  const label = isApproved ? "Approved" : isRejected ? "Rejected" : "Pending";

  const when =
    type === "outing"
      ? `${request.from_time} – ${request.to_time}`
      : `${new Date(request.from_day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(request.to_day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  const duration = formatDuration(
    calculateDuration(
      type === "outing" ? request.from_time : request.from_day,
      type === "outing" ? request.to_time : request.to_day,
    ),
  );

  return (
    <article className="border-b border-border py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-body font-medium capitalize text-head">{type}</h3>
          <p className="mt-1 font-sans text-small tabular-nums text-text-2">
            {request._id.slice(-8).toUpperCase()} ·{" "}
            {new Date(request.requested_time).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      {isPending && request.current_level ? (
        <p className="mt-2 text-small text-text-2">
          Pending at {request.current_level.replace(/_/g, " ")}
        </p>
      ) : null}

      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-dense font-medium text-text-2">Reason</dt>
          <dd className="mt-1 text-body text-head">{request.reason}</dd>
        </div>
        <div>
          <dt className="text-dense font-medium text-text-2">
            {type === "outing" ? "Time" : "Dates"}
          </dt>
          <dd className="mt-1 font-sans text-body tabular-nums text-head">{when}</dd>
        </div>
        <div>
          <dt className="text-dense font-medium text-text-2">Duration</dt>
          <dd className="mt-1 font-sans text-body tabular-nums text-head">{duration}</dd>
        </div>
      </dl>

      {isRejected && request.message ? (
        <div className="mt-3">
          <Alert tone="error" title="Rejection">{request.message}</Alert>
        </div>
      ) : null}

      {request.approval_logs && request.approval_logs.length > 0 ? (
        <div className="mt-4">
          <p className="text-dense font-medium text-text-2">Activity</p>
          <ul className="mt-2 space-y-2">
            {request.approval_logs.map((log: any, i: number) => (
              <li key={i} className="text-small">
                <span
                  className={cn(
                    "font-medium capitalize",
                    log.action === "approve" && "text-success",
                    log.action === "reject" && "text-error",
                    log.action !== "approve" && log.action !== "reject" && "text-text-2",
                  )}
                >
                  {log.action}
                </span>{" "}
                <span className="text-text">by {log.role}</span>
                <span className="mt-0.5 block font-sans tabular-nums text-text-2">
                  {new Date(log.time).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
