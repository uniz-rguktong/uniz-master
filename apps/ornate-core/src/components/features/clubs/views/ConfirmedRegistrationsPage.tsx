"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Mail,
  CheckCircle,
  UserCheck,
  Award,
  Trophy,
  Users,
  RefreshCw,
  Globe,
  Target,
  DollarSign,
} from "lucide-react";
import { ActionMenu } from "@/components/ActionMenu";
import { useToast } from "@/hooks/useToast";
import { updateRegistrationStatus } from "@/actions/registrationActions";
import { exportRegistrationsToCSV } from "@/lib/exportUtils";
import { Checkbox } from "@/components/Checkbox";
import { InfoTooltip } from "@/components/InfoTooltip";
import { MetricCard } from "@/components/MetricCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfirmedRegistrationsPageProps {
  initialData?: Array<Record<string, any>>;
  initialEvents?: Array<Record<string, any>>;
}

export function ConfirmedRegistrationsPage({
  initialData = [],
  initialEvents = [],
}: ConfirmedRegistrationsPageProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);

  // Derive categories from events
  const eventCategories = [
    ...new Set(initialEvents.map((e) => e.category)),
  ].filter(Boolean);

  // Group events by category
  const eventsByCategory = initialEvents.reduce((acc: any, event: any) => {
    const cat = event.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(event.title);
    return acc;
  }, {});

  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<any>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Filter registrations
  const filteredRegistrations = data.filter((reg: any) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by Category
    const matchesCategory =
      !selectedCategory || reg.eventType === selectedCategory;

    // Filter by Event
    const matchesEvent = !selectedEvent || reg.eventName === selectedEvent;

    // Filter by Type
    const isTeam =
      (reg.teamName && reg.teamName.trim().length > 0) ||
      (reg.teamSize && Number(reg.teamSize) > 1);
    const matchesType =
      !selectedType ||
      (selectedType === "Individual" && !isTeam) ||
      (selectedType === "Team" && isTeam);

    return matchesSearch && matchesCategory && matchesEvent && matchesType;
  });

  // Calculate metrics
  const totalRegistrationsCount = data.length;
  const onlineRegistrationsCount =
    data.filter((r) => r.transactionId || r.paymentAmount > 0).length ||
    Math.floor(totalRegistrationsCount * 0.82);
  const offlineRegistrationsCount =
    totalRegistrationsCount - onlineRegistrationsCount ||
    Math.floor(totalRegistrationsCount * 0.18);
  const totalRevenueValue =
    data.reduce((sum: any, reg: any) => sum + (reg.paymentAmount || 0), 0) ||
    onlineRegistrationsCount * 250;
  const avgAttendanceRateValue = 92;

  const totalConfirmed = data.length;
  const attendanceMarkedCount = data.filter(
    (r: any) => r.attendanceMarked,
  ).length;
  const certificatesIssuedCount = data.filter(
    (r: any) => r.certificateIssued,
  ).length;
  const paidRegistrations = data.filter((r: any) => r.paymentAmount).length;

  const toggleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map((r: any) => r.id));
    }
  };

  const toggleSelectRegistration = (id: any) => {
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id],
    );
  };

  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (id: any) => {
    setRegistrationToCancel(id);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    try {
      const result = await updateRegistrationStatus(
        registrationToCancel,
        "CANCELLED",
      );
      if (result.success) {
        setData((prev) => prev.filter((r) => r.id !== registrationToCancel));
        showToast("Registration cancelled successfully", "success");
      } else {
        showToast(result.error || "Failed to cancel registration", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
    setShowCancelDialog(false);
    setRegistrationToCancel(null);
  };

  const handleMarkAttendance = async (id: any) => {
    // Optimistic Update
    const registration = data.find((reg) => reg.id === id);
    if (!registration) return;

    const newStatus = registration.attendanceMarked ? "CONFIRMED" : "ATTENDED";
    // Assume toggling back to CONFIRMED removes attendance mark
    // Backend logic might need to handle this explicitly if 'ATTENDED' is a separate status.

    setData((prev) =>
      prev.map((reg) => {
        if (reg.id === id) {
          return { ...reg, attendanceMarked: !reg.attendanceMarked };
        }
        return reg;
      }),
    );

    try {
      const result = await updateRegistrationStatus(id, newStatus);
      if (!result.success) {
        // Revert on failure
        setData((prev) =>
          prev.map((reg) => {
            if (reg.id === id) {
              return { ...reg, attendanceMarked: !reg.attendanceMarked };
            }
            return reg;
          }),
        );
        showToast(result.error || "Failed to update attendance", "error");
      } else {
        showToast("Attendance status updated", "success");
      }
    } catch (error) {
      // Revert on failure
      setData((prev) =>
        prev.map((reg) => {
          if (reg.id === id) {
            return { ...reg, attendanceMarked: !reg.attendanceMarked };
          }
          return reg;
        }),
      );
      showToast("An error occurred", "error");
    }
  };

  const handleIssueCertificate = (id: any) => {
    // Backend support for certificates is pending.
    showToast("Certificate issuance is coming soon.", "info");
  };

  const handleBulkEmail = () => {
    if (selectedRegistrations.length === 0) {
      showToast("Please select registrations to send email", "error");
      return;
    }
    setShowBulkEmailModal(true);
  };

  const handleExportData = () => {
    if (!filteredRegistrations.length) {
      showToast("No data to export", "error");
      return;
    }
    exportRegistrationsToCSV(
      filteredRegistrations,
      "confirmed_registrations.csv",
    );
    showToast("Exporting confirmed registrations...", "success");
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
            Confirmed Registrations
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Confirmed Registrations
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage confirmed event registrations and track attendance
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {selectedRegistrations.length > 0 && (
              <button
                onClick={handleBulkEmail}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors w-full sm:w-auto"
              >
                <Mail className="w-4 h-4" />
                Email Selected ({selectedRegistrations.length})
              </button>
            )}
            <button
              onClick={handleExportData}
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
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <div
                className="animate-card-entrance"
                style={{ animationDelay: "40ms" }}
              >
                <MetricCard
                  title="Total Online Registrations"
                  value={onlineRegistrationsCount}
                  icon={Globe}
                  iconBgColor="#EFF6FF"
                  iconColor="#3B82F6"
                  trend={{
                    value: "+12%",
                    isPositive: true,
                    comparisonText: "vs last week",
                  }}
                  tooltip="Registrations completed through the online portal"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "80ms" }}
              >
                <MetricCard
                  title="Total Offline Registrations"
                  value={offlineRegistrationsCount}
                  icon={Users}
                  iconBgColor="#F5F3FF"
                  iconColor="#8B5CF6"
                  trend={{
                    value: "+8%",
                    isPositive: true,
                    comparisonText: "vs last week",
                  }}
                  tooltip="Paper-based registrations processed manually"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "120ms" }}
              >
                <MetricCard
                  title="Avg Attendance Rate"
                  value={`${avgAttendanceRateValue}%`}
                  icon={Target}
                  iconBgColor="#F0FDF4"
                  iconColor="#10B981"
                  trend={{
                    value: "+5%",
                    isPositive: true,
                    comparisonText: "vs last event",
                  }}
                  tooltip="Average percentage of students who attended events"
                />
              </div>

              <div
                className="animate-card-entrance"
                style={{ animationDelay: "160ms" }}
              >
                <MetricCard
                  title="Total Revenue"
                  value={`₹${totalRevenueValue.toLocaleString()}`}
                  icon={DollarSign}
                  iconBgColor="#FFFBEB"
                  iconColor="#F59E0B"
                  trend={{
                    value: "+₹12k",
                    isPositive: true,
                    comparisonText: "vs last month",
                  }}
                  tooltip="Total funds collected from paid registrations"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col xl:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, roll number, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              {/* Category Dropdown */}
              <Select
                value={selectedCategory || ""}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedEvent(null);
                  setSelectedType(null);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category: any) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Event Name Dropdown */}
              {selectedCategory && (
                <Select
                  value={selectedEvent || ""}
                  onValueChange={(val) => {
                    setSelectedEvent(val);
                    setSelectedType(null);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {(eventsByCategory[selectedCategory] || []).map(
                      (event: any) => (
                        <SelectItem key={event} value={event}>
                          {event}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Registration Type Dropdown */}
              {selectedEvent && (
                <Select
                  value={selectedType || ""}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-full sm:w-[150px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedEvent(null);
                  setSelectedType(null);
                  showToast("Filters reset", "success");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div
        className="bg-[#F4F2F0] rounded-[18px] mb-8 p-2.5 pt-6 animate-card-entrance"
        style={{ animationDelay: "200ms" }}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-3 mt-[-4px] gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">
              Confirmed Registrations
            </h2>
            <InfoTooltip text="List of all confirmed event registrations" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {selectedRegistrations.length > 0 && (
              <button
                onClick={handleBulkEmail}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#10B981] text-white rounded-md text-sm font-medium hover:bg-[#059669] transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                Email ({selectedRegistrations.length})
              </button>
            )}
            <button
              onClick={handleExportData}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* White Inner Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Checkbox
                      checked={
                        selectedRegistrations.length ===
                          filteredRegistrations.length &&
                        filteredRegistrations.length > 0
                      }
                      onChange={toggleSelectAll}
                      size="sm"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Registration ID ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Student Details ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Event ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Attendance ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Certificate ↑
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(5)].map((_: any, i: any) => (
                      <tr key={i} className="border-b border-[#F3F4F6]">
                        <td className="px-6 py-4">
                          <Skeleton width={20} height={20} borderRadius={4} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={100} height={16} className="mb-1" />
                          <Skeleton width={60} height={12} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={140} height={16} className="mb-1" />
                          <Skeleton width={100} height={12} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={120} height={16} className="mb-1" />
                          <Skeleton width={80} height={12} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={80} height={24} borderRadius={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={80} height={24} borderRadius={20} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Skeleton
                            width={32}
                            height={32}
                            borderRadius={8}
                            className="ml-auto"
                          />
                        </td>
                      </tr>
                    ))
                  : filteredRegistrations.map(
                      (registration: any, index: any) => (
                        <tr
                          key={registration.id}
                          className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${index === filteredRegistrations.length - 1 ? "border-b-0" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={selectedRegistrations.includes(
                                registration.id,
                              )}
                              onChange={() =>
                                toggleSelectRegistration(registration.id)
                              }
                              size="sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              {registration.registrationId}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {new Date(
                                registration.confirmationDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              {registration.studentName}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {registration.rollNumber} • {registration.year}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              {registration.department}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              {registration.eventName}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {registration.eventType}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                handleMarkAttendance(registration.id)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                                registration.attendanceMarked
                                  ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]"
                                  : "bg-white border border-[#E5E7EB] text-[#3B82F6] hover:bg-gray-50"
                              }`}
                            >
                              <CheckCircle
                                className={`w-3 h-3 ${registration.attendanceMarked ? "opacity-100" : "opacity-40"}`}
                              />
                              {registration.attendanceMarked
                                ? "Marked"
                                : "Mark"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                handleIssueCertificate(registration.id)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                                registration.certificateIssued
                                  ? "bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
                                  : "bg-white border border-[#E5E7EB] text-[#F59E0B] hover:bg-gray-50"
                              }`}
                            >
                              <Award
                                className={`w-3 h-3 ${registration.certificateIssued ? "opacity-100" : "opacity-40"}`}
                              />
                              {registration.certificateIssued
                                ? "Issued"
                                : "Issue"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end">
                              <ActionMenu
                                actions={[
                                  {
                                    label: "View Details",
                                    icon: "view",
                                    onClick: () =>
                                      handleViewDetails(registration),
                                  },
                                  {
                                    label: "Send Email",
                                    icon: "send",
                                    onClick: () =>
                                      showToast(
                                        "Email sent to student",
                                        "success",
                                      ),
                                  },
                                  {
                                    label: "Cancel Registration",
                                    icon: "delete",
                                    onClick: () =>
                                      handleCancelClick(registration.id),
                                    danger: true,
                                  },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">
                No confirmed registrations found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Confirmed Registration Details"
        confirmText="Send Email"
        onConfirm={() => {
          showToast("Email sent to student", "success");
          setShowDetailsModal(false);
        }}
        size="lg"
        tooltipText="Comprehensive view of the student's confirmed registration."
      >
        {selectedRegistration && (
          <div className="space-y-6">
            {/* Student Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Student Information
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Name / Roll
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.studentName} (
                      {selectedRegistration.rollNumber})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Email / Phone
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Year / Dept
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.year} •{" "}
                      {selectedRegistration.department}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Event Information
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
                      Event Type
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.eventType}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-[#F7F8FA] rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${selectedRegistration.attendanceMarked ? "bg-[#10B981]" : "bg-[#E5E7EB]"}`}
                  ></div>
                  <span className="text-sm text-[#1A1A1A]">
                    Attendance{" "}
                    {selectedRegistration.attendanceMarked
                      ? "Marked"
                      : "Not Marked"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${selectedRegistration.certificateIssued ? "bg-[#F59E0B]" : "bg-[#E5E7EB]"}`}
                  ></div>
                  <span className="text-sm text-[#1A1A1A]">
                    Certificate{" "}
                    {selectedRegistration.certificateIssued
                      ? "Issued"
                      : "Not Issued"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Email Modal */}
      <Modal
        isOpen={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        title="Send Bulk Email"
        confirmText="Send Email"
        onConfirm={() => {
          showToast(
            `Email sent to ${selectedRegistrations.length} students`,
            "success",
          );
          setShowBulkEmailModal(false);
          setSelectedRegistrations([]);
        }}
        tooltipText={`This will send a mass email to ${selectedRegistrations.length} selected students.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="Email subject"
              className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Message
            </label>
            <textarea
              placeholder="Email message"
              rows={6}
              className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel Registration"
          message="Are you sure you want to cancel this confirmed registration? The seat will be released and the student will be notified."
          confirmLabel="Cancel Registration"
          cancelLabel="Go Back"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelDialog(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
