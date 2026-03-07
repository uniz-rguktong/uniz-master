"use client";
import { Edit, Eye, Copy } from "lucide-react";
import { ActionMenu } from "../ActionMenu";
import { useToast } from "@/hooks/useToast";
import dynamic from "next/dynamic";
import { formatTimeTo12h } from "@/lib/dateUtils";

const EventDetailsModal = dynamic(
  () =>
    import("@/components/EventDetailsModal").then(
      (mod) => mod.EventDetailsModal,
    ),
  {
    loading: () => null,
  },
);
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  updateEventStatus,
  deleteEvent,
  duplicateEvent,
} from "@/actions/eventActions";
import { ConfirmDialog } from "../ConfirmDialog";

interface RawEvent {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  posterUrl?: string;
  date?: string;
  venue?: string;
  registrationsCount?: number;
  status?: string;
  [key: string]: unknown;
}

interface MappedEvent {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  thumbnail: string;
  dateTime: string;
  venue: string;
  registrations: number;
  capacity: number;
  status: string;
  statusColor: string;
  lastModified: string;
  isArchived: boolean;
  originalData: RawEvent;
}

interface NavigationParams {
  mode?: "edit" | "copy";
  eventData?: MappedEvent;
  searchQuery?: string;
  eventId?: string;
}

interface EventListViewProps {
  events: RawEvent[];
  searchQuery: string;
  selectedFilter: string;
  onNavigate?: (path: string, params?: NavigationParams) => void;
  showArchived?: boolean;
  showDrafts?: boolean;
  sortBy?: string;
}

// Mock data removed in favor of real data passed via props

