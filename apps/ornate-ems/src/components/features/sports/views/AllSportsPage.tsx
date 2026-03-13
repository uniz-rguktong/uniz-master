'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Grid3x3, List, Calendar as CalendarIcon, Filter, Plus, Download } from 'lucide-react';
import { SportsGridView } from '../components/events/SportsGridView';
import { SportsListView } from '../components/events/SportsListView';
import { SportsCalendarView } from '../components/events/SportsCalendarView';
import { SportsFiltersPanel } from '../components/events/SportsFiltersPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { getSports } from '@/actions/sportGetters';
import { getUpcomingMatches } from '@/actions/fixtureActions';
import { AddRegistrationModal } from '@/components/shared/AddRegistrationModal';
import { Modal } from '@/components/Modal';
import { SportForm } from '../components/events/SportForm';

interface AllSportsPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
  calendarVariant?: 'default' | 'sports-admin';
}

export function AllSportsPage({ onNavigate, calendarVariant = 'default' }: AllSportsPageProps = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const isBranchPortal = (session?.user?.role === 'BRANCH_SPORTS_ADMIN');

  const [viewType, setViewType] = useState('grid');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sportsData, setSportsData] = useState<any[]>([]);
  const [calendarMatches, setCalendarMatches] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSport, setEditingSport] = useState<any>(null);
  const [preSelectedSportId, setPreSelectedSportId] = useState<string | null>(null);

  const filterChips = ['All', 'Individual', 'Team'];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [sportsRes, matchesRes] = await Promise.all([
        getSports(),
        getUpcomingMatches(200),
      ]);

      if (sportsRes.success) {
        setSportsData(sportsRes.sports || []);
      } else {
        console.error('Failed to fetch sports:', sportsRes.error);
      }

      if (matchesRes.success) {
        setCalendarMatches(matchesRes.data || []);
      } else {
        console.error('Failed to fetch calendar matches:', matchesRes.error);
        setCalendarMatches([]);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const refreshData = async () => {
    const [sportsRes, matchesRes] = await Promise.all([
      getSports(),
      getUpcomingMatches(200),
    ]);

    if (sportsRes.success) {
      setSportsData(sportsRes.sports || []);
    }

    if (matchesRes.success) {
      setCalendarMatches(matchesRes.data || []);
    }
    router.refresh();
  };

  return (
    <div className="flex h-full animate-page-entrance bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
              <span>Dashboard</span>
              <span className="text-[#9CA3AF]">›</span>
              <span>Sports Management</span>
              <span className="text-[#9CA3AF]">›</span>
              <span className="text-[#1A1A1A] font-medium">Sports Competition</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Sports Competition</h1>
                <p className="text-sm text-[#6B7280]">Refine, track, and manage all athletic tournaments for the session.</p>
              </div>
              {!isBranchPortal && (
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all border whitespace-nowrap ${showArchived
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
                      }`}>
                    {showArchived ? 'Archived' : 'View Archived'}
                  </button>
                  <button
                    onClick={() => onNavigate?.('add-sport')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669] transition-all shadow-sm active:scale-95 whitespace-nowrap">
                    <Plus className="w-5 h-5 shrink-0" />
                    <span className="truncate">New Sport</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F4F2F0] p-[10px] rounded-[18px] mb-6">
              <div className="bg-white p-4 md:p-5 rounded-[14px] shadow-sm border border-[#E5E7EB]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                  <div className="flex flex-col md:flex-row flex-1 items-start md:items-center gap-4 w-full">
                    <div className="relative flex-1 w-full md:max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Search tournaments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 active:border-[#1A1A1A] transition-all" />
                    </div>

                    <div className="grid grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
                      {filterChips.map((chip: any) => (
                        <button
                          key={chip}
                          onClick={() => setSelectedFilter(chip)}
                          className={`flex items-center justify-center px-2 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${selectedFilter === chip
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'
                            }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 md:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                    <div className="h-8 w-px bg-gray-100 mx-1 hidden lg:block" />

                    <div className="flex items-center gap-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[18px] p-1.5 focus-within:ring-2 focus-within:ring-[#1A1A1A]/5">
                      <button
                        onClick={() => setViewType('grid')}
                        className={`p-2 rounded-xl transition-all ${viewType === 'grid' ?
                          'bg-white text-[#1A1A1A] shadow-sm' :
                          'text-[#9CA3AF] hover:text-[#1A1A1A]'}`
                        }>
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewType('list')}
                        className={`p-2 rounded-xl transition-all ${viewType === 'list' ?
                          'bg-white text-[#1A1A1A] shadow-sm' :
                          'text-[#9CA3AF] hover:text-[#1A1A1A]'}`
                        }>
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewType('calendar')}
                        className={`p-2 rounded-xl transition-all ${viewType === 'calendar' ?
                          'bg-white text-[#1A1A1A] shadow-sm' :
                          'text-[#9CA3AF] hover:text-[#1A1A1A]'}`
                        }>
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sports Display */}
            {isLoading ?
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_: any, i: any) =>
                  <div key={i} className="bg-white rounded-[32px] border border-[#E5E7EB] overflow-hidden p-5 shadow-sm">
                    <Skeleton height={200} className="w-full rounded-[24px] mb-5" />
                    <div className="space-y-4">
                      <Skeleton width="40%" height={12} />
                      <Skeleton width="85%" height={28} />
                      <Skeleton width="100%" height={14} />
                      <div className="flex justify-between pt-5 border-t border-[#F1F3F5]">
                        <Skeleton width="25%" height={16} />
                        <Skeleton width="30%" height={24} />
                      </div>
                    </div>
                  </div>
                )}
              </div> :

              <div className="animate-card-entrance">
                {viewType === 'grid' && (
                  <SportsGridView
                    sports={sportsData}
                    searchQuery={searchQuery}
                    selectedFilter={selectedFilter}
                    onNavigate={(path, params: any) => {
                      if (path === 'add-registration' && params?.initialData) {
                        setPreSelectedSportId(params.initialData.id);
                        setShowAddModal(true);
                      } else if (path === 'add-sport' && params?.mode === 'edit') {
                        setEditingSport(params.initialData);
                        setShowEditModal(true);
                      } else {
                        onNavigate?.(path, params);
                      }
                    }}
                    showArchived={showArchived}
                    showDrafts={showDrafts}
                    onRefresh={refreshData}
                  />
                )}
                {viewType === 'list' && (
                  <SportsListView
                    sports={sportsData}
                    searchQuery={searchQuery}
                    selectedFilter={selectedFilter}
                    onNavigate={(path, params: any) => {
                      if (path === 'add-registration' && params?.initialData) {
                        setPreSelectedSportId(params.initialData.id);
                        setShowAddModal(true);
                      } else if (path === 'add-sport' && params?.mode === 'edit') {
                        setEditingSport(params.initialData);
                        setShowEditModal(true);
                      } else {
                        onNavigate?.(path, params);
                      }
                    }}
                    showArchived={showArchived}
                    showDrafts={showDrafts}
                    onRefresh={refreshData}
                  />
                )}
                {viewType === 'calendar' && (
                  <div className="bg-[#F4F2F0] p-[10px] rounded-[18px]">
                    <div className="bg-white p-5 rounded-[14px] border border-[#E5E7EB] shadow-sm">
                      <SportsCalendarView
                        sports={sportsData}
                        matches={calendarMatches}
                        selectedFilter={selectedFilter}
                        showArchived={showArchived}
                        variant={calendarVariant}
                      />
                    </div>
                  </div>
                )}
              </div>
            }
          </div>
        </div>
      </div>

      {/* Filters Panel - Right Side Overlay */}
      {showFiltersPanel &&
        <div className="fixed inset-y-0 right-0 z-50 w-[320px] bg-white border-l border-[#E5E7EB] overflow-y-auto animate-slide-left shadow-2xl flex flex-col">
          <SportsFiltersPanel onClose={() => setShowFiltersPanel(false)} />
        </div>
      }

      <AddRegistrationModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPreSelectedSportId(null);
        }}
        onSuccess={() => {
          setShowAddModal(false);
          setPreSelectedSportId(null);
          refreshData();
        }}
        initialSportId={preSelectedSportId === null ? undefined : preSelectedSportId}
      />

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Sport Competition"
        size="xl"
      >
        <SportForm
          mode="edit"
          initialData={editingSport}
          onSuccess={() => {
            setShowEditModal(false);
            refreshData();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>);
}
