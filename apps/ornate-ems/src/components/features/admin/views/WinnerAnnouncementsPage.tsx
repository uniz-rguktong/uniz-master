'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Plus, Edit, Trash2, Eye, Download, CheckCircle, Users, Search } from 'lucide-react';
import { ModalContainer } from '@/components/ModalContainer';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InfoTooltip } from '@/components/InfoTooltip';
import { useToast } from '@/hooks/useToast';
import {
  createWinnerAnnouncement,
  updateWinnerAnnouncement,
  deleteWinnerAnnouncement,
  togglePublishWinnerAnnouncement
} from '@/actions/winnerActions';
import { distributeCertificates } from '@/actions/certificateActions';

import { getCategoryColor } from '@/lib/constants';

interface WinnerAnnouncementsPageProps {
  initialWinners?: any[];
  availableEvents?: any[];
  readOnlyFromRegistrations?: boolean;
}

function getOrdinalLabel(rank: number) {
  const remainderTen = rank % 10;
  const remainderHundred = rank % 100;

  if (remainderTen === 1 && remainderHundred !== 11) return `${rank}st`;
  if (remainderTen === 2 && remainderHundred !== 12) return `${rank}nd`;
  if (remainderTen === 3 && remainderHundred !== 13) return `${rank}rd`;
  return `${rank}th`;
}

function inferRankFromPrize(prize: unknown): number | null {
  const text = String(prize || '').trim().toLowerCase();
  if (!text) return null;

  if (text.includes('first') || text.includes('1st') || text.includes('gold')) return 1;
  if (text.includes('second') || text.includes('2nd') || text.includes('silver')) return 2;
  if (text.includes('third') || text.includes('3rd') || text.includes('bronze')) return 3;

  return null;
}

function getPositionPlaceLabel(position: any, index: number) {
  const numericRank = Number(position?.rank);
  if (Number.isFinite(numericRank) && numericRank > 0) {
    return `${getOrdinalLabel(numericRank)} Place`;
  }

  const inferredRank = inferRankFromPrize(position?.prize);
  if (inferredRank) {
    return `${getOrdinalLabel(inferredRank)} Place`;
  }

  return `${getOrdinalLabel(index + 1)} Place`;
}

function getRankNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return null;
}

function getRegistrationTypeLabel(eventType: unknown) {
  const normalized = String(eventType || '').trim().toLowerCase();
  if (!normalized) return 'Individual';
  if (normalized.includes('team')) return 'Team';
  return 'Individual';
}

