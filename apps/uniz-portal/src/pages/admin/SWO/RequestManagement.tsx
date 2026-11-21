/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Ban,
  Search,
  Inbox,
  Loader2,
  Forward,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  GET_OUTING_REQUESTS,
  GET_OUTPASS_REQUESTS,
  APPROVE_OUTING,
  REJECT_OUTING,
  FORWARD_OUTING,
  APPROVE_OUTPASS,
  REJECT_OUTPASS,
  FORWARD_OUTPASS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminInputClass } from "@/components/admin/admin-ui";

interface RequestManagementProps {
  type: "outing" | "outpass";
}

export default function RequestManagement({ type }: RequestManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Use the parameters provided by the user in the snippet: page=1&limit=50
      const baseUrl =
        type === "outing" ? GET_OUTING_REQUESTS : GET_OUTPASS_REQUESTS;
      const url = `${baseUrl}?page=1&limit=50${searchQuery ? `&search=${searchQuery}` : ""}`;

      const data = await apiClient<any>(url);
      if (data && data.success) {
        const fetchedRequests =
          type === "outing" ? data.outings : data.outpasses;
        setRequests(fetchedRequests || []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [type]); // Fetching on type change. Server side search could be added to dependency but let's keep client search for smoothness unless explicitly asked for debounced server search.

  const handleAction = async (
    action: "approve" | "reject" | "forward",
    id: string,
  ) => {
    let message = "";
    if (action === "approve") {
      message =
        prompt("Enter approval message:", "Parent verified. Fine to go.") || "";
      if (message === "") return;
    } else if (action === "reject") {
      message =
        prompt("Enter rejection comment:", "Emergency not valid.") || "";
      if (message === "") return;
    }

    setActionLoading(id);
    try {
      let endpoint = "";
      if (type === "outing") {
        if (action === "approve") endpoint = APPROVE_OUTING(id);
        else if (action === "reject") endpoint = REJECT_OUTING(id);
        else endpoint = FORWARD_OUTING(id);
      } else {
        if (action === "approve") endpoint = APPROVE_OUTPASS(id);
        else if (action === "reject") endpoint = REJECT_OUTPASS(id);
        else endpoint = FORWARD_OUTPASS(id);
      }

      const body =
        action === "forward"
          ? { id }
          : action === "approve"
            ? { message }
            : { comment: message };

      const data = await apiClient<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data && data.success) {
        toast.success(data.msg || `Request ${action}ed successfully`);
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error(data?.msg || "Action failed");
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  // Local filter for instant responsiveness
  const filteredRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [requests, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-text animate-spin" />
        <p className="text-text-2 font-medium">
          Fetching pending applications...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 pb-20 sm:p-6">
      <PageHeader
        title={type === "outing" ? "Outing requests" : "Outpass requests"}
        meta={`Review and process pending ${type} requests for the student body.`}
      />
      <div className="relative max-w-[640px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
          size={16}
        />
        <input
          type="text"
          placeholder="Search student ID or name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(adminInputClass, "pl-11")}
        />
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="All clear"
          body={`No pending ${type} requests found. New applications will appear here.`}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="flex h-full flex-col rounded-lg border border-border bg-surface p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-dense font-medium text-head">{request.username}</h3>
                  <p className="mt-1 text-small text-text-2">{request.studentId || "No ID"}</p>
                </div>
                <Badge tone="warning">Pending</Badge>
              </div>

              {/* Content Divider */}
              <div className="h-px bg-surface-2 w-full mb-8" />

              <div className="flex-1 space-y-6">
                {/* Reason Section */}
                <div className="bg-surface-2/50 rounded-lg p-6 border border-border">
                  <span className="text-caption font-semibold text-text-3 block mb-3">
                    Reason
                  </span>
                  <p className="text-text font-semibold text-[15px] leading-relaxed italic">
                    "{request.reason || "No reason specified."}"
                  </p>
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <span className="text-caption font-semibold text-text-3 block">
                      From
                    </span>
                    <p
                      className="text-text font-semibold text-[13px] truncate"
                      title={request.from_time || request.from_day}
                    >
                      {request.from_time || request.from_day}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-caption font-semibold text-text-3 block">
                      To
                    </span>
                    <p
                      className="text-text font-semibold text-[13px] truncate"
                      title={request.to_time || request.to_day}
                    >
                      {request.to_time || request.to_day}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <span className="text-caption font-semibold text-text-3 block">
                      Duration
                    </span>
                    <p className="text-text font-semibold text-[13px]">
                      {request.duration || "0 seconds"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-caption font-semibold text-text-3 block text-right">
                      Submitted
                    </span>
                    <p className="text-text font-semibold text-[13px] text-right truncate">
                      {request.requested_time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider before actions */}
              <div className="h-px bg-surface-2 w-full my-8" />

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => handleAction("forward", request._id)}
                  disabled={!!actionLoading}
                >
                  <Forward size={16} />
                  Forward
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="compact"
                  onClick={() => handleAction("reject", request._id)}
                  disabled={!!actionLoading}
                >
                  <Ban size={16} />
                  Reject
                </Button>
                <Button
                  type="button"
                  size="compact"
                  onClick={() => handleAction("approve", request._id)}
                  disabled={!!actionLoading}
                  isLoading={actionLoading === request._id}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
