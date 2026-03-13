'use client';
import { useState, useEffect } from 'react';
import { Download, Users, Target, DollarSign, Globe, Search, MoreHorizontal } from 'lucide-react';
import { downloadCSV } from '@/lib/exportUtils';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/Modal';
import { ModalContainer } from '@/components/ModalContainer';
import { MetricCard } from '@/components/MetricCard';
import { InfoTooltip } from '@/components/InfoTooltip';
import { ExportReportModal } from '@/components/ExportReportModal';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { ActionMenu } from '@/components/ActionMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventAnalyticsData } from '@/actions/dashboardGetters';

export function EventAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventPerformanceData, setEventPerformanceData] = useState<any[]>([]);
  const { toast, showToast, hideToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({ spotRegistrations: 0, attendance: 0 });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getEventAnalyticsData();
        if (res.success) {
          setEventPerformanceData(res.data || []);
        } else {
          showToast('error' in res ? res.error : 'Failed to load analytics', 'error');
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter events based on date range - logic remains same...
  const getFilteredEvents = () => {
    const now = new Date();
    let filterDate = null;

    switch (dateRange) {
      case 'Last 7 Days':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Last 30 Days':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'Last 3 Months':
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'Last 6 Months':
        filterDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'This Year':
        filterDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'All Time':
      default:
        filterDate = null;
    }

    if (!filterDate) return eventPerformanceData;

    return eventPerformanceData.filter(event => {
      if (!event.date) return true;
      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) return true;
      return eventDate >= filterDate;
    });
  };

  const filteredEvents = getFilteredEvents();

  const totalOnlineRegistrations = filteredEvents.reduce((sum: any, event: any) => sum + event.onlineRegistrations, 0);
  const totalSpotRegistrations = filteredEvents.reduce((sum: any, event: any) => sum + (event.spotRegistrations || 0), 0);
  const totalRevenue = filteredEvents.reduce((sum: any, event: any) => sum + (event.revenue || 0), 0);
  const avgAttendanceRate = filteredEvents.length > 0 ? Math.round(
    filteredEvents.reduce((sum: any, event: any) => {
      const totalRegs = event.onlineRegistrations + (event.spotRegistrations || 0);
      return sum + (totalRegs > 0 ? event.attendance / totalRegs * 100 : 0);
    }, 0) / filteredEvents.length
  ) : 0;

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEditFormData({
      spotRegistrations: event.spotRegistrations || 0,
      attendance: event.attendance || 0
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (selectedEvent) {
      setEventPerformanceData((prevData) =>
        prevData.map((event: any) =>
          event.id === selectedEvent.id ?
            {
              ...event,
              spotRegistrations: editFormData.spotRegistrations,
              attendance: editFormData.attendance
            } :
            event
        )
      );
      showToast('Event data updated locally (Backend persistence pending schema update)', 'success');
      setShowEditModal(false);
      setSelectedEvent(null);
    }
  };

  const handleExportReport = (options: any) => {
    // Simulate export process
    showToast(`Exporting ${options.format.toUpperCase()} report...`, 'info');

    // For CSV/Excel, generate a simple CSV
    if (options.format === 'csv' || options.format === 'excel') {
      const exportData = filteredEvents.map(event => ({
        'Event Name': event.name,
        'Category': event.category,
        'Online Registrations': event.onlineRegistrations,
        'Spot Registrations': event.spotRegistrations,
        'Total Registrations': event.onlineRegistrations + event.spotRegistrations,
        'Attendance': event.attendance,
        'Revenue': event.revenue,
        'Attendance Rate': `${event.onlineRegistrations + event.spotRegistrations > 0 ? Math.round(event.attendance / (event.onlineRegistrations + event.spotRegistrations) * 100) : 0}%`
      }));

      downloadCSV(exportData, `event_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    }

    showToast(`${options.format.toUpperCase()} report exported successfully!`, 'success');
  };

  // Calculate category performance based on total registrations (using filtered events)
  const CATEGORIES = [
    'Technical Events',
    'Technical Fun Games',
    'Hackathons',
    'Quizzes',
    'Workshops',
    'Project Expo',
    'Fun Games',
    'Pre-events',
    'Sports'
  ];

  const categoryPerformance = filteredEvents.reduce((acc: any, event: any) => {
    const totalRegs = event.onlineRegistrations + event.spotRegistrations;
    if (!acc[event.category]) {
      acc[event.category] = {
        category: event.category,
        color: event.categoryColor || '#6B7280',
        count: 0,
        totalRegistrations: 0
      };
    }
    acc[event.category].count += 1;
    acc[event.category].totalRegistrations += totalRegs;
    return acc;
  }, CATEGORIES.reduce((acc: any, cat) => {
    acc[cat] = {
      category: cat,
      // Need a dynamic way to grab it, but for our static default let's use a nice fallback hash or hardcode
      color: cat === 'Hackathons' ? '#10B981' :
        cat === 'Workshops' ? '#8B5CF6' :
          cat === 'Quizzes' ? '#F97316' :
            cat === 'Sports' ? '#06B6D4' :
              cat === 'Fun Games' ? '#22C55E' : '#3B82F6', // Blue default
      count: 0,
      totalRegistrations: 0
    };
    return acc;
  }, {}));

  const maxCategoryRegistrations = Math.max(...Object.values(categoryPerformance).map((c: any) => c.totalRegistrations), 0);

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Events Management</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Event Analytics</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Event Performance Reports & Analytics</h1>
            <p className="text-sm text-[#6B7280]">Track event performance and participant engagement</p>
          </div>

          <div className="flex flex-row items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none bg-white border border-[#E5E7EB] text-[#1A1A1A] h-[42px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
                <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="All Time">All Time</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#2D2D2D] transition-colors whitespace-nowrap">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
              <MetricCard
                title="Total Online Registrations"
                value={totalOnlineRegistrations}
                icon={Globe}
                iconBgColor="#EFF6FF"
                iconColor="#3B82F6"
                trend={{ value: "+15%", isPositive: true }}
                className="!pb-[25px]"
                tooltip="Registrations completed through the online portal" />
            </div>
            <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
              <MetricCard
                title="Total Spot Registrations"
                value={totalSpotRegistrations}
                icon={Users}
                iconBgColor="#F5F3FF"
                iconColor="#8B5CF6"
                trend={{ value: "+8%", isPositive: true }}
                className="!pb-[25px]"
                tooltip="Spot or paper-based registrations processed manually" />
            </div>
            <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
              <MetricCard
                title="Avg Attendance Rate"
                value={`${avgAttendanceRate}%`}
                icon={Target}
                iconBgColor="#F0FDF4"
                iconColor="#10B981"
                trend={{ value: "+12%", isPositive: true }}
                className="!pb-[25px]"
                tooltip="Average percentage of registered participants who attended" />
            </div>
            <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
              <MetricCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                iconBgColor="#FEF3C7"
                iconColor="#F59E0B"
                trend={{ value: "+18%", isPositive: true }}
                className="!pb-[15px]"
                tooltip="Total entry fees collected across all paid events" />
            </div>
          </>
        )}
      </div>

      {/* Event Performance Table */}
      <div className="bg-[#F4F2F0] rounded-[18px] mb-8 p-2.5 pt-6 animate-card-entrance" style={{ animationDelay: '200ms' }}>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-3 mt-[-4px] gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#7A7772] uppercase tracking-widest opacity-70">Event Performance</h2>
            <InfoTooltip text="Comparative analytics for all managed events" />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#D1D5DB] focus:border-[#D1D5DB] placeholder:text-[#9CA3AF]" />
            </div>
          </div>
        </div>

        {/* White Inner Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-white border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Event Name ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Online Reg. ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Spot Reg. ↑
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Attendance ↑
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Revenue ↑
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_: any, i: any) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-6 py-4"><Skeleton width={180} height={16} /></td>
                      <td className="px-6 py-4"><Skeleton width={100} height={24} borderRadius={20} /></td>
                      <td className="px-6 py-4"><Skeleton width={60} height={16} /></td>
                      <td className="px-6 py-4"><Skeleton width={60} height={16} /></td>
                      <td className="px-6 py-4"><Skeleton width={80} height={16} /></td>
                      <td className="px-6 py-4 text-right"><Skeleton width={70} height={16} className="ml-auto" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton width={32} height={32} borderRadius={8} className="ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  filteredEvents.filter(e =>
                    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((event, index, array) => {
                    const totalRegs = event.onlineRegistrations + event.spotRegistrations;
                    const attendanceRate = totalRegs > 0 ? Math.round(event.attendance / totalRegs * 100) : 0;

                    return (
                      <tr
                        key={event.id}
                        className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${index === array.length - 1 ? 'border-b-0' : ''}`
                        }>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#1A1A1A]">{event.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: event.categoryColor }}>

                            {event.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-[#1A1A1A]">
                              {event.onlineRegistrations}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-[#1A1A1A]">
                              {event.spotRegistrations}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#1A1A1A]">
                            <span className="font-semibold">{event.attendance}</span>
                            <span className="text-[#6B7280]">
                              {' '}({attendanceRate}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-[#1A1A1A]">
                            {event.revenue > 0 ? `$${event.revenue.toLocaleString()}` : 'Free'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ActionMenu
                            actions={[
                              {
                                label: 'Update Data',
                                icon: 'edit',
                                onClick: () => handleEditEvent(event)
                              },
                              {
                                label: 'View Details',
                                icon: 'view',
                                onClick: () => undefined
                              },
                              {
                                label: 'Export Report',
                                icon: 'download',
                                onClick: () => setShowExportModal(true)
                              }
                            ]}
                            size="sm"
                          />
                        </td>
                      </tr>);
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#F4F2F0] rounded-[18px] p-2.5 animate-card-entrance" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-2 mb-5 px-3 mt-4">
            <h3 className="text-sm font-bold text-[#7A7772] uppercase tracking-widest opacity-70">Category Performance</h3>
            <InfoTooltip text="Distribution of registrations across different categories" />
          </div>
          <div className="bg-white rounded-[14px] mb-1">
            <div className="space-y-5 p-5">
              {isLoading ? (
                [...Array(5)].map((_: any, i: any) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Skeleton width={12} height={12} borderRadius="50%" />
                        <Skeleton width={100} height={14} />
                      </div>
                      <Skeleton width={60} height={14} />
                    </div>
                    <Skeleton width="100%" height={8} borderRadius={4} />
                  </div>
                ))
              ) : (
                Object.values(categoryPerformance).map((cat: any) => {
                  const percentage = cat.totalRegistrations / maxCategoryRegistrations * 100;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full "
                            style={{ backgroundColor: cat.color }}>
                          </div>
                          <span className="text-sm font-medium text-[#1A1A1A]">{cat.category}</span>
                          <span className="text-xs text-[#6B7280]">({cat.count} events)</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1A1A1A]">{cat.totalRegistrations} regs</span>
                      </div>
                      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cat.color
                          }}>
                        </div>
                      </div>
                    </div>);
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#F4F2F0] rounded-[18px] p-2.5 animate-card-entrance" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center gap-2 mb-5 px-3 mt-4">
            <h3 className="text-sm font-bold text-[#7A7772] uppercase tracking-widest opacity-70">Top Performing Events</h3>
            <InfoTooltip text="Ranking based on total registrations and attendance rates" />
          </div>
          <div className="bg-white rounded-[14px] p-5">
            <div className="space-y-4">
              {isLoading ? (
                [...Array(5)].map((_: any, i: any) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[rgb(244,242,240)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton width={32} height={32} borderRadius={8} />
                      <div>
                        <Skeleton width={120} height={14} className="mb-2" />
                        <Skeleton width={180} height={10} />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton width={40} height={14} className="mb-1 ml-auto" />
                      <Skeleton width={60} height={10} className="ml-auto" />
                    </div>
                  </div>
                ))
              ) : filteredEvents.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-[#6B7280] text-sm">
                  No events found for the selected time range
                </div>
              ) : (
                filteredEvents.
                  map((event) => ({
                    ...event,
                    totalRegs: event.onlineRegistrations + event.spotRegistrations,
                    score: event.attendance + (event.onlineRegistrations + event.spotRegistrations)
                  })).
                  sort((a, b) => b.score - a.score).
                  slice(0, 5).
                  map((event, index) =>
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-[rgb(244,242,240)] rounded-lg">

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm text-[#1A1A1A]">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1A1A1A]">{event.name}</div>
                          <div className="text-xs text-[#6B7280]">{event.totalRegs} registrations • {event.attendance} attended</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#10B981]">{Math.round(event.attendance / event.totalRegs * 100)}%</div>
                        <div className="text-xs text-[#6B7280]">attendance</div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedEvent &&
        <Modal
          isOpen={showEditModal && !!selectedEvent}
          title={`Update Data: ${selectedEvent.name}`}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onConfirm={handleSaveEdit}
          confirmText="Save Changes"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Spot Registrations
              </label>
              <input
                type="number"
                value={editFormData.spotRegistrations}
                onChange={(e) => setEditFormData({ ...editFormData, spotRegistrations: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                min="0" />

            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Total Attendance
              </label>
              <input
                type="number"
                value={editFormData.attendance}
                onChange={(e) => setEditFormData({ ...editFormData, attendance: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                min="0" />

            </div>
            <div className="bg-[#F7F8FA] rounded-lg p-3 text-sm text-[#6B7280]">
              <p>💡 After each event, update the spot registrations and attendance numbers to maintain accurate analytics.</p>
            </div>
          </div>
        </Modal>
      }

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportReport} />



    </div>);

}