"use client";
import {
  ChevronLeft,
  FileText,
  Calendar,
  MapPin,
  Edit3,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface DraftItem {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  lastModified: string;
  venue: string;
  progress: number;
  data: Record<string, unknown>;
}

interface DraftsPageProps {
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
}

const mockDrafts = [
  {
    id: "d1",
    name: "Untitled Event 1",
    category: "Workshops",
    categoryColor: "#8B5CF6",
    lastModified: "2 hours ago",
    venue: "Block A, LH-1",
    progress: 40,
    data: {
      eventName: "Untitled Event 1",
      category: "Workshops",
    },
  },
  {
    id: "d2",
    name: "Tech Fest 2025 Brainstorming",
    category: "Cultural",
    categoryColor: "#F59E0B",
    lastModified: "1 day ago",
    venue: "Online",
    progress: 60,
    data: {
      eventName: "Tech Fest 2025 Brainstorming",
      category: "Cultural",
      locationType: "online",
    },
  },
];

export function DraftsPage({ onNavigate }: DraftsPageProps) {
  const [draftsList, setDraftsList] = useState<DraftItem[]>(mockDrafts);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<DraftItem | null>(null);
  const { showToast } = useToast();

  const handleDeleteClick = (draft: DraftItem) => {
    setDraftToDelete(draft);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setDraftsList(draftsList.filter((d) => d.id !== draftToDelete?.id));
    setShowDeleteDialog(false);
    setDraftToDelete(null);
    showToast("Draft deleted successfully", "success");
  };

  const handleEditDraft = (draft: DraftItem) => {
    onNavigate("create-event", { mode: "edit", eventData: draft.data });
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate("all-events")}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to All Events
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Saved Drafts
            </h1>
            <p className="text-sm text-[#6B7280]">
              Finish setting up your events
            </p>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      {draftsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {draftsList.map((draft: any) => (
            <div
              key={draft.id}
              className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden hover:border-[#1A1A1A] transition-all duration-300 group shadow-sm hover:shadow-md h-full flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#F7F8FA] rounded-[14px] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#6B7280]" />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${draft.categoryColor}15`,
                      color: draft.categoryColor,
                    }}
                  >
                    {draft.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#1A1A1A] transition-colors line-clamp-1">
                  {draft.name}
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {draft.lastModified}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <MapPin className="w-4 h-4" />
                    <span>{draft.venue}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-medium text-[#6B7280] mb-1.5">
                    <span>Setup Progress</span>
                    <span>{draft.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1A1A1A] transition-all duration-500"
                      style={{ width: `${draft.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F7F8FA] border-t border-[#E5E7EB] flex items-center justify-between">
                <button
                  onClick={() => handleEditDraft(draft)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] hover:opacity-70 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                  Continue Setup
                </button>
                <button
                  onClick={() => handleDeleteClick(draft)}
                  className="p-2 text-[#6B7280] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-12 text-center animate-card-entrance">
          <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#9CA3AF]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            No drafts found
          </h3>
          <p className="text-[#6B7280] max-w-sm mx-auto mb-8">
            You don&apos;t have any saved drafts at the moment.
          </p>
          <button
            onClick={() => onNavigate("create-event", { mode: "create" })}
            className="px-6 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
          >
            Create Your First Event
          </button>
        </div>
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Draft"
          message={`Are you sure you want to delete "${draftToDelete?.name}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete Draft"
        />
      )}
    </div>
  );
}
