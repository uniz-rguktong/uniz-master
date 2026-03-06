'use client';
import { useState, useEffect } from 'react';
import {
  Search, UserX, CheckCircle, XCircle, Eye, Mail, Phone,
  Users, RefreshCw, Calendar,
  Download, Send, Globe, Target, DollarSign
} from
  'lucide-react';
import { useToast } from '@/hooks/useToast';


import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MetricCard } from '@/components/MetricCard';
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

interface WaitlistManagementPageProps {
  initialRegistrations?: Array<Record<string, any>>;
}

export function WaitlistManagementPage({ initialRegistrations = [] }: WaitlistManagementPageProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [data, setData] = useState<any[]>(initialRegistrations || []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setData(initialRegistrations || []);
  }, [initialRegistrations]);

  const [selectedRegistrations, setSelectedRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [registrationToProcess, setRegistrationToProcess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trends, setTrends] = useState<any>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!isMounted) return;
    getAllTrends().then(result => {
      if (result.success) {
        setTrends(result.trends);
      }
    });
  }, [isMounted]);

  const filteredRegistrations = data.filter((reg: any) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || reg.eventType === selectedCategory;
    const matchesEvent = !selectedEvent || reg.eventName === selectedEvent;
    const matchesPriority = !selectedPriority || reg.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesEvent && matchesPriority;
  });

  const filteredOnline = filteredRegistrations.filter(r => r.transactionId || r.paymentAmount > 0).length;
  const filteredOffline = filteredRegistrations.length - filteredOnline;
  const filteredHighPriority = filteredRegistrations.filter(r => r.priority === 'high').length;
  const filteredPotentialRevenue = filteredRegistrations.reduce((sum: any, reg: any) => sum + (reg.paymentAmount || 0), 0);

  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);

  const dynamicCategories = Array.from(new Set(data.map(r => r.eventType))).filter(Boolean);
  const dynamicEvents = Array.from(new Set(
    selectedCategory
      ? data.filter(r => r.eventType === selectedCategory).map(r => r.eventName)
      : data.map(r => r.eventName)
  )).filter(Boolean);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedEvent, selectedPriority]);

  const getPriorityBadge = (priority: any) => {
    const styles = {
      'high': { bg: '#FEE2E2', text: '#991B1B', label: 'High Priority' },
      'medium': { bg: '#FEF3C7', text: '#92400E', label: 'Medium Priority' },
      'low': { bg: '#E0E7FF', text: '#3730A3', label: 'Low Priority' }
    };
    const style = (styles as any)[priority] || styles.low;

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}>
        {style.label}
      </span>);
  };

  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleApproveClick = (id: any) => {
    setRegistrationToProcess(id);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (id: any) => {
    setRegistrationToProcess(id);
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!registrationToProcess) return;
    setIsLoading(true);
    try {
      const result = await updateRegistrationStatus(registrationToProcess, 'CONFIRMED');
      if (result.success) {
        setData(prev => prev.filter(r => r.id !== registrationToProcess));
        showToast('Student moved to confirmed registrations', 'success');
      } else {
        showToast(result.error || 'Failed to approve registration', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
      setShowApproveDialog(false);
      setRegistrationToProcess(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!registrationToProcess) return;
    setIsLoading(true);
    try {
      const result = await updateRegistrationStatus(registrationToProcess, 'REJECTED');
      if (result.success) {
        setData(prev => prev.filter(r => r.id !== registrationToProcess));
        showToast('Waitlist registration removed', 'success');
      } else {
        showToast(result.error || 'Failed to remove registration', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
      setShowRejectDialog(false);
      setRegistrationToProcess(null);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-8 animate-page-entrance">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Registrations</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Waitlist Management</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Waitlist Management</h1>
            <p className="text-sm text-[#6B7280]">Manage students waiting for seat availability</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                if (filteredRegistrations.length === 0) {
                  showToast('No data to export', 'error');
                  return;
                }
                exportRegistrationsToCSV(filteredRegistrations as any, `waitlist_export_${new Date().toISOString().split('T')[0]}.csv`);
                showToast(`Exported ${filteredRegistrations.length} waitlist records to CSV`, 'success');
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors w-full sm:w-auto">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                <MetricCard
                  title="Waitlisted Online"
                  value={String(filteredOnline)}
                  icon={Globe}
                  iconBgColor="#EFF6FF"
                  iconColor="#3B82F6"
                  tooltip="Waitlisted registrations from the online portal (filtered)" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                <MetricCard
                  title="Waitlisted Offline"
                  value={String(filteredOffline)}
                  icon={Users}
                  iconBgColor="#F5F3FF"
                  iconColor="#8B5CF6"
                  tooltip="Waitlisted manual/offline registrations (filtered)" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <MetricCard
                  title="High Priority"
                  value={String(filteredHighPriority)}
                  icon={Target}
                  iconBgColor="#FEF2F2"
                  iconColor="#EF4444"
                  tooltip="Waitlisted registrations marked as high priority (filtered)" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                <MetricCard
                  title="Potential Revenue"
                  value={`₹${filteredPotentialRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  iconBgColor="#F0FDF4"
                  iconColor="#10B981"
                  tooltip="Total potential revenue from waitlisted students (filtered)" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, roll number, registration ID, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <Select value={selectedCategory || 'all'} onValueChange={(val) => {
                setSelectedCategory(val === 'all' ? null : val);
                setSelectedEvent(null);
              }}>
                <SelectTrigger className="w-full sm:w-[160px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {dynamicCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCategory && (
                <Select value={selectedEvent || 'all'} onValueChange={(val) => setSelectedEvent(val === 'all' ? null : val)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {dynamicEvents.map((event) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedPriority || 'all'} onValueChange={(val) => setSelectedPriority(val === 'all' ? null : val)}>
                <SelectTrigger className="w-full sm:w-[150px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedEvent(null);
                  setSelectedPriority(null);
                  setSearchQuery('');
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

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[16px] p-4 animate-pulse">
              <Skeleton width="100%" height={200} borderRadius={16} />
            </div>
          ))
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] p-12 text-center">
              <UserX className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
              <p className="text-sm text-[#6B7280]">No waitlisted students found</p>
            </div>
          </div>
        ) : (
          paginatedRegistrations.map((registration, index) => (
            <div key={registration.id} className="bg-[#F4F2F0] rounded-[16px] p-2.5 animate-card-entrance" style={{ animationDelay: `${index * 100 + 200}ms` }}>
              <div className="px-3 my-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mr-1">{registration.studentName}</h3>
                  <span className="px-2 py-0.5 bg-[#E0E7FF] text-[#6366F1] text-xs font-medium rounded whitespace-nowrap">
                    {registration.registrationId}
                  </span>
                  {getPriorityBadge(registration.priority)}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B7280] mb-3">
                  <span className="font-medium text-[#4B5563]">{registration.rollNumber}</span>
                  <span className="text-[#9CA3AF] hidden sm:inline">•</span>
                  <span>{registration.year}</span>
                  <span className="text-[#9CA3AF] hidden sm:inline">•</span>
                  <span>{registration.department}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[#6B7280]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{registration.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{registration.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="shrink-0 w-full sm:w-auto flex justify-center sm:block">
                    <div className="w-20 h-20 bg-linear-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex flex-col items-center justify-center text-white">
                      <div className="text-2xl font-bold">#{registration.waitlistPosition}</div>
                      <div className="text-xs opacity-80">of {registration.totalWaitlist}</div>
                    </div>
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Event</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">{registration.eventName}</div>
                        <div className="text-xs text-[#6B7280]">{registration.eventType}</div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Capacity Status</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {registration.maxCapacity - registration.seatsAvailable}/{registration.maxCapacity}
                        </div>
                        <div className={`text-xs ${registration.seatsAvailable > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {registration.seatsAvailable > 0 ? 'Available' : 'Full'}
                        </div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Registration Date</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {new Date(registration.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Payment Status</div>
                        {registration.paymentAmount ? (
                          <div>
                            <div className="font-medium text-sm text-[#1A1A1A]">₹{registration.paymentAmount}</div>
                            <div className={`text-xs ${registration.paymentStatus === 'paid' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                              {registration.paymentStatus}
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium text-sm text-[#6B7280]">Free Event</div>
                        )}
                      </div>
                    </div>

                    {registration.teamName && (
                      <div className="bg-[#E0F2FE] border border-[#BAE6FD] rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-[#0369A1]" />
                          <span className="font-medium text-[#0369A1]">Team: {registration.teamName}</span>
                          <span className="text-[#0369A1]">({registration.teamSize} members)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleViewDetails(registration)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      <button
                        onClick={() => {
                          exportRegistrationsToCSV([registration] as any, `registration_${(registration.id || '').substring(0, 8)}.csv`);
                          showToast('Registration data downloaded as CSV', 'success');
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download CSV
                      </button>
                      <button
                        onClick={() => handleApproveClick(registration.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Registration
                      </button>
                      <button
                        onClick={() => handleRejectClick(registration.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between px-3 gap-4 bg-[#F4F2F0] rounded-[16px] p-4 border border-[#E5E7EB]">
            <div className="text-xs text-[#6B7280]">
              Showing <span className="font-medium text-[#1A1A1A]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[#1A1A1A]">{Math.min(currentPage * itemsPerPage, filteredRegistrations.length)}</span> of <span className="font-medium text-[#1A1A1A]">{filteredRegistrations.length}</span> waitlisted students
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1 px-2 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#1A1A1A] text-white' : 'bg-white hover:bg-gray-50 text-[#6B7280]'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1 px-2 border border-[#E5E7EB] rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDetailsModal && !!selectedRegistration}
        onClose={() => setShowDetailsModal(false)}
        title="Waitlist Details"
        confirmText="Approve Registration"
        onConfirm={() => {
          setShowDetailsModal(false);
          handleApproveClick(selectedRegistration.id);
        }}
        size="lg">
        {selectedRegistration && (
          <div className="space-y-6">
            <div className="bg-linear-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl p-6 text-white text-center">
              <div className="text-sm mb-1 opacity-90 font-medium">Waitlist Position</div>
              <div className="text-5xl font-bold">#{selectedRegistration.waitlistPosition}</div>
              <div className="text-sm mt-1 opacity-90">of {selectedRegistration.totalWaitlist} total</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">Student / Roll</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.studentName} ({selectedRegistration.rollNumber})</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">Priority / Dept</div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedRegistration.priority)}
                  <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.department}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Event Status</h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Event Name</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{selectedRegistration.eventName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">Capacity Status</div>
                    <div className="text-sm font-medium text-[#EF4444]">Full ({selectedRegistration.maxCapacity} Seats)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showApproveDialog &&
        <ConfirmDialog
          title="Approve Waitlist Registration"
          message="Are you sure you want to approve this waitlist registration? The student will be moved to confirmed registrations and notified immediately."
          confirmLabel="Approve"
          cancelLabel="Cancel"
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApproveDialog(false)}
          variant="success" />
      }

      {showRejectDialog &&
        <ConfirmDialog
          title="Remove from Waitlist"
          message="Are you sure you want to remove this student from the waitlist? They will be notified about the removal."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectDialog(false)}
          variant="danger" />
      }
    </div>
  );
}