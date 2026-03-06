'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Plus, Edit, Trash2, Eye, Download, CheckCircle, Users } from 'lucide-react';
import { ModalContainer } from '@/components/ModalContainer';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  createSportWinnerAnnouncement,
  updateSportWinnerAnnouncement,
  deleteSportWinnerAnnouncement,
  toggleSportWinnerAnnouncementPublish
} from '@/actions/sportWinnerActions';
import { distributeCertificates } from '@/actions/certificateActions';

type EntityId = string | number;

interface WinnerPositionInput {
  rank: number;
  teamName?: string;
  members?: string[] | string;
  project?: string;
  prize?: string;
  certificate?: boolean;
}

interface WinnerEvent {
  id: EntityId;
  title?: string;
  category?: string;
  date?: string | Date;
}

interface WinnerAnnouncementInput {
  id: EntityId;
  eventId: EntityId;
  sportId?: EntityId;
  event?: {
    title?: string;
    category?: string;
    date?: string | Date;
  } | null;
  sport?: {
    name?: string;
    category?: string;
    createdAt?: string | Date;
  } | null;
  positions?: WinnerPositionInput[];
  isPublished?: boolean;
  publishedAt?: string | null;
}

interface WinnersAnnouncementPageProps {
  initialWinners?: WinnerAnnouncementInput[];
  availableEvents?: WinnerEvent[];
}

