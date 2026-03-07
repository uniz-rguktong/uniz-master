"use client";
import {
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Edit,
  Eye,
  Copy,
} from "lucide-react";
import { getCategoryColor } from "@/lib/constants";

import { useState } from "react";
import { formatTimeTo12h } from "@/lib/dateUtils";
import { ActionMenu } from "../ActionMenu";
import { useToast } from "@/hooks/useToast";
import { Modal } from "../Modal";
import { ConfirmDialog } from "../ConfirmDialog";
import dynamic from "next/dynamic";

const EventDetailsModal = dynamic(
  () => import("../EventDetailsModal").then((mod) => mod.EventDetailsModal),
  {
    loading: () => null,
  },
);
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  updateEventStatus,
  deleteEvent,
  duplicateEvent,
} from "@/actions/eventActions";

interface RawEvent {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  posterUrl?: string;
  venue?: string;
  date: string;
  time?: string;
  startTime?: string;
  registrationsCount?: number;
  maxCapacity?: number;
  fee?: string;
  status?: string;
  _count?: { registrations?: number };
  [key: string]: unknown;
}

interface MappedEvent {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  poster: string;
  venue: string;
  date: string;
  time: string;
  registrations: number;
  capacity: number;
  fee: string;
  status: string;
  registrationRate: number;
  isArchived: boolean;
  originalData: RawEvent;
}

interface NavigationParams {
  mode?: "edit" | "copy";
  eventData?: MappedEvent;
  searchQuery?: string;
  eventId?: string;
}

interface EventGridViewProps {
  events: RawEvent[];
  searchQuery: string;
  selectedFilter: string;
  onNavigate?: (path: string, params?: NavigationParams) => void;
  showArchived?: boolean;
  showDrafts?: boolean;
  sortBy?: string;
}

