"use client";
import { useState, useEffect } from "react";
import {
  Search,
  UserX,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Users,
  RefreshCw,
  AlertCircle,
  Calendar,
  Download,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { updateRegistrationStatus } from "@/actions/registrationActions";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MetricCard } from "@/components/MetricCard";
import { Modal } from "@/components/Modal";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WaitlistManagementPageProps {
  initialData?: Array<Record<string, any>>;
  initialEvents?: Array<Record<string, any>>;
}

export function WaitlistManagementPage({
  initialData = [],
  initialEvents = [],
}: WaitlistManagementPageProps = {}) {
  const [data, setData] = useState(initialData);
  const [events] = useState(initialEvents);
  const [filterEventId, setFilterEventId] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReleaseSeatsModal, setShowReleaseSeatsModal] = useState(false);
  const [registrationToProcess, setRegistrationToProcess] = useState<any>(null);
  const [seatsToRelease, setSeatsToRelease] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Filter registrations
  const filteredRegistrations = data.filter((reg: any) => {
    const matchesEvent =
      filterEventId === "all" || reg.eventId === filterEventId;
    const matchesPriority =
      filterPriority === "all" || reg.priority === filterPriority;
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesEvent && matchesPriority && matchesSearch;
  });

  // Calculate metrics
  const totalWaitlisted = data.length;
  const highPriorityCount = data.filter(
    (r: any) => r.priority === "high",
  ).length;
  const paidWaitlistCount = data.filter(
    (r: any) => r.paymentStatus === "paid",
  ).length;
  const uniqueEvents = new Set(data.map((r: any) => r.eventName)).size;

  const getPriorityBadge = (priority: any) => {
    const styles = {
      high: { bg: "#FEE2E2", text: "#991B1B", label: "High Priority" },
      medium: { bg: "#FEF3C7", text: "#92400E", label: "Medium Priority" },
      low: { bg: "#E0E7FF", text: "#3730A3", label: "Low Priority" },
    };
    const style = (styles as any)[priority] || styles.low;

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
    );
  };

  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleApproveClick = (id: any) => {
    setRegistrationToProcess(id);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (id: any) => {
    setRegistrationToProcess(id);
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = async () => {
    try {
      const result = await updateRegistrationStatus(
        registrationToProcess,
        "CONFIRMED",
        { paymentStatus: "PAID" },
      );
      if (result.success) {
        showToast("Student moved to confirmed registrations", "success");
        setData((prev) => prev.filter((r) => r.id !== registrationToProcess));
      } else {
        showToast(result.error || "Failed to approve registration", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
    setShowApproveDialog(false);
    setRegistrationToProcess(null);
  };

  const handleRejectConfirm = async () => {
    try {
      const result = await updateRegistrationStatus(
        registrationToProcess,
        "CANCELLED",
      );
      if (result.success) {
        showToast("Waitlist registration removed", "success");
        setData((prev) => prev.filter((r) => r.id !== registrationToProcess));
      } else {
        showToast(result.error || "Failed to remove registration", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
    setShowRejectDialog(false);
    setRegistrationToProcess(null);
  };

  const handleReleaseSeats = async () => {
    if (seatsToRelease < 1) {
      showToast("Please enter valid number of seats", "error");
      return;
    }

    if (filterEventId === "all") {
      showToast(
        "Please select a specific event from filters to release seats.",
        "warning",
      );
      setShowReleaseSeatsModal(false);
      return;
    }

    try {
      showToast("Processing request...", "info");

      // Dynamic import to avoid server/client issues
      const { releaseWaitlistSeats } =
        await import("@/actions/registrationActions");
      const result = await releaseWaitlistSeats(filterEventId, seatsToRelease);

      if (result.success) {
        showToast(`${result.count} seat(s) released successfully!`, "success");
        // Optimistic update could happen here, but revalidatePath usually handles it on next render.
        // For immediate feedback, we can filter out the top N items if we wanted to be fancy,
        // but a simple router reset or data refresh is safer.
        // Since we are using an initialData prop passed from server, we rely on standard Next.js revalidation.
        // But for client-side list, we might want to manually refresh or wait for server re-render.
      } else {
        showToast(result.error || "Failed to release seats", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An unexpected error occurred", "error");
    }

    setShowReleaseSeatsModal(false);
    setSeatsToRelease(1);
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Registrations</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">
            Waitlist Management
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Waitlist Management
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage students waiting for seat availability
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowReleaseSeatsModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4" />
              Release Seats
            </button>
            <button
              onClick={() => showToast("Exporting waitlist data...", "success")}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => (
              <MetricCardSkeleton key={i} />
            ))
          ) : (
            <>
              <div
                className="animate-card-entrance"
                style={{ animationDelay: "40ms" }}
              >
                <MetricCard
                  title="Total Waitlisted"
                  value={totalWaitlisted}
                  icon={UserX}
                  iconBgColor="#E0E7FF"
                  iconColor="#6366F1"
                  trend={{
                    value: "+2",
                    isPositive: true,
                    comparisonText: "vs yesterday",
                  }}
                  tooltip="Students currently in the waitlist"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "80ms" }}
              >
                <MetricCard
                  title="High Priority"
                  value={highPriorityCount}
                  icon={AlertCircle}
                  iconBgColor="#FEE2E2"
                  iconColor="#EF4444"
                  trend={{
                    value: "+1",
                    isPositive: true,
                    comparisonText: "vs yesterday",
                  }}
                  tooltip="Waitlisted students with critical priority status"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "120ms" }}
              >
                <MetricCard
                  title="Already Paid"
                  value={paidWaitlistCount}
                  icon={CheckCircle}
                  iconBgColor="#D1FAE5"
                  iconColor="#10B981"
                  trend={{
                    value: "+3",
                    isPositive: true,
                    comparisonText: "vs yesterday",
                  }}
                  tooltip="Waitlisted students who have already completed payment"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "160ms" }}
              >
                <MetricCard
                  title="Events Affected"
                  value={uniqueEvents}
                  icon={Calendar}
                  iconBgColor="#FEF3C7"
                  iconColor="#F59E0B"
                  trend={{
                    value: "0",
                    isPositive: true,
                    comparisonText: "vs yesterday",
                  }}
                  tooltip="Number of events currently at maximum capacity"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, roll number, registration ID, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <Select value={filterEventId} onValueChange={setFilterEventId}>
                <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => {
                  setFilterEventId("all");
                  setFilterPriority("all");
                  setSearchQuery("");
                  showToast("Filters reset", "success");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Content */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_: any, i: any) => (
            <div
              key={i}
              className="bg-[#F4F2F0] rounded-[16px] p-4 animate-pulse"
            >
              <Skeleton width="100%" height={200} borderRadius={16} />
            </div>
          ))
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] p-12 text-center">
              <UserX className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
              <p className="text-sm text-[#6B7280]">
                No waitlisted students found
              </p>
            </div>
          </div>
        ) : (
          filteredRegistrations.map((registration: any, index: any) => (
            <div
              key={registration.id}
              className="bg-[#F4F2F0] rounded-[16px] p-2.5 animate-card-entrance"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              {/* Top Section: Student Info */}
              <div className="px-3 my-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mr-1">
                    {registration.studentName}
                  </h3>
                  <span className="px-2 py-0.5 bg-[#E0E7FF] text-[#6366F1] text-xs font-medium rounded whitespace-nowrap">
                    {registration.registrationId}
                  </span>
                  {getPriorityBadge(registration.priority)}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B7280] mb-3">
                  <span className="font-medium text-[#4B5563]">
                    {registration.rollNumber}
                  </span>
                  <span className="text-[#9CA3AF] hidden sm:inline">•</span>
                  <span>{registration.year}</span>
                  <span className="text-[#9CA3AF] hidden sm:inline">•</span>
                  <span>{registration.department}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[#6B7280]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{registration.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{registration.phone}</span>
                  </div>
                </div>
              </div>

              {/* Inner White Card */}
              <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Waitlist Position Indicator */}
                  <div className="shrink-0 w-full sm:w-auto flex justify-center sm:block">
                    <div className="w-20 h-20 bg-linear-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex flex-col items-center justify-center text-white">
                      <div className="text-2xl font-bold">
                        #{registration.waitlistPosition}
                      </div>
                      <div className="text-xs opacity-80">
                        of {registration.totalWaitlist}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Event</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {registration.eventName}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {registration.eventType}
                        </div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">
                          Capacity Status
                        </div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {registration.seatsAvailable}/
                          {registration.maxCapacity}
                        </div>
                        <div className="text-xs text-[#EF4444]">Full</div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">
                          Registration Date
                        </div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {new Date(
                            registration.registrationDate,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">
                          Payment Status
                        </div>
                        {registration.paymentAmount ? (
                          <div>
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              ₹{registration.paymentAmount}
                            </div>
                            <div
                              className={`text-xs ${registration.paymentStatus === "paid" ? "text-[#10B981]" : "text-[#F59E0B]"}`}
                            >
                              {registration.paymentStatus}
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium text-sm text-[#6B7280]">
                            Free Event
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Information */}
                    {registration.teamName && (
                      <div className="bg-[#E0F2FE] border border-[#BAE6FD] rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-[#0369A1]" />
                          <span className="font-medium text-[#0369A1]">
                            Team: {registration.teamName}
                          </span>
                          <span className="text-[#0369A1]">
                            ({registration.teamSize} members)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleViewDetails(registration)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      <button
                        onClick={() => handleApproveClick(registration.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Registration
                      </button>
                      <button
                        onClick={() => handleRejectClick(registration.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Waitlist Details"
        confirmText="Approve Registration"
        onConfirm={() => {
          setShowDetailsModal(false);
          handleApproveClick(selectedRegistration.id);
        }}
        size="lg"
        tooltipText="Detailed view of the student's waitlist position and registration status."
      >
        {selectedRegistration && (
          <div className="space-y-6">
            <div className="bg-linear-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl p-6 text-white text-center">
              <div className="text-sm mb-1 opacity-90 font-medium">
                Waitlist Position
              </div>
              <div className="text-5xl font-bold">
                #{selectedRegistration.waitlistPosition}
              </div>
              <div className="text-sm mt-1 opacity-90">
                of {selectedRegistration.totalWaitlist} total
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">
                  Student / Roll
                </div>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.studentName} (
                  {selectedRegistration.rollNumber})
                </div>
              </div>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">
                  Priority / Dept
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedRegistration.priority)}
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {selectedRegistration.department}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Event Status
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Event Name
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.eventName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Capacity Status
                    </div>
                    <div className="text-sm font-medium text-[#EF4444]">
                      Full ({selectedRegistration.maxCapacity} Seats)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Release Seats Modal */}
      <Modal
        isOpen={showReleaseSeatsModal}
        onClose={() => {
          setShowReleaseSeatsModal(false);
          setSeatsToRelease(1);
        }}
        title="Release Seats"
        confirmText="Release Seats"
        onConfirm={handleReleaseSeats}
        confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
        tooltipText="Release seats to the top students in the waitlist. They will be notified automatically."
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Enter the number of seats to release. Top priority students from the
            waitlist will be alerted and moved to confirmed status.
          </p>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Number of Seats
            </label>
            <input
              type="number"
              min="1"
              value={seatsToRelease}
              onChange={(e) => setSeatsToRelease(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation Dialog */}
      {showApproveDialog && (
        <ConfirmDialog
          title="Approve Waitlist Registration"
          message="Are you sure you want to approve this waitlist registration? The student will be moved to confirmed registrations and notified immediately."
          confirmLabel="Approve"
          cancelLabel="Cancel"
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApproveDialog(false)}
          variant="success"
        />
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && (
        <ConfirmDialog
          title="Remove from Waitlist"
          message="Are you sure you want to remove this student from the waitlist? They will be notified about the removal."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectDialog(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
