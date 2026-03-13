'use client';

import type { CalendarEvent } from '../types';
import { Clock, MapPin, Users } from 'lucide-react';

interface ListViewProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

export function ListView({ events, onEventClick }: ListViewProps) {
    const sortedEvents = [...events].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="p-6 space-y-4">
            {sortedEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No events scheduled.</div>
            ) : (
                sortedEvents.map((event: any) => (
                    <div
                        key={event.id}
                        className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onEventClick(event)}
                    >
                        <div className="flex flex-row items-start gap-4 sm:gap-6">
                            <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl border border-[#E5E7EB] shrink-0">
                                <div className="text-[10px] sm:text-sm text-[#6B7280]">
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-tight">
                                    {new Date(event.date).getDate()}
                                </div>
                                <div className="text-[10px] sm:text-xs text-[#6B7280]">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A] truncate">{event.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                        <span className="hidden sm:inline">•</span>
                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                        <span
                                            className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                                            style={{ backgroundColor: event.categoryColor }}
                                        >
                                            {event.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4 text-[11px] sm:text-sm">
                                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[#6B7280]">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#6B7280]">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{event.registrations}/{event.capacity} registered</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
