'use client';
import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Trash2,
  Edit,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Zap,
  MoreVertical,
  ArrowUpRight,
  CheckCircle,
  X,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits'),
  assignedEvent: z.string().min(2, 'Assigned event/department is required')
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCoordinator, setCurrentCoordinator] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<any | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    setCoordinatorsList(initialCoordinators);
  }, [initialCoordinators]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CoordinatorFormValues>({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      assignedEvent: ''
    }
  });

  const filteredCoordinators = coordinatorsList.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.assignedEvent || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: CoordinatorFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && currentCoordinator?.id) {
        const result = await updateCoordinatorProfile(currentCoordinator.id, data);
        if (result?.success && (result as any).coordinator) {
          const updated = (result as any).coordinator as Coordinator;
          setCoordinatorsList(prev => prev.map(c => c.id === updated.id ? updated : c));
          showToast('Coordinator credentials authorized', 'success');
        } else {
          showToast(result?.error || 'Authorization failed', 'error');
        }
      } else {
        const result = await createCoordinatorProfile(data);
        if (result?.success && (result as any).coordinator) {
          const created = (result as any).coordinator as Coordinator;
          setCoordinatorsList(prev => [created, ...prev]);
          showToast('New asset deployed to cluster', 'success');
        } else {
          showToast(result?.error || 'Deployment failed', 'error');
        }
      }
      setIsAddModalOpen(false);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (coordinator: any) => {
    setCurrentCoordinator(coordinator);
    setIsEditMode(true);
    setIsAddModalOpen(true);
    setValue('name', coordinator.name || '');
    setValue('email', coordinator.email || '');
    setValue('phone', coordinator.phone || '');
    setValue('assignedEvent', coordinator.assignedEvent || '');
  };

  return (
    <div className="p-8 md:p-12 animate-page-entrance bg-gray-50/20 min-h-screen">
      {/* Narrative Section */}
      <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-center justify-between gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Human Capital <ChevronRight className="w-3 h-3" /> Asset Intelligence
          </div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Users className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Liaison</span></h1>
              <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-widest">Coordinating human throughput across the event matrix</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setIsEditMode(false); reset(); setIsAddModalOpen(true); }}
          className="group px-10 py-6 bg-gray-900 text-white rounded-[32px] shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center gap-4 active:scale-95">
          <UserPlus className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-widest">Initialize New Liaison</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Control Surface */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#F4F2F0] rounded-[64px] p-[12px] shadow-sm">
          <div className="bg-white rounded-[56px] p-12 border border-white shadow-xl">
            {/* Intelligence Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
              <div className="relative w-full md:w-[480px]">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Identify liaison by name, email or vector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[30px] text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Relay Active</span>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex items-center gap-3">
                  <span className="text-[18px] font-black text-gray-900">{filteredCoordinators.length}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assets Online</span>
                </div>
              </div>
            </div>

            {/* Directory Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCoordinators.length > 0 ? filteredCoordinators.map((coordinator) => (
                <div key={coordinator.id} className="group relative p-8 bg-white border border-gray-50 rounded-[48px] hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500">
                  <div className="absolute top-8 right-8">
                    <button onClick={() => openEditModal(coordinator)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-gray-50 rounded-[28px] flex items-center justify-center font-black text-lg text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                        {coordinator.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900 tracking-tight mb-1">{coordinator.name}</h3>
                        <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100/50">
                          <ShieldCheck className="w-3 h-3" /> {coordinator.status || 'Verified Asset'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-gray-400 group-hover:text-gray-900 transition-colors">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Vector Assignment</p>
                          <p className="text-xs font-bold truncate pr-8">{coordinator.assignedEvent}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 group-hover:text-gray-900 transition-colors">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Uplink Address</p>
                          <p className="text-xs font-bold truncate pr-8">{coordinator.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 group-hover:text-gray-900 transition-colors">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Bio-Link Contact</p>
                          <p className="text-xs font-bold truncate pr-8">{coordinator.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex gap-2">
                      <button onClick={() => openEditModal(coordinator)} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">Authorize Edits</button>
                      <button
                        onClick={() => { setCoordinatorToDelete(coordinator); setShowDeleteDialog(true); }}
                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-40 border-2 border-dashed border-gray-100 rounded-[64px] flex flex-col items-center justify-center text-gray-300">
                  <Terminal className="w-16 h-16 mb-8 opacity-10" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Database Null</h4>
                  <p className="text-[10px] font-bold mt-4 uppercase tracking-tighter">No active liaison modules found in current sector</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={isEditMode ? "Liaison Override" : "Liaison Deployment"} description="Configure biological interface for event coordination.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
          <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Personnel Profile</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Name</label>
                <Input {...register('name')} placeholder="e.g. Commander Smith" className="h-14 bg-white border-none rounded-2xl shadow-inner font-bold" error={errors.name?.message} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Uplink Email</label>
                  <Input {...register('email')} placeholder="liaison@cluster.io" className="h-14 bg-white border-none rounded-2xl shadow-inner font-bold text-xs" error={errors.email?.message} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Bio-Link</label>
                  <Input {...register('phone')} placeholder="10-digit code" className="h-14 bg-white border-none rounded-2xl shadow-inner font-bold text-xs" error={errors.phone?.message} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Vector Assignment</label>
                <Input {...register('assignedEvent')} placeholder="e.g. Astrophysics Division" className="h-14 bg-white border-none rounded-2xl shadow-inner font-bold text-xs" error={errors.assignedEvent?.message} />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 bg-gray-50 text-gray-600 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Abort Ops</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-gray-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isSubmitting ? 'Processing...' : (isEditMode ? 'Authorize Update' : 'Initialize Asset')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          if (!coordinatorToDelete?.id) return;
          const res = await deleteCoordinatorProfile(coordinatorToDelete.id);
          if (res?.success) {
            setCoordinatorsList(prev => prev.filter(c => c.id !== coordinatorToDelete.id));
            showToast('Asset decommissioned from cluster', 'success');
          } else {
            showToast(res?.error || 'Decommission failed', 'error');
          }
          setShowDeleteDialog(false);
        }}
        title="Asset Decommission"
        message={`Confirm permanent removal of liaison module: ${coordinatorToDelete?.name}. This execution is irreversible.`}
        variant="danger"
        confirmLabel="Final Decommission"
      />
    </div>
  );
}
