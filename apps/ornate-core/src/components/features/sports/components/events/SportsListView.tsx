"use client";
import { Edit, Eye, Copy, Trophy, Target } from "lucide-react";
import Image from "next/image";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import {
  deleteSport,
  duplicateSport,
  setSportActive,
  updateSportStatus,
} from "@/actions/sportActions";

interface ListSport {
  id: string;
  name: string;
  category: string;
  date?: string;
  venue?: string;
  status?: string;
  poster?: string;
  type?: string;
  registrations?: number;
  capacity?: number;
  winnerPoints?: number;
  runnerPoints?: number;
  secondRunnerPoints?: number;
  isArchived?: boolean;
  isDraft?: boolean;
}

interface SportsListViewProps {
  sports?: ListSport[];
  searchQuery: string;
  selectedFilter: string;
  onNavigate?: (route: string, params?: Record<string, unknown>) => void;
  showArchived?: boolean;
  showDrafts?: boolean;
  onRefresh?: () => void;
}

export function SportsListView({
  sports,
  searchQuery,
  selectedFilter,
  onNavigate,
  showArchived,
  showDrafts,
  onRefresh,
}: SportsListViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<ListSport | null>(null);
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isSportsCoordinator = session?.user?.role === "BRANCH_SPORTS_ADMIN";

  const safeSports = sports || [];

  const handleEditClick = (sport: ListSport) => {
    if (onNavigate) {
      onNavigate("add-sport", { mode: "edit", initialData: sport });
    }
  };

  const handleViewClick = (sport: ListSport) => {
    if (onNavigate) {
      onNavigate("add-sport", { mode: "view", initialData: sport });
    }
  };

  const handleCopySport = async (sport: ListSport) => {
    const res = await duplicateSport(sport.id);
    if (res.success) {
      showToast("Sport duplicated successfully (Upcoming)", "success");
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || "Failed to duplicate sport", "error");
    }
  };

  const handleArchive = async (sport: ListSport) => {
    const res = await setSportActive(sport.id, !!sport.isArchived);
    if (res.success) {
      showToast(
        sport.isArchived
          ? "Sport restored successfully"
          : "Sport archived successfully",
        "success",
      );
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || "Failed to update archive status", "error");
    }
  };

  const handlePublish = async (sport: ListSport) => {
    const res = await updateSportStatus(sport.id, "UPCOMING");
    if (res.success) {
      showToast("Sport restored to All Sports", "success");
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || "Failed to restore sport", "error");
    }
  };

  const handleDeleteClick = (sport: ListSport) => {
    setSportToDelete(sport);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (sportToDelete) {
      const res = await deleteSport(sportToDelete.id);
      if (res.success) {
        setShowDeleteDialog(false);
        setSportToDelete(null);
        showToast("Sport competition deleted successfully", "success");
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || "Failed to delete sport", "error");
      }
    }
  };

  const filteredSports = safeSports.filter((sport: any) => {
    const matchesSearch =
      sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sport.venue &&
        sport.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      selectedFilter === "All" || sport.category === selectedFilter;
    const matchesArchive = !!sport.isArchived === (showArchived || false);
    const matchesDraft = !!sport.isDraft === (showDrafts || false);

    if (showArchived) return matchesSearch && matchesFilter && sport.isArchived;
    if (showDrafts) return matchesSearch && matchesFilter && sport.isDraft;

    return (
      matchesSearch && matchesFilter && !sport.isArchived && !sport.isDraft
    );
  });

  return (
    <div className="bg-white rounded-[32px] border border-[#E5E7EB] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">
                Sport Details
              </th>
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">
                Category
              </th>
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">
                Starts From
              </th>
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">
                Venue
              </th>
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">
                Stats
              </th>
              <th className="py-5 px-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filteredSports.map((sport: any) => (
              <tr
                key={sport.id}
                className="hover:bg-[#F9FAFB] transition-colors group"
              >
                <td className="py-5 px-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                      <Image
                        src={
                          sport.poster ||
                          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070"
                        }
                        alt={sport.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1A1A1A] leading-tight tracking-tight">
                        {sport.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {sport.type || "N/A"}
                        </span>
                        <span className="text-[11px] font-medium text-[#9CA3AF]">
                          #{sport.id.substring(0, 6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/60 font-bold">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${sport.category === "Outdoor" ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                    <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wide">
                      {sport.category}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="text-[13px] font-bold text-[#1A1A1A]">
                    {sport.date}
                  </div>
                  <div className="text-[11px] font-medium text-[#6B7280] uppercase mt-1 tracking-tight">
                    {sport.status}
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="text-[13px] font-bold text-[#1A1A1A] truncate max-w-[180px]">
                    {sport.venue}
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">
                        {sport.registrations}/{sport.capacity}
                      </span>
                      <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                        Teams
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">
                        {(sport.category === "Individual" ||
                          sport.name.toLowerCase().includes("athletics")) &&
                        sport.winnerPoints === 10
                          ? 5
                          : sport.winnerPoints || 0}
                      </span>
                      <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                        Winner
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">
                        {(sport.category === "Individual" ||
                          sport.name.toLowerCase().includes("athletics")) &&
                        sport.runnerPoints === 5
                          ? 3
                          : sport.runnerPoints || 0}
                      </span>
                      <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                        Runner
                      </span>
                    </div>
                    {(sport.category === "Individual" ||
                      sport.name.toLowerCase().includes("athletics")) && (
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1A1A1A]">
                          {(sport.category === "Individual" ||
                            sport.name.toLowerCase().includes("athletics")) &&
                          (sport.secondRunnerPoints === 0 ||
                            !sport.secondRunnerPoints)
                            ? 1
                            : sport.secondRunnerPoints || 0}
                        </span>
                        <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">
                          2nd
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(sport)}
                      className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all text-[#6B7280] hover:text-[#1A1A1A] shadow-sm"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleViewClick(sport)}
                      className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all text-[#6B7280] hover:text-[#1A1A1A] shadow-sm"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    <ActionMenu
                      actions={[
                        {
                          label: "View Teams",
                          icon: "users",
                          onClick: () =>
                            onNavigate?.("all-registrations", {
                              eventId: sport.id,
                              filterSport: sport.name,
                            }),
                        },
                        isSportsCoordinator
                          ? {
                              label: "Add Registration",
                              icon: "plus",
                              onClick: () =>
                                onNavigate?.("add-registration", {
                                  initialData: sport,
                                }),
                            }
                          : {
                              label: "Polls and Fixtures",
                              icon: "view",
                              onClick: () => onNavigate?.("polls-fixtures"),
                            },
                        {
                          label: "Edit Sport",
                          icon: "edit",
                          onClick: () => handleEditClick(sport),
                        },
                        {
                          label: "Duplicate",
                          icon: "copy",
                          onClick: () => handleCopySport(sport),
                        },
                        { divider: true },
                        ...(sport.isDraft
                          ? [
                              {
                                label: "Restore to All Sports",
                                icon: "check",
                                onClick: () => handlePublish(sport),
                              },
                            ]
                          : []),
                        {
                          label: "Archive",
                          icon: "archive",
                          onClick: () => handleArchive(sport),
                        },
                        {
                          label: "Delete",
                          icon: "delete",
                          onClick: () => handleDeleteClick(sport),
                          danger: true,
                        },
                      ]}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSports.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Target className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] opacity-70">
            No matching sports found
          </h3>
          <p className="text-[12px] text-[#6B7280] mt-2 opacity-60">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Sport Competition"
        message={`This will permanently remove "${sportToDelete?.name}". All brackets and registrations will be lost. Are you sure?`}
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
