'use client';
import { useState, useEffect } from 'react';
import { Search, Download, UserCheck, Trophy, Users, RefreshCw, Globe, Target, DollarSign } from 'lucide-react';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/hooks/useToast';
import { Checkbox } from '@/components/Checkbox';
import { InfoTooltip } from '@/components/InfoTooltip';
import { MetricCard } from '@/components/MetricCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateRegistrationStatus } from '@/actions/registrationActions';
import { getAllTrends } from '@/actions/trendsGetters';
import { exportRegistrationsToCSV } from '@/lib/exportUtils';

interface ConfirmedRegistrationsPageProps {
  initialRegistrations?: Array<Record<string, any>>;
  hideSelection?: boolean;
  paginationWindowSize?: number;
}

export function ConfirmedRegistrationsPage({ initialRegistrations, hideSelection = false, paginationWindowSize }: ConfirmedRegistrationsPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trends, setTrends] = useState<any>(null);
  const { toast, showToast, hideToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [data, setData] = useState<any[]>(initialRegistrations || []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setData(initialRegistrations || []);
    getAllTrends().then(result => {
      if (result.success) {
        setTrends(result.trends);
      }
    });
  }, [initialRegistrations]);

  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<any>(null);

  // Filter registrations
  const filteredRegistrations = data.filter((reg: any) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || reg.eventType === selectedCategory;
    const matchesEvent = !selectedEvent || reg.eventName === selectedEvent;

    const isTeam = (reg.teamName && reg.teamName.trim().length > 0) || (reg.teamSize && Number(reg.teamSize) > 1);
    const matchesType = !selectedType || (selectedType === 'Individual' && !isTeam) || (selectedType === 'Team' && isTeam);

    return matchesSearch && matchesCategory && matchesEvent && matchesType;
  });

  // Calculate dynamic metrics based on filters
  const filteredOnline = filteredRegistrations.filter(r => r.transactionId || r.paymentAmount > 0).length;
  const filteredOffline = filteredRegistrations.length - filteredOnline;
  const filteredRevenue = filteredRegistrations.reduce((sum: any, reg: any) => sum + (reg.paymentAmount || 0), 0);
  const filteredAttendance = filteredRegistrations.length > 0
    ? Math.round((filteredRegistrations.filter(r => r.attendanceMarked).length / filteredRegistrations.length) * 100)
    : 0;

  // Pagination logic
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const visiblePageWindow = Math.max(1, Math.min(totalPages, paginationWindowSize || totalPages));
  const pageEnd = Math.min(totalPages, Math.max(visiblePageWindow, currentPage));
  const pageStart = Math.max(1, pageEnd - visiblePageWindow + 1);
  const visiblePages = Array.from(
    { length: Math.max(0, pageEnd - pageStart + 1) },
    (_, index) => pageStart + index
  );

  // Dynamic filter lists
  const dynamicCategories = Array.from(new Set(data.map(r => r.eventType))).filter(Boolean);
  const dynamicEvents = Array.from(new Set(
    selectedCategory
      ? data.filter(r => r.eventType === selectedCategory).map(r => r.eventName)
      : data.map(r => r.eventName)
  )).filter(Boolean);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedEvent, selectedType]);

  const toggleSelectAll = () => {
    if (hideSelection) return;
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map((r: any) => r.id));
    }
  };

  const toggleSelectRegistration = (id: any) => {
    if (hideSelection) return;
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id]
    );
  };

  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (id: any) => {
    setRegistrationToCancel(id);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!registrationToCancel) return;
    setIsLoading(true);
    try {
      const result = await updateRegistrationStatus(registrationToCancel, 'CANCELLED');
      if (result.success) {
        setData(prev => prev.filter(r => r.id !== registrationToCancel));
        showToast('Registration cancelled successfully', 'success');
      } else {
        showToast(result.error || 'Failed to cancel registration', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
      setRegistrationToCancel(null);
    }
  };

  const handleExportData = () => {
    if (filteredRegistrations.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    exportRegistrationsToCSV(filteredRegistrations as any, `confirmed_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    showToast(`Exported ${filteredRegistrations.length} confirmed records to CSV`, 'success');
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Registrations</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Confirmed Registrations</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Confirmed Registrations</h1>
            <p className="text-sm text-[#6B7280]">Manage confirmed event registrations and track attendance</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors w-full sm:w-auto">

              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  title="Confirmed Online"
                  value={String(filteredOnline)}
                  icon={Globe}
                  iconBgColor="#EFF6FF"
                  iconColor="#3B82F6"
                  tooltip="Confirmed registrations from the online portal (filtered)" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                <MetricCard
                  title="Confirmed Offline"
                  value={String(filteredOffline)}
                  icon={Users}
                  iconBgColor="#F5F3FF"
                  iconColor="#8B5CF6"
                  tooltip="Confirmed manual/offline registrations (filtered)" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <MetricCard
                  title="Attendance Rate"
                  value={`${filteredAttendance}%`}
                  icon={Target}
                  iconBgColor="#F0FDF4"
                  iconColor="#10B981"
                  tooltip="Attendance rate for current selection" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                <MetricCard
                  title="Total Revenue"
                  value={`₹${filteredRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  iconBgColor="#FFFBEB"
                  iconColor="#F59E0B"
                  tooltip="Total revenue collected from selection" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col xl:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, roll number, registration ID, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">

              <Select value={selectedCategory || 'all'} onValueChange={(val) => {
                setSelectedCategory(val === 'all' ? null : val);
                setSelectedEvent(null);
                setSelectedType(null);
              }}>
                <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {dynamicCategories.map((category: any) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCategory && (
                <Select value={selectedEvent || 'all'} onValueChange={(val) => {
                  setSelectedEvent(val === 'all' ? null : val);
                  setSelectedType(null);
                }}>
                  <SelectTrigger className="w-full sm:w-[220px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {dynamicEvents.map((event: any) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedEvent && (
                <Select value={selectedType || ''} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[150px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedEvent(null);
                  setSelectedType(null);
                  showToast('Filters reset', 'success');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors whitespace-nowrap">
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-[#F4F2F0] rounded-[18px] mb-8 p-2.5 pt-6 animate-card-entrance" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-3 mt-[-4px] gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Confirmed Registrations</h2>
            <InfoTooltip text="List of all confirmed event registrations" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportData}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">

              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-3 text-left">
                    {!hideSelection ? (
                      <Checkbox
                        checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                        onChange={toggleSelectAll}
                        size="sm" />
                    ) : null}
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Registration ID ↑
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Student Details ↑
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Event ↑
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-6 py-4"><Skeleton width={20} height={20} borderRadius={4} /></td>
                      <td className="px-6 py-4">
                        <Skeleton width={100} height={16} className="mb-1" />
                        <Skeleton width={60} height={12} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton width={140} height={16} className="mb-1" />
                        <Skeleton width={100} height={12} />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton width={120} height={16} className="mb-1" />
                        <Skeleton width={80} height={12} />
                      </td>
                      <td className="px-6 py-4 text-right"><Skeleton width={32} height={32} borderRadius={8} className="ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  paginatedRegistrations.map((registration: any, index: any) =>
                    <tr
                      key={registration.id}
                      className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${index === paginatedRegistrations.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-6 py-4">
                        {!hideSelection ? (
                          <Checkbox
                            checked={selectedRegistrations.includes(registration.id)}
                            onChange={() => toggleSelectRegistration(registration.id)}
                            size="sm" />
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-[#1A1A1A]">{registration.registrationId}</div>
                        <div className="text-xs text-[#6B7280]">
                          {new Date(registration.confirmationDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-[#1A1A1A]">{registration.studentName}</div>
                        <div className="text-xs text-[#6B7280]">{registration.rollNumber} • {registration.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-[#1A1A1A]">{registration.eventName}</div>
                        <div className="text-xs text-[#6B7280]">{registration.eventType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <ActionMenu
                            actions={[
                              {
                                label: 'View Details',
                                icon: 'view',
                                onClick: () => handleViewDetails(registration)
                              },
                              {
                                label: 'Download CSV',
                                icon: 'download',
                                onClick: () => {
                                  exportRegistrationsToCSV([registration] as any, `registration_${(registration.id || '').substring(0, 8)}.csv`);
                                  showToast('Registration data downloaded as CSV', 'success');
                                }
                              },
                              {
                                label: 'Cancel Registration',
                                icon: 'delete',
                                onClick: () => handleCancelClick(registration.id),
                                danger: true
                              }]
                            } />
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 &&
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">No confirmed registrations found</p>
            </div>
          }
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#F3F4F6] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#6B7280]">
                Showing <span className="font-medium text-[#1A1A1A]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[#1A1A1A]">{Math.min(currentPage * itemsPerPage, filteredRegistrations.length)}</span> of <span className="font-medium text-[#1A1A1A]">{filteredRegistrations.length}</span> students
              </div>
              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 px-2 border border-[#E5E7EB] rounded hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium shrink-0"
                >
                  Previous
                </button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors shrink-0 ${currentPage === pageNumber ? 'bg-[#1A1A1A] text-white' : 'hover:bg-gray-50 text-[#6B7280]'}`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 px-2 border border-[#E5E7EB] rounded hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium shrink-0"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Confirmed Registration Details"
        confirmText="Close"
        onConfirm={() => {
          setShowDetailsModal(false);
        }}
        size="lg">
        {selectedRegistration &&
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Student Information</h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Name / Roll</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.studentName} ({selectedRegistration.rollNumber})</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Email / Phone</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Year / Dept</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.year} • {selectedRegistration.department}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Event Information</h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Event Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.eventName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Event Type</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.eventType}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F7F8FA] rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedRegistration.attendanceMarked ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'}`}></div>
                  <span className="text-sm text-[#1A1A1A]">Attendance {selectedRegistration.attendanceMarked ? 'Marked' : 'Not Marked'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedRegistration.certificateIssued ? 'bg-[#F59E0B]' : 'bg-[#E5E7EB]'}`}></div>
                  <span className="text-sm text-[#1A1A1A]">Certificate {selectedRegistration.certificateIssued ? 'Issued' : 'Not Issued'}</span>
                </div>
              </div>
            </div>
          </div>
        }
      </Modal>

      {showCancelDialog &&
        <ConfirmDialog
          title="Cancel Registration"
          message="Are you sure you want to cancel this confirmed registration? The seat will be released and the student will be notified."
          confirmLabel="Cancel Registration"
          cancelLabel="Go Back"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelDialog(false)}
          variant="danger" />
      }
    </div>
  );
}