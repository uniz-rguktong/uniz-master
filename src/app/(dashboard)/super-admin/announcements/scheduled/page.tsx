'use client';
import { useState } from 'react';
import { Megaphone, Calendar, Clock, Edit2, Trash2, Users, Eye, PlayCircle, Pause } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MetricCard } from '@/components/MetricCard';
import { useToast } from '@/hooks/useToast';

const SCHEDULED_ANNOUNCEMENTS = [
    {
        id: 1,
        title: 'Inauguration Ceremony Reminder',
        type: 'Important',
        author: 'Super Admin',
        scheduledFor: 'Feb 10, 2025 • 08:00 AM',
        description: 'Reminder for all students and faculty to attend the Grand Inauguration Ceremony at Main Auditorium. Gates open at 7:30 AM.',
        audience: 'Everyone',
        channels: ['Push', 'Banner', 'Email'],
        status: 'Queued',
    },
    {
        id: 2,
        title: 'Cultural Night Performance Schedule',
        type: 'Events',
        author: 'Cultural Admin',
        scheduledFor: 'Feb 12, 2025 • 06:00 PM',
        description: 'The detailed performance schedule for Cultural Night is ready. All participants must report to green room 30 minutes before their slot.',
        audience: 'Registered Participants',
        channels: ['Push', 'Banner'],
        status: 'Queued',
    },
    {
        id: 3,
        title: 'Sports Day Registration Closing',
        type: 'Updates',
        author: 'Sports Admin',
        scheduledFor: 'Feb 14, 2025 • 11:59 PM',
        description: 'Last call for Sports Day registrations! Register now to participate in the inter-branch sports championship.',
        audience: 'All Students',
        channels: ['Push', 'Email'],
        status: 'Queued',
    },
    {
        id: 4,
        title: 'Workshop Materials Available',
        type: 'Information',
        author: 'CSE Admin',
        scheduledFor: 'Feb 15, 2025 • 09:00 AM',
        description: 'Workshop materials and pre-requisites for the AI/ML Workshop are now available for download. Please review before the session.',
        audience: 'III & IV Year',
        channels: ['Email'],
        status: 'Draft',
    },
    {
        id: 5,
        title: 'Exam Schedule Released',
        type: 'Important',
        author: 'Super Admin',
        scheduledFor: 'Feb 20, 2025 • 10:00 AM',
        description: 'The mid-semester examination schedule has been finalized. Students can view their individual timetables in the portal.',
        audience: 'All Students',
        channels: ['Push', 'Banner', 'Email'],
        status: 'Queued',
    },
];

const INITIAL_SCHEDULED = [
    {
        id: 1,
        title: 'Inauguration Ceremony Reminder',
        type: 'Important',
        author: 'Super Admin',
        scheduledFor: 'Feb 10, 2025 • 08:00 AM',
        description: 'Reminder for all students and faculty to attend the Grand Inauguration Ceremony at Main Auditorium. Gates open at 7:30 AM.',
        audience: 'Everyone',
        channels: ['Push', 'Banner', 'Email'],
        status: 'Queued',
    },
    {
        id: 2,
        title: 'Cultural Night Performance Schedule',
        type: 'Events',
        author: 'Cultural Admin',
        scheduledFor: 'Feb 12, 2025 • 06:00 PM',
        description: 'The detailed performance schedule for Cultural Night is ready. All participants must report to green room 30 minutes before their slot.',
        audience: 'Registered Participants',
        channels: ['Push', 'Banner'],
        status: 'Queued',
    },
    {
        id: 3,
        title: 'Sports Day Registration Closing',
        type: 'Updates',
        author: 'Sports Admin',
        scheduledFor: 'Feb 14, 2025 • 11:59 PM',
        description: 'Last call for Sports Day registrations! Register now to participate in the inter-branch sports championship.',
        audience: 'All Students',
        channels: ['Push', 'Email'],
        status: 'Queued',
    },
    {
        id: 4,
        title: 'Workshop Materials Available',
        type: 'Information',
        author: 'CSE Admin',
        scheduledFor: 'Feb 15, 2025 • 09:00 AM',
        description: 'Workshop materials and pre-requisites for the AI/ML Workshop are now available for download. Please review before the session.',
        audience: 'III & IV Year',
        channels: ['Email'],
        status: 'Draft',
    },
    {
        id: 5,
        title: 'Exam Schedule Released',
        type: 'Important',
        author: 'Super Admin',
        scheduledFor: 'Feb 20, 2025 • 10:00 AM',
        description: 'The mid-semester examination schedule has been finalized. Students can view their individual timetables in the portal.',
        audience: 'All Students',
        channels: ['Push', 'Banner', 'Email'],
        status: 'Queued',
    },
];

const FILTERS = ['All', 'Queued'];

