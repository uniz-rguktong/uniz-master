'use client';
import { Search, Calendar, MapPin, Users, Download, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActionMenu } from '@/components/ActionMenu';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { deleteEvent as deleteEventAction, updateEvent as updateEventAction } from '@/actions/eventActions';
import { getEventRegistrations, getSportRegistrations } from '@/actions/superAdminActions';

interface EventsPageClientProps {
    initialEvents: Array<Record<string, any>>;
}

export default function EventsPageClient({ initialEvents }: EventsPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedPortal, setSelectedPortal] = useState('All Portals');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [eventsList, setEventsList] = useState(initialEvents);
    const { showToast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [viewEvent, setViewEvent] = useState<any>(null);
    const [editEvent, setEditEvent] = useState<any>(null);
    const [selectedEventToDelete, setSelectedEventToDelete] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [eventDetail, setEventDetail] = useState<any>(null);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        date: '',
        venue: '',
        category: 'General',
        status: 'Draft',
        description: ''
    });
    const [windowStart, setWindowStart] = useState(1);
    const itemsPerPage = 5;

    // Sync window when page changes through non-arrow means (like filters)
    useEffect(() => {
        if (currentPage === 1) {
            setWindowStart(1);
        }
    }, [currentPage]);

    const normalizeStatus = (value: unknown): string => {
        return String(value ?? 'DRAFT').trim().toUpperCase();
    };

    const getRoleLabel = (event: Record<string, any>): string => {
        const role = String(event.creatorRole ?? '').toUpperCase();
        switch (role) {
            case 'SPORTS_ADMIN':
            case 'BRANCH_SPORTS_ADMIN':
                return 'Sports Coordinator';
            case 'HHO':
                return 'HHO Coordinator';
            case 'CLUB_COORDINATOR':
                return 'Club Coordinator';
            case 'EVENT_COORDINATOR':
                return 'Ornate Committee';
            case 'SUPER_ADMIN':
            case 'BRANCH_ADMIN':
            default:
                return 'Branch Admin';
        }
    };

    const filteredByRole = useMemo(() => {
        if (selectedRole === 'All Roles') return eventsList;
        return eventsList.filter((event) => getRoleLabel(event) === selectedRole);
    }, [eventsList, selectedRole]);

    const portalOptions = useMemo(() => {
        const unique = new Set<string>();
        filteredByRole.forEach((event) => {
            const organizer = String(event.organizer ?? '').trim();
            if (organizer) unique.add(organizer);
        });

        // Add "Civil Admin" manually when "Branch Admin" role is selected 
        // as requested: "add one more as civil admin when we select branch from all roles"
        if (selectedRole === 'Branch Admin') {
            unique.add('Civil Admin');
        }

        return Array.from(unique).sort((a, b) => a.localeCompare(b));
    }, [filteredByRole, selectedRole]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 200);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    // Fetch registrations when viewEvent changes
    useEffect(() => {
        if (!viewEvent) return;
        let cancelled = false;
        setRegistrationsLoading(true);
        setRegistrations([]);

        const fetchFn = viewEvent.source === 'sport'
            ? getSportRegistrations(viewEvent.id)
            : getEventRegistrations(viewEvent.id);

        fetchFn.then((res: any) => {
            if (cancelled) return;
            if (res?.success && res.data) {
                setRegistrations(res.data.registrations || []);
                setEventDetail(res.data.event || res.data.sport || null);
            } else {
                showToast('error' in res ? res.error : 'Failed to load registrations', 'error');
            }
        }).catch(() => {
            if (!cancelled) showToast('Failed to load registrations', 'error');
        }).finally(() => {
            if (!cancelled) setRegistrationsLoading(false);
        });
        return () => { cancelled = true; };
    }, [viewEvent]);

    // Filter Logic
    const filteredEvents = useMemo(() => {
        const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();

        return filteredByRole.filter((event) => {
            const name = String(event.name ?? '').toLowerCase();
            const organizer = String(event.organizer ?? '').toLowerCase();
            const venue = String(event.venue ?? '').toLowerCase();
            const category = String(event.category ?? '').toLowerCase();

            const matchesSearch =
                !normalizedQuery ||
                name.includes(normalizedQuery) ||
                organizer.includes(normalizedQuery) ||
                venue.includes(normalizedQuery) ||
                category.includes(normalizedQuery);

            const matchesPortal =
                selectedPortal === 'All Portals' ||
                String(event.organizer ?? '').trim() === selectedPortal;

            const matchesStatus =
                selectedStatus === 'ALL' ||
                normalizeStatus(event.status) === selectedStatus;

            return matchesSearch && matchesPortal && matchesStatus;
        });
    }, [filteredByRole, debouncedSearchQuery, selectedPortal, selectedStatus]);

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEvents = useMemo(
        () => filteredEvents.slice(indexOfFirstItem, indexOfLastItem),
        [filteredEvents, indexOfFirstItem, indexOfLastItem]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, selectedRole, selectedPortal, selectedStatus]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (selectedPortal !== 'All Portals' && !portalOptions.includes(selectedPortal)) {
            setSelectedPortal('All Portals');
        }
    }, [portalOptions, selectedPortal]);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Master Event List</h1>
                        <p className="text-sm text-[#6B7280]">View and manage all {eventsList.length} events scheduled for the fest.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => showToast('Events exported successfully', 'success')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                {/* Filters */}
                <div className="bg-white rounded-[14px] p-4 md:p-5 mb-4 shadow-sm border border-[#E5E7EB]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                            />
                        </div>

                        {/* Combined Selects Filter Desktop Row */}
                        <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                            {/* Role Filter */}
                            <div className="col-span-1 md:w-[150px] lg:w-[170px]">
                                <Select value={selectedRole} onValueChange={(value) => { setSelectedRole(value); setSelectedPortal('All Portals'); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-full h-[40px] md:h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-xs md:text-sm">
                                        <SelectValue placeholder="Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All Roles">All Roles</SelectItem>
                                        <SelectItem value="Branch Admin">Branch Admin</SelectItem>
                                        <SelectItem value="Club Coordinator">Club Coordinator</SelectItem>
                                        <SelectItem value="Sports Coordinator">Sports Coordinator</SelectItem>
                                        <SelectItem value="HHO Coordinator">HHO Coordinator</SelectItem>
                                        <SelectItem value="Ornate Committee">Ornate Committee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Portal Filter */}
                            <div className="col-span-1 md:w-[150px] lg:w-[170px]">
                                <Select value={selectedPortal} onValueChange={(value) => { setSelectedPortal(value); setCurrentPage(1); }} disabled={selectedRole === 'All Roles'}>
                                    <SelectTrigger className="w-full h-[40px] md:h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-xs md:text-sm">
                                        <SelectValue placeholder="Portals" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All Portals">All Portals</SelectItem>
                                        {portalOptions.map(portal => (
                                            <SelectItem key={portal} value={portal}>{portal}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div className="col-span-2 md:col-span-none md:w-[150px] lg:w-[170px]">
                                <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-full h-[40px] md:h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-xs md:text-sm">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Status</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="PUBLISHED">Published</SelectItem>
                                        <SelectItem value="UPCOMING">Upcoming</SelectItem>
                                        <SelectItem value="REGISTRATION OPEN">Registration Open</SelectItem>
                                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Table (Desktop) / Cards (Mobile) */}
                <div className="bg-white rounded-[14px] overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Event Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Venue</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Registrations</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Last Modified</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {currentEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
                                            No events found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    currentEvents.map((event: any) => (
                                        <tr key={event.id} className="hover:bg-[#F9FAFB] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-[#6B7280]" />
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{event.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#4F46E5]">
                                                    {event.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6B7280]">{event.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                                                    <span className="text-sm text-[#6B7280]">{event.venue}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#9CA3AF]" />
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{event.registrations}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6B7280]">{event.lastModified || '—'}</td>
                                            <td className="px-6 py-4">
                                                <ActionMenu
                                                    actions={[
                                                        { label: 'View Details', icon: 'view', onClick: () => setViewEvent(event) },
                                                        ...(event.source !== 'sport' ? [
                                                            {
                                                                label: 'Edit Event',
                                                                icon: 'edit' as const,
                                                                onClick: () => {
                                                                    setEditEvent(event);
                                                                    setEventFormData({
                                                                        title: event.name,
                                                                        date: new Date(event.rawDate).toISOString().split('T')[0] || '',
                                                                        venue: event.venue,
                                                                        category: event.category,
                                                                        status: event.status,
                                                                        description: ''
                                                                    });
                                                                    setShowEditModal(true);
                                                                }
                                                            },
                                                            { divider: true },
                                                            { label: 'Delete Event', icon: 'delete' as const, onClick: () => setSelectedEventToDelete(event), danger: true }
                                                        ] : [])
                                                    ]}
                                                    size="sm"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-[#E5E7EB]">
                        {currentEvents.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
                                No events found matching your filters.
                            </div>
                        ) : (
                            currentEvents.map((event: any) => (
                                <div key={event.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{event.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF2FF] text-[#4F46E5] uppercase">
                                                    {event.category}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${normalizeStatus(event.status) === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'} uppercase`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                        </div>
                                        <ActionMenu
                                            actions={[
                                                { label: 'View Details', icon: 'view', onClick: () => setViewEvent(event) },
                                                ...(event.source !== 'sport' ? [
                                                    {
                                                        label: 'Edit Event',
                                                        icon: 'edit' as const,
                                                        onClick: () => {
                                                            setEditEvent(event);
                                                            setEventFormData({
                                                                title: event.name,
                                                                date: new Date(event.rawDate).toISOString().split('T')[0] || '',
                                                                venue: event.venue,
                                                                category: event.category,
                                                                status: event.status,
                                                                description: ''
                                                            });
                                                            setShowEditModal(true);
                                                        }
                                                    },
                                                    { divider: true },
                                                    { label: 'Delete Event', icon: 'delete' as const, onClick: () => setSelectedEventToDelete(event), danger: true }
                                                ] : [])
                                            ]}
                                            size="sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{event.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                            <Users className="w-3.5 h-3.5 shrink-0" />
                                            <span>{event.registrations} Registrations</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Modified {event.lastModified || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 md:px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between gap-4">
                        <div className="text-left">
                            <div className="text-xs md:text-sm text-[#6B7280] font-medium whitespace-nowrap">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEvents.length)} of {filteredEvents.length}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <button
                                onClick={() => {
                                    if (currentPage > 1) {
                                        if (currentPage > windowStart) {
                                            // Highlight moves to previous button within current window
                                            setCurrentPage(prev => prev - 1);
                                        } else {
                                            // Highlight is on first button, slide window back
                                            setCurrentPage(prev => prev - 1);
                                            setWindowStart(prev => Math.max(1, prev - 1));
                                        }
                                    }
                                }}
                                disabled={currentPage === 1}
                                className="p-2 text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                aria-label="Previous page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            {/* Mobile Page Numbers (2 buttons sliding window) */}
                            <div className="flex items-center gap-1.5 md:hidden">
                                {[windowStart, windowStart + 1].filter(p => p <= totalPages).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            if (p < currentPage) setWindowStart(p);
                                            else if (p > currentPage) setWindowStart(p - 1);
                                            setCurrentPage(p);
                                        }}
                                        className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center ${currentPage === p
                                            ? 'bg-[#10B981] text-white font-bold'
                                            : 'text-[#6B7280] bg-white border border-[#E5E7EB]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            {/* Desktop Page Numbers (5 buttons sliding window) */}
                            <div className="hidden md:flex items-center gap-2">
                                {[...Array(5)].map((_: any, i: any) => {
                                    const p = windowStart + i;
                                    if (p > totalPages) return null;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center ${currentPage === p
                                                ? 'bg-[#10B981] text-white font-bold'
                                                : 'text-[#6B7280] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB]'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    if (currentPage < totalPages) {
                                        const isMobile = window.innerWidth < 768;
                                        const windowSize = isMobile ? 2 : 5;

                                        if (currentPage < windowStart + windowSize - 1 && currentPage < totalPages) {
                                            // Highlight moves to next button within current window
                                            setCurrentPage(prev => prev + 1);
                                        } else if (currentPage < totalPages) {
                                            // Highlight is on last button, slide window forward
                                            setCurrentPage(prev => prev + 1);
                                            setWindowStart(prev => prev + 1);
                                        }
                                    }
                                }}
                                disabled={currentPage === totalPages}
                                className="p-2 text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                aria-label="Next page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Event Modal with Registered Students */}
            {viewEvent && (
                <Modal
                    isOpen={true}
                    onClose={() => { setViewEvent(null); setRegistrations([]); setEventDetail(null); }}
                    title="Event Details"
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* Event Info Summary */}
                        <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-[#1A1A1A]">{viewEvent.name}</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewEvent.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                    viewEvent.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                        viewEvent.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                            viewEvent.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {viewEvent.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="text-[#6B7280] text-xs">Organizer</span>
                                    <p className="font-medium text-[#1A1A1A]">{viewEvent.organizer}</p>
                                </div>
                                <div>
                                    <span className="text-[#6B7280] text-xs">Category</span>
                                    <p className="font-medium text-[#1A1A1A]">{viewEvent.category}</p>
                                </div>
                                <div>
                                    <span className="text-[#6B7280] text-xs">Date</span>
                                    <p className="font-medium text-[#1A1A1A]">{viewEvent.date}</p>
                                </div>
                                <div>
                                    <span className="text-[#6B7280] text-xs">Venue</span>
                                    <p className="font-medium text-[#1A1A1A]">{viewEvent.venue}</p>
                                </div>
                            </div>
                        </div>

                        {/* Registrations Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-[#1A1A1A]">Registered Students ({registrations.length})</h4>
                            </div>

                            {registrationsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full" />
                                    <span className="ml-3 text-sm text-[#6B7280]">Loading registrations...</span>
                                </div>
                            ) : registrations.length === 0 ? (
                                <div className="text-center py-8 text-sm text-[#9CA3AF]">
                                    No registrations found for this event.
                                </div>
                            ) : (
                                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Student Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Phone</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Branch</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Year</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Payment</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">Registered</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E5E7EB]">
                                                {registrations.map((reg: any, idx: number) => (
                                                    <tr key={reg.id} className="hover:bg-[#F9FAFB] transition-colors">
                                                        <td className="px-4 py-3 text-[#6B7280]">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-[#1A1A1A] whitespace-nowrap">{reg.studentName}</td>
                                                        <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{reg.studentId}</td>
                                                        <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{reg.email}</td>
                                                        <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{reg.phone}</td>
                                                        <td className="px-4 py-3 text-[#6B7280]">{reg.branch}</td>
                                                        <td className="px-4 py-3 text-[#6B7280]">{reg.year}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                                reg.status === 'ATTENDED' ? 'bg-blue-100 text-blue-700' :
                                                                    reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                        reg.status === 'WAITLISTED' ? 'bg-orange-100 text-orange-700' :
                                                                            reg.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {reg.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${reg.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                                                                reg.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {reg.paymentStatus}{reg.amount > 0 ? ` (\u20B9${reg.amount})` : ''}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                                                            {new Date(reg.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Event Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Event"
                confirmText="Save Changes"
                onConfirm={async () => {
                    const formData = new FormData();
                    formData.append('id', editEvent.id);
                    Object.entries(eventFormData).forEach(([key, value]) => formData.append(key, value));
                    const result = await updateEventAction(formData);
                    if (result.success && result.data) {
                        setEventsList(prev => prev.map(e => e.id === editEvent.id ? {
                            ...e,
                            name: result.data!.title,
                            date: new Date(result.data!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            venue: result.data!.venue || 'TBD',
                            category: result.data!.category || 'General',
                            status: result.data!.status || 'Draft',
                            rawDate: result.data!.date
                        } : e));
                        showToast('Event updated successfully', 'success');
                        setShowEditModal(false);
                    } else {
                        showToast(result.error || 'Failed to update event', 'error');
                    }
                }}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Event Title</label>
                            <input
                                type="text"
                                placeholder="Enter event title"
                                value={eventFormData.title}
                                onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10B981] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                            <input
                                type="date"
                                value={eventFormData.date}
                                onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10B981] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Venue</label>
                            <input
                                type="text"
                                placeholder="e.g. Main Auditorium"
                                value={eventFormData.venue}
                                onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10B981] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                            <Select value={eventFormData.category} onValueChange={(val) => setEventFormData({ ...eventFormData, category: val })}>
                                <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-10">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Technical">Technical</SelectItem>
                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                    <SelectItem value="Sports">Sports</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="Ornate">Ornate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                            <Select value={eventFormData.status} onValueChange={(val) => setEventFormData({ ...eventFormData, status: val })}>
                                <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-10">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                    <SelectItem value="Live">Live</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                            <textarea
                                rows={3}
                                placeholder="Brief event description..."
                                value={eventFormData.description}
                                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10B981] outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            {selectedEventToDelete && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setSelectedEventToDelete(null)}
                    onConfirm={async () => {
                        const result = await deleteEventAction(selectedEventToDelete.id);
                        if (result.success) {
                            setEventsList(prev => prev.filter(e => e.id !== selectedEventToDelete.id));
                            showToast(`Event "${selectedEventToDelete.name}" deleted successfully`, 'success');
                            setSelectedEventToDelete(null);
                        } else {
                            showToast(result.error || 'Failed to delete event', 'error');
                        }
                    }}
                    title="Delete Event"
                    message={`Are you sure you want to delete "${selectedEventToDelete.name}"? This action cannot be undone.`}
                    type="danger"
                />
            )}
        </div>
    );
}
