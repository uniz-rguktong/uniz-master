'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Search, CheckCircle, XCircle, Eye, Mail, Phone,
  DollarSign, AlertTriangle, Clock,
  RefreshCw, UserCheck, Target,
  ChevronLeft, ChevronRight
} from
  'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MetricCard } from '@/components/MetricCard';
import { Modal } from '@/components/Modal';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { updateRegistrationStatus } from '@/actions/registrationActions';
import { getAllTrends } from '@/actions/trendsGetters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingRegistration {
  id: string | number;
  type?: 'payment' | 'requirements' | string;
  transactionId?: string;
  paymentAmount?: number;
  eventType?: string;
  eventName?: string;
  teamName?: string;
  teamSize?: number | string;
  studentName?: string;
  rollNumber?: string;
  registrationId?: string;
  [key: string]: unknown;
}

interface PendingApprovalsPageProps {
  initialRegistrations?: PendingRegistration[];
  decoupleMetricsFromFilters?: boolean;
}

export function PendingApprovalsPage({ initialRegistrations, decoupleMetricsFromFilters = false }: PendingApprovalsPageProps) {
  const [activeSection, setActiveSection] = useState('payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [registrationToProcess, setRegistrationToProcess] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [trends, setTrends] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const scrollRestoreRef = useRef<number | null>(null);

  const data = (initialRegistrations || []) as any[];

  // Dynamic filter options derived from actual data
  const dynamicCategories = Array.from(new Set(data.map(r => r.eventType))).filter(Boolean);
  const dynamicEvents = Array.from(new Set(
    selectedCategory
      ? data.filter(r => r.eventType === selectedCategory).map(r => r.eventName)
      : data.map(r => r.eventName)
  )).filter(Boolean);

  const isUrgent = (deadline?: string) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return diff > 0 && diff < 86400000; // Within 24 hours
  };

  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setIsMounted(true);
    setLocalData(initialRegistrations || []);
    getAllTrends().then(result => {
      if (result.success) {
        setTrends(result.trends);
      }
      setIsLoading(false);
    });
  }, [initialRegistrations]);

  // Master filter for analytics and lists
  const masterFiltered = localData.filter((reg: any) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || reg.eventType === selectedCategory;
    const matchesEvent = !selectedEvent || reg.eventName === selectedEvent;

    const isTeam = (reg.teamName && reg.teamName.length > 0) || (reg.teamSize && Number(reg.teamSize) > 1);
    const matchesType = !selectedType ||
      (selectedType === 'Individual' && !isTeam) ||
      (selectedType === 'Team' && isTeam);

    return matchesSearch && matchesCategory && matchesEvent && matchesType;
  });

  const filteredPayments = masterFiltered.filter(r => r.type === 'payment');
  const filteredRequirements = masterFiltered.filter(r => r.type === 'requirements');

  const basePaymentsCount = localData.filter((r: any) => r.type === 'payment').length;
  const baseRequirementsCount = localData.filter((r: any) => r.type === 'requirements').length;

  const pendingPaymentsCount = decoupleMetricsFromFilters ? basePaymentsCount : filteredPayments.length;
  const pendingRequirementsCount = decoupleMetricsFromFilters ? baseRequirementsCount : filteredRequirements.length;
  const totalInQueueCount = pendingPaymentsCount + pendingRequirementsCount;

  const displayedList = activeSection === 'payment' ? filteredPayments : filteredRequirements;

  const paginatedRegistrations = displayedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(displayedList.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchQuery, selectedCategory, selectedEvent, selectedType]);

  useEffect(() => {
    if (scrollRestoreRef.current !== null) {
      window.scrollTo({ top: scrollRestoreRef.current });
      scrollRestoreRef.current = null;
    }
  }, [currentPage]);

  const setPageWithoutScrollJump = (nextPage: number) => {
    scrollRestoreRef.current = window.scrollY;
    setCurrentPage(nextPage);
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
      const result = await updateRegistrationStatus(registrationToProcess, 'CONFIRMED', { paymentStatus: 'PAID' });
      if (result.success) {
        showToast('Registration approved successfully', 'success');
        setLocalData(prev => prev.filter(r => r.id !== registrationToProcess));
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
    if (!rejectionReason) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    if (!registrationToProcess) return;
    setIsLoading(true);
    try {
      const result = await updateRegistrationStatus(registrationToProcess, 'REJECTED', { rejectionReason });
      if (result.success) {
        showToast('Registration rejected', 'success');
        setLocalData(prev => prev.filter(r => r.id !== registrationToProcess));
      } else {
        showToast(result.error || 'Failed to reject registration', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
      setShowRejectDialog(false);
      setRegistrationToProcess(null);
      setRejectionReason('');
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
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Pending Approvals</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Pending Approvals</h1>
            <p className="text-sm text-[#6B7280]">Review and approve pending registrations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                <MetricCard
                  title="Awaiting Payment"
                  value={pendingPaymentsCount}
                  icon={DollarSign}
                  iconBgColor="#EFF6FF"
                  iconColor="#3B82F6"
                  tooltip="Registrations waiting for transaction verification" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                <MetricCard
                  title="Awaiting Requirements"
                  value={pendingRequirementsCount}
                  icon={AlertTriangle}
                  iconBgColor="#FFF1F2"
                  iconColor="#EF4444"
                  tooltip="Registrations with missing or unverified documents" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <MetricCard
                  title="Total in Queue"
                  value={totalInQueueCount}
                  icon={Target}
                  iconBgColor="#F5F3FF"
                  iconColor="#8B5CF6"
                  tooltip="Total number of verifications currently pending" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveSection('payment')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'payment' ?
              'bg-[#6366F1] text-white' :
              'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
          >
            <DollarSign className="w-4 h-4" />
            Payment Verification ({pendingPaymentsCount})
          </button>
          <button
            onClick={() => setActiveSection('requirements')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'requirements' ?
              'bg-[#EF4444] text-white' :
              'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Requirements Verification ({pendingRequirementsCount})
          </button>
        </div>
      </div>

      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex flex-col xl:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, roll number, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              <Select value={selectedCategory || 'all'} onValueChange={(val) => setSelectedCategory(val === 'all' ? null : val)}>
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

              <Select value={selectedEvent || 'all'} onValueChange={(val) => setSelectedEvent(val === 'all' ? null : val)}>
                <SelectTrigger className="w-full sm:w-[220px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {dynamicEvents.map((event: any) => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType || 'all'} onValueChange={(val) => setSelectedType(val === 'all' ? null : val)}>
                <SelectTrigger className="w-full sm:w-[150px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedEvent(null);
                  setSelectedType(null);
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
        ) : displayedList.length === 0 ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] p-12 text-center">
              <UserCheck className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
              <p className="text-sm text-[#6B7280]">No pending {activeSection} verifications</p>
            </div>
          </div>
        ) : (
          paginatedRegistrations.map((registration, index) => (
            <div key={registration.id} className="bg-[#F4F2F0] rounded-[16px] p-2.5 animate-card-entrance" style={{ animationDelay: `${index * 100 + 200}ms` }}>
              <div className="px-3 pt-1.5 pb-3 my-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">{registration.studentName}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 ${activeSection === 'payment' ? 'bg-[#E0E7FF] text-[#6366F1]' : 'bg-[#FECACA] text-[#991B1B]'} text-xs font-medium rounded`}>
                        {registration.registrationId}
                      </span>
                      {isUrgent(registration.registrationDeadline) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded flex items-center gap-1 animate-pulse border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          URGENT DEADLINE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6B7280] mb-2">
                  <span className="font-medium text-[#4B5563]">{registration.rollNumber}</span>
                  <span className="text-[#9CA3AF]">•</span>
                  <span>{registration.year}</span>
                  <span className="text-[#9CA3AF]">•</span>
                  <span>{registration.department}</span>
                  <span className="text-[#9CA3AF]">•</span>
                  <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-[11px] border shadow-sm ${isUrgent(registration.registrationDeadline)
                    ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse'
                    : 'text-indigo-600 bg-indigo-50 border-indigo-100'
                    }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>DEADLINE: {registration.registrationDeadline ? new Date(registration.registrationDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{registration.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{registration.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[16px] p-6">
                {activeSection === 'payment' ? (
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-full md:w-48 h-48 md:h-32 bg-[#F7F8FA] rounded-lg overflow-hidden shrink-0 border border-[#E5E7EB] relative">
                      <Image
                        src={registration.paymentScreenshot || 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=400&h=300&fit=crop'}
                        alt="Payment Screenshot"
                        fill
                        className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleViewDetails(registration)}
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#F7F8FA] rounded-lg p-3">
                          <div className="text-xs text-[#6B7280] mb-1">Event</div>
                          <div className="font-medium text-sm text-[#1A1A1A]">{registration.eventName}</div>
                          <div className="text-xs text-[#6B7280]">{registration.eventType}</div>
                        </div>
                        <div className="bg-[#F7F8FA] rounded-lg p-3">
                          <div className="text-xs text-[#6B7280] mb-1">Payment Amount</div>
                          <div className="font-semibold text-lg text-[#1A1A1A]">₹{registration.paymentAmount}</div>
                          <div className="text-xs text-[#6B7280]">TXN: {registration.transactionId}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                          onClick={() => handleViewDetails(registration)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
                        >
                          <Eye className="w-4 h-4" /> View Screenshot
                        </button>
                        <button
                          onClick={() => handleApproveClick(registration.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve Payment
                        </button>
                        <button
                          onClick={() => handleRejectClick(registration.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Event</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">{registration.eventName}</div>
                        <div className="text-xs text-[#6B7280]">{registration.eventType}</div>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-lg p-3">
                        <div className="text-xs text-[#6B7280] mb-1">Registration Date</div>
                        <div className="font-medium text-sm text-[#1A1A1A]">
                          {new Date(registration.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                        <div className="text-sm font-semibold text-[#991B1B]">Missing Requirements</div>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {(registration.missingRequirements || ['Document Verification']).map((req: any, i: any) => (
                          <li key={i} className="text-sm text-[#991B1B] list-disc">{req}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApproveClick(registration.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Anyway
                      </button>
                      <button
                        onClick={() => handleRejectClick(registration.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject Registration
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <div className="text-sm text-[#6B7280]">
            Showing <span className="font-medium text-[#1A1A1A]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[#1A1A1A]">{Math.min(currentPage * itemsPerPage, displayedList.length)}</span> of <span className="font-medium text-[#1A1A1A]">{displayedList.length}</span> requests
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageWithoutScrollJump(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPageWithoutScrollJump(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#F7F8FA] text-[#6B7280]'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPageWithoutScrollJump(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDetailsModal && !!selectedRegistration && selectedRegistration.type === 'payment'}
        onClose={() => setShowDetailsModal(false)}
        title="Payment Verification"
        confirmText="Approve Payment"
        onConfirm={() => {
          setShowDetailsModal(false);
          handleApproveClick(selectedRegistration.id);
        }}
        size="lg">
        {selectedRegistration && (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-[#1A1A1A] mb-3">Payment Screenshot</div>
              <div className="bg-[#F7F8FA] rounded-xl p-2 border border-[#E5E7EB] relative h-96">
                <Image
                  src={selectedRegistration.paymentScreenshot || 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=400&h=300&fit=crop'}
                  alt="Payment Screenshot"
                  fill
                  className="object-contain rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">Student / Roll Number</div>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.studentName} ({selectedRegistration.rollNumber})
                </div>
              </div>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="text-xs text-[#6B7280] mb-1">Event / Amount</div>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.eventName} - ₹{selectedRegistration.paymentAmount}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleRejectClick(selectedRegistration.id);
                }}
                className="flex-1 px-4 py-2.5 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors">
                Reject Payment
              </button>
            </div>
          </div>
        )}
      </Modal>

      {showApproveDialog &&
        <ConfirmDialog
          title="Approve Registration"
          message="Are you sure you want to approve this registration? The student will be notified and their registration will be confirmed."
          confirmLabel="Approve"
          cancelLabel="Cancel"
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApproveDialog(false)}
          variant="success" />
      }

      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
        }}
        title="Reject Registration"
        confirmText="Reject Registration"
        onConfirm={handleRejectConfirm}
        confirmButtonClass="bg-[#EF4444] hover:bg-[#DC2626]">
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Please provide a reason for rejecting this registration. The student will be notified with this message.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444] resize-none" />
        </div>
      </Modal>
    </div>
  );
}