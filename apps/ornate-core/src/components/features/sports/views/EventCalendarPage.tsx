"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventCalendar } from "@/components/shared/EventCalendar";
import { Modal } from "@/components/Modal";
import { deleteSport } from "@/actions/sportActions";
import { getSportsCalendarEvents } from "@/actions/sportGetters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ConfirmDialog"; // Added import

export function EventCalendarPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null }); // Added state

  // Add Event State
  const [newEvent, setNewEvent] = useState<any>({
    title: "",
    date: "",
    time: "",
    category: "Workshops",
    venue: "",
    capacity: 100,
  });

  const categories = [
    "Workshops",
    "Technical",
    "Non-Technical",
    "Cultural",
    "Sports",
    "Seminars",
  ]; // Should ideally come from DB or constants
  const venues = [
    "Main Auditorium",
    "Seminar Hall 1",
    "Seminar Hall 2",
    "Ground",
    "Indoor Stadium",
    "Online",
  ];

  const handleAddEvent = () => {
    // This is a mock implementation as seen in the original file
    // Ideally this should call an API action
    showToast(
      "Event creation is not fully implemented in this prototype",
      "info",
    );
    setShowAddEventModal(false);
    setNewEvent({
      title: "",
      date: "",
      time: "",
      category: "Workshops",
      venue: "",
      capacity: 100,
    });
  };

  // Modified handleDeleteEvent to open the confirmation dialog
  const handleDeleteEvent = (eventId: any) => {
    setDeleteModal({ isOpen: true, id: eventId });
  };

  // New function to handle the actual deletion after confirmation
  const confirmDelete = async () => {
    const eventIdToDelete = deleteModal.id;
    setDeleteModal({ isOpen: false, id: null }); // Close modal and reset id

    if (!eventIdToDelete) {
      return;
    }

    try {
      const result = await deleteSport(eventIdToDelete);
      if (result.success) {
        showToast("Event deleted successfully", "success");
        // The calendar component fetches events, so we might need to trigger a refetch
        // But since fetchEvents is a prop, we can't easily trigger it from outside unless we lift state.
        // However, the unified component handles internal state.
        // We might need a key to force re-render or a ref.
        // For now, reload window or router refresh
        location.reload();
      } else {
        showToast(result.error || "Failed to delete event", "error");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event", "error");
    }
  };

  const handleEditEvent = (event: any) => {
    router.push(`/branch-admin/events/create?id=${event.id}`);
  };

  return (
    <>
      <EventCalendar
        fetchEvents={getSportsCalendarEvents as any}
        config={{
          title: "Event Calendar",
          description: "View and manage all scheduled events",
          showAddEvent: true,
          showFilters: true,
          onAddEvent: () => setShowAddEventModal(true),
          onEditEvent: handleEditEvent,
          onDeleteEvent: handleDeleteEvent,
        }}
      />

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Add New Event"
        onConfirm={handleAddEvent}
        confirmText="Add Event"
        confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              placeholder="Enter event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Date
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Time
              </label>
              <input
                type="text"
                value={newEvent.time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, time: e.target.value })
                }
                className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                placeholder="e.g. 10:00 AM - 12:00 PM"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Category
              </label>
              <Select
                value={newEvent.category}
                onValueChange={(value) =>
                  setNewEvent({ ...newEvent, category: value })
                }
              >
                <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.map((c: any) => (
                    <SelectItem key={c} value={c} className="cursor-pointer">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Venue
              </label>
              <Select
                value={newEvent.venue}
                onValueChange={(value) =>
                  setNewEvent({ ...newEvent, venue: value })
                }
              >
                <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="Select Venue" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {venues.map((v: any) => (
                    <SelectItem key={v} value={v} className="cursor-pointer">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        type="danger"
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </>
  );
}