const toDateTimeLocalValue = (scheduledFor: string) => {
    if (!scheduledFor) return '';
    const normalized = scheduledFor.replace(' • ', ', ');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return '';

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toScheduledForDisplay = (dateTimeValue: string) => {
    if (!dateTimeValue) return '';
    const parsed = new Date(dateTimeValue);
    if (Number.isNaN(parsed.getTime())) return '';

    const datePart = parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const timePart = parsed.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return `${datePart} • ${timePart}`;
};

const getTypeColor = (type: any) => {
    switch (type) {
        case 'Important':
            return 'bg-red-500 text-white';
        case 'Events':
            return 'bg-emerald-500 text-white';
        case 'Updates':
            return 'bg-orange-500 text-white';
        case 'Information':
            return 'bg-blue-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

const getStatusColor = (status: any) => {
    switch (status) {
        case 'Queued':
            return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'Draft':
            return 'bg-gray-50 text-gray-600 border-gray-200';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

export default function ScheduledAnnouncementsPage() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [scheduledList, setScheduledList] = useState(INITIAL_SCHEDULED);
    const [editingId, setEditingId] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({ title: '', description: '', scheduledFor: '' });
    const [deleteId, setDeleteId] = useState<any>(null);
    const [sendId, setSendId] = useState<any>(null);
    const { showToast } = useToast();

    const handleEditClick = (announcement: any) => {
        setEditingId(announcement.id);
        setEditForm({
            title: announcement.title,
            description: announcement.description,
            scheduledFor: toDateTimeLocalValue(announcement.scheduledFor)
        });
    };

    const handleSaveEdit = () => {
        setScheduledList((prev: any) => prev.map((item: any) =>
            item.id === editingId
                ? { ...item, ...editForm, scheduledFor: toScheduledForDisplay(editForm.scheduledFor) }
                : item
        ));
        setEditingId(null);
        showToast('Announcement updated successfully', 'success');
    };

    const handleDeleteClick = (id: any) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        setScheduledList((prev: any) => prev.filter((item: any) => item.id !== deleteId));
        setDeleteId(null);
        showToast('Scheduled announcement deleted successfully', 'success');
    };

    const handleSendClick = (id: any) => {
        setSendId(id);
    };

    const confirmSend = () => {
        // In a real app, this would trigger an API call to send the announcement immediately
        // For now, we will just remove it from the scheduled list 
        // to simulate that it has been sent (and thus is no longer "scheduled")
        setScheduledList((prev: any) => prev.filter((item: any) => item.id !== sendId));
        setSendId(null);
        showToast('Announcement sent successfully', 'success');
    };

    const filteredAnnouncements = scheduledList.filter((announcement: any) => {
        return activeFilter === 'All' || announcement.status === activeFilter;
    });

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Scheduled Announcements</h1>
                        <p className="text-sm text-[#6B7280]">Manage upcoming automated broadcasts and messages.</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                    title="Total Scheduled"
                    value={scheduledList.length}
                    icon={Megaphone}
                    iconBgColor="#F3F4F6"
                    iconColor="#6B7280"
                    tooltip="Total number of announcements currently scheduled"
                    compact
                />
                <MetricCard
                    title="Queued"
                    value={scheduledList.filter(a => a.status === 'Queued').length}
                    icon={Clock}
                    iconBgColor="#D1FAE5"
                    iconColor="#10B981"
                    tooltip="Announcements queued to be sent at their scheduled time"
                    compact
                />
                <MetricCard
                    title="Drafts"
                    value={scheduledList.filter(a => a.status === 'Draft').length}
                    icon={Pause}
                    iconBgColor="#FEF3C7"
                    iconColor="#F59E0B"
                    tooltip="Scheduled announcements saved as drafts and not queued yet"
                    compact
                />
                <MetricCard
                    title="Total Views"
                    value="12,450"
                    icon={Eye}
                    iconBgColor="#FFEDD5"
                    iconColor="#F97316"
                    tooltip="Combined views across scheduled announcement items"
                    compact
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
                {FILTERS.map((filter: any) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFilter === filter
                            ? 'bg-[#1A1A1A] text-white shadow-lg'
                            : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Scheduled Announcements List */}
            <div className="space-y-4">
                {filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map((announcement: any) => (
                        <div
                            key={announcement.id}
                            className="bg-[#F4F2F0] rounded-[18px] p-[10px]"
                        >
                            <div className="bg-white rounded-[14px] p-6">
                                {/* Title Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-bold text-[#1A1A1A] text-lg">{announcement.title}</h3>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>
                                                    {announcement.type}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(announcement.status)}`}>
                                                    {announcement.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#6B7280] mt-0.5">
                                                By {announcement.author}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[#6B7280] text-sm mb-4 leading-relaxed">
                                    {announcement.description}
                                </p>

                                {/* Scheduled Time Bar */}
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-700">Scheduled for: {announcement.scheduledFor}</span>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm">{announcement.audience}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {announcement.channels.map((channel: any) => (
                                                <span key={channel} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                                                    {channel}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {announcement.status === 'Queued' && (
                                            <button
                                                onClick={() => handleSendClick(announcement.id)}
                                                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                                                title="Send Now"
                                            >
                                                <PlayCircle className="w-4 h-4 text-emerald-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEditClick(announcement)}
                                            className="p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4 text-[#6B7280]" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(announcement.id)}
                                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                        <div className="bg-white rounded-[14px] p-12 text-center">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-bold text-[#1A1A1A] mb-2">No scheduled announcements</h3>
                            <p className="text-sm text-[#6B7280]">
                                No announcements match the selected filter.
                            </p>
                        </div>
                    </div>
                )}
            </div>


            {/* Edit Modal */}
            <Modal
                isOpen={!!editingId}
                onClose={() => setEditingId(null)}
                title="Edit Scheduled Announcement"
                size="lg"
                onConfirm={handleSaveEdit}
                confirmText="Save Changes"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Subject / Title</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={editForm.title}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Scheduled For</label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={editForm.scheduledFor}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, scheduledFor: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message Content</label>
                        <textarea
                            rows={6}
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                        ></textarea>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Scheduled Announcement"
                message="Are you sure you want to delete this scheduled announcement? This action cannot be undone."
                variant="danger"
            />

            {/* Send Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!sendId}
                onClose={() => setSendId(null)}
                onConfirm={confirmSend}
                title="Send Announcement Now"
                message="Are you sure you want to send this announcement immediately? This will bypass the scheduled time."
                variant="info"
                confirmLabel="Send Now"
            />
        </div >
    );
}
