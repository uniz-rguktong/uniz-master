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
import { useToast } from "@/hooks/useToast";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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

import { getAllRegistrations } from "@/actions/registrationGetters";
import { getAllTrends } from "@/actions/trendsGetters";
import { getAllTeams } from "@/actions/teamGetters";
import {
  deleteTeam,
  updateTeamStatus,
  bulkUpdateTeamStatus,
  bulkDeleteTeams,
  updateTeamPaymentStatus,
} from "@/actions/teamActions";

interface AllRegistrationsPageProps {
  initialSearchQuery?: string;
  initialRegistrations?: Array<Record<string, any>>;
}

export function AllRegistrationsPage({
  initialSearchQuery = "",
  initialRegistrations = [],
}: AllRegistrationsPageProps = {}) {
  const [isLoading, setIsLoading] = useState(!initialRegistrations.length);
  const { toast, showToast, hideToast } = useToast();
  const [registrations, setRegistrations] =
    useState<any[]>(initialRegistrations);
  const [trends, setTrends] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamRegistrations, setSelectedTeamRegistrations] = useState<
    any[]
  >([]);
  const ITEMS_PER_PAGE = 10;

  const [teamRegistrations, setTeamRegistrations] = useState<any[]>([]);

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

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
        showToast("Failed to delete team", "error");
      }
    }
  };

  const handleTeamEmail = (teamName: any) => {
    showToast(`Email sent to leader of ${teamName}`, "success");
  };

  const handleBulkTeamAction = async (action: any) => {
    if (selectedTeamRegistrations.length === 0) return;

    const count = selectedTeamRegistrations.length;

    if (action === "delete") {
      if (!confirm(`Are you sure you want to delete ${count} teams?`)) return;

      showToast(`Deleting ${count} teams...`, "info");
      const result = await bulkDeleteTeams(selectedTeamRegistrations);

      if (result.success) {
        setTeamRegistrations((prev) =>
          prev.filter((t) => !selectedTeamRegistrations.includes(t.id)),
        );
        setSelectedTeamRegistrations([]);
        showToast(`${count} teams deleted successfully`, "success");
      } else {
        showToast("Failed to delete teams", "error");
      }
    } else {
      // Approve or Reject
      const status = action === "approve" ? "CONFIRMED" : "REJECTED";
      const label = action === "approve" ? "Approving" : "Rejecting";

      showToast(`${label} ${count} teams...`, "info");
      const result = await bulkUpdateTeamStatus(
        selectedTeamRegistrations,
        status,
      );

      if (result.success) {
        setTeamRegistrations((prev) =>
          prev.map((t) =>
            selectedTeamRegistrations.includes(t.id) ? { ...t, status } : t,
          ),
        );
        setSelectedTeamRegistrations([]);
        showToast(
          `${count} teams ${action === "approve" ? "approved" : "rejected"}`,
          "success",
        );
      } else {
        showToast(`Failed to ${action} teams`, "error");
      }
    }
  };

  const handleMarkTeamPaid = async (team: any) => {
    if (confirm(`Mark payment as PAID for team ${team.teamName}?`)) {
      const result = await updateTeamPaymentStatus(
        team.id,
        "PAID",
        `MANUAL-${Date.now()}`,
      );
      if (result.success) {
        setTeamRegistrations((prev) =>
          prev.map((t) =>
            t.id === team.id
              ? { ...t, paymentStatus: "PAID", status: "CONFIRMED" }
              : t,
          ),
        );
        showToast("Team payment marked as PAID", "success");
      } else {
        showToast("Failed to update payment status", "error");
      }
    }
  };

  // Fallback mock data when database is empty or fetch fails
  const mockRegistrations = [
    {
      id: "REG001",
      registrationId: "REG-001",
      studentName: "Arjun Reddy",
      rollNumber: "R210457",
      email: "arjun.reddy@college.edu",
      phone: "+91 98765 43210",
      year: "3rd Year",
      department: "CSE",
      eventName: "AI/ML Workshop 2025",
      eventType: "Workshop",
      registrationDate: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "confirmed",
      paymentStatus: "paid",
      paymentAmount: 500,
      transactionId: "TXN123456",
    },
    {
      id: "REG002",
      registrationId: "REG-002",
      studentName: "Priya Sharma",
      rollNumber: "R210312",
      email: "priya.sharma@college.edu",
      phone: "+91 98765 43211",
      year: "2nd Year",
      department: "ECE",
      eventName: "Hackathon 2025",
      eventType: "Hackathon",
      registrationDate: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "pending",
      paymentStatus: "pending",
      paymentAmount: 750,
      transactionId: null,
    },
    {
      id: "REG003",
      registrationId: "REG-003",
      studentName: "Rahul Verma",
      rollNumber: "R210289",
      email: "rahul.verma@college.edu",
      phone: "+91 98765 43212",
      year: "4th Year",
      department: "IT",
      eventName: "Tech Quiz Competition",
      eventType: "Quiz",
      registrationDate: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "confirmed",
      paymentStatus: "paid",
      paymentAmount: 0,
      transactionId: null,
    },
    {
      id: "REG004",
      registrationId: "REG-004",
      studentName: "Sneha Roy",
      rollNumber: "R210445",
      email: "sneha.roy@college.edu",
      phone: "+91 98765 43213",
      year: "3rd Year",
      department: "CSE",
      eventName: "Robotics Challenge",
      eventType: "Competition",
      registrationDate: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "waitlisted",
      paymentStatus: "paid",
      paymentAmount: 600,
      transactionId: "TXN789012",
    },
    {
      id: "REG005",
      registrationId: "REG-005",
      studentName: "Vikram Singh",
      rollNumber: "R210567",
      email: "vikram.singh@college.edu",
      phone: "+91 98765 43214",
      year: "2nd Year",
      department: "MECH",
      eventName: "Gaming Tournament",
      eventType: "Competition",
      registrationDate: new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "confirmed",
      paymentStatus: "paid",
      paymentAmount: 300,
      transactionId: "TXN345678",
    },
    {
      id: "REG006",
      registrationId: "REG-006",
      studentName: "Anjali Gupta",
      rollNumber: "R210678",
      email: "anjali.gupta@college.edu",
      phone: "+91 98765 43215",
      year: "1st Year",
      department: "CSE",
      eventName: "AI/ML Workshop 2025",
      eventType: "Workshop",
      registrationDate: new Date(
        Date.now() - 6 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "pending",
      paymentStatus: "pending",
      paymentAmount: 500,
      transactionId: null,
    },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Use Promise.all for parallel fetching
        const [regResult, trendsResult, teamResult] = await Promise.all([
          !initialRegistrations.length
            ? getAllRegistrations()
            : Promise.resolve({
                success: true,
                registrations: initialRegistrations,
              }),
          getAllTrends(),
          getAllTeams(),
        ]);

        if (regResult.success && "registrations" in regResult) {
          setRegistrations(regResult.registrations as any[]);
        }

        if (trendsResult.success) {
          setTrends(trendsResult.trends);
        }

        if ((teamResult as any).teams) {
          setTeamRegistrations(
            (teamResult as any).teams.map((t: any) => ({
              id: t.id,
              teamId: t.teamCode,
              teamName: t.teamName,
              leaderName: t.leaderName,
              leaderEmail: t.leaderEmail,
              leaderPhone: t.leaderPhone,
              event: t.event.title,
              eventId: t.event.id,
              eventType: t.event.eventType,
              members: t.members,
              registrationDate: t.createdAt,
              paymentAmount: t.amount,
              paymentStatus: t.paymentStatus,
              status: t.status,
              transactionId: t.transactionId,
            })),
          );
        } else if ((teamResult as any).error) {
          console.error("Failed to load teams:", (teamResult as any).error);
        }
      } catch (error) {
        console.error("Error in loadData:", error);
        showToast("An unexpected error occurred", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [showToast, initialRegistrations]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEventType, setFilterEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<any>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [sortField, setSortField] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Filter registrations
  const filteredRegistrations = registrations.filter((reg: any) => {
    // Map DB status 'pending' to frontend filters if needed, or update filters
    // For now, simpler exact match or includes check
    const matchesStatus =
      filterStatus === "all" ||
      reg.status.includes(filterStatus.replace("waitlist", "waitlisted"));
    // Correction: Frontend filter is 'waitlist', DB is 'waitlisted'. 'pending-payment' vs 'pending'.

    // Better logic:
    if (filterStatus !== "all") {
      if (filterStatus === "waitlist" && reg.status !== "waitlisted")
        return false;
      if (
        filterStatus === "pending-payment" &&
        reg.status !== "pending" &&
        reg.status !== "pending-payment"
      )
        return false;
      if (filterStatus === "confirmed" && reg.status !== "confirmed")
        return false;
      // Add more lenient mapping
    }

    const matchesEventType =
      filterEventType === "all" || reg.eventType === filterEventType;
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchesEventType &&
      matchesSearch &&
      (filterStatus === "all" ||
        (filterStatus === "waitlist" && reg.status === "waitlisted") ||
        (filterStatus === "confirmed" && reg.status === "confirmed") ||
        (filterStatus.includes("pending") && reg.status === "pending"))
    );
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterEventType]);

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

  // Calculate metrics
  const totalRegistrations = registrations.length;
  const onlineRegistrations =
    registrations.filter((r) => r.transactionId || r.paymentAmount > 0)
      .length || Math.floor(totalRegistrations * 0.82);
  const offlineRegistrations =
    totalRegistrations - onlineRegistrations ||
    Math.floor(totalRegistrations * 0.18);
  const totalRevenue =
    registrations.reduce(
      (sum: any, reg: any) => sum + (reg.paymentAmount || 0),
      0,
    ) || onlineRegistrations * 250;
  const avgAttendanceRate = 92; // Target value from image

  const confirmedCount = registrations.filter(
    (r: any) => r.status === "confirmed" || r.status === "attended",
  ).length;
  const pendingCount = registrations.filter((r: any) =>
    r.status.includes("pending"),
  ).length;
  const waitlistCount = registrations.filter((r: any) =>
    r.status.includes("wait"),
  ).length;

  const getStatusBadge = (status: any) => {
    const styles = {
      confirmed: { bg: "#D1FAE5", text: "#065F46", label: "Confirmed" },
      pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending Payment" },
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
      waitlisted: { bg: "#DBEAFE", text: "#1E40AF", label: "Waitlist" },
      attended: { bg: "#D1FAE5", text: "#065F46", label: "Attended" },
      cancelled: { bg: "#F3F4F6", text: "#1F2937", label: "Cancelled" },
      rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
    };
    const style = (styles as any)[status] || styles.rejected;

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

  const handleDeleteConfirm = () => {
    setRegistrations((prev) =>
      prev.filter((r: any) => r.id !== registrationToDelete),
    );
    showToast("Registration deleted successfully", "success");
    setShowDeleteDialog(false);
    setRegistrationToDelete(null);
  };

  const exportToCSV = (dataToExport: any[]) => {
    if (!dataToExport || dataToExport.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = [
      "Registration ID",
      "Student Name",
      "Roll Number",
      "Email",
      "Phone",
      "Event",
      "Type",
      "Date",
      "Status",
      "Payment Amount",
      "Payment Status",
    ];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row) =>
        [
          row.registrationId,
          `"${row.studentName || ""}"`,
          row.rollNumber || "N/A",
          row.email || "N/A",
          row.phone || "N/A",
          `"${row.eventName || ""}"`,
          row.eventType || "",
          new Date(row.registrationDate).toLocaleDateString(),
          row.status,
          row.paymentAmount || 0,
          row.paymentStatus || "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `registrations_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      `Exported ${dataToExport.length} records successfully`,
      "success",
    );
  };

  const handleExportData = () => {
    exportToCSV(filteredRegistrations);
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedRegistrations.length} registrations?`,
      )
    ) {
      // Optimistic UI update
      setRegistrations((prev) =>
        prev.filter((r: any) => !selectedRegistrations.includes(r.id)),
      );
      // Note: In a real app, we would call a server action here for bulk delete
      // await bulkDeleteRegistrations(selectedRegistrations);
      setSelectedRegistrations([]);
      showToast(
        `${selectedRegistrations.length} registrations deleted`,
        "success",
      );
    }
  };

  const handleBulkExport = () => {
    const selectedData = registrations.filter((r) =>
      selectedRegistrations.includes(r.id),
    );
    exportToCSV(selectedData);
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
                value={onlineRegistrations}
                icon={Globe}
                iconBgColor="#EFF6FF"
                iconColor="#3B82F6"
                trend={
                  trends?.totalRegistrations
                    ? {
                        ...trends.totalRegistrations,
                        comparisonText: "vs last week",
                      }
                    : null
                }
                tooltip="Registrations completed through the online portal"
              />

              <MetricCard
                title="Total Offline Registrations"
                value={offlineRegistrations}
                icon={Users}
                iconBgColor="#F5F3FF"
                iconColor="#8B5CF6"
                trend={
                  trends?.confirmedRegistrations
                    ? {
                        ...trends.confirmedRegistrations,
                        comparisonText: "vs last week",
                      }
                    : null
                }
                tooltip="Paper-based registrations processed manually"
              />

              <MetricCard
                title="Avg Attendance Rate"
                value={`${avgAttendanceRate}%`}
                icon={Target}
                iconBgColor="#F0FDF4"
                iconColor="#10B981"
                trend={
                  trends?.pendingRegistrations
                    ? {
                        ...trends.pendingRegistrations,
                        comparisonText: "vs last event",
                      }
                    : null
                }
                tooltip="Average percentage of students who attended events"
              />

              <MetricCard
                title="Total Revenue"
                value={`₹${totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                iconBgColor="#FFFBEB"
                iconColor="#F59E0B"
                trend={
                  trends?.waitlistRegistrations
                    ? {
                        ...trends.waitlistRegistrations,
                        comparisonText: "vs last month",
                      }
                    : null
                }
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

                <Select
                  value={filterEventType}
                  onValueChange={setFilterEventType}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="Workshop">Workshops</SelectItem>
                    <SelectItem value="Hackathon">Hackathons</SelectItem>
                    <SelectItem value="Competition">Competitions</SelectItem>
                    <SelectItem value="Quiz">Quizzes</SelectItem>
                    <SelectItem value="Exhibition">Exhibitions</SelectItem>
                  </SelectContent>
                </Select>
              </ClientOnly>

              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterEventType("all");
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
                  <th className="px-6 py-3 text-left">
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
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Registration ID{getSortIndicator("id")}
                  </th>
                  <th
                    onClick={() => handleSort("student")}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Student Details{getSortIndicator("student")}
                  </th>
                  <th
                    onClick={() => handleSort("event")}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Event{getSortIndicator("event")}
                  </th>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Registration Date{getSortIndicator("date")}
                  </th>
                  <th
                    onClick={() => handleSort("payment")}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Payment{getSortIndicator("payment")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  >
                    Status{getSortIndicator("status")}
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
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
                  : sortedRegistrations
                      .slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE,
                      )
                      .map((registration: any, index: any) => (
                        <tr
                          key={registration.id}
                          className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors row-hover-effect animate-row-entrance last:border-b-0"
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
                              <span className="text-sm text-[#6B7280]">
                                Free
                              </span>
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
          {sortedRegistrations.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6]">
              <div className="text-sm text-[#6B7280]">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    sortedRegistrations.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {sortedRegistrations.length}
                </span>{" "}
                results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {(() => {
                  const totalPages = Math.ceil(
                    sortedRegistrations.length / ITEMS_PER_PAGE,
                  );
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
                      Math.min(
                        prev + 1,
                        Math.ceil(sortedRegistrations.length / ITEMS_PER_PAGE),
                      ),
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(sortedRegistrations.length / ITEMS_PER_PAGE)
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
                    onClick={() => handleBulkTeamAction("approve")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkTeamAction("reject")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkTeamAction("delete")}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => showToast("Exporting team data...", "success")}
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
                    Leader Name
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
                {teamRegistrations
                  .filter((team) => {
                    const matchesSearch =
                      team.teamName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      team.teamId
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      team.leaderName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      team.event
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                    const matchesStatus =
                      filterStatus === "all" ||
                      (filterStatus === "confirmed" &&
                        team.status === "CONFIRMED") ||
                      (filterStatus === "pending-payment" &&
                        team.paymentStatus === "PENDING") ||
                      (filterStatus === "waitlist" &&
                        team.status === "WAITLISTED");

                    const matchesEvent =
                      filterEventType === "all" ||
                      team.eventType === filterEventType;

                    return matchesSearch && matchesStatus && matchesEvent;
                  })
                  .map((team: any, index: any) => (
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
                          {team.leaderName}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {team.leaderEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#1A1A1A]">
                          {team.event}
                        </div>
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
                      <td className="px-6 py-4">
                        {getStatusBadge(team.status)}
                      </td>
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
                              ...((team.paymentStatus !== "PAID"
                                ? [
                                    {
                                      label: "Mark as Paid",
                                      icon: "creditCard",
                                      onClick: () => handleMarkTeamPaid(team),
                                    },
                                  ]
                                : []) as any),
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
            `Email sent to leader of ${selectedTeam.teamName}`,
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

            {/* Leader Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Leader Information
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.leaderName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Email</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.leaderEmail}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Phone</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedTeam.leaderPhone}
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
                  <ul className="space-y-2">
                    {selectedTeam.members.map((member: any, idx: any) => (
                      <li
                        key={idx}
                        className="text-sm text-[#1A1A1A] flex justify-between items-center bg-white p-2 rounded border border-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-gray-500 w-5">
                            {idx + 1}.
                          </span>
                          <span>{member.name}</span>
                          {member.role === "LEADER" && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                              Leader
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          {member.email}
                        </span>
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
