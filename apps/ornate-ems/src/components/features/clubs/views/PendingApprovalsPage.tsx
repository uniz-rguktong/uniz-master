'use client';
import { useState, useEffect } from 'react';
import {
  Search, CheckCircle, XCircle, Eye, Mail, Phone,
  DollarSign, AlertTriangle, Clock,
  RefreshCw, UserCheck
} from
  'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import { updateRegistrationStatus } from '@/actions/registrationActions';

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

interface PendingApprovalsPageProps {
  initialData?: Array<Record<string, any>>;
  initialEvents?: Array<Record<string, any>>;
}

export function PendingApprovalsPage({ initialData = [], initialEvents = [] }: PendingApprovalsPageProps = {}) {
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
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);

  // Derive categories from events
  const eventCategories = [...new Set(initialEvents.map(e => e.category))].filter(Boolean);

  // Group events by category
  const eventsByCategory = initialEvents.reduce((acc: any, event: any) => {
    const cat = event.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    if (!acc[cat].includes(event.title)) {
      acc[cat].push(event.title);
    }
    return acc;
  }, {});

  const [paymentsList, setPaymentsList] = useState(initialData.filter(r => r.type === 'payment'));
  const [requirementsList, setRequirementsList] = useState(initialData.filter(r => r.type === 'requirements'));

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  const currentList = activeSection === 'payment' ? paymentsList : requirementsList;

  const filteredRegistrations = currentList.filter((reg: any) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by Event Category (exact match)
    const matchesCategory = !selectedCategory || reg.eventType === selectedCategory;

    // Filter by Event Name
    const matchesEvent = !selectedEvent || reg.eventName === selectedEvent;

    // Filter by Registration Type (Individual vs Team)
    const isTeam = (reg.teamName && reg.teamName.length > 0) || (reg.teamSize && Number(reg.teamSize) > 1);

    const matchesType = !selectedType ||
      (selectedType === 'Individual' && !isTeam) ||
      (selectedType === 'Team' && isTeam);

    return matchesSearch && matchesCategory && matchesEvent && matchesType;
  });

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
    try {
      const result = await updateRegistrationStatus(registrationToProcess, 'CONFIRMED', { paymentStatus: 'PAID' });
      if (result.success) {
        showToast('Registration approved successfully', 'success');
        setPaymentsList(prev => prev.filter(r => r.id !== registrationToProcess));
        setRequirementsList(prev => prev.filter(r => r.id !== registrationToProcess));
      } else {
        showToast(result.error || 'Failed to approve registration', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
    setShowApproveDialog(false);
    setRegistrationToProcess(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    try {
      const result = await updateRegistrationStatus(registrationToProcess, 'REJECTED', { notes: rejectionReason });
      if (result.success) {
        showToast('Registration rejected', 'success');
        setPaymentsList(prev => prev.filter(r => r.id !== registrationToProcess));
        setRequirementsList(prev => prev.filter(r => r.id !== registrationToProcess));
      } else {
        showToast(result.error || 'Failed to reject registration', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
    setShowRejectDialog(false);
    setRegistrationToProcess(null);
    setRejectionReason('');
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
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

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                <MetricCard
                  title="Total Pending"
                  value={paymentsList.length + requirementsList.length}
                  icon={Clock}
                  iconBgColor="#FEF3C7"
                  iconColor="#F59E0B"
                  trend={{ value: "+3", isPositive: true, comparisonText: "vs yesterday" }}
                  tooltip="Total registrations awaiting verification" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                <MetricCard
                  title="Payment Verification"
                  value={paymentsList.length}
                  icon={DollarSign}
                  iconBgColor="#E0E7FF"
                  iconColor="#6366F1"
                  trend={{ value: "+2", isPositive: true, comparisonText: "vs yesterday" }}
                  tooltip="Registrations pending payment confirmation" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <MetricCard
                  title="Requirements Check"
                  value={requirementsList.length}
                  icon={AlertTriangle}
                  iconBgColor="#FECACA"
                  iconColor="#EF4444"
                  trend={{ value: "+1", isPositive: true, comparisonText: "vs yesterday" }}
                  tooltip="Registrations pending eligibility verification" />
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                <MetricCard
                  title="Approved Today"
                  value={12}
                  icon={CheckCircle}
                  iconBgColor="#D1FAE5"
                  iconColor="#10B981"
                  trend={{ value: "+4", isPositive: true, comparisonText: "vs yesterday" }}
                  tooltip="Successfully processed registrations today" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveSection('payment')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'payment' ?
              'bg-[#6366F1] text-white' :
              'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
          >
            <DollarSign className="w-4 h-4" />
            Payment Verification ({paymentsList.length})
          </button>
          <button
            onClick={() => setActiveSection('requirements')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'requirements' ?
              'bg-[#EF4444] text-white' :
              'text-[#6B7280] hover:bg-[#F7F8FA]'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Requirements Verification ({requirementsList.length})
          </button>
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
                placeholder="Search by name, roll number, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">

              {/* Category Dropdown */}
              <Select value={selectedCategory || ''} onValueChange={(val) => {
                setSelectedCategory(val);
                setSelectedEvent(null);
                setSelectedType(null);
              }}>
                <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category: any) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Event Name Dropdown */}
              {selectedCategory && (
                <Select value={selectedEvent || ''} onValueChange={(val) => {
                  setSelectedEvent(val);
                  setSelectedType(null);
                }}>
                  <SelectTrigger className="w-full sm:w-[180px] h-[42px] bg-[#F7F8FA] border border-[#E5E7EB]">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {(eventsByCategory[selectedCategory] || []).map((event: any) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Registration Type Dropdown */}
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
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors whitespace-nowrap">
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Content */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_: any, i: any) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[16px] p-4 animate-pulse">
              <Skeleton width="100%" height={200} borderRadius={16} />
            </div>
          ))
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] p-12 text-center">
              <UserCheck className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
              <p className="text-sm text-[#6B7280]">No pending {activeSection} verifications</p>
            </div>
          </div>
        ) : (
          filteredRegistrations.map((registration: any, index: any) => (
            <div key={registration.id} className="bg-[#F4F2F0] rounded-[16px] p-2.5 animate-card-entrance" style={{ animationDelay: `${index * 100 + 200}ms` }}>
              {/* Top Section: Student Info */}
              <div className="px-3 pt-1.5 pb-3 my-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">{registration.studentName}</h3>
                    <span className={`px-2 py-0.5 ${activeSection === 'payment' ? 'bg-[#E0E7FF] text-[#6366F1]' : 'bg-[#FECACA] text-[#991B1B]'} text-xs font-medium rounded`}>
                      {registration.registrationId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-2">
                  <span className="font-medium text-[#4B5563]">{registration.rollNumber}</span>
                  <span className="text-[#9CA3AF]">•</span>
                  <span>{registration.year}</span>
                  <span className="text-[#9CA3AF]">•</span>
                  <span>{registration.department}</span>
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

              {/* Inner White Card */}
              <div className="bg-white rounded-[16px] p-6">
                {activeSection === 'payment' ? (
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-full md:w-48 h-48 md:h-32 bg-[#F7F8FA] rounded-lg overflow-hidden shrink-0 border border-[#E5E7EB] relative">
                      <Image
                        src={registration.paymentScreenshot}
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
                        {registration.missingRequirements?.map((req: any, i: any) => (
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

      {/* Payment Screenshot Modal */}
      <Modal
        isOpen={showDetailsModal && !!selectedRegistration && selectedRegistration.type === 'payment'}
        onClose={() => setShowDetailsModal(false)}
        title="Payment Verification"
        confirmText="Approve Payment"
        onConfirm={() => {
          setShowDetailsModal(false);
          handleApproveClick(selectedRegistration.id);
        }}
        size="lg"
        tooltipText="Verify the student's payment screenshot against their registration details.">

        {selectedRegistration &&
          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-[#1A1A1A] mb-3">Payment Screenshot</div>
              <div className="bg-[#F7F8FA] rounded-xl p-2 border border-[#E5E7EB]">
                <Image
                  src={selectedRegistration.paymentScreenshot}
                  alt="Payment Screenshot"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg" />

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
        }
      </Modal>

      {/* Approve Confirmation Dialog */}
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

      {/* Reject Dialog with Reason */}
      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
        }}
        title="Reject Registration"
        confirmText="Reject Registration"
        onConfirm={handleRejectConfirm}
        confirmButtonClass="bg-[#EF4444] hover:bg-[#DC2626]"
        tooltipText="Provide a reason for rejection. This will be sent to the student.">

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

    </div>);
}