import { useRecoilValue, useSetRecoilState } from "recoil";
import { useGetOutings } from "../../hooks/getoutings";
import { useGetOutpasses } from "../../hooks/getoutpassess";
import { outings, outpasses } from "../../store";
import {
  APPROVE_OUTING,
  APPROVE_OUTPASS,
  REJECT_OUTING,
  REJECT_OUTPASS,
  FORWARD_OUTING,
  FORWARD_OUTPASS,
} from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsAuth } from "../../hooks/is_authenticated";
import {
  calculateDuration,
  formatDuration,
  formatRequestTime,
} from "../../utils/timeUtils";
import { toast } from "@/utils/toast-ref";
import { CheckCircle, Search, Ban, Forward, ArrowLeft } from "lucide-react";
import { Input } from "../../components/Input";
import { formatDisplayText } from "@/utils/displayText";
import { cn } from "../../utils/cn";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminCardClass, adminPageWrapClass } from "../../components/admin/admin-ui";

type ApproveProps = {
  type: "outing" | "outpass";
};

export default function ApproveComp({ type }: ApproveProps) {
  useIsAuth();
  useGetOutings();
  useGetOutpasses();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const Outings = useRecoilValue(outings) || [];
  const Outpasses = useRecoilValue(outpasses) || [];

  const setOutings = useSetRecoilState(outings);
  const setOutpasses = useSetRecoilState(outpasses);

  const requests = type === "outing" ? Outings : Outpasses;

  // Filter logic
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter(
      (item: any) =>
        !item.is_expired &&
        (item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.reason.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [requests, searchQuery]);

  const handleAction = async (
    action: "approve" | "reject" | "forward",
    id: string,
  ) => {
    let endpoint = "";
    const body: any = { id };

    if (action === "reject") {
      const reason = prompt(
        "Enter rejection reason:",
        "Rejected via Admin Console",
      );
      if (!reason) return;
      body.message = reason;
    }

    if (type === "outing") {
      if (action === "approve") endpoint = APPROVE_OUTING(id);
      else if (action === "reject") endpoint = REJECT_OUTING(id);
      else endpoint = FORWARD_OUTING(id);
    } else {
      if (action === "approve") endpoint = APPROVE_OUTPASS(id);
      else if (action === "reject") endpoint = REJECT_OUTPASS(id);
      else endpoint = FORWARD_OUTPASS(id);
    }

    setLoadingId(id);

    try {
      const data = await apiClient<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data && data.success) {
        toast.success(data.msg || "Action successful");

        // Optimistic UI Update
        const updateState = (prev: any[]) => {
          if (action === "forward")
            return prev.filter((item) => item._id !== id);

          return prev.map((item) => {
            if (item._id !== id) return item;
            return {
              ...item,
              is_approved: action === "approve",
              is_rejected: action === "reject",
              issued_by:
                action === "approve" ? "Administration" : item.issued_by,
              rejected_by:
                action === "reject" ? "Administration" : item.rejected_by,
              message: action === "reject" ? body.message : item.message,
            };
          });
        };

        if (type === "outing") setOutings(updateState);
        else setOutpasses(updateState);
      }
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    } finally {
      setLoadingId(null);
    }
  };

  const title = type === "outing" ? "Outing approvals" : "Outpass approvals";

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      <Button variant="ghost" size="compact" onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <PageHeader title={title} meta="Manage pending student requests" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Search by ID, Name or Reason..."
            value={searchQuery}
            onchangeFunction={(e: any) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Badge tone="neutral">{filteredRequests.length} Pending</Badge>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No pending requests found"
          body={`Good job! You've cleared the queue. Check back later for new ${type} requests.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredRequests.map((request: any) => (
            <div
              key={request._id}
              className={cn(
                adminCardClass,
                "flex flex-col p-6",
                request.is_approved && "border-success",
                request.is_rejected && "border-error",
              )}
            >
              <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-text">
                    {request.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-none text-text">
                      {request.username}
                    </h3>
                    <p className="mt-1 text-dense text-text-2">{request.email}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge
                    tone={
                      request.is_approved
                        ? "success"
                        : request.is_rejected
                          ? "error"
                          : "warning"
                    }
                  >
                    {request.is_approved
                      ? "Approved"
                      : request.is_rejected
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                  {!request.is_approved &&
                    !request.is_rejected &&
                    request.current_level && (
                      <Badge tone="neutral">
                        <Forward className="w-3 h-3" />{" "}
                        {formatDisplayText(request.current_level)}
                      </Badge>
                    )}
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <h4 className="mb-2 text-caption font-semibold text-text-3">Reason</h4>
                  <p className="text-dense font-medium leading-relaxed text-text">
                    "{request.reason}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-caption font-semibold text-text-3">From</p>
                    <p className="font-medium text-text">
                      {type === "outing" ? request.from_time : request.from_day}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-caption font-semibold text-text-3">To</p>
                    <p className="font-medium text-text">
                      {type === "outing" ? request.to_time : request.to_day}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-dense">
                  <div>
                    <span className="text-caption font-semibold text-text-3">Duration</span>
                    <br />
                    <span className="font-medium text-text">
                      {formatDuration(
                        calculateDuration(
                          type === "outing" ? request.from_time : request.from_day,
                          type === "outing" ? request.to_time : request.to_day,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-caption font-semibold text-text-3">Submitted</span>
                    <br />
                    <span className="font-medium text-text">
                      {formatRequestTime(request.requested_time)}
                    </span>
                  </div>
                </div>
              </div>

              {!request.is_approved &&
                !request.is_rejected &&
                !request.is_expired && (
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
                    <Button
                      variant="outline"
                      size="compact"
                      className="w-full"
                      onClick={() => handleAction("approve", request._id)}
                      isLoading={loadingId === request._id}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="compact"
                      className="w-full"
                      onClick={() => handleAction("reject", request._id)}
                      isLoading={loadingId === request._id}
                    >
                      <Ban className="w-4 h-4" />
                      Reject
                    </Button>
                    {request.current_level !== "dsw" &&
                      request.current_level !== "swo" && (
                        <Button
                          variant="outline"
                          size="compact"
                          className="w-full"
                          onClick={() => handleAction("forward", request._id)}
                          isLoading={loadingId === request._id}
                        >
                          <Forward className="w-4 h-4" />
                          Forward
                        </Button>
                      )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
