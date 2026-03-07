"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type {
  Registration,
  TeamRegistration,
  RegistrationsTableConfig,
  RegistrationStatus,
} from "./types";
import { usePathname, useSearchParams } from "next/navigation";
import { RegistrationsPageHeader } from "./components/RegistrationsPageHeader";
import { RegistrationsMetrics } from "./components/RegistrationsMetrics";
import { RegistrationsFilters } from "./components/RegistrationsFilters";
import { RegistrationsTableContent } from "./components/RegistrationsTableContent";
import { TeamRegistrationsTableContent } from "./components/TeamRegistrationsTableContent";
import { Modal } from "@/components/Modal";
import { exportRegistrationsToCSV } from "@/lib/exportUtils";
import {
  ADMIN_CONFIG,
  SPORTS_CONFIG,
  CLUBS_CONFIG,
  HHO_CONFIG,
} from "./configs";
import { AddRegistrationModal } from "@/components/shared/AddRegistrationModal";

const CONFIG_MAP = {
  admin: ADMIN_CONFIG,
  sports: SPORTS_CONFIG,
  clubs: CLUBS_CONFIG,
  hho: HHO_CONFIG,
};

interface RegistrationsTableProps {
  variant: keyof typeof CONFIG_MAP;
  hideSelection?: boolean;
  config?: Partial<RegistrationsTableConfig>;
  initialData?: {
    registrations: Registration[];
    teams?: TeamRegistration[];
    stats?: any;
    trends?: any;
    pagination?: any;
    events?: { id: string; title: string }[];
  };
  actions?: {
    fetchRegistrations: (params: any) => Promise<any>;
    deleteRegistration: (id: string) => Promise<any>;
    deleteTeam?: (id: string) => Promise<any>;
    announceWinners?: (eventId: string) => Promise<any>;
    assignWinnerPrize?: (params: {
      eventId: string;
      targetId: string;
      targetType: "registration" | "team";
      rank: 1 | 2 | 3;
    }) => Promise<any>;
  };
}