export function WinnerAnnouncementsPage({ initialWinners = [], availableEvents = [], readOnlyFromRegistrations = false }: WinnerAnnouncementsPageProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Actions State
  const [editingId, setEditingId] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Form State
  const [formData, setFormData] = useState<any>({
    eventId: '',
    positions: [
      { rank: 1, teamName: '', members: '', project: '', prize: '', certificate: false },
      { rank: 2, teamName: '', members: '', project: '', prize: '', certificate: false },
      { rank: 3, teamName: '', members: '', project: '', prize: '', certificate: false }
    ],
    generateCertificates: false,
    notifyWinners: false
  });

  // Transform initial data on mount
  useEffect(() => {
    if (!isMounted) return;

    // Only transform if we have data, otherwise just stop loading
    if (!initialWinners || initialWinners.length === 0) {
      setIsLoading(false);
      return;
    }

    const transformed = initialWinners.map(w => ({
      id: w.id,
      eventId: w.eventId,
      eventName: w.event?.title || 'Unknown Event',
      eventCategory: w.event?.category || 'General',
      registrationType: getRegistrationTypeLabel(w.event?.eventType),
      categoryColor: getCategoryColor(w.event?.category),
      eventDate: w.event?.date ? new Date(w.event.date).toISOString().split('T')[0] : '',
      rankedRegistrations: w.event?.registrations || [],
      positions: w.positions || [],
      isPublished: w.isPublished,
      publishedDate: w.publishedAt
    }));
    setWinnersList(transformed);
    setIsLoading(false);
  }, [initialWinners, isMounted]);

  // Get events that don't have announcements yet (for create mode)
  const eventsWithoutWinners = availableEvents.filter(
    e => !e.winnerAnnouncement && !winnersList.some(w => w.eventId === e.id)
  );

  const resetForm = () => {
    setFormData({
      eventId: '',
      positions: [
        { rank: 1, teamName: '', members: '', project: '', prize: '', certificate: false },
        { rank: 2, teamName: '', members: '', project: '', prize: '', certificate: false },
        { rank: 3, teamName: '', members: '', project: '', prize: '', certificate: false }
      ],
      generateCertificates: false,
      notifyWinners: false
    });
    setEditingId(null);
  };

  const handleEdit = (winner: any) => {
    setFormData({
      eventId: winner.eventId,
      positions: [1, 2, 3].map(rank => {
        const pos = winner.positions.find((p: any) => p.rank === rank);
        return {
          rank,
          teamName: pos?.teamName || '',
          members: Array.isArray(pos?.members) ? pos.members.join(', ') : (pos?.members || ''),
          project: pos?.project || '',
          prize: pos?.prize || '',
          certificate: pos?.certificate || false
        };
      }),
      generateCertificates: false,
      notifyWinners: false
    });
    setEditingId(winner.id);
    setShowCreateModal(true);
  };

  const handleDelete = (id: any) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    const result = await deleteWinnerAnnouncement(deleteId);
    if (result.success) {
      setWinnersList((prev: any) => prev.filter((w: any) => w.id !== deleteId));
      showToast('Winner announcement deleted', 'success');
    } else {
      showToast((result as any).error || 'Failed to delete', 'error');
    }
    setShowConfirmDialog(false);
    setIsSaving(false);
  };

  const handleTogglePublish = async (winner: any) => {
    const newStatus = !winner.isPublished;
    const result = await togglePublishWinnerAnnouncement(winner.id, newStatus);
    if (result.success) {
      setWinnersList((prev: any) => prev.map((w: any) =>
        w.id === winner.id ? { ...w, isPublished: newStatus, publishedDate: newStatus ? new Date().toISOString() : null } : w
      ));
      showToast(newStatus ? 'Published successfully' : 'Unpublished', 'success');
    } else {
      showToast((result as any).error || 'Failed to update', 'error');
    }
  };

  const handleDownload = (winner: any) => {
    showToast(`Downloading data for ${winner.eventName}...`, 'info');
  };

  const handleSave = async (publish = true) => {
    if (!formData.eventId) {
      showToast('Please select an event', 'error');
      return;
    }

    setIsSaving(true);

    // Transform positions
    const newPositions = formData.positions.map((p: any) => ({
      rank: p.rank,
      teamName: p.teamName || null,
      members: p.members.split(',').map((m: any) => m.trim()).filter(Boolean),
      project: p.project || null,
      prize: p.prize || '',
      certificate: formData.generateCertificates
    })).filter((p: any) => p.teamName || p.members.length > 0);

    if (newPositions.length === 0) {
      showToast('Please add at least one winner', 'error');
      setIsSaving(false);
      return;
    }

    // Validation: Ensure email is provided for distribution
    for (const pos of newPositions) {
      const hasEmail = pos.members.some((m: any) => m.includes('@'));
      if (!hasEmail) {
        showToast(`Rank ${pos.rank}: Please provide a valid email (Gmail) for certificate distribution.`, 'error');
        setIsSaving(false);
        return;
      }
    }

    try {
      let result;
      if (editingId) {
        result = await updateWinnerAnnouncement(editingId, {
          eventId: formData.eventId,
          positions: newPositions,
          isPublished: publish
        });
      } else {
        result = await createWinnerAnnouncement({
          eventId: formData.eventId,
          positions: newPositions,
          isPublished: publish
        });
      }

      if (result.success) {
        // Find the event details for UI update
        const selectedEvent = availableEvents.find(e => e.id === formData.eventId);

        if (editingId) {
          setWinnersList(prev => prev.map(w =>
            w.id === editingId ? {
              ...w,
              eventId: formData.eventId,
              eventName: selectedEvent?.title || 'Unknown',
              eventCategory: selectedEvent?.category || 'General',
              categoryColor: getCategoryColor(selectedEvent?.category),
              eventDate: selectedEvent?.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
              positions: newPositions,
              isPublished: publish,
              publishedDate: publish ? new Date().toISOString() : null
            } : w
          ));
          showToast('Announcement updated', 'success');
        } else {
          const newWinner = {
            id: (result.data as any).id,
            eventId: formData.eventId,
            eventName: selectedEvent?.title || 'Unknown',
            eventCategory: selectedEvent?.category || 'General',
            categoryColor: getCategoryColor(selectedEvent?.category),
            eventDate: selectedEvent?.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
            positions: newPositions,
            isPublished: publish,
            publishedDate: publish ? new Date().toISOString() : null
          };
          setWinnersList(prev => [newWinner, ...prev]);
          showToast(publish ? 'Winners announced successfully' : 'Saved as draft', 'success');
        }

        // Check for auto-distribution
        if (publish && (formData.generateCertificates || formData.notifyWinners)) {
          showToast('Initiating certificate distribution...', 'info');
          try {
            const distResult = await distributeCertificates(formData.eventId);
            if (distResult.success) {
              showToast('Certificates distributed and emails sent!', 'success');
            } else {
              showToast('Distribution warning: ' + distResult.error, 'warning');
            }
          } catch (err) {
            console.error(err);
            showToast('Failed to auto-distribute certificates', 'warning');
          }
        }

        setShowCreateModal(false);
        resetForm();
      } else {
        showToast((result as any).error || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredWinners = winnersList.filter((w: any) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'published') return w.isPublished;
    if (filterStatus === 'draft') return !w.isPublished;
    return true;
  });

  const getRankIcon = (rank: any) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-[#F59E0B]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#9CA3AF]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default:
        return <Award className="w-6 h-6 text-[#6B7280]" />;
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Content Management</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Winner Announcements</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Winner Announcements</h1>
            <p className="text-sm text-[#6B7280]">
              {readOnlyFromRegistrations
                ? 'Winners are fetched from ranked registrations. Use All Registrations → Actions → Announce Winners.'
                : 'Announce and manage event winners and prizes'}
            </p>
          </div>

          {!readOnlyFromRegistrations && (
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              disabled={eventsWithoutWinners.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-5 h-5" />
              Announce Winners
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                title="Total Events"
                value={winnersList.length}
                icon={Trophy}
                iconBgColor="#DBEAFE"
                iconColor="#3B82F6"
                tooltip="Total events with winner announcements"
              />

              <MetricCard
                title="Published"
                value={winnersList.filter((w: any) => w.isPublished).length}
                icon={CheckCircle}
                iconBgColor="#D1FAE5"
                iconColor="#10B981"
                tooltip="Announcements currently visible to users"
              />

              <MetricCard
                title="Total Winners"
                value={winnersList.reduce((sum: any, w: any) => sum + (w.positions?.length || 0), 0)}
                icon={Users}
                iconBgColor="#F5F3FF"
                iconColor="#8B5CF6"
                tooltip="Total winner positions recorded across all events"
              />

              <MetricCard
                title="Certificates Issued"
                value={winnersList.reduce((sum: any, w: any) => sum + (w.positions?.filter((p: any) => p.certificate)?.length || 0), 0)}
                icon={Award}
                iconBgColor="#FEF3C7"
                iconColor="#F59E0B"
                tooltip="Winner entries marked for certificate issuance"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'published', 'draft'].map((status: any) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === status ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Winners List */}
      <div className="space-y-8">
        {isLoading ? (
          [...Array(2)].map((_: any, i: any) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="px-6 py-4 bg-[rgb(244,242,240)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="w-48 h-5" />
                    <Skeleton className="w-36 h-3" />
                  </div>
                </div>
              </div>
              <div className="bg-[#F4F2F0] p-2">
                <div className="bg-white rounded-[12px] p-4 space-y-4">
                  <Skeleton className="w-full h-28 rounded-xl" />
                </div>
              </div>
            </div>
          ))
        ) : filteredWinners.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]">
            <Trophy className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No Winner Announcements</h3>
            <p className="text-sm text-[#6B7280] mb-6">Get started by announcing winners for your completed events.</p>
            {!readOnlyFromRegistrations && (
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                disabled={eventsWithoutWinners.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-50">
                <Plus className="w-4 h-4" />
                Announce Winners
              </button>
            )}
          </div>
        ) : (
          filteredWinners.map((event: any) => (
            <div key={event.id} className="bg-white rounded-xl overflow-hidden">
              {/* Event Header */}
              <div className="px-4 md:px-6 py-4 bg-[rgb(244,242,240)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#1A1A1A]">
                        {event.eventName}
                      </h3>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: event.categoryColor }}>
                        {event.eventCategory}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#3730A3]">
                        {event.registrationType}
                      </span>
                      {event.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-semibold">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-semibold">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B7280] mt-1">
                      Event Date: {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                      {event.publishedDate && (
                        <span>
                          {' • '}Published: {new Date(event.publishedDate).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!event.isPublished && (
                    <button
                      onClick={() => handleTogglePublish(event)}
                      className="px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors">
                      Publish
                    </button>
                  )}
                  {event.isPublished && (
                    <button
                      onClick={() => handleTogglePublish(event)}
                      className="px-4 py-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium transition-colors text-[#6B7280]">
                      Unpublish
                    </button>
                  )}
                  {!readOnlyFromRegistrations && (
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-[#6B7280]" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(event)}
                    className="p-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  {!readOnlyFromRegistrations && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 bg-white hover:bg-[#FEE2E2] border border-[#E5E7EB] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Winners */}
              <div className="bg-[#F4F2F0] rounded-none p-2">
                <div className="bg-white rounded-[12px] p-4 space-y-4">
                  {event.positions?.map((position: any, index: number) => (
                    <div
                      key={`${position.rank || 'position'}-${index}`}
                      className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        {/* Rank Badge */}
                        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-0">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-[#F9FAFB] border border-[#E5E7EB]">
                            {getRankIcon(position.rank)}
                          </div>
                          <div className="mt-0 sm:mt-2 text-sm font-bold text-[#1A1A1A]">
                            {getPositionPlaceLabel(position, index)}
                          </div>
                        </div>

                        {/* Winner Details */}
                        <div className="flex-1 w-full">
                          {position.teamName && (
                            <h4 className="text-lg font-bold text-[#1A1A1A] mb-2">
                              {position.teamName}
                            </h4>
                          )}
                          {(() => {
                            const rankNumber = getRankNumber(position.rank);
                            const registrationPeople = rankNumber
                              ? (event.rankedRegistrations || []).filter((r: any) => Number(r.rank) === rankNumber)
                              : [];
                            const registrationLabel = event.registrationType === 'Team'
                              ? (() => {
                                const allMembers = registrationPeople.flatMap((r: any) => {
                                  const teamMembers = Array.isArray(r?.team?.members) ? r.team.members : [];
                                  if (teamMembers.length > 0) {
                                    return teamMembers.map((member: any) => `${member.name} (${member.rollNumber})`);
                                  }
                                  if (r.studentName || r.studentId) {
                                    return [`${r.studentName} (${r.studentId})`];
                                  }
                                  return [];
                                });

                                return Array.from(new Set(allMembers)).join(', ');
                              })()
                              : registrationPeople
                                .map((r: any) => `${r.studentName} (${r.studentId})`)
                                .join(', ');
                            const fallbackMembers = Array.isArray(position.members) ? position.members.join(', ') : position.members;
                            const detailsText = registrationLabel || fallbackMembers;

                            if (!detailsText) return null;

                            return (
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-[#1A1A1A]">Students:</span>
                                <span className="text-sm text-[#6B7280]">{detailsText}</span>
                              </div>
                            );
                          })()}
                          {position.project && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-[#1A1A1A]">Project:</span>
                              <span className="text-sm text-[#6B7280]">{position.project}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-[#10B981]" />
                              <span className="text-sm font-semibold text-[#10B981]">
                                {position.prize}
                              </span>
                            </div>
                            {position.certificate && (
                              <span className="text-xs px-2 py-1 bg-white border border-[#E5E7EB] rounded-full text-[#6B7280]">
                                ✓ Certificate Issued
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {!readOnlyFromRegistrations && showCreateModal &&
        <ModalContainer
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title={editingId ? "Edit Winners" : "Announce Event Winners"}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[16px] font-normal text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50">
                Cancel
              </button>
              {!editingId &&
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] text-[16px] font-normal text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save as Draft'}
                </button>
              }
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 bg-[#10B981] text-white rounded-[10px] text-[16px] font-normal hover:bg-[#059669] transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Publish Winners')}
              </button>
            </div>
          }>

          <div className="space-y-4">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Select Event <span className="text-[#EF4444]">*</span>
              </label>
              <Select
                value={formData.eventId}
                onValueChange={(val) => setFormData({ ...formData, eventId: val })}
                disabled={editingId != null}
              >
                <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {(editingId ? availableEvents : eventsWithoutWinners).map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} {event.category ? `(${event.category})` : ''} - {event.date ? new Date(event.date).toLocaleDateString() : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventsWithoutWinners.length === 0 && !editingId && (
                <p className="text-xs text-[#F59E0B] mt-1">All your events already have winner announcements.</p>
              )}
            </div>

            {/* Winner Positions */}
            {[0, 1, 2].map((idx: any) => (
              <div key={idx} className="border-t border-[#E5E7EB] pt-4">
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  {getRankIcon(idx + 1)}
                  {idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Place Winner
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.positions[idx].teamName}
                    onChange={(e) => {
                      const newPos = [...formData.positions];
                      newPos[idx].teamName = e.target.value;
                      setFormData({ ...formData, positions: newPos });
                    }}
                    placeholder="Team/Student Name"
                    className="px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />

                  <input
                    type="text"
                    value={formData.positions[idx].prize}
                    onChange={(e) => {
                      const newPos = [...formData.positions];
                      newPos[idx].prize = e.target.value;
                      setFormData({ ...formData, positions: newPos });
                    }}
                    placeholder="Prize (e.g., $1000, Trophy)"
                    className="px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
                </div>
                <input
                  type="text"
                  value={formData.positions[idx].members}
                  onChange={(e) => {
                    const newPos = [...formData.positions];
                    newPos[idx].members = e.target.value;
                    setFormData({ ...formData, positions: newPos });
                  }}
                  placeholder="Team Members (Gmail/Email required for certificate distribution)"
                  className="w-full mt-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
                <input
                  type="text"
                  value={formData.positions[idx].project}
                  onChange={(e) => {
                    const newPos = [...formData.positions];
                    newPos[idx].project = e.target.value;
                    setFormData({ ...formData, positions: newPos });
                  }}
                  placeholder="Project Name (optional)"
                  className="w-full mt-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
              </div>
            ))}

            {/* Options */}
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="generateCertificates"
                checked={formData.generateCertificates}
                onChange={(e) => setFormData({ ...formData, generateCertificates: e.target.checked })}
                className="w-4 h-4 rounded border-[#E5E7EB]"
              />
              <label htmlFor="generateCertificates" className="text-sm text-[#1A1A1A]">Generate certificates automatically</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyWinners"
                checked={formData.notifyWinners}
                onChange={(e) => setFormData({ ...formData, notifyWinners: e.target.checked })}
                className="w-4 h-4 rounded border-[#E5E7EB]"
              />
              <label htmlFor="notifyWinners" className="text-sm text-[#1A1A1A]">Send email notifications to winners</label>
            </div>
          </div>
        </ModalContainer>
      }

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Delete Winner Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        onConfirm={confirmDelete}
        type="danger"
      />


    </div>
  );
}