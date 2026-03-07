"use client";
import {
  Store,
  Plus,
  X,
  Save,
  Pencil,
  CheckCircle,
  Clock,
  IndianRupee,
  Trash2,
  Users as UsersIcon,
  MapPin,
} from "lucide-react";
import { useState, useMemo } from "react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { MetricCard } from "@/components/MetricCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { saveStall, deleteStall } from "@/actions/stallActions";
import { STALLS } from "@/lib/constants/stalls";

export default function StallsPageClient({
  initialStalls,
}: {
  initialStalls: any[];
}) {
  const [stalls, setStalls] = useState(initialStalls);
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<any>(null);
  const [stallToDelete, setStallToDelete] = useState<any>(null);

  // Use database stalls directly
  const displayedStalls = useMemo(() => {
    return stalls.map((stall) => ({
      ...stall,
      no: stall.stallNo || stall.id,
      team: stall.teamSize || "-",
      price: stall.price || stall.bidAmount,
      richType: stall.type,
    }));
  }, [stalls]);

  // Form state
  const [formData, setFormData] = useState<any>({
    stallNo: "",
    name: "",
    type: "food",
    bidAmount: "",
    price: "",
    teamSize: "",
    description: "",
    owner: "",
  });

  const openAddModal = () => {
    setEditingStall(null);
    setFormData({
      stallNo: "",
      name: "",
      type: "food",
      bidAmount: "",
      price: "",
      teamSize: "",
      description: "",
      owner: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (stall: any) => {
    setEditingStall(stall);
    setFormData({
      stallNo: stall.stallNo || "",
      name: stall.name,
      type: stall.type || "food",
      bidAmount: stall.bidAmount?.replace("₹", "").replace(",", "") || "",
      price: stall.price || "",
      teamSize: stall.teamSize || "",
      description: stall.description || "",
      owner: stall.owner !== "-" ? stall.owner : "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStall(null);
    setFormData({ stallId: "", name: "", type: "", bidAmount: "", owner: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      id: editingStall?.id,
      stallNo: formData.stallNo,
      name: formData.name,
      type: formData.type,
      bidAmount: formData.bidAmount
        ? formData.bidAmount.startsWith("₹")
          ? formData.bidAmount
          : `₹${formData.bidAmount}`
        : "-",
      price: formData.price,
      teamSize: formData.teamSize,
      description: formData.description,
      owner: formData.owner || "-",
    };

    const res = await saveStall(payload);

    if ("stall" in res) {
      if (editingStall) {
        // Update existing stall in local state
        setStalls((prev: any) =>
          prev.map((stall: any) => {
            if (stall.id === editingStall.id) {
              return res.stall;
            }
            return stall;
          }),
        );
        showToast("Stall details updated successfully", "success");
      } else {
        // Directly use the returned stall with correct ID
        setStalls((prev: any) => [...prev, res.stall]);
        showToast("New stall added successfully", "success");
      }
    } else {
      showToast(res.error || "Failed to save stall", "error");
    }

    closeModal();
  };

  const handleDelete = async (id: number) => {
    const res = await deleteStall(id);

    if (!("error" in res)) {
      setStalls((prev: any) => prev.filter((stall: any) => stall.id !== id));
      showToast("Stall deleted successfully", "success");
    } else {
      showToast(res.error || "Failed to delete stall", "error");
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
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Stalls Management
              </h1>
              <InfoTooltip
                text="Track and manage vendor stalls and auction details"
                size="md"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              Manage commercial stalls and allocations after bidding.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Stall
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          value={stalls.filter((s) => s.status === "Allocated").length}
          icon={CheckCircle}
          iconBgColor="#D1FAE5"
          iconColor="#10B981"
          tooltip="Stalls currently allocated to owners"
          compact
        />
        <MetricCard
          title="Vacant"
          value={stalls.filter((s) => s.status === "Vacant").length}
          icon={Clock}
          iconBgColor="#FEF3C7"
          iconColor="#F59E0B"
          tooltip="Stalls that are still vacant and available"
          compact
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${stalls
            .reduce((sum: any, s: any) => {
              let amountStr = s.bidAmount.replace(/[₹,]/g, "").toUpperCase();
              let amount = parseFloat(amountStr) || 0;
              if (amountStr.endsWith("K")) amount *= 1000;
              return sum + amount;
            }, 0)
            .toLocaleString()}`}
          icon={IndianRupee}
          iconBgColor="#FFEDD5"
          iconColor="#F97316"
          tooltip="Total bid revenue from all stalls"
          compact
        />
      </div>

      {/* Stalls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayedStalls.map((stall: any) => (
          <div
            key={stall.id}
            className="group relative bg-white rounded-3xl p-5 border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-[240px]"
          >
            {/* Top row: No & Type */}
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500">
                <MapPin className="w-3 h-3" />
                STALL {stall.no}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                {stall.richType}
              </span>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1 truncate group-hover:text-indigo-600 transition-colors">
                {stall.name}
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                {stall.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-1 text-[9px] text-gray-400 mb-0.5 font-bold uppercase tracking-tighter">
                  <UsersIcon className="w-2.5 h-2.5" /> Team
                </div>
                <div className="text-xs font-bold text-gray-700">
                  {stall.team}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-1 text-[9px] text-gray-400 mb-0.5 font-bold uppercase tracking-tighter">
                  <IndianRupee className="w-2.5 h-2.5 text-emerald-600" /> Bid
                </div>
                <div className="text-xs font-bold text-emerald-600">
                  {stall.price}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${stall.status === "Allocated" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gray-300"}`}
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {stall.status}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEditModal(stall)}
                  className="p-2 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStallToDelete(stall)}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Stall Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">
                  {editingStall ? "Edit Stall" : "Add New Stall"}
                </h2>
                <p className="text-xs text-gray-500">
                  {editingStall
                    ? "Update stall details"
                    : "Record details of a new stall allocation"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Stall Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Stall No
                  </label>
                  <input
                    type="text"
                    name="stallNo"
                    placeholder="e.g. 14"
                    value={formData.stallNo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  />
                </div>
                {/* Stall Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e: any) => handleInputChange(e)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  >
                    <option value="food">Food</option>
                    <option value="dessert">Dessert</option>
                    <option value="cafe">Cafe</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Stall Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stall Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Spice Corner"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bid Amount */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bid Amount
                  </label>
                  <input
                    type="text"
                    name="bidAmount"
                    placeholder="e.g. 50,000"
                    value={formData.bidAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  />
                </div>
                {/* Price Tag */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Display Price
                  </label>
                  <input
                    type="text"
                    name="price"
                    placeholder="e.g. 50K"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Team Size */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Team Size
                  </label>
                  <input
                    type="text"
                    name="teamSize"
                    placeholder="e.g. 40"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  />
                </div>
                {/* Owner */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="owner"
                    placeholder="Winner Name"
                    value={formData.owner}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Enter stall details..."
                  value={formData.description}
                  onChange={(e: any) => handleInputChange(e)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {editingStall ? "Update Stall" : "Save Stall"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!stallToDelete}
        onClose={() => setStallToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Stall"
        message={`Are you sure you want to delete ${stallToDelete?.name || "this stall"} permanently?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
