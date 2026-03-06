'use client';
import { useState, useRef, useEffect } from 'react';
import { Megaphone, Send, Clock, Users, Globe, Layout, ChevronDown, ChevronRight, Check, Eye, Edit2, Trash2, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/actions/announcementActions';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];

const CLUBS = [
    { id: 'techexcel', name: 'TechExcel Club' },
    { id: 'sarvasrijana', name: 'Sarvasrijana Club' },
    { id: 'artix', name: 'Artix Club' },
    { id: 'kaladharani', name: 'Kaladharani Club' },
    { id: 'khelsaathi', name: 'KhelSaathi Club' },
    { id: 'icro', name: 'ICRO Club' },
    { id: 'pixelro', name: 'Pixelro Club' },
];

const ANNOUNCEMENTS = [
    {
        id: 1,
        title: 'Registration Deadline Extended',
        type: 'Important',
        author: 'CSE Admin',
        date: 'Nov 5, 2025',
        description: 'The registration deadline for AI/ML Workshop has been extended to November 15, 2025. All interested students can register now.',
        views: 1245,
        audience: 'All Students',
        expires: 'Nov 15',
    },
    {
        id: 2,
        title: 'Hackathon 2025 - Team Formation',
        type: 'Events',
        author: 'CSE Admin',
        date: 'Nov 4, 2025',
        description: 'Team formation portal is now open for Hackathon 2025. Maximum team size is 5 members. Form your teams before November 10.',
        views: 892,
        audience: 'III & IV Year',
        expires: 'Nov 10',
    },
    {
        id: 3,
        title: 'Venue Change - Tech Quiz',
        type: 'Updates',
        author: 'CSE Admin',
        date: 'Nov 3, 2025',
        description: 'Tech Quiz Competition venue has been changed from Seminar Hall to Main Auditorium due to increased registrations.',
        views: 567,
        audience: 'Registered Participants',
        expires: 'Nov 8',
    },
    {
        id: 4,
        title: 'Cultural Night Schedule Released',
        type: 'Events',
        author: 'Cultural Admin',
        date: 'Nov 2, 2025',
        description: 'The schedule for Cultural Night has been released. All participants are requested to check their performance timings.',
        views: 1823,
        audience: 'All Students',
        expires: 'Nov 12',
    },
    {
        id: 5,
        title: 'Library Hours Extended',
        type: 'Information',
        author: 'Super Admin',
        date: 'Nov 1, 2025',
        description: 'Library will remain open till 10 PM during the fest week to accommodate student preparation needs.',
        views: 456,
        audience: 'Everyone',
        expires: 'Nov 20',
    },
];

const INITIAL_ANNOUNCEMENTS = [
    {
        id: 1,
        title: 'Registration Deadline Extended',
        type: 'Important',
        author: 'CSE Admin',
        date: 'Nov 5, 2025',
        description: 'The registration deadline for AI/ML Workshop has been extended to November 15, 2025. All interested students can register now.',
        views: 1245,
        audience: 'All Students',
        expires: 'Nov 15',
    },
    {
        id: 2,
        title: 'Hackathon 2025 - Team Formation',
        type: 'Events',
        author: 'CSE Admin',
        date: 'Nov 4, 2025',
        description: 'Team formation portal is now open for Hackathon 2025. Maximum team size is 5 members. Form your teams before November 10.',
        views: 892,
        audience: 'III & IV Year',
        expires: 'Nov 10',
    },
    {
        id: 3,
        title: 'Venue Change - Tech Quiz',
        type: 'Updates',
        author: 'CSE Admin',
        date: 'Nov 3, 2025',
        description: 'Tech Quiz Competition venue has been changed from Seminar Hall to Main Auditorium due to increased registrations.',
        views: 567,
        audience: 'Registered Participants',
        expires: 'Nov 8',
    },
    {
        id: 4,
        title: 'Cultural Night Schedule Released',
        type: 'Events',
        author: 'Cultural Admin',
        date: 'Nov 2, 2025',
        description: 'The schedule for Cultural Night has been released. All participants are requested to check their performance timings.',
        views: 1823,
        audience: 'All Students',
        expires: 'Nov 12',
    },
    {
        id: 5,
        title: 'Library Hours Extended',
        type: 'Information',
        author: 'Super Admin',
        date: 'Nov 1, 2025',
        description: 'Library will remain open till 10 PM during the fest week to accommodate student preparation needs.',
        views: 456,
        audience: 'Everyone',
        expires: 'Nov 20',
    },
];

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

export default function CreateAnnouncementPage() {
    const [selectedAudiences, setSelectedAudiences] = useState(['everyone']);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('All');

    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [editingId, setEditingId] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({ title: '', description: '' });
    const [deleteId, setDeleteId] = useState<any>(null);
    const [scheduledAnnouncements, setScheduledAnnouncements] = useState<any[]>([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [editingScheduledId, setEditingScheduledId] = useState<any>(null);
    const [scheduledEditForm, setScheduledEditForm] = useState<any>({
        title: '',
        description: '',
        scheduleDateTime: '',
    });
    const { showToast } = useToast();

    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementCategory, setAnnouncementCategory] = useState('Information');
    const [announcementExpiryDate, setAnnouncementExpiryDate] = useState('');
    const [channelPortalBanner, setChannelPortalBanner] = useState(true);
    const [channelPushNotification, setChannelPushNotification] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New state for message content and attachments
    const [messageContent, setMessageContent] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [attachedImages, setAttachedImages] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsHistoryLoading(true);
            try {
                const response = await getAnnouncements();
                if (response.success) {
                    setHistory(response.data || []);
                } else {
                    showToast(response.error || 'Failed to load announcement history', 'error');
                }
            } catch (error) {
                showToast('Failed to load announcement history', 'error');
            } finally {
                setIsHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [showToast]);

    const handleInsertLink = () => {
        setShowLinkModal(true);
    };

    const confirmLink = () => {
        if (linkUrl) {
            setMessageContent((prev: any) => prev + ` ${linkUrl} `);
            setLinkUrl('');
            setShowLinkModal(false);
        }
    };

    const handleAttachImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: any) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            // Create a fake URL for preview
            const imageUrl = URL.createObjectURL(file);
            setAttachedImages((prev: any) => [...prev, { id: Date.now(), name: file.name, url: imageUrl }]);
        }
    };

    const removeImage = (id: any) => {
        setAttachedImages((prev: any) => prev.filter((img: any) => img.id !== id));
    };

    const handleEditClick = (announcement: any) => {
        setEditingId(announcement.id);
        setEditForm({ title: announcement.title, description: announcement.content });
    };

    const handleSaveEdit = async () => {
        if (!editForm.title?.trim() || !editForm.description?.trim()) {
            showToast('Title and content are required', 'error');
            return;
        }

        const existing = history.find((item: any) => item.id === editingId);
        if (!existing) {
            showToast('Announcement not found', 'error');
            return;
        }

        const response = await updateAnnouncement(editingId, {
            title: editForm.title,
            content: editForm.description,
            category: existing.category,
            targetAudience: existing.targetAudience,
            expiryDate: existing.expiryDate
        });

        if (!response.success || !response.data) {
            showToast(response.error || 'Failed to update announcement', 'error');
            return;
        }

        setHistory((prev: any) => prev.map((item: any) =>
            item.id === editingId ? response.data : item
        ));
        setEditingId(null);
        showToast('Announcement updated successfully', 'success');
    };

    const handleDeleteClick = (id: any) => {
        setDeleteId(id);
    };

    const formatDateTimeLocal = (value: any) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const confirmDelete = async () => {
        const response = await deleteAnnouncement(deleteId);
        if (!response.success) {
            showToast(response.error || 'Failed to delete announcement', 'error');
            return;
        }
        setHistory((prev: any) => prev.filter((item: any) => item.id !== deleteId));
        setDeleteId(null);
        showToast('Announcement deleted successfully', 'success');
    };

    const buildTargetAudiencePayload = () => {
        if (selectedAudiences.includes('everyone')) {
            return 'Global (All Users)';
        }
        return getSelectedList().join(', ');
    };

    const validateBroadcastForm = () => {
        if (!announcementTitle.trim()) {
            showToast('Subject / Title is required', 'error');
            return false;
        }
        if (!messageContent.trim()) {
            showToast('Message content is required', 'error');
            return false;
        }
        if (!announcementCategory) {
            showToast('Category is required', 'error');
            return false;
        }
        if (!announcementExpiryDate) {
            showToast('Expiry date is required', 'error');
            return false;
        }
        if (!selectedAudiences.length) {
            showToast('Target audience is required', 'error');
            return false;
        }
        if (!channelPortalBanner && !channelPushNotification) {
            showToast('Select at least one distribution channel', 'error');
            return false;
        }
        return true;
    };

    const handleSendNow = async () => {
        if (!validateBroadcastForm()) return;

        setIsSubmitting(true);
        try {
            const response = await createAnnouncement({
                title: announcementTitle.trim(),
                content: messageContent.trim(),
                category: announcementCategory,
                targetAudience: buildTargetAudiencePayload(),
                expiryDate: announcementExpiryDate,
                notify: channelPushNotification
            });

            if (!response.success || !response.data) {
                showToast(response.error || 'Failed to send announcement', 'error');
                return;
            }

            setHistory((prev: any) => [response.data, ...prev]);
            showToast('Announcement sent successfully', 'success');

            setAnnouncementTitle('');
            setMessageContent('');
            setAnnouncementCategory('Information');
            setAnnouncementExpiryDate('');
            setSelectedAudiences(['everyone']);
            setAttachedImages([]);
            setChannelPortalBanner(true);
            setChannelPushNotification(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleLater = () => {
        if (!validateBroadcastForm()) return;
        setShowScheduleModal(true);
    };

    const handleConfirmSchedule = () => {
        if (!scheduleDateTime) {
            showToast('Schedule date and time is required', 'error');
            return;
        }

        const scheduledItem = {
            id: Date.now(),
            title: announcementTitle.trim(),
            content: messageContent.trim(),
            category: announcementCategory,
            targetAudience: buildTargetAudiencePayload(),
            expiryDate: announcementExpiryDate,
            scheduledAt: scheduleDateTime,
            createdBy: 'Super Admin',
            createdDate: new Date().toISOString(),
        };

        setScheduledAnnouncements((prev: any) => [scheduledItem, ...prev]);
        showToast('Announcement scheduled successfully', 'success');

        setAnnouncementTitle('');
        setMessageContent('');
        setAnnouncementCategory('Information');
        setAnnouncementExpiryDate('');
        setSelectedAudiences(['everyone']);
        setAttachedImages([]);
        setChannelPortalBanner(true);
        setChannelPushNotification(false);
        setScheduleDateTime('');
        setShowScheduleModal(false);
    };

    const handleScheduledEditClick = (announcement: any) => {
        setEditingScheduledId(announcement.id);
        setScheduledEditForm({
            title: announcement.title,
            description: announcement.content,
            scheduleDateTime: formatDateTimeLocal(announcement.scheduledAt),
        });
    };

    const handleSaveScheduledEdit = () => {
        if (!scheduledEditForm.title?.trim() || !scheduledEditForm.description?.trim()) {
            showToast('Title and content are required', 'error');
            return;
        }
        if (!scheduledEditForm.scheduleDateTime) {
            showToast('Schedule date and time is required', 'error');
            return;
        }

        setScheduledAnnouncements((prev: any) =>
            prev.map((item: any) =>
                item.id === editingScheduledId
                    ? {
                        ...item,
                        title: scheduledEditForm.title,
                        content: scheduledEditForm.description,
                        scheduledAt: scheduledEditForm.scheduleDateTime,
                    }
                    : item
            )
        );

        setEditingScheduledId(null);
        showToast('Scheduled announcement updated successfully', 'success');
    };

    const filteredAnnouncements = history.filter((announcement: any) => {
        return activeFilter === 'All' || announcement.category === activeFilter;
    });

    const audienceOptions = [
        { id: 'everyone', label: 'Everyone', hasSubOptions: false },
        { id: 'branch_admins', label: 'Branch Admins', hasSubOptions: true, subOptions: BRANCHES.map(b => ({ id: `branch_${b}`, name: `${b} Admin` })) },
        { id: 'club_admins', label: 'Club Admins', hasSubOptions: true, subOptions: CLUBS.map(c => ({ id: `club_${c.id}`, name: c.name })) },
        { id: 'hho', label: 'HHO', hasSubOptions: false },
        { id: 'sports', label: 'Sports', hasSubOptions: false },
        { id: 'all_students', label: 'All Students', hasSubOptions: false },
        { id: 'registered_students', label: 'Registered Students', hasSubOptions: false },
    ];

    const toggleCategory = (categoryId: any) => {
        setExpandedCategories((prev: any) =>
            prev.includes(categoryId)
                ? prev.filter((id: any) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const toggleAudience = (audienceId: any) => {
        // If selecting "everyone", clear all others
        if (audienceId === 'everyone') {
            setSelectedAudiences(['everyone']);
            return;
        }

        // If selecting something else, remove "everyone"
        setSelectedAudiences((prev: any) => {
            const withoutEveryone = prev.filter((id: any) => id !== 'everyone');
            if (withoutEveryone.includes(audienceId)) {
                const newSelection = withoutEveryone.filter((id: any) => id !== audienceId);
                return newSelection.length === 0 ? ['everyone'] : newSelection;
            }
            return [...withoutEveryone, audienceId];
        });
    };

    const toggleParentCategory = (option: any) => {
        if (!option.hasSubOptions) return;

        const allSubIds = option?.subOptions.map((s: any) => s.id);
        const allSelected = allSubIds.every((id: any) => selectedAudiences.includes(id));

        setSelectedAudiences((prev: any) => {
            const withoutEveryone = prev.filter((id: any) => id !== 'everyone');
            if (allSelected) {
                // Deselect all sub-options
                const newSelection = withoutEveryone.filter((id: any) => !allSubIds.includes(id));
                return newSelection.length === 0 ? ['everyone'] : newSelection;
            } else {
                // Select all sub-options
                const existingWithoutThese = withoutEveryone.filter((id: any) => !allSubIds.includes(id));
                return [...existingWithoutThese, ...allSubIds];
            }
        });
    };

    const isParentSelected = (option: any) => {
        if (!option.hasSubOptions) return false;
        return option?.subOptions.every((s: any) => selectedAudiences.includes(s.id));
    };

    const isParentPartiallySelected = (option: any) => {
        if (!option.hasSubOptions) return false;
        const someSelected = option?.subOptions.some((s: any) => selectedAudiences.includes(s.id));
        const allSelected = option?.subOptions.every((s: any) => selectedAudiences.includes(s.id));
        return someSelected && !allSelected;
    };

    const getDisplayLabel = () => {
        if (selectedAudiences.includes('everyone')) return 'Everyone';
        if (selectedAudiences.length === 0) return 'Select Target Audience';
        if (selectedAudiences.length === 1) {
            // Find the label
            for (const opt of audienceOptions) {
                if (opt.id === selectedAudiences[0]) return opt.label;
                if (opt.hasSubOptions) {
                    const sub = opt.subOptions?.find((s: any) => s.id === selectedAudiences[0]);
                    if (sub) return sub.name;
                }
            }
        }
        return `${selectedAudiences.length} audiences selected`;
    };

    const getSelectedList = () => {
        const items = [];
        for (const id of selectedAudiences) {
            if (id === 'everyone') {
                items.push('Everyone');
                continue;
            }
            for (const opt of audienceOptions) {
                if (opt.id === id) {
                    items.push(opt.label);
                    break;
                }
                if (opt.hasSubOptions) {
                    const sub = opt.subOptions?.find((s: any) => s.id === id);
                    if (sub) {
                        items.push(sub.name);
                        break;
                    }
                }
            }
        }
        return items;
    };

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-[#1A1A1A]">Broadcast Announcement</h1>
                            <InfoTooltip text="Create and send important updates to students and staff" size="md" />
                        </div>
                        <p className="text-sm text-[#6B7280]">Send push notifications, emails, and portal alerts instantly.</p>
                    </div>
                    <button
                        onClick={handleSendNow}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200">
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Sending...' : 'Send Now'}
                    </button>
                </div>
            </div>

            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-[#1A1A1A]">Broadcast Setup</h2>
                    <InfoTooltip text="Compose, audience, distribution, and scheduling in one section" size="sm" />
                </div>

                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Compose Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Subject / Title <span className="text-[#EF4444]">*</span></label>
                                <input
                                    type="text"
                                    value={announcementTitle}
                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                    placeholder="e.g. Lunch Break Timings Changed"
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category <span className="text-[#EF4444]">*</span></label>
                                    <select
                                        value={announcementCategory}
                                        onChange={(e) => setAnnouncementCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                    >
                                        <option value="Important">Important</option>
                                        <option value="Events">Events</option>
                                        <option value="Updates">Updates</option>
                                        <option value="Information">Information</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Expiry Date <span className="text-[#EF4444]">*</span></label>
                                    <input
                                        type="date"
                                        value={announcementExpiryDate}
                                        onChange={(e) => setAnnouncementExpiryDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message Content <span className="text-[#EF4444]">*</span></label>
                                <textarea
                                    rows={6}
                                    placeholder="Type your message here..."
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                ></textarea>
                                <div className="flex flex-col gap-3 mt-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleInsertLink}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            Insert Link
                                        </button>
                                        <button
                                            onClick={handleAttachImage}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            Attach Image
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Attached Images Preview */}
                                    {attachedImages.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {attachedImages.map((img: any) => (
                                                <div key={img.id} className="relative group">
                                                    <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <button
                                                        onClick={() => removeImage(img.id)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                                    >
                                                        <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Channel Selection */}
                            <div>
                            <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                Distribution Channels <span className="text-[#EF4444]">*</span>
                                <InfoTooltip text="Choose where this announcement will be displayed" size="sm" />
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between p-4 border border-indigo-100 bg-indigo-50 rounded-xl cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg text-indigo-600"><Megaphone className="w-4 h-4" /></div>
                                        <div>
                                            <div className="font-semibold text-indigo-900">Portal Banner</div>
                                            <div className="text-xs text-indigo-600">Top alert bar</div>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4 text-indigo-600" checked={channelPortalBanner} onChange={(e) => setChannelPortalBanner(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Users className="w-4 h-4" /></div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Push Notification</div>
                                            <div className="text-xs text-gray-500">To mobile app users</div>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4 text-gray-600" checked={channelPushNotification} onChange={(e) => setChannelPushNotification(e.target.checked)} />
                                </label>
                            </div>
                            </div>
                        </div>

                        {/* Audience & Schedule */}
                        <div className="space-y-6">
                            {/* Target Audience */}
                            <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-[#1A1A1A]">Target Audience</h3>
                                        <InfoTooltip text="Select specific groups or everyone" size="sm" />
                                    </div>
                                    <p className="text-xs text-[#6B7280]">Select who will receive this</p>
                                </div>
                            </div>

                            {/* Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white transition-all"
                                >
                                    <span>{getDisplayLabel()}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-[350px] overflow-y-auto">
                                        {audienceOptions.map((option: any) => (
                                            <div key={option.id}>
                                                <div className="flex items-center px-4 py-3 hover:bg-[#F7F8FA] transition-colors border-b border-gray-50 last:border-b-0">
                                                    {/* Checkbox for main option */}
                                                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (option.hasSubOptions) {
                                                                    toggleParentCategory(option);
                                                                } else {
                                                                    toggleAudience(option.id);
                                                                }
                                                            }}
                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${(option.hasSubOptions ? isParentSelected(option) : selectedAudiences.includes(option.id))
                                                                ? 'bg-[#10B981] border-[#10B981] shadow-sm shadow-emerald-200'
                                                                : isParentPartiallySelected(option)
                                                                    ? 'bg-[#6EE7B7] border-[#6EE7B7]'
                                                                    : 'border-gray-300 hover:border-[#10B981]'
                                                                }`}
                                                        >
                                                            {(option.hasSubOptions ? (isParentSelected(option) || isParentPartiallySelected(option)) : selectedAudiences.includes(option.id)) && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-[#1A1A1A]">{option.label}</span>
                                                    </label>

                                                    {/* Expand arrow for sub-options */}
                                                    {option.hasSubOptions && (
                                                        <button
                                                            onClick={() => toggleCategory(option.id)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategories.includes(option.id) ? 'rotate-90' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Sub-options with checkboxes */}
                                                {option.hasSubOptions && expandedCategories.includes(option.id) && (
                                                    <div className="bg-[#F7F8FA] border-t border-gray-100">
                                                        {option?.subOptions.map((subOption: any) => (
                                                            <label
                                                                key={subOption.id}
                                                                className="flex items-center gap-3 px-8 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer"
                                                            >
                                                                <div
                                                                    onClick={() => toggleAudience(subOption.id)}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedAudiences.includes(subOption.id)
                                                                        ? 'bg-[#10B981] border-[#10B981] shadow-sm shadow-emerald-200'
                                                                        : 'border-gray-300 hover:border-[#10B981]'
                                                                        }`}
                                                                >
                                                                    {selectedAudiences.includes(subOption.id) && (
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-[#6B7280]">{subOption.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected audiences list */}
                            <div className="mt-4 p-4 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Selected Audiences</p>
                                <div className="flex flex-wrap gap-2">
                                    {getSelectedList().map((item: any, idx: any) => (
                                        <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            </div>

                            {/* Schedule */}
                            <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1A1A1A]">Schedule</h3>
                                    <p className="text-xs text-[#6B7280]">When to send this announcement</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={handleSendNow}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#2D2D2D] transition-colors disabled:opacity-60">{isSubmitting ? 'Sending...' : 'Send Now'}</button>
                                <button
                                    onClick={handleScheduleLater}
                                    className="flex-1 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">Schedule later</button>
                            </div>
                            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                                <p className="text-xs text-[#6B7280]">
                                    Estimated Reach: <span className="font-bold text-[#1A1A1A]">{selectedAudiences.includes('everyone') ? '2,450' : selectedAudiences.length * 150} Users</span>
                                </p>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Scheduled Announcements Section */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Scheduled Announcements</h2>
                            <InfoTooltip text="Announcements queued to be sent on selected date and time" size="sm" />
                        </div>
                        <p className="text-sm text-[#6B7280]">Only scheduled announcements are shown here.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {scheduledAnnouncements.length === 0 ? (
                        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                            <div className="bg-white rounded-[14px] p-6 text-sm text-[#6B7280]">No scheduled announcements.</div>
                        </div>
                    ) : scheduledAnnouncements.map((announcement: any) => (
                        <div
                            key={announcement.id}
                            className="bg-[#F4F2F0] rounded-[18px] p-[10px]"
                        >
                            <div className="bg-white rounded-[14px] p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-[#1A1A1A] text-lg">{announcement.title}</h3>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.category)}`}>
                                                    {announcement.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#6B7280] mt-0.5">
                                                Scheduled for {new Date(announcement.scheduledAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[#6B7280] text-sm mb-4 leading-relaxed">
                                    {announcement.content}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Layout className="w-4 h-4" />
                                            <span className="text-sm">{announcement.targetAudience}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Expires: {new Date(announcement.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleScheduledEditClick(announcement)}
                                            className="p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-[#6B7280]" />
                                        </button>
                                        <button
                                            onClick={() => setScheduledAnnouncements((prev: any) => prev.filter((item: any) => item.id !== announcement.id))}
                                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Updates & Announcements History Section */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Updates & Announcements History</h2>
                            <InfoTooltip text="Log of all sent communications" size="sm" />
                        </div>
                        <p className="text-sm text-[#6B7280]">View and manage all past announcements and updates.</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#F4F2F0] rounded-[18px] pt-[5px] px-[5px] pb-[15px]">
                        <div className="bg-white rounded-[14px] p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm text-[#6B7280]">Total Announcements</p>
                                <p className="text-2xl font-bold text-[#1A1A1A]">{history.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#F4F2F0] rounded-[18px] pt-[5px] px-[5px] pb-[15px]">
                        <div className="bg-white rounded-[14px] p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-[#6B7280]">Important</p>
                                <p className="text-2xl font-bold text-red-500">{history.filter(a => a.category === 'Important').length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#F4F2F0] rounded-[18px] pt-[5px] px-[5px] pb-[15px]">
                        <div className="bg-white rounded-[14px] p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-[#6B7280]">Events</p>
                                <p className="text-2xl font-bold text-emerald-500">{history.filter(a => a.category === 'Events').length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#F4F2F0] rounded-[18px] pt-[5px] px-[5px] pb-[15px]">
                        <div className="bg-white rounded-[14px] p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-[#6B7280]">Total Views</p>
                                <p className="text-2xl font-bold text-[#1A1A1A]">{history.reduce((sum: any, a: any) => sum + (a.viewCount || 0), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6">
                    {['All', 'Important', 'Events', 'Updates', 'Information'].map((filter: any) => (
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

                {/* Announcements List */}
                <div className="space-y-4">
                    {isHistoryLoading ? (
                        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                            <div className="bg-white rounded-[14px] p-6 text-sm text-[#6B7280]">Loading announcement history...</div>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                            <div className="bg-white rounded-[14px] p-6 text-sm text-[#6B7280]">No announcements found.</div>
                        </div>
                    ) : filteredAnnouncements.map((announcement: any) => (
                        <div
                            key={announcement.id}
                            className="bg-[#F4F2F0] rounded-[18px] p-[10px]"
                        >
                            <div className="bg-white rounded-[14px] p-6">
                                {/* Title Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                                            <Megaphone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-[#1A1A1A] text-lg">{announcement.title}</h3>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.category)}`}>
                                                    {announcement.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#6B7280] mt-0.5">
                                                By {announcement.createdBy} • {new Date(announcement.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[#6B7280] text-sm mb-4 leading-relaxed">
                                    {announcement.content}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm">{(announcement.viewCount || 0).toLocaleString()} views</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Layout className="w-4 h-4" />
                                            <span className="text-sm">{announcement.targetAudience}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6B7280]">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Expires: {new Date(announcement.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditClick(announcement)}
                                            className="p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-[#6B7280]" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(announcement.id)}
                                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Link Modal */}
            <Modal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                title="Insert Link"
                size="md"
                onConfirm={confirmLink}
                confirmText="Insert"
                confirmButtonClass="bg-[#1A1A1A] hover:bg-[#374151]"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">URL</label>
                        <input
                            type="url"
                            placeholder="https://example.com"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingId}
                onClose={() => setEditingId(null)}
                title="Edit Announcement"
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

            {/* Schedule Later Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title="Schedule Announcement"
                size="md"
                onConfirm={handleConfirmSchedule}
                confirmText="Schedule"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Date & Time</label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={scheduleDateTime}
                            onChange={(e) => setScheduleDateTime(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Scheduled Edit Modal */}
            <Modal
                isOpen={!!editingScheduledId}
                onClose={() => setEditingScheduledId(null)}
                title="Edit Scheduled Announcement"
                size="lg"
                onConfirm={handleSaveScheduledEdit}
                confirmText="Save Changes"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Subject / Title</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={scheduledEditForm.title}
                            onChange={(e) => setScheduledEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message Content</label>
                        <textarea
                            rows={6}
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
                            value={scheduledEditForm.description}
                            onChange={(e) => setScheduledEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Scheduled Date & Time</label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            value={scheduledEditForm.scheduleDateTime}
                            onChange={(e) => setScheduledEditForm((prev: any) => ({ ...prev, scheduleDateTime: e.target.value }))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
                variant="danger"
            />
        </div>
    );
}

