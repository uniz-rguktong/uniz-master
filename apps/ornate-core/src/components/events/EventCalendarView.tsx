"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

const calendarEvents = [
  {
    id: 1,
    name: "AI/ML Workshop",
    category: "Workshops",
    color: "#8B5CF6",
    date: 15,
    time: "10:00 AM",
    isArchived: false,
  },
  {
    id: 2,
    name: "Tech Quiz",
    category: "Quizzes",
    color: "#F59E0B",
    date: 18,
    time: "2:00 PM",
    isArchived: true,
  },
  {
    id: 3,
    name: "Hackathon",
    category: "Hackathons",
    color: "#EF4444",
    date: 20,
    time: "9:00 AM",
    isArchived: false,
  },
  {
    id: 4,
    name: "Robotics Challenge",
    category: "Technical",
    color: "#3B82F6",
    date: 22,
    time: "11:00 AM",
    isArchived: false,
  },
  {
    id: 5,
    name: "Gaming Tournament",
    category: "Fun Games",
    color: "#10B981",
    date: 25,
    time: "3:00 PM",
    isArchived: true,
  },
  {
    id: 6,
    name: "Project Expo",
    category: "Project Expo",
    color: "#06B6D4",
    date: 28,
    time: "10:00 AM",
    isArchived: false,
  },
];

import { getCategoryColor } from "@/lib/constants";
import { formatTimeTo12h } from "@/lib/dateUtils";

interface EventCalendarViewProps {
  events?: Array<Record<string, any>>;
  selectedFilter?: string;
  showArchived?: boolean;
  showDrafts?: boolean;
}

