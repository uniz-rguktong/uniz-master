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
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-xl border border-[#E5E7EB] shrink-0">
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

                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-[#1A1A1A]">{event.title}</h3>
                                    <span
                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white w-fit mx-auto sm:mx-0"
                                        style={{ backgroundColor: event.categoryColor }}
                                    >
                                        {event.category}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-[#6B7280] justify-center sm:justify-start">
                                        <Clock className="w-4 h-4" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#6B7280] justify-center sm:justify-start">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#6B7280] justify-center sm:justify-start">
                                        <Users className="w-4 h-4" />
                                        <span>{event.registrations}/{event.capacity} registered</span>
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
