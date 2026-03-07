"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Users,
  Clock,
  CheckCircle,
  Trash2,
  UserX,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
  Globe,
  Target,
  DollarSign,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ActionMenu } from "@/components/ActionMenu";
import { Checkbox } from "@/components/Checkbox";
import { MetricCard } from "@/components/MetricCard";
import { Modal } from "@/components/Modal";
import { ClientOnly } from "@/components/ClientOnly";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteRegistration,
  bulkDeleteRegistrations,
} from "@/actions/registrationActions";
import { deleteTeam, bulkUpdateTeamStatus } from "@/actions/teamActions";
import { exportRegistrationsToCSV, exportTeamsToCSV } from "@/lib/exportUtils";
import { getAllRegistrations } from "@/actions/registrationGetters";

export function AllRegistrationsPage({
  initialRegistrations = [],
  initialPagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
  initialTeamRegistrations = [],
  initialEvents = [],
  initialSearchQuery = "",
  initialStats = {
    totalOnlineRegistrations: 0,
    totalOfflineRegistrations: 0,
    totalRevenue: 0,
    avgAttendanceRate: 0,
  },
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [registrations, setRegistrations] =
    useState<any[]>(initialRegistrations);
  const [pagination, setPagination] = useState<any>(initialPagination);
  const [events] = useState<any[]>(initialEvents);

  const [currentPage, setCurrentPage] = useState(initialPagination.page || 1);
  const [selectedTeamRegistrations, setSelectedTeamRegistrations] = useState<
    any[]
  >([]);
  const ITEMS_PER_PAGE = 10;

  const [teamRegistrations, setTeamRegistrations] = useState<any[]>(
    initialTeamRegistrations,
  );

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // ... (keep existing team handlers)

  const handleViewTeamDetails = (team: any) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleDeleteTeam = async (id: any) => {
    if (confirm("Are you sure you want to delete this team registration?")) {
      const result = await deleteTeam(id);
      if (result.success) {
        setTeamRegistrations((prev) => prev.filter((t) => t.id !== id));
        showToast("Team registration deleted", "success");
      } else {
        showToast(result.error || "Failed to delete team", "error");
      }
    }
  };

  const handleTeamEmail = (teamName: any) => {
    showToast(`Email sent to captain of ${teamName}`, "success");
  };

  const handleBulkTeamStatus = async (status: any) => {
    if (
      confirm(
        `Are you sure you want to set status to ${status} for ${selectedTeamRegistrations.length} teams?`,
      )
    ) {
      const result = await bulkUpdateTeamStatus(
        selectedTeamRegistrations,
        status,
      );
      if (result.success) {
        setTeamRegistrations((prev) =>
          prev.map((t) =>
            selectedTeamRegistrations.includes(t.id)
              ? { ...t, status: status.toLowerCase() }
              : t,
          ),
        );
        setSelectedTeamRegistrations([]);
        showToast(`${result.count} teams updated`, "success");
      } else {
        showToast(result.error || "Failed to update teams", "error");
      }
    }
  };

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEventId, setFilterEventId] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchQuery);

  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data when filters/page change
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getAllRegistrations({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          status: filterStatus,
          eventId: filterEventId,
        });

        if (isMounted && result.success) {
          setRegistrations(result.data.registrations);
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }
        } else if (isMounted && result.error) {
          showToast(result.error, "error");
        }
      } catch (error) {
        console.error("Failed to fetch registrations", error);
        if (isMounted) showToast("Failed to load data", "error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Only fetch if meaningful change or if not initial load (optimization could be added here)
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, debouncedSearch, filterStatus, filterEventId]);

  // Reset to page 1 when filters change (except pagination itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterEventId]);

  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<any>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [sortField, setSortField] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const { showToast } = useToast();

  // No longer use client-side filtering for the main list
  const filteredRegistrations = registrations; // Server-side filtered
  // However, we might want to keep sorting client-side for the current page
  // Or implement server-side sorting. For consistency with pagination, client-side sorting only sorts current page.
  // We'll proceed with client-side sorting of the current page for now.

  // ... (keep sorting and select logic)

  // Sort registrations
  const sortedRegistrations = [...filteredRegistrations].sort(
    (a: any, b: any) => {
      if (!sortField) return 0;

      let aValue, bValue;

      switch (sortField) {
        case "id":
          aValue = a.registrationId;
          bValue = b.registrationId;
          break;
        case "student":
          aValue = a.studentName;
          bValue = b.studentName;
          break;
        case "event":
          aValue = a.eventName;
          bValue = b.eventName;
          break;
        case "date":
          aValue = new Date(a.registrationDate).getTime();
          bValue = new Date(b.registrationDate).getTime();
          break;
        case "payment":
          aValue = a.paymentAmount;
          bValue = b.paymentAmount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    },
  );

  // Sort handler
  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: any) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map((r: any) => r.id));
    }
  };

  const toggleSelectRegistration = (id: any) => {
    setSelectedRegistrations((prev) =>
      prev.includes(id)
        ? prev.filter((regId: any) => regId !== id)
        : [...prev, id],
    );
  };

  // Use stats from server for metrics
  const onlineRegistrationsCount = initialStats.totalOnlineRegistrations;
  const offlineRegistrationsCount = initialStats.totalOfflineRegistrations;
  const totalRevenueValue = initialStats.totalRevenue;
  const avgAttendanceRateValue = initialStats.avgAttendanceRate;

  // Placeholder counts if needed (not used in top cards)
  const confirmedCount = 0;
  const pendingCount = 0;
  const waitlistCount = 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> =
      {
        confirmed: { bg: "#D1FAE5", text: "#065F46", label: "Confirmed" },
        "pending-payment": {
          bg: "#FEF3C7",
          text: "#92400E",
          label: "Pending Payment",
        },
        "pending-requirements": {
          bg: "#FECACA",
          text: "#991B1B",
          label: "Pending Requirements",
        },
        waitlist: { bg: "#DBEAFE", text: "#1E40AF", label: "Waitlist" },
        rejected: { bg: "#F3F4F6", text: "#1F2937", label: "Rejected" },
      };
    const style: any = styles[status] || styles.rejected;

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

  const handleDeleteClick = (id: any) => {
    setRegistrationToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    const result = await deleteRegistration(registrationToDelete);
    if (result.success) {
      setRegistrations((prev) =>
        prev.filter((r: any) => r.id !== registrationToDelete),
      );
      showToast("Registration deleted successfully", "success");
    } else {
      showToast(result.error || "Failed to delete registration", "error");
    }
    setShowDeleteDialog(false);
    setRegistrationToDelete(null);
  };

  const handleExportData = () => {
    if (!filteredRegistrations.length) {
      showToast("No data to export", "error");
      return;
    }
    exportRegistrationsToCSV(filteredRegistrations, "all_registrations.csv");
    showToast("Exporting registration data...", "success");
  };

  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedRegistrations.length} registrations?`,
      )
    ) {
      const result = await bulkDeleteRegistrations(selectedRegistrations);
      if (result.success) {
        setRegistrations((prev) =>
          prev.filter((r: any) => !selectedRegistrations.includes(r.id)),
        );
        setSelectedRegistrations([]);
        showToast(
          `${selectedRegistrations.length} registrations deleted`,
          "success",
        );
      } else {
        showToast(result.error || "Failed to delete registrations", "error");
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredRegistrations.filter((r) =>
      selectedRegistrations.includes(r.id),
    );
    if (!selectedData.length) {
      showToast("No registrations selected", "error");
      return;
    }
    exportRegistrationsToCSV(
      selectedData,
      `selected_registrations_${selectedData.length}.csv`,
    );
    showToast(
      `Exporting ${selectedRegistrations.length} registrations...`,
      "success",
    );
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
            All Registrations
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              All Registrations
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage all event registrations across different statuses
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() =>
                showToast("Email notification system initialized", "info")
              }
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors w-full sm:w-auto"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
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
              <MetricCard
                title="Total Online Registrations"
                value={String(onlineRegistrationsCount)}
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

              <MetricCard
                title="Total Offline Registrations"
                value={String(offlineRegistrationsCount)}
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
              <ClientOnly
                fallback={
                  <>
                    <div className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg animate-pulse" />
                    <div className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg animate-pulse" />
                  </>
                }
              >
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending-payment">
                      Pending Payment
                    </SelectItem>
                    <SelectItem value="pending-requirements">
                      Pending Requirements
                    </SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>

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
              </ClientOnly>

              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterEventId("all");
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

      {/* Registrations Table */}
      <div
        className="bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] pt-[24px] pr-[10px] pb-[10px] pl-[10px] animate-card-entrance"
        style={{ animationDelay: "200ms" }}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[16px] px-[12px]  mt-[-4px]  gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide text-[14px]">
              All Individual Registrations
            </h2>
            <InfoTooltip text="Complete list of all event registrations" />
          </div>
          {selectedRegistrations.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-[#1A1A1A] font-medium bg-[#F3F4F6] px-2 py-1 rounded w-full sm:w-auto text-center">
                  {selectedRegistrations.length} selected
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() =>
                      showToast(
                        `Sending emails to ${selectedRegistrations.length} students...`,
                        "info",
                      )
                    }
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={handleBulkExport}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleExportData}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          )}
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
                  <th
                    onClick={() => handleSort("id")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Registration ID{getSortIndicator("id")}
                  </th>
                  <th
                    onClick={() => handleSort("student")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Student Details{getSortIndicator("student")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th
                    onClick={() => handleSort("event")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Event{getSortIndicator("event")}
                  </th>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Registration Date{getSortIndicator("date")}
                  </th>
                  <th
                    onClick={() => handleSort("payment")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Payment{getSortIndicator("payment")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Status{getSortIndicator("status")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(5)].map((_: any, i: any) => (
                      <tr
                        key={i}
                        className="border-b border-[#F3F4F6] animate-row-entrance"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <td className="px-6 py-4">
                          <Skeleton width={20} height={20} borderRadius={4} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={100} height={16} />
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
                          <Skeleton width={90} height={16} className="mb-1" />
                          <Skeleton width={60} height={12} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width={70} height={16} />
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
                  : sortedRegistrations.map((registration: any, index: any) => (
                      <tr
                        key={registration.id}
                        className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors row-hover-effect animate-row-entrance ${index === filteredRegistrations.length - 1 ? "border-b-0" : ""}`}
                        style={{ animationDelay: `${index * 60}ms` }}
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
                          <div className="text-sm text-[#1A1A1A]">
                            {new Date(
                              registration.registrationDate,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {new Date(
                              registration.registrationDate,
                            ).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {registration.paymentAmount ? (
                            <div>
                              <div className="font-medium text-sm text-[#1A1A1A]">
                                ₹{registration.paymentAmount}
                              </div>
                              <div className="text-xs text-[#6B7280]">
                                {registration.paymentStatus}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#6B7280]">Free</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(registration.status)}
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
                                  label: "Delete",
                                  icon: "delete",
                                  onClick: () =>
                                    handleDeleteClick(registration.id),
                                  danger: true,
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {/* Pagination Controls */}
          {registrations.length > 0 && (
            <div className="px-6 py-4 border-t border-[#F3F4F6] flex items-center justify-between bg-white">
              <div className="text-sm text-[#6B7280]">
                Showing{" "}
                <span className="font-medium text-[#1A1A1A]">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[#1A1A1A]">
                  {(currentPage - 1) * ITEMS_PER_PAGE + registrations.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#1A1A1A]">
                  {pagination.total > 0
                    ? pagination.total
                    : registrations.length}
                </span>{" "}
                results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {(() => {
                  const totalPages =
                    pagination.totalPages > 0
                      ? pagination.totalPages
                      : Math.ceil(pagination.total / ITEMS_PER_PAGE) || 1;
                  let pages = [];
                  if (totalPages <= 7) {
                    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  } else {
                    if (currentPage <= 4) {
                      pages = [1, 2, 3, 4, 5, "...", totalPages];
                    } else if (currentPage >= totalPages - 3) {
                      pages = [
                        1,
                        "...",
                        totalPages - 4,
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages,
                      ];
                    } else {
                      pages = [
                        1,
                        "...",
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                        "...",
                        totalPages,
                      ];
                    }
                  }

                  return pages.map((page: any, index: any) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-[#6B7280]"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? "bg-[#1A1A1A] text-white"
                            : "text-[#6B7280] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages || 1),
                    )
                  }
                  disabled={
                    currentPage >= (pagination.totalPages || 1) || isLoading
                  }
                  className="p-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">No registrations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Registrations Table */}
      <div
        className="mt-8 bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] pt-[24px] pr-[10px] pb-[10px] pl-[10px] animate-card-entrance"
        style={{ animationDelay: "300ms" }}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[16px] px-[12px]  mt-[-4px]  gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide text-[14px]">
              All Team Registrations
            </h2>
            <InfoTooltip text="List of all team-based event registrations" />
          </div>
          {selectedTeamRegistrations.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-[#1A1A1A] font-medium bg-[#F3F4F6] px-2 py-1 rounded w-full sm:w-auto text-center">
                  {selectedTeamRegistrations.length} selected
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleBulkTeamStatus("CONFIRMED")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkTeamStatus("REJECTED")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!teamRegistrations.length) {
                    showToast("No team data to export", "error");
                    return;
                  }
                  exportTeamsToCSV(
                    teamRegistrations,
                    "all_team_registrations.csv",
                  );
                  showToast("Exporting team data...", "success");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          )}
        </div>

        {/* White Inner Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={
                        selectedTeamRegistrations.length ===
                          teamRegistrations.length &&
                        teamRegistrations.length > 0
                      }
                      onChange={() => {
                        if (
                          selectedTeamRegistrations.length ===
                          teamRegistrations.length
                        ) {
                          setSelectedTeamRegistrations([]);
                        } else {
                          setSelectedTeamRegistrations(
                            teamRegistrations.map((r) => r.id),
                          );
                        }
                      }}
                      size="sm"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Team ID
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Captain Name
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamRegistrations.map((team: any, index: any) => (
                  <tr
                    key={team.id}
                    className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors last:border-b-0 animate-row-entrance"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedTeamRegistrations.includes(team.id)}
                        onChange={() => {
                          setSelectedTeamRegistrations((prev) =>
                            prev.includes(team.id)
                              ? prev.filter((id) => id !== team.id)
                              : [...prev, team.id],
                          );
                        }}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-[#1A1A1A]">
                        {team.teamId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-[#1A1A1A]">
                        {team.teamName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#1A1A1A]">
                        {team.captainName}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {team.captainEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#1A1A1A]">{team.event}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#1A1A1A]">
                        {new Date(team.registrationDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          ₹{team.paymentAmount}
                        </div>
                        <div className="text-xs text-[#6B7280] capitalize">
                          {team.paymentStatus}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(team.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ActionMenu
                          actions={[
                            {
                              label: "View Details",
                              icon: "view",
                              onClick: () => handleViewTeamDetails(team),
                            },
                            {
                              label: "Send Email",
                              icon: "send",
                              onClick: () => handleTeamEmail(team.teamName),
                            },
                            {
                              label: "Delete",
                              icon: "delete",
                              onClick: () => handleDeleteTeam(team.id),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Registration Details"
        confirmText="Send Email"
        onConfirm={() => {
          showToast("Email sent to student", "success");
          setShowDetailsModal(false);
        }}
        size="lg"
        tooltipText="Detailed view of student registration information."
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
                    <div className="text-xs text-[#6B7280] mb-1">Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.studentName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Roll Number
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.rollNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Email</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Phone</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Year</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.year}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Department
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
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
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Registration Date
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {new Date(
                        selectedRegistration.registrationDate,
                      ).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Status</div>
                    <div>{getStatusBadge(selectedRegistration.status)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {selectedRegistration.paymentAmount && (
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                  Payment Information
                </h4>
                <div className="bg-[#F7F8FA] rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Amount</div>
                      <div className="text-sm font-medium text-[#1A1A1A]">
                        ₹{selectedRegistration.paymentAmount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">
                        Payment Status
                      </div>
                      <div className="text-sm font-medium text-[#1A1A1A]">
                        {selectedRegistration.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Team Details Modal */}
      <Modal
        isOpen={showTeamModal && !!selectedTeam}
        onClose={() => setShowTeamModal(false)}
        title="Team Registration Details"
        confirmText="Send Email"
        onConfirm={() => {
          showToast(
            `Email sent to captain of ${selectedTeam.teamName}`,
            "success",
          );
          setShowTeamModal(false);
        }}
        size="lg"
        tooltipText="Detailed view of team registration."
      >
        {selectedTeam && (
          <div className="space-y-6">
            {/* Team Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Team Information
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Team Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.teamName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Team ID</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.teamId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Event</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.event}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Status</div>
                    <div>{getStatusBadge(selectedTeam.status)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Captain Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Captain Information
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.captainName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Email</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.captainEmail}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Phone</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.captainPhone}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {selectedTeam.members && (
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                  Team Members
                </h4>
                <div className="bg-[#F7F8FA] rounded-xl p-4">
                  <ul className="list-disc list-inside space-y-1">
                    {selectedTeam.members.map((member: any, idx: any) => (
                      <li key={idx} className="text-sm text-[#1A1A1A]">
                        {member}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Payment Information
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Amount</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      ₹{selectedTeam.paymentAmount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Payment Status
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A] capitalize">
                      {selectedTeam.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Registration"
          message="Are you sure you want to delete this registration? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