export default function RegistrationsTable({
  variant,
  hideSelection = false,
  config: configOverride,
  initialData,
  actions,
}: RegistrationsTableProps) {
  const baseConfig = CONFIG_MAP[variant];
  const config = { ...baseConfig, ...configOverride };

  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Data States
  const [registrations, setRegistrations] = useState<Registration[]>(
    initialData?.registrations || [],
  );
  const [teams, setTeams] = useState<TeamRegistration[]>(
    initialData?.teams || [],
  );
  const [pagination, setPagination] = useState(
    initialData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
  );
  const [events] = useState(initialData?.events || []);
  const [stats, setStats] = useState(
    initialData?.stats || {
      totalOnlineRegistrations: 0,
      totalOfflineRegistrations: 0,
      totalRevenue: 0,
      avgAttendanceRate: 0,
    },
  );

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialEventId = searchParams.get("eventId") || "all";
  const isBranchAdmin = pathname.startsWith("/branch-admin");
  const hideExport = isBranchAdmin || variant === "clubs";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEvent, setFilterEvent] = useState(initialEventId);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Selection States
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Modal States
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "reg" | "team";
  } | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedPrizeRank, setSelectedPrizeRank] = useState<1 | 2 | 3>(1);
  const [winnerTarget, setWinnerTarget] = useState<{
    eventId: string;
    targetId: string;
    targetType: "registration" | "team";
    label: string;
  } | null>(null);

  // Fetch logic
  const loadData = useCallback(async () => {
    if (!actions?.fetchRegistrations) return;

    setIsLoading(true);
    try {
      const result = await actions.fetchRegistrations({
        page: currentPage,
        limit: 10,
        search: debouncedSearchQuery,
        status: filterStatus,
        eventId: filterEvent,
      });

      if (result.success && result.data) {
        setRegistrations(result.data.registrations);
        if (result.data.pagination) setPagination(result.data.pagination);
        if (result.data.stats) setStats(result.data.stats);
      }
    } catch (error) {
      console.error("Failed to load registrations", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    actions,
    currentPage,
    debouncedSearchQuery,
    filterStatus,
    filterEvent,
    showToast,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const toggleSelectRegRow = (id: string) => {
    setSelectedRegIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAllRegs = () => {
    if (selectedRegIds.length === registrations.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(registrations.map((r) => r.id));
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterEvent("all");
    setCurrentPage(1);
    showToast("Filters reset", "success");
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    showToast(
      `Deleting ${itemToDelete.type === "reg" ? "registration" : "team"}...`,
      "info",
    );

    const action =
      itemToDelete.type === "reg"
        ? actions?.deleteRegistration
        : actions?.deleteTeam;

    if (action) {
      const result = await action(itemToDelete.id);
      if (result.success) {
        showToast("Deleted successfully", "success");
        if (itemToDelete.type === "reg") {
          setRegistrations((prev) =>
            prev.filter((r) => r.id !== itemToDelete.id),
          );
        } else {
          setTeams((prev) => prev.filter((t) => t.id !== itemToDelete.id));
        }
      } else {
        showToast(result.error || "Failed to delete", "error");
      }
    }

    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  return (
    <div className="p-8 animate-page-entrance">
      <RegistrationsPageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Registrations" },
          { label: config.title, active: true },
        ]}
        onSendEmail={() =>
          showToast("Communication module initialized", "info")
        }
        onExport={() =>
          exportRegistrationsToCSV(
            registrations as any,
            `${variant}_registrations_export.csv`,
          )
        }
        onAddRegistration={undefined}
        showExport={!hideExport}
      />

      {config.showMetrics && (
        <RegistrationsMetrics
          isLoading={isLoading}
          stats={stats}
          trends={initialData?.trends}
        />
      )}

      <RegistrationsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterEvent={filterEvent}
        setFilterEvent={setFilterEvent}
        events={events}
        onReset={handleReset}
      />

      <RegistrationsTableContent
        isLoading={isLoading}
        registrations={registrations}
        columns={config.columns}
        selectedIds={selectedRegIds}
        toggleSelectAll={toggleSelectAllRegs}
        toggleSelectRow={toggleSelectRegRow}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        getSortIndicator={getSortIndicator}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pagination={pagination}
        itemsPerPage={10}
        onViewDetails={(reg) => {
          setSelectedItem(reg);
          setShowDetailsModal(true);
        }}
        onSendEmail={(reg) =>
          showToast(`Email sent to ${reg.studentName}`, "success")
        }
        onDelete={(id) => {
          setItemToDelete({ id, type: "reg" });
          setShowDeleteDialog(true);
        }}
        {...(actions?.assignWinnerPrize
          ? {
              onAnnounceWinners: async (reg: any) => {
                if (!reg.eventId) {
                  showToast(
                    "Event information is missing for this registration.",
                    "error",
                  );
                  return;
                }
                setWinnerTarget({
                  eventId: reg.eventId,
                  targetId: reg.id,
                  targetType: "registration",
                  label: reg.studentName || "Selected registration",
                });
                setSelectedPrizeRank(1);
                setShowPrizeModal(true);
              },
            }
          : {})}
        title="Individual Registrations"
        tooltipText="List of all individual students registered"
        showSelection={!(hideSelection || variant === "hho")}
      />

      {config.teamSupport && config.teamColumns && (
        <TeamRegistrationsTableContent
          isLoading={isLoading}
          teams={teams}
          columns={config.teamColumns}
          selectedIds={selectedTeamIds}
          toggleSelectAll={() =>
            setSelectedTeamIds(
              selectedTeamIds.length === teams.length
                ? []
                : teams.map((t) => t.id),
            )
          }
          toggleSelectRow={(id) =>
            setSelectedTeamIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
            )
          }
          onViewDetails={(team) => {
            setSelectedItem(team);
            setShowDetailsModal(true);
          }}
          onSendEmail={(team) =>
            showToast(
              `Email sent to team leader of ${team.teamName}`,
              "success",
            )
          }
          onDelete={(id) => {
            setItemToDelete({ id, type: "team" });
            setShowDeleteDialog(true);
          }}
          {...(actions?.assignWinnerPrize
            ? {
                onAnnounceWinners: async (team: any) => {
                  if (!team.eventId) {
                    showToast(
                      "Event information is missing for this team.",
                      "error",
                    );
                    return;
                  }
                  setWinnerTarget({
                    eventId: team.eventId,
                    targetId: team.id,
                    targetType: "team",
                    label: team.teamName || "Selected team",
                  });
                  setSelectedPrizeRank(1);
                  setShowPrizeModal(true);
                },
              }
            : {})}
          title="Team Registrations"
          tooltipText="List of all teams registered for events"
          showSelection={!(hideSelection || variant === "hho")}
        />
      )}

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Record Details"
        onConfirm={() => setShowDetailsModal(false)}
        tooltipText="Detailed view of the selected record."
        footer={null}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(selectedItem)
                .filter((k) => typeof selectedItem[k] !== "object")
                .map((key) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      {key}
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {String(selectedItem[key])}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        variant="danger"
        tooltipText="Confirm record deletion."
        type="danger"
      />

      <Modal
        isOpen={showPrizeModal}
        onClose={() => {
          setShowPrizeModal(false);
          setWinnerTarget(null);
        }}
        title="Announce Winners"
        confirmText="OK"
        onConfirm={async () => {
          if (!winnerTarget || !actions?.assignWinnerPrize) return;

          const result = await actions.assignWinnerPrize({
            eventId: winnerTarget.eventId,
            targetId: winnerTarget.targetId,
            targetType: winnerTarget.targetType,
            rank: selectedPrizeRank,
          });

          if (result?.success) {
            showToast(
              result.message || "Prize assigned and winners updated.",
              "success",
            );
            setShowPrizeModal(false);
            setWinnerTarget(null);
            loadData();
          } else {
            showToast(result?.error || "Failed to assign prize.", "error");
          }
        }}
        confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Assign winner prize for{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {winnerTarget?.label}
            </span>
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
              <input
                type="radio"
                name="winnerPrizeRank"
                checked={selectedPrizeRank === 1}
                onChange={() => setSelectedPrizeRank(1)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-[#1A1A1A]">
                1st Prize
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
              <input
                type="radio"
                name="winnerPrizeRank"
                checked={selectedPrizeRank === 2}
                onChange={() => setSelectedPrizeRank(2)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-[#1A1A1A]">
                2nd Prize
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
              <input
                type="radio"
                name="winnerPrizeRank"
                checked={selectedPrizeRank === 3}
                onChange={() => setSelectedPrizeRank(3)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-[#1A1A1A]">
                3rd Prize
              </span>
            </label>
          </div>
        </div>
      </Modal>

      <AddRegistrationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadData();
          // If table doesn't have its own load teams, we might need one.
          // But usually loadData handles registrations.
        }}
      />
    </div>
  );
}
