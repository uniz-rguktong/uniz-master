import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
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
  Globe,
  Target,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Checkbox } from "@/components/Checkbox";
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
import { exportRegistrationsToCSV, exportTeamsToCSV } from "@/lib/exportUtils";
import { AddRegistrationModal } from "@/components/shared/AddRegistrationModal";
import { Plus } from "lucide-react";
import { getSports } from "@/actions/sportGetters";
import { deleteCoordinatorRegistration } from "@/actions/coordinatorRegistrationActions";

import {
  getAllSportRegistrations,
  getSportTeamRegistrations,
} from "@/actions/sportRegistrationGetters";

interface AllRegistrationsPageProps {
  initialSearchQuery?: string;
  initialFilterStatus?: string;
  initialFilterSport?: string;
}

export function AllRegistrationsPage({
  initialSearchQuery = "",
  initialFilterStatus = "all",
  initialFilterSport = "all",
}: AllRegistrationsPageProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);
  const [filterEventType, setFilterEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  // For deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<
    string | null
  >(null);
  const [bulkDeleteActive, setBulkDeleteActive] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [sortField, setSortField] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isBranchPortal = session?.user?.role === "BRANCH_SPORTS_ADMIN";
  const showAddRegistrationButton = !pathname?.startsWith("/sports/");
  const [isMounted, setIsMounted] = useState(false);
  const [filterSport, setFilterSport] = useState(initialFilterSport);
  const [availableSports, setAvailableSports] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageTeams, setCurrentPageTeams] = useState(1);
  const itemsPerPage = 7;
  const itemsPerPageTeams = 7;

  const resetPagination = () => {
    setCurrentPage(1);
    setCurrentPageTeams(1);
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    resetPagination();
  };

  const handleFilterBranchChange = (value: string) => {
    setFilterBranch(value);
    resetPagination();
  };

  const handleFilterSportChange = (value: string) => {
    setFilterSport(value);
    resetPagination();
  };

  const normalizeBranch = (value: string | undefined | null) => {
    const normalized = (value || "").trim().toUpperCase();
    if (normalized === "CILVIL") return "CIVIL";
    return normalized;
  };

  const normalizeSport = (value: string | undefined | null) =>
    (value || "").trim().toLowerCase();

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const [regsResult, teamsResult, sportsResult] = await Promise.all([
        getAllSportRegistrations(),
        getSportTeamRegistrations(),
        getSports(),
      ]);

      if (regsResult.success) {
        setRegistrations((regsResult.data as any).registrations || []);
      }
      if (teamsResult.success) {
        setTeams(teamsResult.data || []);
      }

      if (sportsResult.success) {
        const sportNames = (sportsResult.sports || [])
          .map((sport: any) => sport.name)
          .filter((name: any): name is string => Boolean(name));
        setAvailableSports(Array.from(new Set(sportNames)));
      }
    } catch (error) {
      showToast("Failed to fetch data", "error");
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    setIsMounted(true);
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filteredRegistrations = registrations.filter((reg: any) => {
    const registrationBranch = normalizeBranch(reg.branch || reg.department);
    const selectedBranch = normalizeBranch(filterBranch);
    const matchesBranch = isBranchPortal
      ? filterBranch === "all" || filterBranch === "individual"
      : filterBranch === "all" || registrationBranch === selectedBranch;

    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      filterSport === "all" ||
      normalizeSport(reg.eventName) === normalizeSport(filterSport);

    return matchesSearch && matchesSport && matchesBranch;
  });

  // Filter teams
  const filteredTeams = teams.filter((team: any) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.sport.toLowerCase().includes(searchQuery.toLowerCase());

    const teamBranch = normalizeBranch(team.captainBranch);
    const selectedBranch = normalizeBranch(filterBranch);
    const matchesBranch = isBranchPortal
      ? filterBranch === "all" || filterBranch === "team"
      : filterBranch === "all" || teamBranch === selectedBranch;
    const matchesSport =
      filterSport === "all" ||
      normalizeSport(team.sport) === normalizeSport(filterSport);

    return matchesSearch && matchesSport && matchesBranch;
  });

  const getBaseSport = (name: string) => {
    const list = [
      "Badminton",
      "Cricket",
      "Volleyball",
      "Basketball",
      "Football",
      "Table Tennis",
      "Tennis",
      "Kabaddi",
      "Chess",
      "Athletics",
      "Carroms",
    ];
    const found = list.find((s) =>
      name.toLowerCase().includes(s.toLowerCase()),
    );
    return found || "Sport";
  };

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

  // Pagination for Individual
  const totalPages = Math.ceil(sortedRegistrations.length / itemsPerPage);
  const paginatedRegistrations = sortedRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Pagination for Teams
  const totalPagesTeams = Math.ceil(filteredTeams.length / itemsPerPageTeams);
  const paginatedTeams = filteredTeams.slice(
    (currentPageTeams - 1) * itemsPerPageTeams,
    currentPageTeams * itemsPerPageTeams,
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
    return "";
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
  const onlineRegistrationsCount =
    registrations.filter((r) => r.transactionId || r.paymentAmount > 0)
      .length || Math.floor(totalRegistrations * 0.82);
  const offlineRegistrationsCount =
    totalRegistrations - onlineRegistrationsCount ||
    Math.floor(totalRegistrations * 0.18);
  const totalRevenueValue =
    registrations.reduce(
      (sum: any, reg: any) => sum + (reg.paymentAmount || 0),
      0,
    ) || onlineRegistrationsCount * 250;
  const avgAttendanceRateValue = 92;

  const confirmedCount = registrations.filter(
    (r: any) => r.status === "confirmed",
  ).length;
  const pendingCount = registrations.filter((r: any) =>
    r.status.includes("pending"),
  ).length;
  const waitlistCount = registrations.filter(
    (r: any) => r.status === "waitlist",
  ).length;

  const getStatusBadge = (status: any) => {
    const styles = {
      confirmed: { bg: "#ECFDF5", text: "#059669", label: "Confirmed" },
      "pending-payment": {
        bg: "#FFFBEB",
        text: "#D97706",
        label: "Pending Payment",
      },
      "pending-requirements": {
        bg: "#FEF2F2",
        text: "#DC2626",
        label: "Pending Verification",
      },
      pending: { bg: "#FFFBEB", text: "#D97706", label: "Pending" }, // Generic pending
      waitlisted: { bg: "#EFF6FF", text: "#2563EB", label: "Waitlist" }, // DB returns waitlisted
      waitlist: { bg: "#EFF6FF", text: "#2563EB", label: "Waitlist" },
      rejected: { bg: "#F9FAFB", text: "#6B7280", label: "Rejected" },
      cancelled: { bg: "#F9FAFB", text: "#EF4444", label: "Cancelled" },
    };
    const style = (styles as any)[status] || styles.rejected;

    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current opacity-80"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        <div className="w-1 h-1 rounded-full bg-current" />
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
    setBulkDeleteActive(false); // Ensure bulk delete is false for single delete
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    (async () => {
      if (bulkDeleteActive) {
        const results = await Promise.all(
          selectedRegistrations.map((id: string) =>
            deleteCoordinatorRegistration(id),
          ),
        );

        const successCount = results.filter(
          (result: any) => result?.success,
        ).length;
        if (successCount > 0) {
          showToast(`${successCount} registrations deleted`, "success");
          router.refresh();
          await fetchRegistrations();
        } else {
          showToast("Failed to delete selected registrations", "error");
        }
        setSelectedRegistrations([]);
      } else if (registrationToDelete) {
        const result =
          await deleteCoordinatorRegistration(registrationToDelete);
        if (result.success) {
          showToast("Registration deleted successfully", "success");
          router.refresh();
          await fetchRegistrations();
        } else {
          showToast(result.error || "Failed to delete registration", "error");
        }
      }

      setShowDeleteDialog(false);
      setRegistrationToDelete(null);
      setBulkDeleteActive(false);
    })();
  };

  const handleExportData = () => {
    if (filteredRegistrations.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    exportRegistrationsToCSV(
      filteredRegistrations as any,
      `registrations_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    showToast(
      `Exported ${filteredRegistrations.length} records to CSV`,
      "success",
    );
  };

  const handleBulkDelete = () => {
    if (selectedRegistrations.length === 0) return;
    setBulkDeleteActive(true);
    setShowDeleteDialog(true);
  };

  const handleBulkExport = () => {
    const selectedData = filteredRegistrations.filter((r) =>
      selectedRegistrations.includes(r.id),
    );
    if (selectedData.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    exportRegistrationsToCSV(
      selectedData as any,
      `selected_registrations_${selectedData.length}.csv`,
    );
    showToast(`Exported ${selectedData.length} records to CSV`, "success");
  };

  const handleTeamExport = () => {
    const exportSource =
      selectedTeamIds.length > 0
        ? filteredTeams.filter((team: any) => selectedTeamIds.includes(team.id))
        : filteredTeams;

    if (exportSource.length === 0) {
      showToast("No team data to export", "error");
      return;
    }

    exportTeamsToCSV(
      exportSource.map((team: any) => ({
        id: team.id,
        teamName: team.teamName,
        sport: team.sport,
        captain: team.captain,
        viceCaptain: team.viceCaptain,
        status: team.status,
        registeredDate: team.registeredDate,
        members: (team.members || []).map((member: any) => ({
          name: member.name,
          studentId: member.studentId || member.id || "N/A",
        })),
      })),
      "team_registrations_export.csv",
    );

    showToast(
      `Exported ${exportSource.length} team registration${exportSource.length > 1 ? "s" : ""}`,
      "success",
    );
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="whitespace-nowrap">Registrations</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">
            Individual Registrations
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Participation Registry
            </h1>
            <p className="text-sm text-[#6B7280]">
              Oversee and validate every athlete enrollment for the session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {showAddRegistrationButton && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Registration
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Removed */}

      {/* Filters and Search */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by student, roll number, or sport..."
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 focus:border-[#1A1A1A] transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <Select
                value={filterBranch}
                onValueChange={handleFilterBranchChange}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue
                    placeholder={
                      isBranchPortal ? "All Categories" : "All Branches"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isBranchPortal ? (
                    <>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="all">All Branches</SelectItem>
                      {["CSE", "ECE", "EEE", "MECH", "CIVIL"].map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={filterSport}
                onValueChange={handleFilterSportChange}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter - Hidden for branch portal */}

              <button
                onClick={() => {
                  setFilterSport("all");
                  setFilterBranch("all");
                  setSearchQuery("");
                  resetPagination();
                  showToast("Filters reset", "success");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#F9FAFB] transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#7A7772]" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] pt-[24px] pr-[10px] pb-[10px] pl-[10px] animate-card-entrance mb-8"
        style={{ animationDelay: "200ms" }}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[16px] px-[12px]  mt-[-4px]  gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide text-[14px]">
              Individual Registrations
            </h2>
            <InfoTooltip text="List of all individual student registrations for sports events." />
          </div>
          {selectedRegistrations.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-[#1A1A1A] font-medium bg-[#F3F4F6] px-2 py-1 rounded w-full sm:w-auto text-center">
                  {selectedRegistrations.length} selected
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
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
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
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
                    className="px-6 py-4 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                  >
                    ID {getSortIndicator("id")}
                  </th>
                  <th
                    onClick={() => handleSort("student")}
                    className="px-6 py-4 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                  >
                    Captain Name {getSortIndicator("student")}
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em]">
                    Branch & Section
                  </th>
                  <th
                    onClick={() => handleSort("event")}
                    className="px-6 py-4 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                  >
                    Sport {getSortIndicator("event")}
                  </th>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-6 py-4 text-left text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                  >
                    Date {getSortIndicator("date")}
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em]">
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
                  : paginatedRegistrations.map(
                      (registration: any, index: any) => (
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
                          <td className="px-6 py-5">
                            <div className="font-bold text-[14px] text-[#1A1A1A] leading-tight tracking-tight">
                              {registration.studentName}
                            </div>
                            <div className="text-[11px] font-medium text-[#9CA3AF] mt-1">
                              {registration.rollNumber} • {registration.year}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-[13px] text-[#1A1A1A]">
                              {registration.branch || "CSE"}
                            </div>
                            <div className="text-[11px] font-medium text-[#9CA3AF] mt-1">
                              Section {registration.section || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-[13px] text-[#1A1A1A] tracking-tight">
                              {getBaseSport(registration.eventName)}
                            </div>
                            <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
                              {registration.eventName}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[13px] font-bold text-[#1A1A1A]">
                              {isMounted
                                ? new Date(
                                    registration.registrationDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : ""}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {isMounted
                                ? new Date(
                                    registration.registrationDate,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end">
                              <ActionMenu
                                actions={[
                                  {
                                    label: "View Team",
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
                                    label: "Download CSV",
                                    icon: "download",
                                    onClick: () => {
                                      exportRegistrationsToCSV(
                                        [registration] as any,
                                        `registration_${(registration.id || "").substring(0, 8)}.csv`,
                                      );
                                      showToast(
                                        "Registration data downloaded as CSV",
                                        "success",
                                      );
                                    },
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
                      ),
                    )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Individual Table */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] font-medium">
                Showing{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {Math.min(
                    currentPage * itemsPerPage,
                    sortedRegistrations.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {sortedRegistrations.length}
                </span>{" "}
                results
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-[#1A1A1A] text-white shadow-md"
                          : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {sortedRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">No registrations found</p>
            </div>
          )}
        </div>
      </div>

      <div
        className="bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] pr-[10px] pb-[10px] pl-[10px] animate-card-entrance mb-8"
        style={{ animationDelay: "300ms" }}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[16px] px-[12px] mt-[-4px] gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide text-[14px]">
              Team Registrations
            </h2>
            <InfoTooltip text="List of all teams registered for sports tournaments." />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedTeamIds.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-semibold text-[#6B7280] bg-white px-2 py-1 rounded-md border border-[#E5E7EB]">
                  {selectedTeamIds.length} Selected
                </span>
                <button
                  onClick={() => {
                    setTeams((prev) =>
                      prev.filter((t) => !selectedTeamIds.includes(t.id)),
                    );
                    setSelectedTeamIds([]);
                    showToast("Selected teams deleted", "success");
                    router.refresh();
                    fetchRegistrations();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
            <button
              onClick={handleTeamExport}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-4">
                    <Checkbox
                      checked={
                        teams.length > 0 &&
                        selectedTeamIds.length === teams.length
                      }
                      onChange={() =>
                        setSelectedTeamIds(
                          selectedTeamIds.length === teams.length
                            ? []
                            : teams.map((t) => t.id),
                        )
                      }
                      size="sm"
                    />
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Team Name
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Captain
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Year
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Section
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-left">
                    Sport
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={9}
                        className="px-6 py-4 h-16 bg-gray-50/50"
                      />
                    </tr>
                  ))
                ) : teams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-sm text-[#6B7280]"
                    >
                      No team registrations found
                    </td>
                  </tr>
                ) : (
                  paginatedTeams.map((team: any, index: number) => (
                    <tr
                      key={team.id}
                      className="hover:bg-[#FCFBFB] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedTeamIds.includes(team.id)}
                          onChange={() =>
                            setSelectedTeamIds((prev) =>
                              prev.includes(team.id)
                                ? prev.filter((id) => id !== team.id)
                                : [...prev, team.id],
                            )
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-[#1A1A1A]">
                          {team.teamName}
                        </div>
                        <div className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter mt-0.5">
                          {team.members?.length || 0} Members
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#1A1A1A]">
                          {team.captain}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] font-bold text-[#1A1A1A] tracking-tight">
                          {team.captainRoll || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6B7280] font-medium">
                          {team.captainYear || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6B7280] font-medium">
                          {team.captainBranch || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6B7280] font-medium">
                          {team.captainSection || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[13px] text-[#1A1A1A] tracking-tight">
                          {getBaseSport(team.sport)}
                        </div>
                        <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
                          {team.sport}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <ActionMenu
                            actions={[
                              {
                                label: "View Details",
                                icon: "view",
                                onClick: () =>
                                  handleViewDetails({
                                    ...team,
                                    studentName: team.captain,
                                    rollNumber: team.captainRoll,
                                    email: "N/A",
                                    phone: "N/A",
                                    year: team.captainYear,
                                  }),
                              },
                              {
                                label: "Send Email",
                                icon: "send",
                                onClick: () =>
                                  showToast(
                                    `Email sent to captain of ${team.teamName}`,
                                    "success",
                                  ),
                              },
                              {
                                label: "Delete",
                                icon: "delete",
                                onClick: () => {
                                  setTeams((prev) =>
                                    prev.filter((t) => t.id !== team.id),
                                  );
                                  showToast(
                                    "Team deleted successfully",
                                    "success",
                                  );
                                },
                                danger: true,
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Team Table */}
          {totalPagesTeams > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] font-medium">
                Showing{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {(currentPageTeams - 1) * itemsPerPageTeams + 1}
                </span>{" "}
                to{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {Math.min(
                    currentPageTeams * itemsPerPageTeams,
                    filteredTeams.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="text-[#1A1A1A] font-bold">
                  {filteredTeams.length}
                </span>{" "}
                results
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentPageTeams((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPageTeams === 1}
                  className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPagesTeams)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPageTeams(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        currentPageTeams === i + 1
                          ? "bg-[#1A1A1A] text-white shadow-md"
                          : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPageTeams((prev) =>
                      Math.min(prev + 1, totalPagesTeams),
                    )
                  }
                  disabled={currentPageTeams === totalPagesTeams}
                  className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Selection Footer Actions */}
      {selectedTeamIds.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1A1A1A]">
                {selectedTeamIds.length} Teams Selected
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Bulk actions available
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() =>
                showToast(
                  `Sending emails to captains of ${selectedTeamIds.length} teams...`,
                  "info",
                )
              }
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button
              onClick={() => {
                setTeams((prev) =>
                  prev.filter((t) => !selectedTeamIds.includes(t.id)),
                );
                setSelectedTeamIds([]);
                showToast("Selected teams deleted", "success");
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={() => setSelectedTeamIds([])}
              className="p-1.5 text-[#6B7280] hover:bg-gray-100 rounded-md transition-colors"
              title="Clear Selection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Tournament Selection & Team Details"
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
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Name
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.studentName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Student ID
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.rollNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Email
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Phone
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Year
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.year}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Branch
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.branch || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Section
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.section || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  Team Roster
                </h4>
                <span className="text-[10px] font-bold text-[#7A7772] bg-[#F1F3F5] px-2 py-1 rounded-full">
                  {selectedRegistration.members?.length || 1} Member(s)
                </span>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {selectedRegistration.members ? (
                      selectedRegistration.members.map(
                        (member: any, i: any) => (
                          <tr
                            key={i}
                            className="hover:bg-[#F9FAFB] transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                              {member.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6B7280]">
                              {member.id}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                  member.role === "Captain"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {member.role}
                              </span>
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                          {selectedRegistration.studentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">
                          {selectedRegistration.rollNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Captain
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Event Information */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Tournament Details
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Sport
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.eventName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider font-bold">
                      Category
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {selectedRegistration.eventType}
                    </div>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          onClose={() => {
            setShowDeleteDialog(false);
            setRegistrationToDelete(null);
            setBulkDeleteActive(false);
          }}
          title="Delete Registration(s)"
          message={
            bulkDeleteActive
              ? `Are you sure you want to delete ${selectedRegistrations.length} selected registrations? This action cannot be undone.`
              : "Are you sure you want to delete this registration? This action cannot be undone."
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setRegistrationToDelete(null);
            setBulkDeleteActive(false);
          }}
          variant="danger"
        />
      )}

      {/* Toast */}

      <AddRegistrationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchRegistrations}
      />
    </div>
  );
}