export function EventCalendarView({
  events = [],
  selectedFilter,
  showArchived,
  showDrafts,
}: EventCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("Month");
  const { toast, showToast, hideToast } = useToast();

  const getDaysInMonth = (date: any) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

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

  const allMappedEvents =
    events.length > 0
      ? events.map((e) => {
          const parsedDate = e.date ? new Date(e.date) : null;
          return {
            ...e,
            id: e.id,
            name: e.title || e.name,
            category: e.category || "General",
            color: getCategoryColor(e.category),
            date:
              parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.getDate()
                : null,
            month:
              parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.getMonth()
                : null,
            year:
              parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.getFullYear()
                : null,
            time: formatTimeTo12h(e.time || e.startTime),
            status: e.status || "PUBLISHED",
            isArchived: e.status === "CANCELLED" || e.status === "ARCHIVED",
          };
        })
      : calendarEvents.map((e) => ({
          ...e,
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
        }));

  const getWeekStart = (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getWeekDays = (date: Date) => {
    const weekStart = getWeekStart(date);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return day;
    });
  };

  const getEventsForDay = (day: any) => {
    return allMappedEvents.filter((event: any) => {
      const isDraft = event.status?.toUpperCase() === "DRAFT";
      const isArchived =
        event.isArchived ||
        event.status?.toUpperCase() === "CANCELLED" ||
        event.status?.toUpperCase() === "ARCHIVED";

      const sameDay =
        event.date === day &&
        (event.month === undefined ||
          event.month === null ||
          event.month === currentDate.getMonth()) &&
        (event.year === undefined ||
          event.year === null ||
          event.year === currentDate.getFullYear());

      if (!sameDay) return false;

      if (showArchived)
        return (
          isArchived &&
          (selectedFilter === "All" || event.category === selectedFilter)
        );
      if (showDrafts)
        return (
          isDraft &&
          (selectedFilter === "All" || event.category === selectedFilter)
        );

      return (
        !isDraft &&
        !isArchived &&
        (selectedFilter === "All" || event.category === selectedFilter)
      );
    });
  };

  const getEventsForExactDate = (date: Date) => {
    return allMappedEvents.filter((event: any) => {
      const isDraft = event.status?.toUpperCase() === "DRAFT";
      const isArchived =
        event.isArchived ||
        event.status?.toUpperCase() === "CANCELLED" ||
        event.status?.toUpperCase() === "ARCHIVED";

      const isSameDate =
        event.date === date.getDate() &&
        event.month === date.getMonth() &&
        event.year === date.getFullYear();

      if (!isSameDate) return false;

      if (showArchived)
        return (
          isArchived &&
          (selectedFilter === "All" || event.category === selectedFilter)
        );
      if (showDrafts)
        return (
          isDraft &&
          (selectedFilter === "All" || event.category === selectedFilter)
        );

      return (
        !isDraft &&
        !isArchived &&
        (selectedFilter === "All" || event.category === selectedFilter)
      );
    });
  };

  const previousPeriod = () => {
    if (view === "Month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
      return;
    }

    if (view === "Week") {
      const previousWeek = new Date(currentDate);
      previousWeek.setDate(previousWeek.getDate() - 7);
      setCurrentDate(previousWeek);
      return;
    }

    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setCurrentDate(previousDay);
  };

  const nextPeriod = () => {
    if (view === "Month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
      return;
    }

    if (view === "Week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
      return;
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
  };

  const getHeaderLabel = () => {
    if (view === "Month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    if (view === "Week") {
      const weekDays = getWeekDays(currentDate);
      const first = weekDays[0];
      const last = weekDays[6];
      return `${first?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${last?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }

    return currentDate.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            {getHeaderLabel()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousPeriod}
              className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {["Month", "Week", "Day"].map((v: any) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                view === v
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#F7F8FA] text-[#6B7280] hover:bg-[#F3F4F6]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid Container */}
      {view === "Month" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden min-w-200">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day: any) => (
                <div
                  key={day}
                  className="bg-[#F7F8FA] px-4 py-3 text-center text-xs font-semibold text-[#6B7280]"
                >
                  {day}
                </div>
              ),
            )}

            {/* Empty Days */}
            {emptyDays.map((_: any, index: any) => (
              <div
                key={`empty-${index}`}
                className="bg-white p-3 min-h-30"
              ></div>
            ))}

            {/* Calendar Days */}
            {days.map((day: any) => {
              const dayEvents = getEventsForDay(day);
              const now = new Date();
              const isToday =
                now.getDate() === day &&
                now.getMonth() === currentDate.getMonth() &&
                now.getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  className={`bg-white p-3 min-h-30 hover:bg-[#F7F8FA] transition-colors cursor-pointer ${isToday ? "ring-2 ring-[#1A1A1A] ring-inset" : ""}`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${isToday ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event: any) => (
                      <div
                        key={event.id}
                        onClick={() =>
                          showToast(`${event.name} - ${event.time}`, "info")
                        }
                        className="px-2 py-1 rounded text-xs font-medium text-white truncate hover:opacity-80 cursor-pointer transition-opacity"
                        style={{ backgroundColor: event.color }}
                        title={`${event.name} - ${event.time}`}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "Week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {getWeekDays(currentDate).map((date, index) => {
            const dayEvents = getEventsForExactDate(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={index}
                className={`border border-[#E5E7EB] rounded-lg p-3 bg-white ${isToday ? "ring-2 ring-[#1A1A1A] ring-inset" : ""}`}
              >
                <div className="text-xs font-semibold text-[#6B7280] mb-2">
                  {date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="space-y-1">
                  {dayEvents.length === 0 && (
                    <div className="text-xs text-[#9CA3AF]">No events</div>
                  )}
                  {dayEvents.map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() =>
                        showToast(`${event.name} - ${event.time}`, "info")
                      }
                      className="px-2 py-1 rounded text-xs font-medium text-white truncate hover:opacity-80 cursor-pointer transition-opacity"
                      style={{ backgroundColor: event.color }}
                      title={`${event.name} - ${event.time}`}
                    >
                      {event.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "Day" && (
        <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
          <div className="text-sm font-semibold text-[#1A1A1A] mb-3">
            {currentDate.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="space-y-2">
            {getEventsForExactDate(currentDate).length === 0 && (
              <div className="text-sm text-[#9CA3AF]">
                No events for this day.
              </div>
            )}
            {getEventsForExactDate(currentDate).map((event: any) => (
              <div
                key={event.id}
                onClick={() =>
                  showToast(`${event.name} - ${event.time}`, "info")
                }
                className="px-3 py-2 rounded text-sm font-medium text-white hover:opacity-90 cursor-pointer transition-opacity"
                style={{ backgroundColor: event.color }}
                title={`${event.name} - ${event.time}`}
              >
                {event.name} • {event.time}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
        <div className="text-xs font-semibold text-[#6B7280] w-full sm:w-auto">
          CATEGORIES:
        </div>
        {[
          { name: "Technical", color: "#3B82F6" },
          { name: "Fun Games", color: "#10B981" },
          { name: "Workshops", color: "#8B5CF6" },
          { name: "Hackathons", color: "#EF4444" },
          { name: "Quizzes", color: "#F59E0B" },
          { name: "Project Expo", color: "#06B6D4" },
        ].map((category) => (
          <div key={category.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: category.color }}
            ></div>
            <span className="text-xs text-[#6B7280]">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
