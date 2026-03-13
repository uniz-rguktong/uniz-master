'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Download, CheckCircle, Clock, XCircle, Edit, Trash2, Info, UserPlus, Eye, Save, X } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import { getSportTeamRegistrations } from '@/actions/sportRegistrationGetters';
import { getSportsListForFilter } from '@/actions/sportGetters';
import {
  createSportSpotTeamRegistration,
  deleteSportTeamRegistration,
  updateSportSpotTeamRegistration,
} from '@/actions/sportRegistrationActions';
import { updateSportRegistrationStatus } from '@/actions/sportRegistrationActions';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

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
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [sportOptions, setSportOptions] = useState<string[]>([]);
  const [sportIdByName, setSportIdByName] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);

  const [editingRegistrationId, setEditingRegistrationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teamsRes, sportsRes] = await Promise.all([
        getSportTeamRegistrations(),
        getSportsListForFilter(),
      ]);

      if (teamsRes?.success && teamsRes?.data) {
        setTeamsList(teamsRes.data as any[]);
      } else {
        setTeamsList([]);
      }

      if (sportsRes?.success && sportsRes?.sports) {
        const rawSports = sportsRes.sports as any[];
        const names = Array.from(new Set(rawSports.map((sport) => sport.name)));
        const mapping = rawSports.reduce((acc, sport) => {
          if (sport?.name && sport?.id) {
            acc[sport.name] = sport.id;
          }
          return acc;
        }, {} as Record<string, string>);

        setSportOptions(names as string[]);
        setSportIdByName(mapping);
      } else {
        setSportOptions([]);
        setSportIdByName({});
      }
    } catch {
      showToast('Failed to load team registrations', 'error');
      setTeamsList([]);
      setSportOptions([]);
      setSportIdByName({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showToast]);

  const handleAddMemberToList = () => {
    const result = memberSchema.safeParse(currentMember);
    if (!result.success) {
      showToast(result.error.issues[0]?.message || 'Validation error', 'error');
      return;
    }
    append(result.data);
    setCurrentMember({ role: 'Member', name: '', studentId: '', phoneNumber: '', year: '', section: '' });
  };

  const onRegisterSubmit = async (data: TeamRegistrationFormValues) => {
    setIsMutating(true);
    const sportId = sportIdByName[data.sport];

    if (!sportId) {
      showToast('Invalid sport selected', 'error');
      setIsMutating(false);
      return;
    }

    const payloadMembers = data.members.map((member) => ({
      name: member.name,
      rollNumber: member.studentId,
      phone: member.phoneNumber,
      year: member.year,
      section: member.section,
      role: member.role,
    }));

    try {
      if (editingRegistrationId) {
        const result = await updateSportSpotTeamRegistration({
          registrationId: editingRegistrationId,
          sportId,
          teamName: data.teamName,
          members: payloadMembers,
        });

        if (result?.success) {
          showToast('Team updated successfully', 'success');
          await loadData();
          setShowAddForm(false);
          reset();
          setEditingRegistrationId(null);
        } else {
          showToast(result?.error || 'Failed to update team', 'error');
        }
      } else {
        const result = await createSportSpotTeamRegistration({
          sportId,
          teamName: data.teamName,
          members: payloadMembers,
        });

        if (result?.success) {
          showToast('Team registered successfully', 'success');
          await loadData();
          setShowAddForm(false);
          reset();
        } else {
          showToast(result?.error || 'Failed to register team', 'error');
        }
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTeam = async (team: any) => {
    if (!confirm(`Are you sure you want to delete ${team.teamName}?`)) return;

    setIsMutating(true);
    try {
      const result = await deleteSportTeamRegistration(team.registrationId);
      if (result?.success) {
        showToast('Team deleted successfully', 'success');
        await loadData();
      } else {
        showToast(result?.error || 'Failed to delete team', 'error');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateStatus = async (team: any, status: 'CONFIRMED' | 'REJECTED') => {
    setIsMutating(true);
    try {
      const result = await updateSportRegistrationStatus(team.registrationId, status);
      if (result?.success) {
        showToast(`Team ${status.toLowerCase()} successfully`, 'success');
        await loadData();
      } else {
        showToast(result?.error || 'Failed to update status', 'error');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleEditTeam = (team: any) => {
    setEditingRegistrationId(team.registrationId);
    reset({
      teamName: team.teamName,
      sport: team.sport,
      members: team.members.map((m: any) => ({
        name: m.name,
        studentId: m.studentId || m.rollNumber,
        year: m.year,
        section: m.section,
        role: m.role,
        phoneNumber: m.phoneNumber || m.phone
      }))
    });
    setShowAddForm(true);
  };

  const filteredTeams = teamsList.filter((team: any) => {
    const matchesSearch = team.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = filterSport === 'All' || team.sport === filterSport;
    const matchesStatus = filterStatus === 'All' || team.status === filterStatus;
    return matchesSearch && matchesSport && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Sports</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Team Registration</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Team Registration</h1>
            <p className="text-sm text-[#6B7280]">Manage sports team registrations and approvals</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button className="flex justify-center items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
              <Download className="w-4 h-4" />
              Export List
            </button>
            <button
              onClick={() => { reset({ teamName: '', sport: '', members: [] }); setEditingRegistrationId(null); setShowAddForm(true); }}
              className="flex justify-center items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">
              <Plus className="w-5 h-5" />
              Register Team
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Teams</p>
              <p className="text-xl font-bold">{teamsList.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Confirmed</p>
              <p className="text-xl font-bold">{teamsList.filter(t => t.status === 'confirmed').length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pending</p>
              <p className="text-xl font-bold">{teamsList.filter(t => t.status === 'pending').length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Rejected</p>
              <p className="text-xl font-bold">{teamsList.filter(t => t.status === 'rejected').length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by team name or captain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger className="w-full md:w-[180px] h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sports</SelectItem>
                {sportOptions.map(sport => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm capitalize">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sport</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Captain / VC</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><Skeleton width="100%" height={200} /></td></tr>
            ) : filteredTeams.map(team => (
              <tr key={team.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{team.teamName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {team.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100">
                    {team.sport}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{team.captain}</div>
                  <div className="text-xs text-gray-500">{team.viceCaptain}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <Users className="w-4 h-4 text-gray-400" />
                    {team.members.length}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${team.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    team.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                    {team.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewingTeam(team)} className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                    {team.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(team, 'CONFIRMED')} className="p-2 text-gray-400 hover:text-emerald-600 bg-white border border-gray-100 rounded-lg shadow-sm">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleUpdateStatus(team, 'REJECTED')} className="p-2 text-gray-400 hover:text-rose-600 bg-white border border-gray-100 rounded-lg shadow-sm">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleEditTeam(team)} className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTeam(team)} className="p-2 text-gray-400 hover:text-rose-600 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingRegistrationId ? 'Edit Team Registration' : 'New Team Registration'}</h2>
                <p className="text-sm text-gray-500">Provide team details and member squad information</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form id="team-reg-form" onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Team Name</label>
                    <Input {...register('teamName')} placeholder="e.g. Thunder Warriors" error={errors.teamName?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Sport</label>
                    <Select onValueChange={(v) => setValue('sport', v)} defaultValue={watch('sport')}>
                      <SelectTrigger className="h-10 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportOptions.map(sport => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.sport?.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.sport.message}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Member Squad</h3>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{fields.length} Members</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input placeholder="Name" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" value={currentMember.name || ''} onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })} />
                    <input placeholder="Student ID" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" value={currentMember.studentId || ''} onChange={e => setCurrentMember({ ...currentMember, studentId: e.target.value })} />
                    <input placeholder="Phone" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" value={currentMember.phoneNumber || ''} onChange={e => setCurrentMember({ ...currentMember, phoneNumber: e.target.value })} />
                    <input placeholder="Email *" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" value={currentMember.email || ''} onChange={e => setCurrentMember({ ...currentMember, email: e.target.value })} />

                    <Select onValueChange={v => setCurrentMember({ ...currentMember, year: v })} value={currentMember.year || ''}>
                      <SelectTrigger className="h-9 bg-white border-gray-200 rounded-lg text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>{['I', 'II', 'III', 'IV'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={v => setCurrentMember({ ...currentMember, section: v })} value={currentMember.section || ''}>
                      <SelectTrigger className="h-9 bg-white border-gray-200 rounded-lg text-xs"><SelectValue placeholder="Sec" /></SelectTrigger>
                      <SelectContent>{['A', 'B', 'C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={v => setCurrentMember({ ...currentMember, role: v as any })} value={currentMember.role || ''}>
                      <SelectTrigger className="h-9 bg-white border-gray-200 rounded-lg text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Captain">Captain</SelectItem>
                        <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                      </SelectContent>
                    </Select>

                    <button type="button" onClick={handleAddMemberToList} className="sm:col-span-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" /> Add to List
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                            {field.name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{field.name}</div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{field.studentId} • {field.year} {field.section} • {field.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${field.role === 'Captain' ? 'bg-orange-100 text-orange-600' :
                            field.role === 'Vice Captain' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>{field.role}</span>
                          <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {errors.members?.message && <p className="text-[10px] text-red-500 font-bold">{errors.members.message}</p>}
                    {errors.members?.root?.message && <p className="text-[10px] text-red-500 font-bold">{errors.members.root.message}</p>}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
              <button type="submit" form="team-reg-form" disabled={isMutating} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {isMutating ? 'Saving...' : (editingRegistrationId ? 'Update Registration' : 'Complete Registration')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Team Modal */}
      {viewingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setViewingTeam(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-indigo-600 text-white relative">
              <h3 className="text-xl font-bold">{viewingTeam.teamName}</h3>
              <p className="text-xs text-white/70 uppercase font-bold tracking-widest">{viewingTeam.sport} Squad</p>
              <button onClick={() => setViewingTeam(null)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {viewingTeam.members.map((member: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-50 rounded-2xl hover:bg-indigo-50/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-gray-400">
                      {member.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{member.name}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{member.rollNumber} • {member.year} {member.section}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${member.role === 'Captain' ? 'bg-orange-100 text-orange-600' :
                    member.role === 'Vice Captain' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
