"use client";

import type { CalendarEvent } from "../types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((event: any) => event.date.startsWith(dateStr));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-7 bg-[#F7F8FA] border-b border-[#E5E7EB]">
          {dayNames.map((day: any) => (
            <div
              key={day}
              className="py-3 px-2 text-center text-xs font-semibold text-[#6B7280] tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_: any, index: any) => (
            <div
              key={`empty-${index}`}
              className="min-h-[120px] border-r border-b border-[#E5E7EB] bg-[#FAFAFA]"
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_: any, index: any) => {
            const day = index + 1;
            const dayEvents = getEventsForDate(day);
            const isToday =
              new Date().toDateString() ===
              new Date(year, month, day).toDateString();

            return (
              <div
                key={day}
                className={`min-h-[120px] border-r border-b border-[#E5E7EB] p-2 hover:bg-[#F7F8FA] transition-colors ${isToday ? "bg-[#EFF6FF]" : ""}`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${isToday ? "w-6 h-6 bg-[#3B82F6] text-white rounded-full flex items-center justify-center" : "text-[#1A1A1A]"}`}
                >
                  {day}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event: any) => (
                    <div
                      key={event.id}
                      className="text-[10px] px-2 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.categoryColor }}
                      onClick={() => onEventClick(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-[#6B7280] pl-1 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
