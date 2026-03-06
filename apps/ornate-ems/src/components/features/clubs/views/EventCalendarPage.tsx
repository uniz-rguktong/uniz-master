'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, X, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getCalendarEvents } from '@/actions/eventGetters';
import { deleteEvent } from '@/actions/eventActions';
import { useRouter } from 'next/navigation';

const getDaysInMonth = (year: any, month: any) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: any, month: any) => {
  return new Date(year, month, 1).getDay();
};

const getWeekDays = (date: any) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

export function EventCalendarPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getCalendarEvents();
      if (result.success && result.data) {
        setEvents(result.data);
      } else {
        console.error('Failed to load events:', (result as any).error);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Modal Logic
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<any>({
    categories: [],
    startDate: '',
    endDate: '',
    venue: ''
  });
  const [appliedFilters, setAppliedFilters] = useState<any>({
    categories: [],
    startDate: '',
    endDate: '',
    venue: ''
  });

  // Add Event Modal Logic
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<any>({
    title: '',
    date: '',
    time: '',
    category: 'Workshops',
    venue: '',
    capacity: 100
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekDays = getWeekDays(currentDate);

  const eventCategories = [...new Set(events.map(e => e.category))];
  const categories = ['All', ...eventCategories];
  const venues = [...new Set(events.map(e => e.venue))];
  // Week View Helpers
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM'];


  const getEventStyle = (event: any) => {
    // Simple parsing to determine start row and duration
    // This is a simplified version for prototype purposes
    const startTimeParts = event.time.split('-')[0].trim().split(' ');
    let startHour = parseInt(startTimeParts[0].split(':')[0]);
    if (startTimeParts[1] === 'PM' && startHour !== 12) startHour += 12;
    if (startTimeParts[1] === 'AM' && startHour === 12) startHour = 0;

    // Assume start of day is 8 AM
    const offset = startHour - 8;
    const top = Math.max(0, offset * 60); // 60px per hour

    return {
      top: `${top}px`,
      height: '60px', // Default height
      backgroundColor: event.categoryColor
    };
  };

  const handleDeleteEvent = async (eventId: any) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteEvent(eventId);
      if (result.success) {
        setSelectedEvent(null);
        await loadEvents();
        alert('Event deleted successfully!');
      } else {
        alert('Error: ' + (result.error || 'Failed to delete event'));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleAddEvent = () => {
    const event = {
      id: events.length + 1,
      ...newEvent,
      categoryColor: '#3B82F6', // Default color
      registrations: 0
    };
    setEvents([...events, event]);
    setShowAddEventModal(false);
    setNewEvent({ title: '', date: '', time: '', category: 'Workshops', venue: '', capacity: 100 });
  };

  const filteredEvents = events.filter((event: any) => {
    // Quick category filter
    if (selectedCategory !== 'All' && event.category !== selectedCategory) return false;

    // Advanced filters
    if (appliedFilters.categories.length > 0 && !appliedFilters.categories.includes(event.category)) return false;

    if (appliedFilters.startDate && event.date < appliedFilters.startDate) return false;
    if (appliedFilters.endDate && event.date > appliedFilters.endDate) return false;

    if (appliedFilters.venue && event.venue !== appliedFilters.venue) return false;

    return true;
  });

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    const clearState = { categories: [], startDate: '', endDate: '', venue: '' };
    setTempFilters(clearState);
    setAppliedFilters(clearState);
  };

  const getEventsForDate = (day: any) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((event: any) => event.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];


  return (
    <>
      <div className="p-4 md:p-8 animate-page-entrance">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
            <span>Dashboard</span>
            <span>›</span>
            <span>Schedule & Roadmap</span>
            <span>›</span>
            <span className="text-[#1A1A1A] font-medium">Event Calendar</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Event Calendar</h1>
              <p className="text-sm text-[#6B7280]">View and manage all scheduled events</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((category: any) =>
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category ?
                  'bg-[#1A1A1A] text-white' :
                  'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
                }>

                {category}
              </button>
            )}
          </div>
        </div>

        {/* Calendar Card - Two Layer Design */}
        <div className="bg-[#F4F2F0] rounded-[16px] p-2 animate-card-entrance" style={{ animationDelay: '50ms' }}>
          {/* Controls Section - Inside Main Card */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-[8px] px-2 md:px-[12px] py-2">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <button
                onClick={previousMonth}
                className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">

                <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
              </button>

              <div className="px-6 py-2 bg-white border border-[#E5E7EB] rounded-lg min-w-[150px] text-center">
                <span className="text-lg font-semibold text-[#1A1A1A]">
                  {monthNames[month]} {year}
                </span>
              </div>

              <button
                onClick={nextMonth}
                className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">

                <ChevronRight className="w-5 h-5 text-[#1A1A1A]" />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">

                Today
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-lg p-1 w-full sm:w-auto justify-center">
              {['month', 'week', 'list'].map((view: any) =>
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded text-sm font-medium transition-colors capitalize ${viewType === view ?
                    'bg-[#1A1A1A] text-white' :
                    'text-[#6B7280] hover:bg-[#F7F8FA]'}`
                  }>

                  {view}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inner White Card - Calendar Content */}
        <div className="bg-white rounded-[14px] overflow-hidden w-full">
          {isLoading ? (
            <div className="p-4 md:p-8 space-y-4">
              {viewType === 'month' ? (
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <div className="grid grid-cols-7 bg-[#F7F8FA] border-b border-[#E5E7EB]">
                    {[...Array(7)].map((_: any, i: any) => (
                      <div key={i} className="py-3 px-2 flex justify-center">
                        <Skeleton width={40} height={12} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {[...Array(35)].map((_: any, i: any) => (
                      <div key={i} className="min-h-[120px] border-r border-b border-[#E5E7EB] p-2">
                        <Skeleton width={20} height={20} borderRadius="50%" className="mb-2" />
                        <Skeleton width="90%" height={24} borderRadius={4} className="mb-1" />
                        <Skeleton width="70%" height={24} borderRadius={4} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewType === 'list' ? (
                [...Array(5)].map((_: any, i: any) => (
                  <div key={i} className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] p-6 flex items-start gap-6">
                    <Skeleton width={80} height={80} borderRadius={12} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton width="40%" height={20} />
                        <Skeleton width={80} height={18} borderRadius={12} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <Skeleton width="80%" height={14} />
                        <Skeleton width="80%" height={14} />
                        <Skeleton width="80%" height={14} />
                      </div>
                      <Skeleton width={256} height={8} borderRadius={4} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[600px] border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <div className="w-20 border-r border-[#E5E7EB]">
                    <div className="h-12 border-b border-[#E5E7EB]"></div>
                    {[...Array(12)].map((_: any, i: any) => (
                      <div key={i} className="h-[60px] p-2 flex flex-col items-end">
                        <Skeleton width={40} height={10} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-7">
                    {[...Array(7)].map((_: any, i: any) => (
                      <div key={i} className="border-r border-[#E5E7EB]">
                        <div className="h-12 border-b border-[#E5E7EB] bg-[#F7F8FA] flex flex-col items-center justify-center p-2">
                          <Skeleton width={30} height={10} className="mb-1" />
                          <Skeleton width={24} height={24} borderRadius="50%" />
                        </div>
                        <div className="p-2 space-y-2">
                          <Skeleton width="100%" height={60} borderRadius={4} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Month View */}
              {viewType === 'month' &&
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 bg-[#F7F8FA] border-b border-[#E5E7EB]">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: any) =>
                        <div key={day} className="py-3 px-2 text-center text-xs font-semibold text-[#6B7280] tracking-wide">
                          {day}
                        </div>
                      )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: firstDay }).map((_: any, index: any) =>
                        <div key={`empty-${index}`} className="min-h-[120px] border-r border-b border-[#E5E7EB] bg-[#FAFAFA]" />
                      )}

                      {/* Calendar days */}
                      {Array.from({ length: daysInMonth }).map((_: any, index: any) => {
                        const day = index + 1;
                        const dayEvents = getEventsForDate(day);
                        const isToday = day === 6 && month === 10 && year === 2025; // Highlighting Nov 6, 2025

                        return (
                          <div
                            key={day}
                            className={`min-h-[120px] border-r border-b border-[#E5E7EB] p-2 hover:bg-[#F7F8FA] transition-colors ${isToday ? 'bg-[#EFF6FF]' : ''}`
                            }>

                            <div className={`text-sm font-semibold mb-1 ${isToday ?
                              'w-6 h-6 bg-[#3B82F6] text-white rounded-full flex items-center justify-center' :
                              'text-[#1A1A1A]'}`
                            }>
                              {day}
                            </div>

                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event: any) =>
                                <div
                                  key={event.id}
                                  className="text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: event.categoryColor }}
                                  title={event.title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}>

                                  {event.title}
                                </div>
                              )}
                              {dayEvents.length > 2 &&
                                <div className="text-xs text-[#6B7280] pl-2">
                                  +{dayEvents.length - 2} more
                                </div>
                              }
                            </div>
                          </div>);

                      })}
                    </div>
                  </div>
                </div>
              }

              {/* List View */}
              {viewType === 'list' &&
                <div className="p-6 space-y-4">
                  {filteredEvents.
                    sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).
                    map((event) =>
                      <div
                        key={event.id}
                        className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] p-4 sm:p-6 hover:shadow-md transition-all">

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                          {/* Date Badge */}
                          <div className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-xl border border-[#E5E7EB]">
                            <div className="text-sm text-[#6B7280]">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </div>
                            <div className="text-2xl font-bold text-[#1A1A1A]">
                              {new Date(event.date).getDate()}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                              <h3 className="text-lg font-semibold text-[#1A1A1A]">
                                {event.title}
                              </h3>
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                                style={{ backgroundColor: event.categoryColor }}>

                                {event.category}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-[#6B7280]">
                                <Clock className="w-4 h-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[#6B7280]">
                                <MapPin className="w-4 h-4" />
                                <span>{event.venue}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[#6B7280]">
                                <Users className="w-4 h-4" />
                                <span>{event.registrations}/{event.capacity} registered</span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 w-64">
                              <div className="h-2 bg-white rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${event.registrations / event.capacity * 100}%`,
                                    backgroundColor: event.categoryColor
                                  }} />

                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEventClick(event)}
                              className="px-4 py-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                              View Details
                            </button>
                            <button
                              onClick={() => router.push(`/clubs-portal/events/create?id=${event.id}`)}
                              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white rounded-lg text-sm font-medium transition-colors">
                              Edit
                            </button>
                          </div>
                          treasure
                        </div>
                      </div>
                    )}
                </div>
              }

              {viewType === 'week' &&
                <div className="w-full overflow-x-auto">
                  <div className="flex bg-white min-h-[600px] min-w-[800px] overflow-hidden">
                    {/* Time Scale */}
                    <div className="w-20 shrink-0 border-r border-[#E5E7EB]">
                      <div className="h-12 border-b border-[#E5E7EB]"></div>
                      {timeSlots.map((time: any) =>
                        <div key={time} className="h-[60px] text-xs text-[#6B7280] text-right pr-2 pt-2 relative">
                          <span className="relative z-10 bg-white pl-1">{time}</span>
                          <div className="absolute top-0 right-0 w-full border-t border-[#E5E7EB] border-dashed"></div>
                        </div>
                      )}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 overflow-x-auto">
                      {weekDays.map((day: any, i: any) =>
                        <div key={i} className="min-w-[120px] border-r border-[#E5E7EB] last:border-r-0 relative">
                          {/* Header */}
                          <div className="h-12 border-b border-[#E5E7EB] bg-[#F7F8FA] flex flex-col items-center justify-center">
                            <span className="text-xs text-[#6B7280] uppercase font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mt-0.5 ${day.toDateString() === new Date().toDateString() ?
                              'bg-[#3B82F6] text-white' :
                              'text-[#1A1A1A]'}`
                            }>
                              {day.getDate()}
                            </div>
                          </div>

                          {/* Time Slots Background */}
                          <div className="relative h-[780px]"> {/* 13 slots * 60px */}
                            {timeSlots.map((_: any, index: any) =>
                              <div key={index} className="h-[60px] border-b border-[#E5E7EB] border-dashed"></div>
                            )}

                            {/* Events */}
                            {filteredEvents.
                              filter((e) => e.date === day.toISOString().split('T')[0]).
                              map((event) =>
                                <div
                                  key={event.id}
                                  className="absolute left-1 right-1 rounded p-2 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity shrink-0 z-10 overflow-hidden"
                                  style={getEventStyle(event)}
                                  title={`${event.title} (${event.time})`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}>

                                  <div className="font-semibold truncate">{event.title}</div>
                                  <div className="truncate opacity-90">{event.time}</div>
                                </div>
                              )
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }
            </>
          )}
        </div>
      </div>


      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Events"
        onConfirm={handleApplyFilters}
        confirmText="Apply Filters">

        <div className="space-y-6">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-3">Categories</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.filter((c: any) => c !== 'All').map((category: any) =>
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempFilters.categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempFilters((prev: any) => ({ ...prev, categories: [...prev.categories, category] }));
                      } else {
                        setTempFilters((prev: any) => ({ ...prev, categories: prev.categories.filter((c: any) => c !== category) }));
                      }
                    }}
                    className="w-4 h-4 text-[#10B981] border-[#E5E7EB] rounded focus:ring-[#10B981]" />

                  <span className="text-sm text-[#4B5563]">{category}</span>
                </label>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Start Date</label>
              <input
                type="date"
                value={tempFilters.startDate}
                onChange={(e) => setTempFilters((prev: any) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">End Date</label>
              <input
                type="date"
                value={tempFilters.endDate}
                onChange={(e) => setTempFilters((prev: any) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Venue</label>
            <Select
              value={tempFilters.venue}
              onValueChange={(value) => setTempFilters((prev: any) => ({ ...prev, venue: value }))}>
              <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                <SelectValue placeholder="All Venues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Venues">All Venues</SelectItem>
                {venues.map((venue: any) =>
                  <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setTempFilters({ categories: [], startDate: '', endDate: '', venue: '' })}
              className="text-sm text-[#6B7280] hover:text-[#1A1A1A] underline">

              Clear all filters
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Add New Event"
        onConfirm={handleAddEvent}
        confirmText="Add Event"
        confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Event Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              placeholder="Enter event title" />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Time</label>
              <input
                type="text"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                placeholder="e.g. 10:00 AM - 12:00 PM" />

            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category</label>
              <Select
                value={newEvent.category}
                onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
                <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c: any) => c !== 'All').map((c: any) =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Venue</label>
              <Select
                value={newEvent.venue}
                onValueChange={(value) => setNewEvent({ ...newEvent, venue: value })}>
                <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="Select Venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v: any) =>
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Event Details Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-100 ${selectedEvent ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedEvent && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">{selectedEvent.title}</h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white inline-block"
                  style={{ backgroundColor: selectedEvent.categoryColor }}
                >
                  {selectedEvent.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Date & Time */}
              <div className="bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB]">
                <div className="flex items-start gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-[#3B82F6] mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A] mb-0.5">Date & Time</div>
                    <div className="text-sm text-[#4B5563]">
                      {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-[#4B5563]">{selectedEvent.time}</div>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A] mb-1">Venue</div>
                  <div className="text-sm text-[#4B5563]">{selectedEvent.venue}</div>
                </div>
              </div>

              {/* Registrations */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A] mb-1">Registrations</div>
                  <div className="text-sm text-[#4B5563] mb-2">
                    {selectedEvent.registrations} / {selectedEvent.capacity} Registered
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(selectedEvent.registrations / selectedEvent.capacity) * 100}%`,
                        backgroundColor: selectedEvent.categoryColor
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-[#E5E7EB] grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/clubs-portal/events/create?id=${selectedEvent.id}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Event
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#EF4444] text-[#EF4444] rounded-lg font-medium hover:bg-[#FEF2F2] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for Slide-over */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-90 transition-opacity"
          onClick={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}