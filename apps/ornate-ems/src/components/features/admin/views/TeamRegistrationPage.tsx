'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Download, CheckCircle, Clock, XCircle, Edit, Trash2, Info, UserPlus, Eye } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const teams = [
  {
    id: 1,
    teamName: 'Thunder Strikers',
    sport: 'Cricket',
    sportColor: '#3B82F6',
    captain: 'John Smith',
    viceCaptain: 'Mike Johnson',
    yearLevel: 'Mixed',
    status: 'approved',
    registeredDate: '2025-10-15',
    members: [
      { id: '1', name: 'John Smith', studentId: 'CSE2021001', year: 'III', section: 'A', role: 'Captain' as const, phoneNumber: '9876543210' },
      { id: '2', name: 'Mike Johnson', studentId: 'CSE2021002', year: 'III', section: 'A', role: 'Vice Captain' as const, phoneNumber: '9876543211' },
      { id: '3', name: 'David Lee', studentId: 'CSE2021003', year: 'III', section: 'B', role: 'Member' as const, phoneNumber: '9876543212' },
      { id: '4', name: 'Tom Wilson', studentId: 'CSE2021004', year: 'II', section: 'A', role: 'Member' as const, phoneNumber: '9876543213' },
      { id: '5', name: 'Chris Brown', studentId: 'CSE2021005', year: 'II', section: 'B', role: 'Member' as const, phoneNumber: '9876543214' }]
  }
];

const memberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  studentId: z.string().min(5, 'Valid Student ID is required').toUpperCase(),
  year: z.string().min(1, 'Year is required'),
  section: z.string().min(1, 'Section is required'),
  role: z.enum(['Captain', 'Vice Captain', 'Member']),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required')
});

const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, 'Team name is required'),
  sport: z.string().min(1, 'Sport selection is required'),
  members: z.array(memberSchema).min(1, 'At least one member is required')
    .refine(members => members.some(m => m.role === 'Captain'), 'Team must have a Captain')
    .refine(members => members.some(m => m.role === 'Vice Captain'), 'Team must have a Vice Captain')
});

type TeamRegistrationFormValues = z.infer<typeof teamRegistrationSchema>;

interface TeamRegistrationPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
}

export function TeamRegistrationPage({ onNavigate }: TeamRegistrationPageProps = {}) {
  const [teamsList, setTeamsList] = useState(teams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);

  const [editingId, setEditingId] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<TeamRegistrationFormValues>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: '',
      sport: '',
      members: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members'
  });

  const [currentMember, setCurrentMember] = useState<Partial<z.infer<typeof memberSchema>>>({
    role: 'Member'
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleAddMember = () => {
    if (!currentMember.name || !currentMember.studentId || !currentMember.phoneNumber || !currentMember.email) {
      showToast('Please fill all member fields', 'error');
      return;
    }
    append(currentMember as any);
    setCurrentMember({ role: 'Member', name: '', studentId: '', phoneNumber: '', year: '', section: '' });
  };

  const onSubmit = (data: TeamRegistrationFormValues) => {
    const membersWithIds = data.members.map((m, i) => ({
      ...m,
      id: (m as any).id || `mem-${i}-${Date.now()}`
    }));

    if (editingId) {
      setTeamsList(prev => prev.map(t => t.id === editingId ? { ...t, ...data, members: membersWithIds } as any : t));
      showToast('Team updated successfully', 'success');
    } else {
      const newTeam = {
        id: teamsList.length + 1,
        ...data,
        members: membersWithIds,
        sportColor: '#3B82F6',
        captain: data.members.find(m => m.role === 'Captain')?.name || '',
        viceCaptain: data.members.find(m => m.role === 'Vice Captain')?.name || '',
        yearLevel: 'Mixed',
        status: 'pending',
        registeredDate: new Date().toISOString().split('T')[0]
      };
      setTeamsList(prev => [newTeam as any, ...prev]);
      showToast('Team registered successfully', 'success');
    }
    setShowAddForm(false);
    reset();
    setEditingId(null);
  };

  const filteredTeams = teamsList.filter(team => {
    const matchesSearch = team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = filterSport === 'All' || team.sport === filterSport;
    const matchesStatus = filterStatus === 'All' || team.status === filterStatus;
    return matchesSearch && matchesSport && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Registrations</h1>
          <p className="text-gray-500">Manage sports team registrations and participants</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              reset();
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Register Team
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Teams</span>
            </div>
            <div className="text-2xl font-bold">{teamsList.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Approved</span>
            </div>
            <div className="text-2xl font-bold">{teamsList.filter(t => t.status === 'approved').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-2xl font-bold">{teamsList.filter(t => t.status === 'pending').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rejected</span>
            </div>
            <div className="text-2xl font-bold">{teamsList.filter(t => t.status === 'rejected').length}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team or captain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger className="w-[140px] border-none bg-gray-50 rounded-xl h-9 text-xs">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sports</SelectItem>
                <SelectItem value="Cricket">Cricket</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Football">Football</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] border-none bg-gray-50 rounded-xl h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Details</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Captain / VC</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeams.map(team => (
                <tr key={team.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{team.teamName}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-0.5">{team.sport}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-900">{team.captain}</div>
                    <div className="text-xs text-gray-500">{team.viceCaptain}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${team.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                      team.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                      {team.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingTeam(team)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm">
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

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Team' : 'New Team Registration'}</h2>
                <p className="text-sm text-gray-500">Provide team details and member list</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <form id="team-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Team Name</label>
                    <Input {...register('teamName')} placeholder="e.g. Thunder Strikers" error={errors.teamName?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Sport</label>
                    <Select onValueChange={(v) => setValue('sport', v)}>
                      <SelectTrigger className="h-9 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select Sport" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cricket">Cricket</SelectItem>
                        <SelectItem value="Basketball">Basketball</SelectItem>
                        <SelectItem value="Football">Football</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.sport?.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.sport.message}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Add Team Members</h3>
                    <span className="text-xs text-gray-500 font-bold">{fields.length} added</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      placeholder="Name"
                      value={currentMember.name}
                      onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <input
                      placeholder="Student ID"
                      value={currentMember.studentId}
                      onChange={e => setCurrentMember({ ...currentMember, studentId: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <input
                      placeholder="Phone Number"
                      value={currentMember.phoneNumber}
                      onChange={e => setCurrentMember({ ...currentMember, phoneNumber: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <input
                      placeholder="Email"
                      value={currentMember.email}
                      onChange={e => setCurrentMember({ ...currentMember, email: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <input
                      placeholder="Year"
                      value={currentMember.year}
                      onChange={e => setCurrentMember({ ...currentMember, year: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <input
                      placeholder="Section"
                      value={currentMember.section}
                      onChange={e => setCurrentMember({ ...currentMember, section: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <select
                      value={currentMember.role}
                      onChange={e => setCurrentMember({ ...currentMember, role: e.target.value as any })}
                      className="px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="Member">Member</option>
                      <option value="Captain">Captain</option>
                      <option value="Vice Captain">Vice Captain</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member to List
                  </button>

                  <div className="space-y-2 max-h-40 overflow-y-auto border-t border-gray-100 pt-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-bold">{field.name}</div>
                          <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                            {field.role}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {errors.members?.message && <p className="text-[10px] text-red-500 font-bold">{errors.members.message}</p>}
                    {errors.members?.root?.message && <p className="text-[10px] text-red-500 font-bold">{errors.members.root.message}</p>}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="team-form"
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-indigo-200"
              >
                {editingId ? 'Update Registration' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}