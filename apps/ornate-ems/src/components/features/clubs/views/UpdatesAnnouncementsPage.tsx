'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Megaphone, Edit, Trash2, Eye, Send, Calendar, Users } from 'lucide-react';

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
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/actions/announcementActions';

interface UpdatesAnnouncementsPageProps {
  autoOpenCreate?: boolean;
}

export function UpdatesAnnouncementsPage({ autoOpenCreate = false }: UpdatesAnnouncementsPageProps) {
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(autoOpenCreate);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  // Edit & Delete State
  const [editingId, setEditingId] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const lastFocusRefreshRef = useRef(0);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const ANNOUNCEMENTS_REFRESH_EVENT = 'ornate:announcements:refresh';
  const FOCUS_REFRESH_THROTTLE_MS = 30000;

  const [formData, setFormData] = useState<any>({
    title: '',
    content: '',
    category: '',
    targetAudience: '',
    expiryDate: '',
    notify: false
  });

  const fetchAnnouncements = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await getAnnouncements();
      if (response.success) {
        setAnnouncementsList(response.data || []);
      } else {
        showToastRef.current('Failed to load announcements', 'error');
      }
    } catch (error) {
      console.error(error);
      showToastRef.current('An error occurred while fetching data', 'error');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements(true);

    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefreshRef.current < FOCUS_REFRESH_THROTTLE_MS) return;
      lastFocusRefreshRef.current = now;
      void fetchAnnouncements(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchAnnouncements(false);
      }
    };

    const onExternalRefresh = () => {
      void fetchAnnouncements(false);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener(ANNOUNCEMENTS_REFRESH_EVENT, onExternalRefresh as EventListener);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener(ANNOUNCEMENTS_REFRESH_EVENT, onExternalRefresh as EventListener);
    };
  }, [fetchAnnouncements]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      targetAudience: '',
      expiryDate: '',
      notify: false
    });
    setEditingId(null);
  };

  const toLocalDateTimeInputValue = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  };

  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      expiryDate: toLocalDateTimeInputValue(announcement.expiryDate),
      notify: false
    });
    setEditingId(announcement.id);
    setShowCreateModal(true);
  };

  const handleDelete = (id: any) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteAnnouncement(deleteId);
      if (response.success) {
        setAnnouncementsList(prev => prev.filter(a => a.id !== deleteId));
        window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_REFRESH_EVENT));
        showToast('Announcement deleted successfully', 'success');
      } else {
        showToast('Failed to delete announcement', 'error');
      }
    } catch (error) {
      showToast('Error deleting announcement', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.category || !formData.targetAudience || !formData.expiryDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingId) {
        const response = await updateAnnouncement(editingId, formData);
        if (response.success) {
          setAnnouncementsList(prev => prev.map(a =>
            a.id === editingId ? response.data : a
          ));
          window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_REFRESH_EVENT));
          showToast('Announcement updated successfully', 'success');
          setShowCreateModal(false);
          resetForm();
        } else {
          showToast(response.error || 'Failed to update announcement', 'error');
        }
      } else {
        const response = await createAnnouncement(formData);
        if (response.success) {
          setAnnouncementsList(prev => [response.data, ...prev]);
          window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_REFRESH_EVENT));
          showToast('Announcement created successfully', 'success');
          setShowCreateModal(false);
          resetForm();
        } else {
          showToast(response.error || 'Failed to create announcement', 'error');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred', 'error');
    }
  };

  const categories = ['All', 'Important', 'Events', 'Updates', 'Information'];

  const filteredAnnouncements = announcementsList.filter((ann: any) => {
    const matchesCategory = filterCategory === 'All' || ann.category === filterCategory;
    const matchesStatus = ann.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Content Management</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Updates & Announcements</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Updates & Announcements</h1>
            <p className="text-sm text-[#6B7280]">Manage important updates and announcements for students</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="hidden md:flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto">

            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 mb-6">
          {isLoading ? (
            [...Array(2)].map((_: any, i: any) => (
              <div key={i} className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton width={40} height={40} borderRadius={8} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="40%" height={14} />
                      <Skeleton width="60%" height={24} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-[#6B7280]">Total Created</div>
                        <div className="text-2xl font-semibold text-[#1A1A1A]">
                          {announcementsList.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <div className="bg-[#F4F2F0] rounded-[18px] p-2 pb-6">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                        <Eye className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-[#6B7280]">Total Views</div>
                        <div className="text-2xl font-semibold text-[#1A1A1A]">
                          {announcementsList.reduce((sum: any, a: any) => sum + a.viewCount, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="md:hidden flex mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full">
            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category: any) =>
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === category ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>

              {category}
            </button>
          )}
        </div>
      </div>



      {/* Regular Announcements */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_: any, i: any) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[16px] p-4 animate-pulse">
              <Skeleton width="100%" height={150} borderRadius={16} />
            </div>
          ))
        ) : (
          filteredAnnouncements.map((announcement: any, index: any) => (
            <div
              key={announcement.id}
              className="bg-[#F4F2F0] rounded-[16px] p-4 hover:shadow-md transition-all animate-card-entrance"
              style={{ animationDelay: `${index * 100 + 200}ms` }}>
              <div className="flex items-center gap-3 mb-4 mt-2 px-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: announcement.categoryColor }}>
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[#1A1A1A]">
                      {announcement.title}
                    </h3>
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-white shrink-0"
                      style={{ backgroundColor: announcement.categoryColor }}>
                      {announcement.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span>By {announcement.createdBy}</span>
                    <span>•</span>
                    <span>
                      {new Date(announcement.createdDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[12px] p-5">
                <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
                  {announcement.content}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Eye className="w-4 h-4" />
                      <span>{announcement.viewCount.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Users className="w-4 h-4" />
                      <span>{announcement.targetAudience}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Expires: {new Date(announcement.expiryDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 bg-[#F7F8FA] hover:bg-[#FEE2E2] border border-[#E5E7EB] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal &&
        <ModalContainer
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title={editingId ? "Edit Announcement" : "Create New Announcement"}
          footer={
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[16px] font-normal text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-[10px] text-[16px] font-normal hover:bg-[#059669] transition-colors">
                <Send className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Publish Announcement'}
              </button>
            </div>
          }>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Content <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter announcement content"
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Category <span className="text-[#EF4444]">*</span>
                </label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Updates">Updates</SelectItem>
                    <SelectItem value="Information">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Target Audience <span className="text-[#EF4444]">*</span>
                </label>
                <Select value={formData.targetAudience} onValueChange={(val) => setFormData({ ...formData, targetAudience: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global (All Users)">Global (All Admins & Students)</SelectItem>
                    <SelectItem value="All Students">All Students</SelectItem>
                    <SelectItem value="I Year">I Year</SelectItem>
                    <SelectItem value="II Year">II Year</SelectItem>
                    <SelectItem value="III Year">III Year</SelectItem>
                    <SelectItem value="IV Year">IV Year</SelectItem>
                    <SelectItem value="Registered Participants">Registered Participants</SelectItem>
                    <SelectItem value="Workshop Participants">Workshop Participants</SelectItem>
                    <SelectItem value="Paid Event Registrants">Paid Event Registrants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Expiry Date & Time <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notify}
                onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                className="w-4 h-4 rounded border-[#E5E7EB]"
              />
              <label className="text-sm text-[#1A1A1A]">Send email notification to target audience</label>
            </div>
          </div>
        </ModalContainer>
      }

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        onConfirm={confirmDelete}
        type="danger"
      />
    </div>);
}