export function EventListView({
  events,
  searchQuery,
  selectedFilter,
  onNavigate,
  showArchived,
  showDrafts,
  sortBy,
}: EventListViewProps) {
  const { toast, showToast, hideToast } = useToast();
  const [eventsList, setEventsList] = useState<MappedEvent[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<MappedEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RawEvent | null>(null);

  /* Updated to handle props and navigation */
  const router = useRouter();
  const pathname = usePathname();

  // Update internal list when props change (matching EventGridView)
  useEffect(() => {
    if (events) {
      const mappedEvents = events.map((e: any) => ({
        id: e.id,
        name: e.title,
        category: e.category || "General",
        categoryColor: "#8B5CF6",
        thumbnail:
          e.posterUrl ||
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=60&fit=crop",
        dateTime: e.date
          ? new Date(e.date).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
              hour12: true,
            })
          : "TBD",
        venue: e.venue || "TBD",
        registrations: e.registrationsCount || 0,
        capacity: 100,
        status: (e.status || "PUBLISHED").toUpperCase(),
        statusColor: "#10B981",
        lastModified: "Recently",
        isArchived:
          (e.status || "").toUpperCase() === "CANCELLED" ||
          (e.status || "").toUpperCase() === "ARCHIVED",
        // Keep original data for editing
        originalData: e,
      }));
      setEventsList(mappedEvents);
    }
  }, [events]);

  // Calculate base path (e.g., /dashboard, /hho, /super-admin)
  const basePath = pathname.startsWith("/hho")
    ? "/hho"
    : pathname.startsWith("/super-admin")
      ? "/super-admin"
      : pathname.startsWith("/clubs-portal")
        ? "/clubs-portal"
        : pathname.startsWith("/sports")
          ? "/sports"
          : pathname.startsWith("/branch-admin")
            ? "/branch-admin"
            : "/dashboard";

  const handleNavigation = (path: string, params?: NavigationParams) => {
    if (onNavigate) {
      onNavigate(path, params);
    } else {
      // Fallback for direct handling if onNavigate is missing
      if (path === "create-event") {
        const mode = params?.mode;
        const eventData = params?.eventData;
        if (mode && eventData) {
          const dataToStore = eventData.originalData || eventData;
          // If we have originalData (from mapping), use valid DB data, otherwise use UI data
          localStorage.setItem("editEventData", JSON.stringify(dataToStore));
          router.push(`${basePath}/events/create?mode=${mode}`);
        }
      } else if (path === "all-registrations") {
        const registrationsPath =
          basePath === "/hho"
            ? "/hho/all-registrations"
            : `${basePath}/registrations`;
        router.push(`${registrationsPath}?eventId=${params?.eventId || "all"}`);
      }
    }
  };

  const handleEditClick = (event: MappedEvent) => {
    // Use helper
    handleNavigation("create-event", { mode: "edit", eventData: event });
  };

  const handleViewClick = (event: MappedEvent) => {
    setSelectedEvent(event.originalData || event); // Use originalData if available
    setShowDetailsModal(true);
  };

  const mapEventToListItem = (e: any): MappedEvent => ({
    id: e.id,
    name: e.title,
    category: e.category || "General",
    categoryColor: "#8B5CF6",
    thumbnail:
      e.posterUrl ||
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=60&fit=crop",
    dateTime: e.date
      ? new Date(e.date).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: true,
        })
      : "TBD",
    venue: e.venue || "TBD",
    registrations: e.registrationsCount || e._count?.registrations || 0,
    capacity: e.maxCapacity || 100,
    status: (e.status || "PUBLISHED").toUpperCase(),
    statusColor: "#10B981",
    lastModified: "Just now",
    isArchived:
      (e.status || "").toUpperCase() === "CANCELLED" ||
      (e.status || "").toUpperCase() === "ARCHIVED",
    originalData: e,
  });

  const handleCopyEvent = async (event: MappedEvent) => {
    const result = await duplicateEvent(event.id);
    if (result.success && result.data) {
      setEventsList((prev) => [mapEventToListItem(result.data), ...prev]);
      showToast("Event duplicated successfully", "success");
      router.refresh();
      return;
    }

    showToast(result.error || "Failed to duplicate event", "error");
  };

  const handleArchive = async (event: MappedEvent) => {
    const isCurrentlyArchived =
      event.status === "CANCELLED" || event.status === "ARCHIVED";
    const newStatus = isCurrentlyArchived ? "PUBLISHED" : "CANCELLED";

    // Optimistic UI update
    setEventsList(
      eventsList.map((e) =>
        e.id === event.id
          ? { ...e, status: newStatus, isArchived: !isCurrentlyArchived }
          : e,
      ),
    );

    const result = await updateEventStatus(event.id, newStatus);

    if (result.success) {
      showToast(
        `Event ${isCurrentlyArchived ? "restored" : "archived"} successfully`,
        isCurrentlyArchived ? "success" : "success",
      );
    } else {
      // Revert on failure
      setEventsList(
        eventsList.map((e) =>
          e.id === event.id
            ? { ...e, status: event.status, isArchived: isCurrentlyArchived }
            : e,
        ),
      );
      showToast(result.error || "Failed to update event status", "error");
    }
  };

  const handleDeleteClick = (event: MappedEvent) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      setIsDeleting(true);
      try {
        const result = await deleteEvent(eventToDelete.id);
        if (result.success) {
          setEventsList((prev) =>
            prev.filter((e) => e.id !== eventToDelete.id),
          );
          showToast("Event deleted successfully", "success");
          router.refresh();
        } else {
          showToast(result.error || "Failed to delete event", "error");
        }
      } catch (error) {
        showToast("An error occurred while deleting the event", "error");
      } finally {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        setEventToDelete(null);
      }
    }
  };

  const filteredEvents = eventsList
    .filter((event: any) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "All" || event.category === selectedFilter;

      // Status Filtering
      const status = (event.status || "").toUpperCase().trim();
      const isDraft = status === "DRAFT";
      const isArchived =
        status === "CANCELLED" || status === "ARCHIVED" || event.isArchived;

      // Explicit view modes
      if (showArchived) return matchesSearch && matchesFilter && isArchived;
      if (showDrafts) return matchesSearch && matchesFilter && isDraft;

      // Default view: neither draft nor archived
      return (
        matchesSearch &&
        matchesFilter &&
        status !== "DRAFT" &&
        status !== "CANCELLED" &&
        status !== "ARCHIVED"
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest-first":
          return (
            new Date(
              b.originalData.createdAt ||
                b.originalData.updatedAt ||
                b.originalData.date ||
                0,
            ).getTime() -
            new Date(
              a.originalData.createdAt ||
                a.originalData.updatedAt ||
                a.originalData.date ||
                0,
            ).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "registrations":
          return b.registrations - a.registrations;
        case "capacity":
          return b.capacity - a.capacity;
        case "status":
          return a.status.localeCompare(b.status);
        case "date":
        default:
          return (
            new Date(a.originalData.date || 0).getTime() -
            new Date(b.originalData.date || 0).getTime()
          );
      }
    });

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
            <th className="text-left py-3 px-6"></th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              EVENT NAME ↓
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              CATEGORY
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              DATE & TIME
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              VENUE
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              REGISTRATIONS
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              LAST MODIFIED
            </th>
            <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280] tracking-wide">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((event: any) => (
            <tr
              key={event.id}
              className="border-b border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
            >
              <td className="py-4 px-6"></td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <img
                    src={event.thumbnail}
                    alt={event.name}
                    className="w-16 h-10 object-cover rounded"
                  />

                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {event.name}
                  </span>
                </div>
              </td>
              <td className="py-4 px-6">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: event.categoryColor }}
                >
                  {event.category}
                </span>
              </td>
              <td className="py-4 px-6 text-sm text-[#6B7280]">
                {event.dateTime}
              </td>
              <td className="py-4 px-6 text-sm text-[#6B7280]">
                {event.venue}
              </td>
              <td className="py-4 px-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1A1A1A] font-semibold">
                      {event.registrations}/{event.capacity}
                    </span>
                    <span className="text-[#6B7280]">
                      {Math.round((event.registrations / event.capacity) * 100)}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(event.registrations / event.capacity) * 100}%`,
                        backgroundColor: event.categoryColor,
                      }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-[#6B7280]">
                {event.lastModified}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(event)}
                    className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  <button
                    onClick={() => handleViewClick(event)}
                    className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  <button
                    onClick={() => handleCopyEvent(event)}
                    className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  <ActionMenu
                    actions={[
                      {
                        label: "View Details",
                        icon: "view",
                        onClick: () => handleViewClick(event),
                      },
                      {
                        label: "Edit Event",
                        icon: "edit",
                        onClick: () => handleEditClick(event),
                      },
                      {
                        label: "Duplicate Event",
                        icon: "copy",
                        onClick: () => handleCopyEvent(event),
                      },
                      { divider: true, onClick: () => {} },
                      {
                        label: "View Registrations",
                        icon: "users",
                        onClick: () =>
                          handleNavigation("all-registrations", {
                            eventId: event.id,
                          }),
                      },
                      {
                        label: event.isArchived
                          ? "Restore Event"
                          : "Archive Event",
                        icon: "archive",
                        onClick: () => handleArchive(event),
                      },
                      {
                        label: "Delete Event",
                        icon: "delete",
                        onClick: () => handleDeleteClick(event),
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />

      <EventDetailsModal
        event={selectedEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