export function EventGridView({
  events,
  searchQuery,
  selectedFilter,
  onNavigate,
  showArchived,
  showDrafts,
  sortBy,
}: EventGridViewProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const [eventsList, setEventsList] = useState<MappedEvent[]>([]);

  // Update internal list when props change
  useEffect(() => {
    if (events) {
      // Map Database fields to UI model
      const mappedEvents = events.map((e: any) => {
        const registrations =
          e.registrationsCount || e._count?.registrations || 0;
        const capacity = e.maxCapacity || 100;
        const registrationRate =
          capacity > 0 ? Math.round((registrations / capacity) * 100) : 0;

        return {
          id: e.id,
          name: e.title, // DB uses title, UI uses name
          category: e.category || "General",
          categoryColor: getCategoryColor(e.category),
          poster:
            e.posterUrl ||
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
          venue: e.venue || "TBD",
          date: new Date(e.date).toLocaleDateString(),
          time: formatTimeTo12h(e.time || e.startTime),
          registrations,
          capacity,
          fee: e.fee || "Free",
          status: (e.status || "PUBLISHED").toUpperCase(),
          registrationRate,
          isArchived:
            (e.status || "").toUpperCase() === "CANCELLED" ||
            (e.status || "").toUpperCase() === "ARCHIVED",
          originalData: e,
        };
      });
      setEventsList(mappedEvents);
    }
  }, [events]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MappedEvent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<MappedEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null);

  const filteredEvents = eventsList
    .filter((event: any) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "All" || event.category === selectedFilter;

      const status = (event.status || "").toUpperCase().trim();
      const isDraft = status === "DRAFT";
      const isArchived =
        status === "CANCELLED" || status === "ARCHIVED" || event.isArchived;

      if (showArchived) return matchesSearch && matchesFilter && isArchived;
      if (showDrafts) return matchesSearch && matchesFilter && isDraft;

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

  /* Update handleEditClick to use navigation */
  const router = useRouter();
  const pathname = usePathname();

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
      if (path === "create-event") {
        const mode = params?.mode;
        const eventData = params?.eventData;
        if (mode && eventData) {
          const dataToStore = eventData.originalData || eventData;
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
    handleNavigation("create-event", { mode: "edit", eventData: event });
  };

  const handleViewClick = (event: MappedEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleSaveEdit = () => {
    if (editingEvent) {
      setEventsList(
        eventsList.map((e: any) =>
          e.id === editingEvent.id ? editingEvent : e,
        ),
      );
      setShowEditModal(false);
      showToast(`${editingEvent.name} updated successfully`, "success");
      setEditingEvent(null);
    }
  };

  const mapEventToGridItem = (e: any): MappedEvent => {
    const registrations = e.registrationsCount || e._count?.registrations || 0;
    const capacity = e.maxCapacity || 100;
    const registrationRate =
      capacity > 0 ? Math.round((registrations / capacity) * 100) : 0;

    return {
      id: e.id,
      name: e.title,
      category: e.category || "General",
      categoryColor: getCategoryColor(e.category),
      poster:
        e.posterUrl ||
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
      venue: e.venue || "TBD",
      date: new Date(e.date).toLocaleDateString(),
      time: formatTimeTo12h(e.time || e.startTime),
      registrations,
      capacity,
      fee: e.fee || "Free",
      status: (e.status || "PUBLISHED").toUpperCase(),
      registrationRate,
      isArchived:
        (e.status || "").toUpperCase() === "CANCELLED" ||
        (e.status || "").toUpperCase() === "ARCHIVED",
      originalData: e,
    };
  };

  const handleCopyEvent = async (event: MappedEvent) => {
    const result = await duplicateEvent(event.id);
    if (result.success && result.data) {
      setEventsList((prev) => [mapEventToGridItem(result.data), ...prev]);
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
          router.refresh(); // Refresh server-side data
        } else {
          showToast(result.error || "Failed to delete event", "error");
        }
      } catch (error) {
        showToast("An error occurred while deleting", "error");
      } finally {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        setEventToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event: any) => (
          <div key={event.id} className="group animate-card-entrance">
            {/* Premium Outer Container */}
            <div className="w-full bg-[#F4F2F0] rounded-[18px] p-[10px] flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
              {/* TITLE Section */}
              <h3
                className="text-[16px] font-semibold text-[#1A1A1A] leading-6 px-[12px] py-[4px] mt-[4px] cursor-pointer hover:text-[#3B82F6] transition-colors"
                onClick={() => handleViewClick(event)}
              >
                {event.name}
              </h3>

              {/* Inner Card Container */}
              <div className="bg-white rounded-[14px] p-[10px] flex flex-col gap-4">
                {/* 1. IMAGE SECTION */}
                <div
                  className="relative w-full aspect-16/10 rounded-[12px] overflow-hidden group/thumbnail bg-[#F7F8FA] cursor-pointer"
                  onClick={() => handleViewClick(event)}
                >
                  <img
                    src={event.poster}
                    alt={event.name}
                    className="w-full h-full object-cover rounded-[12px] transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Category Badge - Top Left */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: event.categoryColor }}
                  >
                    {event.category}
                  </div>
                </div>

                {/* 2. STATS & ACTION ROW */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {event.registrations}/{event.capacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{event.fee}</span>
                    </div>
                  </div>

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

                {/* 3. EVENT INFO GRID */}
                <div className="space-y-2 px-1">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[#6B7280] leading-tight">
                      {event.venue}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-[#6B7280] leading-tight">
                      {event.date} • {event.time}
                    </span>
                  </div>
                </div>

                {/* 4. PROGRESS BAR */}
                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">
                      Registration Fill
                    </span>
                    <span className="text-[10px] font-black text-[#1A1A1A]">
                      {event.registrationRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${event.registrationRate}%`,
                        backgroundColor: event.categoryColor,
                      }}
                    />
                  </div>
                </div>

                {/* 5. ACTION BUTTON ROW */}
                <div className="flex gap-2 pt-2 border-t border-[#E8EAED]">
                  <button
                    onClick={() => handleViewClick(event)}
                    className="flex-1 h-9 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                  >
                    <Eye className="w-4 h-4 text-[#374151] group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#374151]">
                      Details
                    </span>
                  </button>
                  <button
                    onClick={() => handleEditClick(event)}
                    className="flex-1 h-9 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                  >
                    <Edit className="w-4 h-4 text-[#374151] group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-[#374151]">
                      Edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopyEvent(event)}
                    className="w-9 h-9 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all flex items-center justify-center active:scale-95 group/btn"
                  >
                    <Copy className="w-4 h-4 text-[#374151] group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal && !!editingEvent}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        title="Edit Event"
        onConfirm={handleSaveEdit}
        confirmText="Save Changes"
        confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
        size="lg"
      >
        {editingEvent && (
          <div className="space-y-4">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Event Name
              </label>
              <input
                type="text"
                value={editingEvent.name}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Category
              </label>
              <select
                value={editingEvent.category}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, category: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option value="Technical">Technical</option>
                <option value="Workshops">Workshops</option>
                <option value="Hackathons">Hackathons</option>
                <option value="Quizzes">Quizzes</option>
                <option value="Fun Games">Fun Games</option>
                <option value="Project Expo">Project Expo</option>
              </select>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Venue
              </label>
              <input
                type="text"
                value={editingEvent.venue}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, venue: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value={editingEvent.date}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Time
                </label>
                <input
                  type="text"
                  value={editingEvent.time}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, time: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={editingEvent.capacity}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    capacity: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Fee
              </label>
              <input
                type="text"
                value={editingEvent.fee}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, fee: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent?.originalData || selectedEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
      />
    </>
  );
}
