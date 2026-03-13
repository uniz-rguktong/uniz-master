'use client';

import { useState, useEffect } from 'react';
import { getEvents, type EventBase } from '@/actions/eventGetters';
import { useToast } from '@/hooks/useToast';
import {
    Calendar,
    MapPin,
    Users,
    ChevronRight,
    Search,
    ClipboardCheck,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function LiveAttendancePage() {
    const [events, setEvents] = useState<EventBase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();
    const pathname = usePathname();

    // Determine the base path for attendance links
    const isBranchAdmin = pathname.includes('/branch-admin');
    const isClubsPortal = pathname.includes('/clubs-portal');
    const isSports = pathname.includes('/sports');
    const isHho = pathname.includes('/hho');

    const basePath = isBranchAdmin ? '/branch-admin' :
        isClubsPortal ? '/clubs-portal' :
            isSports ? '/sports' :
                isHho ? '/hho' : '/super-admin';

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            const result = await getEvents();
            if (result.success) {
                // Filter events that are either published or active
                setEvents(result.data ?? []);
            } else {
                showToast('Failed to fetch events', 'error');
            }
            setIsLoading(false);
        };
        fetchEvents();
    }, [showToast]);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span>Events Management</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Live Attendance</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Live Attendance</h1>
                        <p className="text-sm text-[#6B7280]">Select an event to mark and track attendance in real-time.</p>
                    </div>

                    <div className="relative w-full md:w-87.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search events by name or venue..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#F4F2F0] rounded-[18px] p-2.5">
                <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-[14px] p-5 border border-[#E5E7EB] space-y-4">
                                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                                    <div className="flex gap-4 pt-1">
                                        <Skeleton className="h-4 w-20 rounded-lg" />
                                        <Skeleton className="h-4 w-20 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-10 w-full rounded-[12px]" />
                                </div>
                            ))}
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredEvents.map((event) => (
                                <div key={event.id} className={isBranchAdmin ? "bg-[#F4F2F0] rounded-2xl p-2" : ""}>
                                    <div className="group bg-white rounded-[14px] p-5 border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors flex flex-col h-full">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.category === 'Technical' ? 'bg-blue-50 text-blue-600' :
                                                    event.category === 'Cultural' ? 'bg-purple-50 text-purple-600' :
                                                        'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    {event.category || 'General'}
                                                </div>
                                                {!isBranchAdmin && (
                                                    <div className="p-2 bg-[#F9FAFB] rounded-lg group-hover:bg-[#1A1A1A] transition-colors">
                                                        <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 line-clamp-1">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-2.5 mb-5">
                                                <div className="flex items-center gap-2.5 text-sm text-[#6B7280]">
                                                    <Calendar className="w-4 h-4 shrink-0" />
                                                    <span>{new Date(event.date).toLocaleDateString(undefined, {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-[#6B7280]">
                                                    <MapPin className="w-4 h-4 shrink-0" />
                                                    <span className="line-clamp-1">{event.venue}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-[#6B7280]">
                                                    <Users className="w-4 h-4 shrink-0" />
                                                    <span>{event.registrationsCount} Registered</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`${basePath}/events/${event.id}/attendance`}
                                            className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 bg-[#F9FAFB] group-hover:bg-[#1A1A1A] text-[#1A1A1A] group-hover:text-white font-medium rounded-[12px] transition-colors border border-[#E5E7EB] group-hover:border-[#1A1A1A]"
                                        >
                                            Mark Attendance
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[14px] border border-dashed border-[#E5E7EB] p-12 text-center">
                            <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardCheck className="w-8 h-8 text-[#9CA3AF]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No active events found</h3>
                            <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
                                There are no events matching your current search or assigned to your branch.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
