'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Trash2,
  Edit,
  Plus,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getCoordinators } from '@/actions/userGetters';
import {
  addCoordinatorQuick as createCoordinatorProfile,
  updateCoordinatorDetails as updateCoordinatorProfile,
  deleteCoordinator as deleteCoordinatorProfile,
} from '@/actions/coordinatorActions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

const coordinatorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required'),
  assignedEvent: z.string().min(2, 'Assigned event is required')
});

type CoordinatorFormValues = z.infer<typeof coordinatorSchema>;

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

export function CoordinatorManagementPage({ initialCoordinators = [] }: CoordinatorManagementPageProps) {
  const [coordinatorsList, setCoordinatorsList] = useState<Coordinator[]>(initialCoordinators);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<any>(null);

  const { showToast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CoordinatorFormValues>({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      assignedEvent: ''
    }
  });

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

  const onFormSubmit = async (data: CoordinatorFormValues) => {
    try {
      if (editingId) {
        const result = await updateCoordinatorProfile(editingId, data as any);
        if (!result?.success || !(result as any).coordinator) {
          showToast(result?.error || 'Failed to update coordinator', 'error');
          return;
        }

        const updatedCoordinator = (result as any).coordinator as Coordinator;
        setCoordinatorsList(prev => prev.map(c => c.id === updatedCoordinator.id ? updatedCoordinator : c));
        showToast('Coordinator updated successfully', 'success');
      } else {
        const result = await createCoordinatorProfile(data as any);
        if (!result?.success || !(result as any).coordinator) {
          showToast(result?.error || 'Failed to add coordinator', 'error');
          return;
        }

        const createdCoordinator = (result as any).coordinator as Coordinator;
        setCoordinatorsList(prev => [createdCoordinator, ...prev]);
        showToast('Coordinator added successfully', 'success');
      }

      setIsAddModalOpen(false);
      setEditingId(null);
      reset();
    } catch (error) {
      showToast('An error occurred while saving', 'error');
    }
  };

  const openEditModal = (coordinator: any) => {
    setEditingId(coordinator.id);
    reset({
      name: coordinator.name,
      email: coordinator.email,
      phone: coordinator.phone,
      assignedEvent: coordinator.assignedEvent
    });
    setIsAddModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!coordinatorToDelete?.id) return;

    const result = await deleteCoordinatorProfile(coordinatorToDelete.id);
    if (!result?.success) {
      showToast(result?.error || 'Failed to remove coordinator', 'error');
      return;
    }

    setCoordinatorsList(prev => prev.filter(c => c.id !== coordinatorToDelete.id));
    setShowDeleteDialog(false);
    setCoordinatorToDelete(null);
    showToast('Coordinator removed successfully', 'success');
  };

  const filteredCoordinators = coordinatorsList.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedEvent?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Coordinator Management</h1>
            <p className="text-sm text-[#6B7280]">Manage event coordinators and their contact information</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              reset();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#333] transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Coordinator
          </button>
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinator</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Event</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCoordinators.map((coordinator: any) => (
                  <tr key={coordinator.id} className="hover:bg-[#F7F8FA] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {coordinator.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#1A1A1A]">{coordinator.name}</span>
                      </div>
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
                    <td className="py-4 px-6">
                      <span className="text-sm text-[#1A1A1A] font-medium">{coordinator.assignedEvent}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${coordinator.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {coordinator.status || 'Active'}
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
                          onClick={() => {
                            setCoordinatorToDelete(coordinator);
                            setShowDeleteDialog(true);
                          }}
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
            {filteredCoordinators.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No coordinators found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingId ? "Edit Coordinator" : "Add New Coordinator"}
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
            <Input
              {...register('name')}
              placeholder="e.g. Dr. John Smith"
              error={errors.name?.message}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="john@university.edu"
                error={errors.email?.message}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
              <Input
                {...register('phone')}
                placeholder="9876543210"
                error={errors.phone?.message}
                maxLength={10}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Assigned Event</label>
            <Input
              {...register('assignedEvent')}
              placeholder="e.g. AI/ML Workshop"
              error={errors.assignedEvent?.message}
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#333] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Saving...' : (editingId ? "Update Details" : "Add Coordinator")}
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