export function WinnersAnnouncementPage({ initialWinners = [], availableEvents = [] }: WinnersAnnouncementPageProps) {
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Actions State
  const [editingId, setEditingId] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { showToast } = useToast();

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

  useEffect(() => {
    // Transform initial data
    const transformed = initialWinners.map(w => ({
      id: w.id,
      eventId: w.sportId || w.eventId,
      eventName: w.sport?.name || w.event?.title || 'Unknown Sport',
      eventCategory: w.sport?.category || w.event?.category || 'Sport',
      categoryColor: '#3B82F6',
      eventDate: (w.sport?.createdAt || w.event?.date) ? new Date((w.sport?.createdAt || w.event?.date) as string | Date).toISOString().split('T')[0] : '',
      positions: w.positions || [],
      isPublished: w.isPublished,
      publishedAt: w.publishedAt
    }));
    setWinnersList(transformed);
    setIsLoading(false);
  }, [initialWinners]);

  const eventsWithoutWinners = availableEvents.filter(
    e => !winnersList.some(w => w.eventId === e.id)
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
    const result = await deleteSportWinnerAnnouncement(deleteId);
    if (result.success) {
      setWinnersList(prev => prev.filter(w => w.id !== deleteId));
      showToast('Winner announcement deleted', 'success');
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
    setShowConfirmDialog(false);
    setIsSaving(false);
  };

  const handleDownload = (winner: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(winner, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${winner.eventName}_winners.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast(`Downloading data for ${winner.eventName}...`, 'info');
  };

  const handleTogglePublish = async (winner: any) => {
    const newStatus = !winner.isPublished;
    const result = await toggleSportWinnerAnnouncementPublish(winner.id, newStatus);
    if (result.success) {
      setWinnersList(prev => prev.map(w =>
        w.id === winner.id ? { ...w, isPublished: newStatus, publishedAt: newStatus ? new Date().toISOString() : null } : w
      ));
      showToast(newStatus ? 'Published successfully' : 'Unpublished', 'success');
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const handleSave = async (publish = true) => {
    if (!formData.eventId) {
      showToast('Please select an event', 'error');
      return;
    }

    setIsSaving(true);

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
        result = await updateSportWinnerAnnouncement(editingId, {
          positions: newPositions,
          isPublished: publish
        });
      } else {
        result = await createSportWinnerAnnouncement(formData.eventId, newPositions);

        if (result.success && publish && (result.data as any)?.id) {
          await updateSportWinnerAnnouncement((result.data as any).id, {
            isPublished: true,
            positions: newPositions
          });
        }
      }

      if (result.success) {
        const selectedEvent = availableEvents.find(e => e.id === formData.eventId);
        if (editingId) {
          setWinnersList(prev => prev.map(w =>
            w.id === editingId ? {
              ...w,
              positions: newPositions,
              isPublished: publish,
              publishedAt: publish ? new Date().toISOString() : null
            } : w
          ));
        } else {
          const newWinner = {
            id: (result.data as any).id,
            eventId: formData.eventId,
            eventName: selectedEvent?.title || 'Unknown',
            eventCategory: selectedEvent?.category || 'Sport',
            categoryColor: '#3B82F6',
            eventDate: selectedEvent?.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
            positions: newPositions,
            isPublished: publish,
            publishedAt: publish ? new Date().toISOString() : null
          };
          setWinnersList(prev => [newWinner, ...prev]);
        }
        setShowCreateModal(false);
        resetForm();
        showToast(publish ? 'Winners announced successfully' : 'Saved as draft', 'success');

        // Check for auto-distribution
        if (publish && (formData.generateCertificates || formData.notifyWinners)) {
          showToast('Sport certificate auto-distribution is not wired yet in this flow.', 'warning');
        }
      } else {
        showToast(result.error || 'Failed to save', 'error');
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
      case 1: return <Trophy className="w-6 h-6 text-[#F59E0B]" />;
      case 2: return <Medal className="w-6 h-6 text-[#9CA3AF]" />;
      case 3: return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default: return <Award className="w-6 h-6 text-[#6B7280]" />;
    }
  };

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
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Sports Winners & Awards</h1>
            <p className="text-sm text-[#6B7280]">Announce and manage tournament winners and official awards</p>
          </div>

          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            disabled={eventsWithoutWinners.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto disabled:opacity-50">
            <Plus className="w-5 h-5" />
            Announce Winners
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => (
              <div key={i} className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                <div className="bg-white rounded-[14px] p-4 animate-pulse">
                  <div className="h-10 w-full bg-gray-100 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                <div className="bg-white rounded-[14px] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#6B7280]">Total Tournaments</div>
                    <div className="text-2xl font-semibold text-[#1A1A1A]">{winnersList.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                <div className="bg-white rounded-[14px] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#6B7280]">Published</div>
                    <div className="text-2xl font-semibold text-[#10B981]">{winnersList.filter(w => w.isPublished).length}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {['all', 'published', 'draft'].map((status: any) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === status ? 'bg-[#1A1A1A] text-white' : 'bg-white border text-[#6B7280]'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Winners List */}
      <div className="space-y-6">
        {isLoading ? (
          <Skeleton width="100%" height={200} />
        ) : filteredWinners.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-500">No winner announcements yet.</p>
          </div>
        ) : (
          filteredWinners.map((event: any) => (
            <div key={event.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 bg-[#F9FAFB] flex items-center justify-between border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">{event.eventName}</h3>
                  <p className="text-sm text-[#6B7280]">{event.eventCategory} • {new Date(event.eventDate).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTogglePublish(event)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${event.isPublished ? 'bg-white text-[#6B7280]' : 'bg-[#10B981] text-white'}`}>
                    {event.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleEdit(event)} className="p-2 border rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDownload(event)} className="p-2 border rounded-lg hover:bg-gray-50"><Download className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-2 border rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {event.positions.map((pos: any) => (
                  <div key={pos.rank} className="p-4 border rounded-xl bg-white flex items-start gap-4 shadow-sm hover:shadow transition-shadow">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border">{getRankIcon(pos.rank)}</div>
                    <div>
                      <div className="font-bold text-[#1A1A1A]">{pos.teamName || 'Individual'}</div>
                      <div className="text-sm text-[#6B7280]">{Array.isArray(pos.members) ? pos.members.join(', ') : pos.members}</div>
                      <div className="mt-2 text-sm font-bold text-[#3B82F6]">{pos.prize}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal & Dialogs */}
      {showCreateModal && (
        <ModalContainer
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title={editingId ? "Edit Winners" : "Announce Winners"}
          footer={
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={() => handleSave(true)} disabled={isSaving} className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg">
                {isSaving ? 'Processing...' : (editingId ? 'Save Changes' : 'Publish')}
              </button>
            </div>
          }>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Tournament/Event</label>
              <Select value={String(formData.eventId || '')} onValueChange={(val) => setFormData({ ...formData, eventId: val })} disabled={!!editingId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {(editingId ? availableEvents : eventsWithoutWinners).map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {[0, 1, 2].map(idx => (
              <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="text-sm font-bold flex items-center gap-2">{getRankIcon(idx + 1)} {idx + 1} Rank</div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Team/Winner Name" value={formData.positions[idx].teamName} onChange={e => {
                    const newPos = [...formData.positions];
                    newPos[idx].teamName = e.target.value;
                    setFormData({ ...formData, positions: newPos });
                  }} className="px-3 py-2 border rounded-lg text-sm" />
                  <input placeholder="Award/Prize" value={formData.positions[idx].prize} onChange={e => {
                    const newPos = [...formData.positions];
                    newPos[idx].prize = e.target.value;
                    setFormData({ ...formData, positions: newPos });
                  }} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <input placeholder="Tag Members (Gmail/Email required)" value={formData.positions[idx].members} onChange={e => {
                  const newPos = [...formData.positions];
                  newPos[idx].members = e.target.value;
                  setFormData({ ...formData, positions: newPos });
                }} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            ))}
          </div>
        </ModalContainer>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Delete Winner"
        message="This will permanently delete the announcement. Continue?"
        onConfirm={confirmDelete}
        type="danger"
      />
    </div>
  );
}
