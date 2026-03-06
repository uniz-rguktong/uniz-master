'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Mail,
  Phone,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  deleteCoordinator,
  updateCoordinatorDetails,
  addCoordinatorQuick,
} from '@/actions/coordinatorActions';

// ── Types ────────────────────────────────────────────────────
interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvent: string;
  status: string;
}

interface CoordinatorManagementPageProps {
  initialCoordinators: Coordinator[];
}

// ── Component ────────────────────────────────────────────────
export function CoordinatorManagementPage({
  initialCoordinators,
}: CoordinatorManagementPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCoordinator, setCurrentCoordinator] = useState<Coordinator | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<Coordinator | null>(null);

  const filteredCoordinators = initialCoordinators.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedEvent?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Add / Edit handler ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).trim();
    const email = (fd.get('email') as string).trim();
    const phone = (fd.get('phone') as string).trim();

    const digits = phone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    startTransition(async () => {
      try {
        if (isEditMode && currentCoordinator) {
          const res = await updateCoordinatorDetails(currentCoordinator.id, {
            name,
            email,
            phone,
          });
          if (res && 'error' in res && res.error) {
            showToast(res.error as string, 'error');
            return;
          }
          showToast('Coordinator updated', 'success');
        } else {
          const res = await addCoordinatorQuick({ name, email, phone });
          if (res && 'error' in res && res.error) {
            showToast(res.error as string, 'error');
            return;
          }
          showToast('Coordinator added & invite sent', 'success');
        }
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentCoordinator(null);
        router.refresh(); // Re-fetch SSR data
      } catch (err: any) {
        showToast(err?.message || 'Something went wrong', 'error');
      }
    });
  };

  // ── Delete handler ─────────────────────────────────────────
  const confirmDelete = () => {
    if (!coordinatorToDelete) return;
    startTransition(async () => {
      try {
        const res = await deleteCoordinator(coordinatorToDelete.id);
        if (res && 'error' in res && res.error) {
          showToast(res.error as string, 'error');
          return;
        }
        showToast('Coordinator removed', 'success');
        setShowDeleteDialog(false);
        setCoordinatorToDelete(null);
        router.refresh();
      } catch (err: any) {
        showToast(err?.message || 'Something went wrong', 'error');
      }
    });
  };

  // ── Helpers ────────────────────────────────────────────────
  const openEditModal = (c: Coordinator) => {
    setCurrentCoordinator(c);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (c: Coordinator) => {
    setCoordinatorToDelete(c);
    setShowDeleteDialog(true);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Events Management</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Coordinator Management</span>
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
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Assigned Event
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCoordinators.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-[#6B7280]">
                      No coordinators found
                    </td>
                  </tr>
                )}
                {filteredCoordinators.map((coordinator) => (
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
                          coordinator.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {coordinator.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coordinator)}
                          disabled={isPending}
                          className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#E5E7EB] rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(coordinator)}
                          disabled={isPending}
                          className="p-1.5 text-[#6B7280] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
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

      {/* ── Add / Edit Modal ───────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Coordinator' : 'Add New Coordinator'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={currentCoordinator?.name}
              key={currentCoordinator?.id ?? 'new'}
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
                key={`email-${currentCoordinator?.id ?? 'new'}`}
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
                type="tel"
                defaultValue={currentCoordinator?.phone}
                key={`phone-${currentCoordinator?.id ?? 'new'}`}
                placeholder="+91 98765-43210"
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Read-only: show current assignment (not editable here — use event page to reassign) */}
          {isEditMode && currentCoordinator?.assignedEvent && (
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">
                Current Assignment
              </label>
              <p className="text-sm text-[#1A1A1A] px-4 py-2 bg-[#F7F8FA] rounded-lg border border-[#E5E7EB]">
                {currentCoordinator.assignedEvent}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-[12px] text-sm font-medium text-[#6B7280] border border-transparent hover:border-[#E5E7EB] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 bg-[#1A1A1A] text-white rounded-[12px] text-sm font-medium hover:bg-[#2D2D2D] transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Add Coordinator'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Remove Coordinator"
        message={`Are you sure you want to remove ${coordinatorToDelete?.name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Remove"
      />
    </div>
  );
}
