"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CalendarViewType,
  CalendarEvent,
  EventCalendarConfig,
} from "./types";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"; // Added Filter icon
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { usePathname, useRouter } from "next/navigation";

import { MonthView } from "./components/MonthView";
import { ListView } from "./components/ListView";
import { WeekView } from "./components/WeekView"; // New
import { EventDetailsPanel } from "./components/EventDetailsPanel";
import { FilterModal, type FilterState } from "./components/FilterModal"; // New

interface EventCalendarProps {
  config?: EventCalendarConfig;
  initialEvents?: CalendarEvent[];
  fetchEvents?: () => Promise<{
    success: boolean;
    data?: CalendarEvent[];
    error?: string;
  }>;
}

export default function EventCalendar({
  config = {},
  initialEvents = [],
  fetchEvents,
}: EventCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(!initialEvents.length);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>(
    config.defaultView || "month",
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    startDate: "",
    endDate: "",
    venue: "",
  });

  const loadEvents = useCallback(async () => {
    if (!fetchEvents) return;
    setIsLoading(true);
    try {
      const result = await fetchEvents();
      if (result.success && result.data) {
        setEvents(result.data);
      } else {
        showToast(result.error || "Failed to load events", "error");
      }
    } catch (error) {
      showToast("Error fetching events", "error");
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents, showToast]);

  useEffect(() => {
    if (!initialEvents.length) {
      loadEvents();
    }
  }, [loadEvents, initialEvents.length]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const navigateDate = (direction: "next" | "prev") => {
    const newDate = new Date(currentDate);
    if (viewType === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      if (direction === "next") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
    }
    setCurrentDate(newDate);
  };

  // Derived Data for Filters
  const categories = [
    "All",
    ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
  ];
  const venues = Array.from(
    new Set(events.map((e) => e.venue).filter(Boolean)),
  );

  // Filtering Logic
  const filteredEvents = events.filter((event: any) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(event.category)
    )
      return false;
    if (filters.startDate && event.date < filters.startDate) return false;
    if (filters.endDate && event.date > filters.endDate) return false;
    if (filters.venue && event.venue !== filters.venue) return false;
    return true;
  });

  const handleAddEvent = () => {
    if (config.onAddEvent) {
      config.onAddEvent();
      return;
    }
    if (pathname?.startsWith("/branch-admin")) {
      router.push("/branch-admin/events/create");
    }
  };

  return (
    <div className="p-8 animate-page-entrance">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">
            {config.title || "Event Calendar"}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              {config.title || "Event Calendar"}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {config.description || "View and manage scheduled events"}
            </p>
          </div>
          <div className="flex gap-3">
            {config.showFilters && (
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-xl text-sm font-medium hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            )}
            {config.showAddEvent && (
              <button
                onClick={handleAddEvent}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
              >
                Add Event
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F4F2F0] rounded-[24px] p-2 mb-8 animate-card-entrance">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-2 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <div className="px-6 py-2 bg-white border border-[#E5E7EB] rounded-lg min-w-[200px] text-center font-bold text-lg">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {(["month", "week", "list"] as CalendarViewType[]).map(
              (view: any) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    viewType === view
                      ? "bg-[#1A1A1A] text-white shadow-md"
                      : "text-[#6B7280] hover:bg-[#F7F8FA]"
                  }`}
                >
                  {view}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="grid grid-cols-7 gap-4">
              {[...Array(35)].map((_: any, i: any) => (
                <Skeleton key={i} height={100} className="rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {viewType === "month" && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            )}
            {viewType === "week" && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            )}
            {viewType === "list" && (
              <ListView
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            )}
          </>
        )}
      </div>

      <EventDetailsPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={config.onEditEvent} // Pass onEdit from config if available
        onDelete={config.onDeleteEvent} // Pass onDelete from config if available
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setFilters}
        categories={categories}
        venues={venues}
        initialFilters={filters}
      />
    </div>
  );
}
