"use client";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SportCard } from "./SportCard";
import {
  deleteSport,
  duplicateSport,
  setSportActive,
  updateSportStatus,
} from "@/actions/sportActions";

interface GridSport {
  id: string;
  name: string;
  category?: string;
  status?: string;
  poster?: string;
  type?: string;
  registrations?: number;
  capacity?: number;
  winnerPoints?: number;
  date?: string;
  registrationRate?: number;
  venue?: string;
  isArchived?: boolean;
  isDraft?: boolean;
}

interface SportsGridViewProps {
  sports?: GridSport[];
  searchQuery: string;
  selectedFilter: string;
  onNavigate?: (route: string, params?: Record<string, unknown>) => void;
  showArchived?: boolean;
  showDrafts?: boolean;
  onRefresh?: () => void;
}

export function SportsGridView({
  sports,
  searchQuery,
  selectedFilter,
  onNavigate,
  showArchived,
  showDrafts,
  onRefresh,
}: SportsGridViewProps) {
  const { showToast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<GridSport | null>(null);

  const safeSports = sports || [];

  const filteredSports = safeSports.filter((sport: any) => {
    const matchesSearch =
      sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sport.venue &&
        sport.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      selectedFilter === "All" || sport.category === selectedFilter;
    const matchesArchive = !!sport.isArchived === (showArchived || false);
    const matchesDraft = !!sport.isDraft === (showDrafts || false);

    // If viewing archives, only show archives. If viewing drafts, only show drafts.
    // If viewing main, only show non-archived and non-draft.
    if (showArchived) return matchesSearch && matchesFilter && sport.isArchived;
    if (showDrafts) return matchesSearch && matchesFilter && sport.isDraft;

    return (
      matchesSearch && matchesFilter && !sport.isArchived && !sport.isDraft
    );
  });

  const handleEditClick = (sport: GridSport) => {
    if (onNavigate) {
      // Pass as params to handleNavigate
      onNavigate("add-sport", { mode: "edit", initialData: sport });
    }
  };

  const handleCopySport = async (sport: GridSport) => {
    const res = await duplicateSport(sport.id);
    if (res.success) {
      showToast("Sport duplicated successfully (Upcoming)", "success");
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || "Failed to duplicate sport", "error");
    }
  };

  const handleArchive = async (sport: GridSport) => {
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

  const handlePublish = async (sport: GridSport) => {
    const res = await updateSportStatus(sport.id, "UPCOMING");
    if (res.success) {
      showToast("Sport restored to All Sports", "success");
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || "Failed to restore sport", "error");
    }
  };

  const handleDeleteClick = (sport: GridSport) => {
    setSportToDelete(sport);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (sportToDelete) {
      const res = await deleteSport(sportToDelete.id);
      if (res.success) {
        setShowDeleteDialog(false);
        setSportToDelete(null);
        showToast("Sport deleted successfully", "success"); // Changed to success (was error in mock)
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || "Failed to delete sport", "error");
      }
    }
  };

  return (
    <>
      {filteredSports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#7A7772]">
            No sports found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSports.map((sport: any) => (
            <SportCard
              key={sport.id}
              sport={sport}
              onNavigate={onNavigate ?? (() => {})}
              onEdit={handleEditClick}
              onCopy={handleCopySport}
              onArchive={handleArchive}
              onDelete={handleDeleteClick}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Sport Competition"
        message={`Are you sure you want to delete "${sportToDelete?.name}"? All related fixtures and results will be lost.`}
        confirmLabel="Delete Competition"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
