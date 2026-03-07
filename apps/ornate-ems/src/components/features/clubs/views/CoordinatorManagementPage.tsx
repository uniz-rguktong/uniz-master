"use client";

import { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getCoordinators } from "@/actions/userGetters";
import {
  addCoordinatorQuick as createCoordinatorProfile,
  updateCoordinatorDetails as updateCoordinatorProfile,
  deleteCoordinator as deleteCoordinatorProfile,
} from "@/actions/coordinatorActions";

interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvent: string;
  status: string;
}

interface CoordinatorManagementPageProps {
  initialCoordinators?: Coordinator[];
}

export function CoordinatorManagementPage({
  initialCoordinators = [],
}: CoordinatorManagementPageProps) {
  const [coordinatorsList, setCoordinatorsList] =
    useState<Coordinator[]>(initialCoordinators);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCoordinatorsList(initialCoordinators);
  }, [initialCoordinators]);

  useEffect(() => {
    const loadCoordinators = async () => {
      const result = await getCoordinators();
      if (result?.success && result.data) {
        setCoordinatorsList(result.data as Coordinator[]);
      }
    };

    void loadCoordinators();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCoordinator, setCurrentCoordinator] = useState<any>(null);
  const [phoneError, setPhoneError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<any>(null);

  const { showToast } = useToast();

  const filteredCoordinators = coordinatorsList.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedEvent?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddCoordinator = async (e: any) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.target);
    const phoneValue = String(formData.get("phone") || "");
    const coordinatorData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: phoneValue,
      assignedEvent: formData.get("assignedEvent"),
    };

    const normalizedPhone = phoneValue.replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      const message = "Please enter a valid 10-digit phone number.";
      setPhoneError(message);
      showToast(message, "error");
      return;
    }

    setPhoneError("");
    setIsSubmitting(true);

    try {
      if (isEditMode && currentCoordinator?.id) {
        const result = await updateCoordinatorProfile(
          currentCoordinator.id,
          coordinatorData as any,
        );
        if (!result?.success || !(result as any).coordinator) {
          showToast(result?.error || "Failed to update coordinator", "error");
          return;
        }

        const updatedCoordinator = (result as any).coordinator as Coordinator;
        setCoordinatorsList((prev) =>
          prev.map((c) =>
            c.id === updatedCoordinator.id ? updatedCoordinator : c,
          ),
        );
        showToast("Coordinator updated successfully", "success");
      } else {
        const result = await createCoordinatorProfile(coordinatorData as any);
        if (!result?.success || !(result as any).coordinator) {
          showToast(result?.error || "Failed to add coordinator", "error");
          return;
        }

        const createdCoordinator = (result as any).coordinator as Coordinator;
        setCoordinatorsList((prev) => [createdCoordinator, ...prev]);
        showToast("Coordinator added successfully", "success");
      }

      setIsAddModalOpen(false);
      setIsEditMode(false);
      setCurrentCoordinator(null);
      e.target.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (coordinator: any) => {
    setCurrentCoordinator(coordinator);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const openDeleteDialog = (coordinator: any) => {
    setCoordinatorToDelete(coordinator);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!coordinatorToDelete?.id) return;

    const result = await deleteCoordinatorProfile(coordinatorToDelete.id);
    if (!result?.success) {
      showToast(result?.error || "Failed to remove coordinator", "error");
      return;
    }

    setCoordinatorsList((prev) =>
      prev.filter((c) => c.id !== coordinatorToDelete.id),
    );
    setShowDeleteDialog(false);
    setCoordinatorToDelete(null);
    showToast("Coordinator removed successfully", "error");
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Events Management</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">
            Coordinator Management
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Coordinator Management
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage event coordinators and their contact information
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        <div className="bg-white rounded-[14px] flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search coordinators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Assigned Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCoordinators.map((coordinator: any) => (
                  <tr
                    key={coordinator.id}
                    className="hover:bg-[#F7F8FA] transition-colors group"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-[#1A1A1A]">
                      {coordinator.name}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                          <Mail className="w-3.5 h-3.5" />
                          {coordinator.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                          <Phone className="w-3.5 h-3.5" />
                          {coordinator.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#6B7280]">
                      {coordinator.assignedEvent}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          coordinator.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {coordinator.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coordinator)}
                          className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#E5E7EB] rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(coordinator)}
                          className="p-1.5 text-[#6B7280] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isEditMode ? "Edit Coordinator" : "Add New Coordinator"}
      >
        <form onSubmit={handleAddCoordinator} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={currentCoordinator?.name}
              placeholder="e.g. Dr. John Smith"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={currentCoordinator?.email}
                placeholder="john@university.edu"
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                defaultValue={currentCoordinator?.phone}
                placeholder="9876543210"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                }}
                onChange={() => {
                  if (phoneError) setPhoneError("");
                }}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-500 focus:ring-red-200"
                    : "border-[#E5E7EB] focus:ring-[#1A1A1A]"
                }`}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Assigned Event
            </label>
            <input
              name="assignedEvent"
              type="text"
              required
              defaultValue={currentCoordinator?.assignedEvent}
              placeholder="e.g. AI/ML Workshop"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2 rounded-[12px] text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#1A1A1A] text-white rounded-[12px] text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update"
                  : "Add Coordinator"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Remove Coordinator"
        message={`Are you sure you want to remove ${coordinatorToDelete?.name}? This will not delete their associated events.`}
        variant="danger"
        confirmLabel="Remove"
      />
    </div>
  );
}
