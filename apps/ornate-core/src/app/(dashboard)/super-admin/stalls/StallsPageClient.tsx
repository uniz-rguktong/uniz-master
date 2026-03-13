'use client';
import {
    Store, IndianRupee, MapPin, CheckCircle, Clock,
    Pencil, Trash2, Users as UsersIcon, Plus, Save, X,
    Utensils, QrCode, ExternalLink
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { MetricCard } from '@/components/MetricCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { saveStall, deleteStall } from '@/actions/stallActions';
import { STALLS } from '@/lib/constants/stalls';

export default function StallsPageClient({ initialStalls }: { initialStalls: any[] }) {
    const [stalls, setStalls] = useState(initialStalls);
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStall, setEditingStall] = useState<any>(null);
    const [stallToDelete, setStallToDelete] = useState<any>(null);
    const [activeMenuStall, setActiveMenuStall] = useState<any>(null);
    const [activeQRStall, setActiveQRStall] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Use database stalls directly
    const displayedStalls = useMemo(() => {
        return stalls.map(stall => ({
            ...stall,
            no: stall.stallNo || '-',
            richType: stall.type || 'Food / Fast Food'
        }));
    }, [stalls]);

    // Form state
    const [formData, setFormData] = useState<any>({
        stallNo: '',
        name: '',
        type: 'Food / Fast Food',
        bidAmount: '',
        description: '',
        owner: '',
        menuItems: [],
        timings: '',
        venue: '',
        recommendedItem: '',
        qrCodeUrl: '',
        qrTargetUrl: '',
        teamName: ''
    });

    const openAddModal = () => {
        setEditingStall(null);
        setFormData({
            stallNo: '',
            name: '',
            type: 'Food / Fast Food',
            bidAmount: '',
            description: '',
            owner: '',
            menuItems: [],
            timings: '',
            venue: '',
            recommendedItem: '',
            qrCodeUrl: '',
            qrTargetUrl: '',
            teamName: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (stall: any) => {
        setEditingStall(stall);
        setFormData({
            stallNo: stall.stallNo || '',
            name: stall.name || '',
            type: stall.type || 'Food / Fast Food',
            bidAmount: stall.bidAmount !== '-' ? (stall.bidAmount?.replace(/[₹,]/g, '') || '') : '',
            description: stall.description || '',
            owner: stall.owner !== '-' ? stall.owner : '',
            menuItems: stall.menuItems || [],
            timings: stall.timings !== '-' ? (stall.timings || '') : '',
            venue: stall.venue !== '-' ? (stall.venue || '') : '',
            recommendedItem: stall.recommendedItem !== '-' ? (stall.recommendedItem || '') : '',
            qrCodeUrl: stall.qrCodeUrl || '',
            qrTargetUrl: stall.qrTargetUrl || '',
            teamName: stall.teamName !== '-' ? (stall.teamName || '') : ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStall(null);
        setFormData({
            stallNo: '',
            name: '',
            type: 'Food / Fast Food',
            bidAmount: '',
            description: '',
            owner: '',
            menuItems: [],
            timings: '',
            venue: '',
            recommendedItem: '',
            qrCodeUrl: '',
            qrTargetUrl: '',
            teamName: ''
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const addMenuItem = () => {
        setFormData((prev: any) => ({
            ...prev,
            menuItems: [...prev.menuItems, { item: '', price: '' }]
        }));
    };

    const removeMenuItem = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            menuItems: prev.menuItems.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateMenuItem = (index: number, field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            menuItems: prev.menuItems.map((item: any, i: number) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    // Simulate QR code upload for now
    const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, upload to S3/Cloudinary and get URL
            // For now, simulator with a data URL or placeholder
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, qrCodeUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        // Comprehensive Validation for all fields
        if (!formData.name?.trim()) {
            showToast('Stall name is required', 'error');
            return;
        }
        if (!formData.stallNo?.trim()) {
            showToast('Stall number is required', 'error');
            return;
        }
        if (!formData.description?.trim()) {
            showToast('Stall description is required', 'error');
            return;
        }
        if (!formData.type?.trim()) {
            showToast('Stall type is required', 'error');
            return;
        }
        if (!formData.timings?.trim()) {
            showToast('Operational timings are required', 'error');
            return;
        }
        if (!formData.venue?.trim()) {
            showToast('Venue / Location is required', 'error');
            return;
        }
        if (!formData.teamName?.trim()) {
            showToast('Vendor team name is required', 'error');
            return;
        }
        if (!formData.owner?.trim()) {
            showToast('Team leader / Owner name is required', 'error');
            return;
        }
        if (!formData.bidAmount?.trim()) {
            showToast('Winning bid amount is required', 'error');
            return;
        }
        if (!formData.recommendedItem?.trim()) {
            showToast('Recommended item is required', 'error');
            return;
        }
        if (!formData.qrCodeUrl?.trim()) {
            showToast('QR Code image is required', 'error');
            return;
        }
        if (!formData.qrTargetUrl?.trim()) {
            showToast('QR Code target link is required', 'error');
            return;
        }

        // Validate Menu Items if any exist
        if (formData.menuItems.some((item: any) => !item.item?.trim() || !item.price?.trim())) {
            showToast('Please fill in both item name and price for all menu items', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                id: editingStall?.id,
                stallNo: formData.stallNo,
                name: formData.name,
                type: formData.type,
                bidAmount: formData.bidAmount ? (formData.bidAmount.startsWith('₹') ? formData.bidAmount : `₹${formData.bidAmount}`) : '-',
                description: formData.description,
                owner: formData.owner || '-',
                teamName: formData.teamName,
                menuItems: formData.menuItems,
                timings: formData.timings,
                venue: formData.venue,
                recommendedItem: formData.recommendedItem,
                qrCodeUrl: formData.qrCodeUrl,
                qrTargetUrl: formData.qrTargetUrl,
            };

            const res = await saveStall(payload);

            if ('stall' in res) {
                if (editingStall) {
                    // Update existing stall in local state
                    setStalls((prev: any) => prev.map((stall: any) => {
                        if (stall.id === editingStall.id) {
                            return res.stall;
                        }
                        return stall;
                    }));
                    showToast('Stall details updated successfully', 'success');
                } else {
                    // Directly use the returned stall with correct ID
                    setStalls((prev: any) => [...prev, res.stall]);
                    showToast('New stall added successfully', 'success');
                }
            } else {
                showToast(res.error || 'Failed to save stall', 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred while saving the stall', 'error');
        } finally {
            setIsLoading(false);
        }
        closeModal();
    };

    const handleDelete = async (id: number) => {
        const res = await deleteStall(id);

        if (!('error' in res)) {
            setStalls((prev: any) => prev.filter((stall: any) => stall.id !== id));
            showToast('Stall deleted successfully', 'success');
        } else {
            showToast(res.error || 'Failed to delete stall', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!stallToDelete) return;
        await handleDelete(stallToDelete.id);
        setStallToDelete(null);
    };

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Stalls Management</h1>
                            <InfoTooltip text="Track and manage vendor stalls and auction details" size="md" />
                        </div>
                        <p className="text-sm text-[#6B7280] font-medium md:font-normal">Manage commercial stalls and allocations after bidding.</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-[#1A1A1A] text-white rounded-xl text-xs md:text-sm font-medium hover:bg-[#333] transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Add New Stall
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    title="Total Stalls"
                    value={stalls.length}
                    icon={Store}
                    iconBgColor="#DBEAFE"
                    iconColor="#3B82F6"
                    tooltip="Total number of stalls available in the system"
                    compact
                />
                <MetricCard
                    title="Allocated"
                    value={stalls.filter(s => s.status === 'Allocated').length}
                    icon={CheckCircle}
                    iconBgColor="#D1FAE5"
                    iconColor="#10B981"
                    tooltip="Stalls currently allocated to owners"
                    compact
                />
                <MetricCard
                    title="Vacant"
                    value={stalls.filter(s => s.status === 'Vacant').length}
                    icon={Clock}
                    iconBgColor="#FEF3C7"
                    iconColor="#F59E0B"
                    tooltip="Stalls that are still vacant and available"
                    compact
                />
                <MetricCard
                    title="Total Revenue"
                    value={`₹${stalls.reduce((sum: any, s: any) => {
                        let amountStr = (s.bidAmount || '0').replace(/[₹,]/g, '').toUpperCase();
                        let amount = parseFloat(amountStr) || 0;
                        if (amountStr.endsWith('K')) amount *= 1000;
                        return sum + amount;
                    }, 0).toLocaleString()}`}
                    icon={IndianRupee}
                    iconBgColor="#FFEDD5"
                    iconColor="#F97316"
                    tooltip="Total bid revenue from all stalls"
                    compact
                />
            </div>

            {/* Stalls Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedStalls.map((stall: any) => (
                    <div key={stall.id} className="group animate-card-entrance">
                        {/* Premium Outer Container */}
                        <div className="w-full bg-[#F4F2F0] rounded-[24px] p-[10px] flex flex-col gap-3 transition-all duration-300 hover:shadow-xl">
                            {/* Inner Card Container */}
                            <div className="bg-white rounded-[20px] p-5 md:p-6 flex flex-col gap-6 border border-[#E5E7EB]/50 shadow-sm overflow-hidden">
                                {/* Top Section: Primary Info */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm">
                                            {stall.richType}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            STALL {stall.no}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[18px] font-semibold text-[#1A1A1A] group-hover:text-indigo-600 transition-colors tracking-tight leading-none">
                                            {stall.name}
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                                                {stall.description}
                                            </p>
                                            {stall.recommendedItem && (
                                                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Utensils className="w-3 h-3" />
                                                    Recommended: <span className="text-[#1A1A1A] font-bold">{stall.recommendedItem}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Section: Team & Bid strip */}
                                <div className="bg-[#F8F9FA] rounded-[18px] border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm shrink-0">
                                            <UsersIcon className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-0.5">Vendor Team</span>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-semibold text-[#1A1A1A] truncate">{stall.teamName || 'No Team'}</span>
                                                {stall.owner && <span className="text-[10px] text-[#6B7280] font-medium truncate italic">Leader: {stall.owner}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${stall.status === 'Allocated' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{stall.status}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Winning Bid</span>
                                                <span className="text-[24px] md:text-[28px] font-bold text-emerald-600 tracking-tight leading-none">{stall.bidAmount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Section: Actions */}
                                <div className="flex flex-col gap-3 pt-5 border-t border-gray-100 mt-auto">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setActiveMenuStall(stall)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 bg-white border border-gray-100 rounded-xl hover:bg-indigo-50 transition-all shadow-sm group/btn"
                                        >
                                            <Utensils className="w-4 h-4 text-gray-400 group-hover/btn:text-indigo-600" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Menu Items</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveQRStall(stall)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 bg-white border border-gray-100 rounded-xl hover:bg-indigo-50 transition-all shadow-sm group/btn"
                                        >
                                            <QrCode className="w-4 h-4 text-gray-400 group-hover/btn:text-indigo-600" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">QR Code</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] md:text-[11px] font-bold whitespace-nowrap uppercase tracking-tight">{stall.timings || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100/50">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-[10px] md:text-[11px] font-bold whitespace-nowrap uppercase tracking-tight">{stall.venue || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => openEditModal(stall)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setStallToDelete(stall)}
                                                className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-100 rounded-lg hover:bg-red-50 transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Stall Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={closeModal}
                        ></div>

                        {/* Modal */}
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1A1A1A]">
                                        {editingStall ? 'Edit Stall' : 'Add New Stall'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {editingStall ? 'Update all stall details and menu' : 'Configure a new stall and menu items'}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                                {/* General Info Section */}
                                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 uppercase tracking-wider">General Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stall Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="e.g. The Spicy Hut"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stall Number <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="stallNo"
                                                placeholder="e.g. 14"
                                                value={formData.stallNo}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">One-line Description <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="description"
                                            placeholder="Briefly describe what this stall is about"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="type"
                                                placeholder="e.g. Food / Fast Food"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Timings <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="timings"
                                                placeholder="9AM - 9PM"
                                                value={formData.timings}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Venue <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="venue"
                                                placeholder="Stall Area A"
                                                value={formData.venue}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Team & Allocation Section */}
                                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 uppercase tracking-wider">Team & Allocation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="teamName"
                                                placeholder="Enter team name"
                                                value={formData.teamName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader / Owner <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="owner"
                                                placeholder="Enter leader name"
                                                value={formData.owner}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Winning Bid Amount <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="bidAmount"
                                                placeholder="Enter amount"
                                                value={formData.bidAmount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm font-bold text-emerald-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Section */}
                                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100 space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Menu Items</h3>
                                        <button
                                            onClick={addMenuItem}
                                            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                        >
                                            + Add Item
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.menuItems.map((menuItem: any, index: number) => (
                                            <div key={index} className="flex gap-3 group">
                                                <div className="flex-1">
                                                    <input
                                                        placeholder="Item name"
                                                        value={menuItem.item}
                                                        onChange={(e) => updateMenuItem(index, 'item', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <input
                                                        placeholder="Price"
                                                        value={menuItem.price}
                                                        onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeMenuItem(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.menuItems.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl bg-white">
                                                <p className="text-sm text-gray-400 font-medium">No menu items added yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Digital Presence & Recs Section */}
                                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 uppercase tracking-wider">Digital & Recommendations</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Item <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="recommendedItem"
                                                placeholder="e.g. Signature Burger"
                                                value={formData.recommendedItem}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-amber-50/30 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Image <span className="text-red-500">*</span></label>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex-1 cursor-pointer">
                                                        <div className="px-3 py-2 bg-white border border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                                            <Plus className="w-4 h-4 text-gray-400" />
                                                            <span className="text-xs font-medium text-gray-500">Upload QR</span>
                                                        </div>
                                                        <input type="file" accept="image/*" onChange={handleQRUpload} className="hidden" />
                                                    </label>
                                                    {formData.qrCodeUrl && (
                                                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg p-1">
                                                            <img src={formData.qrCodeUrl} className="w-full h-full object-contain" alt="QR" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Target <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="qrTargetUrl"
                                                    placeholder="e.g. instagram.com/spicyhut"
                                                    value={formData.qrTargetUrl}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-100 flex gap-4 flex-shrink-0">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-3.5 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors text-xs uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 bg-[#1A1A1A] text-white font-bold rounded-2xl hover:bg-[#333] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-black/10 disabled:opacity-60"
                                >
                                    <Save className="w-4 h-4" />
                                    {isLoading ? 'Saving...' : (editingStall ? 'Update Stall' : 'Save Stall')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Menu Preview Modal */}
            {
                activeMenuStall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setActiveMenuStall(null)}>
                        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{activeMenuStall.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Full Menu</p>
                                </div>
                                <button onClick={() => setActiveMenuStall(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                                {activeMenuStall.menuItems && activeMenuStall.menuItems.length > 0 ? (
                                    activeMenuStall.menuItems.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-sm font-medium text-gray-700">{item.item}</span>
                                            <span className="text-sm font-bold text-emerald-600 tracking-tight">₹{item.price}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-4">No menu items available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* QR Preview Modal */}
            {
                activeQRStall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setActiveQRStall(null)}>
                        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Scan & Pay / Follow</h3>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{activeQRStall.name}</p>
                                </div>
                                <button onClick={() => setActiveQRStall(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-8 flex flex-col items-center gap-6">
                                {activeQRStall.qrCodeUrl ? (
                                    <div className="w-48 h-48 bg-white border-2 border-gray-50 rounded-2xl p-4 shadow-inner">
                                        <img src={activeQRStall.qrCodeUrl} className="w-full h-full object-contain" alt="QR Code" />
                                    </div>
                                ) : (
                                    <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                                        <QrCode className="w-12 h-12 text-gray-300" />
                                    </div>
                                )}

                                {activeQRStall.qrTargetUrl && (
                                    <a
                                        href={activeQRStall.qrTargetUrl.startsWith('http') ? activeQRStall.qrTargetUrl : `https://${activeQRStall.qrTargetUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm text-center shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Digital Store
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <ConfirmDialog
                isOpen={!!stallToDelete}
                onClose={() => setStallToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Stall"
                message={`Are you sure you want to delete ${stallToDelete?.name || 'this stall'} permanently?`}
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
