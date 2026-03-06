'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Grid3x3, List, Calendar as CalendarIcon, Archive, FileText } from 'lucide-react';
import { EventGridView } from '@/components/events/EventGridView';
import { EventListView } from '@/components/events/EventListView';
import { EventCalendarView } from '@/components/events/EventCalendarView';
import { EventFiltersPanel } from '@/components/events/EventFiltersPanel';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventById } from '@/actions/eventGetters';








interface AllEventsPageProps {
  initialEvents?: Array<Record<string, any>>;
}

export function AllEventsPage({ initialEvents = [] }: AllEventsPageProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [viewType, setViewType] = useState('grid');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Data is now pre-loaded
  const [showArchived, setShowArchived] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest-first');

  const [events, setEvents] = useState(initialEvents);

  const basePath = pathname.startsWith('/hho') ? '/hho' :
    pathname.startsWith('/super-admin') ? '/super-admin' :
      pathname.startsWith('/clubs-portal') ? '/clubs-portal' :
        pathname.startsWith('/sports') ? '/sports' : '/branch-admin';

  // Sync state with props when they change (important for router.refresh)
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const onNavigate = async (path: any, options: any) => {
    if (path === 'create-event') {
      const targetPath = basePath === '/hho' ? '/hho/add-event' : `${basePath}/events/create`;
      if (options?.mode && options?.eventData) {
        const fallbackData = options.eventData.originalData || options.eventData;
        let dataToStore = fallbackData;

        const eventId = fallbackData?.id;
        if (eventId) {
          const fullEvent = await getEventById(eventId);
          if (fullEvent?.success && fullEvent?.data) {
            dataToStore = fullEvent.data;
          }
        }

        localStorage.setItem('editEventData', JSON.stringify(dataToStore));
        router.push(`${targetPath}?mode=${options.mode}`);
      } else {
        localStorage.removeItem('editEventData'); // Clear previous data
        router.push(`${targetPath}?mode=create`);
      }
    } else if (path === 'all-registrations') {
      const registrationsPath = basePath === '/hho' ? '/hho/all-registrations' : `${basePath}/registrations`;
      router.push(`${registrationsPath}?eventId=${options?.eventId || 'all'}`);
    } else {
      router.push(`${basePath}/${path}`);
    }
  };

  const filterChips = ['All', 'Technical', 'Fun Games', 'Workshops', 'Hackathons', 'Quizzes', 'Project Expo'];

  return (
    <div className="flex h-full animate-page-entrance">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 bg-white">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
              <span className="capitalize">{basePath.replace(/^\//, '') || 'Dashboard'}</span>
              <span>›</span>
              <span>Events Management</span>
              <span>›</span>
              <span className="text-[#1A1A1A] font-medium">All Events</span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Events Management</h1>
            </div>

            {/* Search and View Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {viewType !== 'calendar' ? (
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search by event name, venue, organizer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent transition-all duration-200" />

                </div>
              ) : <div className="hidden md:block flex-1" />}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => {
                    const next = !showArchived;
                    setShowArchived(next);
                    if (next) setShowDrafts(false);
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${showArchived
                    ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                    : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F7F8FA]'
                    }`}>
                  <Archive className={`w-4 h-4 ${showArchived ? 'animate-pulse' : ''}`} />
                  {showArchived ? 'Viewing Archived' : 'Archived Events'}
                </button>

                <button
                  onClick={() => {
                    const next = !showDrafts;
                    setShowDrafts(next);
                    if (next) setShowArchived(false);
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${showDrafts
                    ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]'
                    : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F7F8FA]'
                    }`}>
                  <FileText className={`w-4 h-4 ${showDrafts ? 'animate-pulse' : ''}`} />
                  {showDrafts ? 'Viewing Drafts' : 'Draft Events'}
                </button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] transition-all">
                    <SelectValue placeholder="Sort by: Newest First" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest-first">Sort by: Newest First</SelectItem>
                    <SelectItem value="date">Sort by: Date</SelectItem>
                    <SelectItem value="name">Sort by: Name</SelectItem>
                    <SelectItem value="registrations">Sort by: Registrations</SelectItem>
                    <SelectItem value="capacity">Sort by: Capacity</SelectItem>
                    <SelectItem value="status">Sort by: Status</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
                  <button
                    onClick={() => setViewType('grid')}
                    className={`p-2 rounded transition-colors btn-interaction ${viewType === 'grid' ?
                      'bg-[#F7F8FA] text-[#1A1A1A]' :
                      'text-[#6B7280] hover:bg-[#F7F8FA]'}`
                    }>

                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewType('list')}
                    className={`p-2 rounded transition-colors btn-interaction ${viewType === 'list' ?
                      'bg-[#F7F8FA] text-[#1A1A1A]' :
                      'text-[#6B7280] hover:bg-[#F7F8FA]'}`
                    }>

                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewType('calendar')}
                    className={`p-2 rounded transition-colors btn-interaction ${viewType === 'calendar' ?
                      'bg-[#F7F8FA] text-[#1A1A1A]' :
                      'text-[#6B7280] hover:bg-[#F7F8FA]'}`
                    }>

                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Events Display */}
          {isLoading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-card-entrance" style={{ animationDelay: '100ms' }}>
              {[...Array(6)].map((_: any, i: any) =>
                <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <Skeleton height={160} className="w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="80%" height={24} />
                    <Skeleton width="100%" height={14} />
                    <div className="flex justify-between pt-2">
                      <Skeleton width="30%" height={20} />
                      <Skeleton width="20%" height={20} />
                    </div>
                  </div>
                </div>
              )}
            </div> :

            <div className="animate-card-entrance">
              {viewType === 'grid' && <EventGridView events={events as any} searchQuery={searchQuery} selectedFilter={selectedFilter} onNavigate={onNavigate} showArchived={showArchived} showDrafts={showDrafts} sortBy={sortBy} />}
              {viewType === 'list' && <EventListView events={events as any} searchQuery={searchQuery} selectedFilter={selectedFilter} onNavigate={onNavigate} showArchived={showArchived} showDrafts={showDrafts} sortBy={sortBy} />}
              {viewType === 'calendar' && <EventCalendarView events={events} selectedFilter={selectedFilter} showArchived={showArchived} showDrafts={showDrafts} />}
            </div>
          }
        </div>
      </div>

      {/* Filters Panel - Right Side */}
      {showFiltersPanel &&
        <div className="fixed inset-y-0 right-0 z-50 w-[280px] bg-white border-l border-[#E5E7EB] overflow-y-auto animate-fade-in shadow-2xl md:static md:shadow-none">
          <EventFiltersPanel onClose={() => setShowFiltersPanel(false)} />
        </div>
      }
    </div>);

}