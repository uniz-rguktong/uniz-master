'use client';

import { ChevronLeft, ChevronRight, Trophy, Calendar, MapPin, Clock, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { formatTimeTo12h } from '@/lib/dateUtils';

interface CalendarSport {
  id: string;
  name: string;
  category: string;
  date: string;
  time?: string;
  venue?: string;
  isArchived?: boolean;
}

interface CalendarMatch {
  id: string;
  sport: string;
  gender?: string;
  round?: string;
  date: string;
  time?: string;
  venue?: string;
  team1Name?: string;
  team2Name?: string;
  status?: string;
}

interface SportsCalendarViewProps {
  sports?: CalendarSport[];
  matches?: CalendarMatch[];
  selectedFilter: string;
  showArchived?: boolean;
  variant?: 'default' | 'sports-admin';
}

type CalendarView = 'Month' | 'Week' | 'Day';

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Indoor':
      return '#8B5CF6';
    case 'Outdoor':
      return '#10B981';
    case 'Athletics':
      return '#EF4444';
    case 'Boys':
      return '#3B82F6';
    case 'Girls':
      return '#EC4899';
    default:
      return '#6366F1';
  }
};

const isSameDate = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const startOfWeek = (date: Date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  base.setDate(base.getDate() - day);
  base.setHours(0, 0, 0, 0);
  return base;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const formatWeekLabel = (date: Date) => {
  const weekStart = startOfWeek(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startText = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endText = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startText} - ${endText}`;
};

export function SportsCalendarView({ sports, matches, selectedFilter, showArchived, variant = 'default' }: SportsCalendarViewProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [view, setView] = useState<CalendarView>('Month');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const safeSports = sports || [];
  const safeMatches = matches || [];

  const calendarItems = useMemo(() => {
    return safeMatches.length > 0
      ? safeMatches.map((match) => ({
        id: match.id,
        name: `${match.team1Name || 'TBD'} vs ${match.team2Name || 'TBD'}`,
        category: match.gender || 'Mixed',
        date: match.date,
        time: formatTimeTo12h(match.time),
        venue: match.venue,
        isArchived: false,
        sport: match.sport,
        round: match.round,
        status: match.status,
        team1Name: match.team1Name,
        team2Name: match.team2Name,
      }))
      : safeSports.map((sport) => ({
        ...sport,
        time: formatTimeTo12h(sport.time),
      }));
  }, [safeMatches, safeSports]);

  const filteredItems = useMemo(() => {
    return calendarItems
      .filter((item: any) => {
        const isArchivedMatch = (!!item.isArchived) === (showArchived || false);
        const isCategoryMatch = safeMatches.length > 0 || selectedFilter === 'All' || item.category === selectedFilter;
        return isArchivedMatch && isCategoryMatch;
      })
      .map((item: any) => ({
        ...item,
        color: getCategoryColor(item.category),
      }));
  }, [calendarItems, selectedFilter, showArchived, safeMatches.length]);

  const getEventsForDate = (targetDate: Date) =>
    filteredItems.filter((item: any) => isSameDate(new Date(item.date), targetDate));

  const previousPeriod = () => {
    const next = new Date(currentDate);
    if (view === 'Month') next.setMonth(next.getMonth() - 1, 1);
    if (view === 'Week') next.setDate(next.getDate() - 7);
    if (view === 'Day') next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (view === 'Month') next.setMonth(next.getMonth() + 1, 1);
    if (view === 'Week') next.setDate(next.getDate() + 7);
    if (view === 'Day') next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const calendarTitle = view === 'Month' ? formatMonthLabel(currentDate) : view === 'Week' ? formatWeekLabel(currentDate) : formatDayLabel(currentDate);
  const isSportsAdminVariant = variant === 'sports-admin';

  const renderEventChip = (event: any) => (
    <button
      key={event.id}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEvent(event);
      }}
      className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl border border-transparent transition-all hover:bg-white hover:shadow-sm bg-[#F9FAFB]"
      style={{ borderLeft: `4px solid ${event.color}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold text-[#1A1A1A] truncate">{event.name}</div>
        <div className="text-[10px] text-[#6B7280] mt-0.5">{formatTimeTo12h(event.time)}</div>
      </div>
    </button>
  );

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

    return (
      <div className={`overflow-x-auto ${isSportsAdminVariant ? 'rounded-[12px] border border-[#D1D5DB]' : 'rounded-[20px] border border-[#E5E7EB] p-1'}`}>
        <div className={`grid grid-cols-7 gap-px min-w-[800px] ${isSportsAdminVariant ? 'bg-[#D1D5DB]' : 'bg-[#F3F4F6]'}`}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div key={day} className={`${isSportsAdminVariant ? 'bg-[#F3F4F6] py-3 text-sm font-semibold text-[#6B7280]' : 'bg-white py-3 text-center text-[10px] font-bold text-[#6B7280] tracking-wider'} text-center`}>
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className={`bg-white ${isSportsAdminVariant ? 'h-36' : 'h-32'}`} />
          ))}

          {days.map((day) => {
            const dayDate = new Date(year, month, day);
            const dayEvents = getEventsForDate(dayDate);
            const isToday = isSameDate(dayDate, today);

            return (
              <div
                key={day}
                className={`bg-white p-3 ${isSportsAdminVariant ? 'min-h-[138px]' : 'min-h-[140px]'} ${isToday && !isSportsAdminVariant ? 'ring-1 ring-[#10B981]/30 bg-[#ECFDF5]' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isToday && !isSportsAdminVariant ? 'text-[#047857]' : 'text-[#1A1A1A]'}`}>{day}</span>
                  {dayEvents.length > 0 && <span className="text-[10px] text-[#6B7280]">{dayEvents.length}</span>}
                </div>
                <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">{dayEvents.map(renderEventChip)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return day;
    });

    if (isSportsAdminVariant) {
      return (
        <div className="overflow-x-auto rounded-[12px] border border-[#D1D5DB]">
          <div className="grid grid-cols-7 gap-px min-w-[800px] bg-[#D1D5DB]">
            {weekDays.map((day) => (
              <div key={`head-${day.toISOString()}`} className="bg-[#F3F4F6] py-3 text-center text-sm font-semibold text-[#6B7280]">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
            ))}
            {weekDays.map((day) => {
              const events = getEventsForDate(day);
              return (
                <div key={day.toISOString()} className="bg-white p-3 min-h-[138px]">
                  <div className="text-sm font-bold text-[#1A1A1A] mb-2">{day.getDate()}</div>
                  <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1">{events.map(renderEventChip)}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const events = getEventsForDate(day);
          const isToday = isSameDate(day, today);
          return (
            <div key={day.toISOString()} className={`rounded-2xl border p-3 ${isToday ? 'border-[#10B981] bg-[#ECFDF5]' : 'border-[#E5E7EB] bg-white'}`}>
              <div className="mb-3">
                <div className="text-[10px] font-bold text-[#6B7280] uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="text-sm font-bold text-[#1A1A1A]">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {events.length > 0 ? events.map(renderEventChip) : <div className="text-xs text-[#9CA3AF]">No events</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    if (isSportsAdminVariant) {
      return (
        <div className="overflow-x-auto rounded-[12px] border border-[#D1D5DB]">
          <div className="grid grid-cols-1 min-w-[320px] bg-[#D1D5DB] gap-px">
            <div className="bg-[#F3F4F6] py-3 text-center text-sm font-semibold text-[#6B7280]">
              {currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
            </div>
            <div className="bg-white p-4 min-h-[220px]">
              <div className="text-sm font-bold text-[#1A1A1A] mb-3">{currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div className="space-y-2">{events.length > 0 ? events.map(renderEventChip) : <div className="text-sm text-[#9CA3AF]">No events scheduled for this day.</div>}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{formatDayLabel(currentDate)}</h3>
        </div>
        <div className="space-y-3">
          {events.length > 0 ? events.map(renderEventChip) : <div className="text-sm text-[#9CA3AF]">No events scheduled for this day.</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className={`${isSportsAdminVariant ? 'text-[36px] font-bold' : 'text-xl md:text-2xl font-semibold'} text-[#1A1A1A]`}>{calendarTitle}</h2>
          <button onClick={previousPeriod} className={`${isSportsAdminVariant ? 'p-1 border-none' : 'p-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB]'} transition-colors`} aria-label="Previous period">
            <ChevronLeft className={`${isSportsAdminVariant ? 'w-4 h-4 text-[#6B7280]' : 'w-5 h-5 text-[#1A1A1A]'}`} />
          </button>
          <button onClick={nextPeriod} className={`${isSportsAdminVariant ? 'p-1 border-none' : 'p-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB]'} transition-colors`} aria-label="Next period">
            <ChevronRight className={`${isSportsAdminVariant ? 'w-4 h-4 text-[#6B7280]' : 'w-5 h-5 text-[#1A1A1A]'}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isSportsAdminVariant && (
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
            >
              Today
            </button>
          )}

          <div className={`flex items-center gap-1 p-1 ${isSportsAdminVariant ? 'bg-transparent border-none' : 'bg-[#F9FAFB] border border-[#E5E7EB]'} rounded-xl`}>
            {(['Month', 'Week', 'Day'] as CalendarView[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-5 py-2 rounded-xl text-2xs sm:text-sm font-semibold transition-colors ${view === mode ? 'bg-[#1A1A1A] text-white' : 'text-[#6B7280] bg-[#F3F4F6] hover:text-[#1A1A1A]'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'Month' && renderMonthView()}
      {view === 'Week' && renderWeekView()}
      {view === 'Day' && renderDayView()}

      {!isSportsAdminVariant && (
        <div className="flex items-center justify-between gap-4 text-xs text-[#6B7280] border-t border-[#E5E7EB] pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{filteredItems.length} total {safeMatches.length > 0 ? 'matches' : 'events'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>Click event to view details</span>
          </div>
        </div>
      )}

      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event Details"
          size="md"
          hideHeader
        >
          <div className="p-5 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-2 top-2 p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>

            <div className="mb-5 pr-8">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: getCategoryColor(selectedEvent.category) }}>
                {safeMatches.length > 0 ? `${selectedEvent.sport || 'Match'} ${selectedEvent.round ? `• ${selectedEvent.round}` : ''}` : selectedEvent.category}
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] leading-tight">{selectedEvent.name}</h3>
              {selectedEvent.status && (
                <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-[#F3F4F6] text-xs font-medium text-[#4B5563]">
                  {selectedEvent.status}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                  <Calendar className="w-4 h-4" /> Date
                </div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{new Date(selectedEvent.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                  <Clock className="w-4 h-4" /> Time
                </div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{selectedEvent.time || 'TBD'}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white sm:col-span-2">
                <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                  <MapPin className="w-4 h-4" /> Venue
                </div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{selectedEvent.venue || 'TBD'}</div>
              </div>
              {selectedEvent.team1Name || selectedEvent.team2Name ? (
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white sm:col-span-2">
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                    <Trophy className="w-4 h-4" /> Matchup
                  </div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">
                    {(selectedEvent.team1Name || 'TBD')} vs {(selectedEvent.team2Name || 'TBD')}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
