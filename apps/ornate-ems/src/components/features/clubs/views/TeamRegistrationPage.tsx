'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Download, CheckCircle, Clock, XCircle, Edit, Trash2, Info, MoreHorizontal, UserPlus, Eye } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';

interface TeamRegistrationPageProps {
  initialTeams?: Array<Record<string, any>>;
  initialEvents?: Array<Record<string, any>>;
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
}

export function TeamRegistrationPage({ initialTeams = [], initialEvents = [], onNavigate }: TeamRegistrationPageProps = {}) {
  const [teamsList, setTeamsList] = useState(initialTeams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventId, setFilterEventId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentMember, setCurrentMember] = useState<any>({});

  const [editingId, setEditingId] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddForm || viewingTeam) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, viewingTeam]);

  const statuses = ['All', 'pending', 'approved', 'rejected'];

  const filteredTeams = teamsList.filter((team: any) => {
    const matchesSearch = team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEventId === 'all' || team.eventId === filterEventId;
    const matchesStatus = filterStatus === 'All' || team.status === filterStatus;
    return matchesSearch && matchesEvent && matchesStatus;
  });

  const stats = {
    total: teamsList.length,
    approved: teamsList.filter((t: any) => t.status === 'approved').length,
    pending: teamsList.filter((t: any) => t.status === 'pending').length,
    rejected: teamsList.filter((t: any) => t.status === 'rejected').length
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'approved':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#1F2937' };
    }
  };

  const addMember = () => {
    if (currentMember.name && currentMember.studentId && currentMember.year &&
      currentMember.section && currentMember.role && currentMember.phoneNumber) {
      setTeamMembers([...teamMembers, {
        ...currentMember,
        id: Date.now().toString()
      }]);
      setCurrentMember({});
      showToast('Team member added successfully', 'success');
    } else {
      showToast('Please fill all member details', 'error');
    }
  };

  const removeMember = (id: any) => {
    setTeamMembers(teamMembers.filter((m: any) => m.id !== id));
    showToast('Team member removed', 'warning');
  };

  const handleRegisterTeam = async () => {
    if (!teamName.trim()) {
      showToast('Please enter a team name', 'error');
      return;
    }
    if (!selectedEventId) {
      showToast('Please select an event', 'error');
      return;
    }
    if (teamMembers.length === 0) {
      showToast('Please add at least one team member', 'error');
      return;
    }

    const hasCaptain = teamMembers.some((m: any) => m.role === 'Captain');
    const hasViceCaptain = teamMembers.some((m: any) => m.role === 'Vice Captain');

    if (!hasCaptain) {
      showToast('Please designate a Captain', 'error');
      return;
    }

    if (!hasViceCaptain) {
      showToast('Please designate a Vice Captain', 'error');
      return;
    }

    try {
      if (editingId) {
        // Update existing team (Not fully implemented on backend yet for members update)
        // Ideally we would have updateTeam action too.
        // For now, let's focus on Creation as requested.
        showToast('Update functionality pending backend implementation', 'info');
      } else {
        // Add new team
        const { createTeam } = await import('@/actions/teamActions');
        const result = await createTeam({
          teamName,
          eventId: selectedEventId,
          members: teamMembers
        });

        if (result.success) {
          // Add to local list for optimistic UI update or just rely on revalidation if page reloads
          // Here we are in a client component with local state 'teamsList', so let's update it.
          // However, the object structure might differ slightly from what we had.
          // Let's assume result.data has the needed fields or we construct them from input.

          const newTeam = {
            id: (result.data as any).id,
            teamName: (result.data as any).teamName,
            sport: initialEvents.find(e => e.id === selectedEventId)?.title || 'Unknown',
            eventId: selectedEventId,
            sportColor: '#3B82F6',
            captain: teamMembers.find(m => m.role === 'Captain')?.name || 'N/A',
            viceCaptain: teamMembers.find(m => m.role === 'Vice Captain')?.name || 'N/A',
            yearLevel: 'Mixed',
            status: 'pending',
            registeredDate: new Date().toISOString(),
            members: teamMembers.map(m => ({ ...m, id: Math.random().toString() })) // Mocking IDs for members if not returned fully
          };

          setTeamsList([newTeam, ...teamsList]); // Add to top
          showToast('Team registered successfully', 'success');
          resetForm();
        } else {
          showToast(result.error || 'Failed to register team', 'error');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('An unexpected error occurred', 'error');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setTeamMembers([]);
    setTeamName('');
    setSelectedEventId('');
    setCurrentMember({});
    setEditingId(null);
  };

  const handleDeleteTeam = (id: any) => {
    setTeamsList(teamsList.filter(t => t.id !== id));
    showToast('Team deleted successfully', 'success');
  };

  const handleEditTeam = (team: any) => {
    setTeamName(team.teamName);
    setSelectedEventId(team.eventId);
    setTeamMembers(team.members);
    setEditingId(team.id);
    setShowAddForm(true);
  };

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
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Team Registration</h1>
            <p className="text-sm text-[#6B7280]">Manage sports team registrations and approvals</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button className="flex justify-center items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
              <Download className="w-4 h-4" />
              Export List
            </button>
            <button
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="flex justify-center items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">

              <Plus className="w-5 h-5" />
              Register Team
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2 animate-card-entrance" style={{ animationDelay: '100ms' }}>
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Total Teams</div>
                      <div className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[18px] p-2 animate-card-entrance" style={{ animationDelay: '200ms' }}>
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Approved</div>
                      <div className="text-2xl font-bold text-[#10B981]">{stats.approved}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[18px] p-2 animate-card-entrance" style={{ animationDelay: '300ms' }}>
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Pending</div>
                      <div className="text-2xl font-bold text-[#F59E0B]">{stats.pending}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[18px] p-2 animate-card-entrance" style={{ animationDelay: '400ms' }}>
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Rejected</div>
                      <div className="text-2xl font-bold text-[#EF4444]">{stats.rejected}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
            <div className="w-full md:w-[180px]">
              <Select
                value={filterEventId}
                onValueChange={setFilterEventId}>
                <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {initialEvents.map((event: any) =>
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[180px]">
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status: any) =>
                    <SelectItem key={status} value={status} className="capitalize">
                      {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="animate-card-entrance" style={{ animationDelay: '250ms' }}>
        <div className="bg-[#F4F2F0] rounded-[18px] mb-8 p-2.5 pt-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 px-3 mt-[-4px] gap-3">
            <div className="flex items-center gap-2 justify-between">
              <h2 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Team Registrations</h2>
              <button
                className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                title="Information">

                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-auto pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#D1D5DB] focus:border-[#D1D5DB] placeholder:text-[#9CA3AF]" />

              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-xs sm:text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">

                <Plus className="w-4 h-4" />
                Add Team
              </button>
            </div>
          </div>

          {/* White Inner Card */}
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-[#F3F4F6]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Team Name ↑
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Event / Sport ↑
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Captain ↑
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Vice Captain ↑
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Members ↑
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status ↑
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_: any, i: any) => (
                      <tr key={i} className="border-b border-[#F3F4F6]">
                        <td className="px-6 py-4" colSpan={7}>
                          <Skeleton width="100%" height={40} />
                        </td>
                      </tr>
                    ))
                  ) : filteredTeams.length > 0 ? (
                    filteredTeams.map((team: any, index: any) => (
                      <tr
                        key={team.id}
                        className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${index === filteredTeams.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[#1A1A1A]">{team.teamName}</div>
                          <div className="text-xs text-[#6B7280] mt-0.5">
                            Reg: {new Date(team.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: team.sportColor }}
                          >
                            {team.sport}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#1A1A1A] font-semibold">{team.captain}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#1A1A1A]">{team.viceCaptain}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#6B7280]" />
                            <span className="text-sm font-bold text-[#1A1A1A]">{team.members.length}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{
                              backgroundColor: getStatusColor(team.status).bg,
                              color: getStatusColor(team.status).text
                            }}
                          >
                            {getStatusIcon(team.status)}
                            {team.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingTeam(team)}
                              className="p-1.5 hover:bg-[#DBEAFE] rounded transition-colors"
                              title="View Members"
                            >
                              <Eye className="w-4 h-4 text-[#3B82F6]" />
                            </button>
                            {team.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => showToast(`${team.teamName} approved`, 'success')}
                                  className="p-1.5 hover:bg-[#D1FAE5] rounded transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                                </button>
                                <button
                                  onClick={() => showToast(`${team.teamName} rejected`, 'error')}
                                  className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-[#EF4444]" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors"
                              title="Edit">
                              <Edit className="w-4 h-4 text-[#6B7280]" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-[#EF4444]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280]">
                        No team registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-8 overscroll-contain" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] md:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-modal-entrance">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-[#E5E7EB] shrink-0 bg-white">
              <h3 className="text-xl font-bold text-[#1A1A1A]">{editingId ? 'Edit Team' : 'Register New Team'}</h3>
              <p className="text-sm text-[#6B7280] mt-1">{editingId ? 'Update' : 'Add'} team details and members information</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-6">
              {/* Team Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">Team Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Team Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Event <span className="text-[#EF4444]">*</span>
                    </label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]">
                        <SelectValue placeholder="Select Event" />
                      </SelectTrigger>
                      <SelectContent>
                        {initialEvents.map((event: any) =>
                          <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Add Team Member Section */}
              <div className="border-t border-[#E5E7EB] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Add Team Members</h4>
                  <span className="text-xs font-medium px-2.5 py-1 bg-[#F3F4F6] text-[#6B7280] rounded-full">
                    {teamMembers.length} member(s) added
                  </span>
                </div>

                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Student name"
                        value={currentMember.name || ''}
                        onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Student ID *</label>
                      <input
                        type="text"
                        placeholder="e.g., CSE2021001"
                        value={currentMember.studentId || ''}
                        onChange={(e) => setCurrentMember({ ...currentMember, studentId: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Phone *</label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={currentMember.phoneNumber || ''}
                        onChange={(e) => setCurrentMember({ ...currentMember, phoneNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Year</label>
                      <Select value={currentMember.year || ''} onValueChange={(v) => setCurrentMember({ ...currentMember, year: v })}>
                        <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {['I', 'II', 'III', 'IV'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Section</label>
                      <Select value={currentMember.section || ''} onValueChange={(v) => setCurrentMember({ ...currentMember, section: v })}>
                        <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm">
                          <SelectValue placeholder="Sec" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Role</label>
                      <Select value={currentMember.role || ''} onValueChange={(v) => setCurrentMember({ ...currentMember, role: v })}>
                        <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Captain">Captain</SelectItem>
                          <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                          <SelectItem value="Member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addMember}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-semibold hover:bg-[#059669] transition-colors shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added Members Table */}
                {teamMembers.length > 0 && (
                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <tr>
                          {['Name', 'ID', 'Year', 'Sec', 'Role', 'Phone', ''].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {teamMembers.map((m: any) => (
                          <tr key={m.id} className="hover:bg-gray-50 bg-white">
                            <td className="px-4 py-3 font-medium text-[#1A1A1A]">{m.name}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{m.studentId}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{m.year}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{m.section}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.role === 'Captain' ? 'bg-blue-100 text-blue-700' :
                                m.role === 'Vice Captain' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{m.role}</span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono">{m.phoneNumber}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => removeMember(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-[#E5E7EB] bg-gray-50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterTeam}
                className="px-6 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669] transition-colors shadow-md shadow-emerald-100"
              >
                {editingId ? 'Update Team' : 'Register Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Team Members Modal */}
      {viewingTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-8 overscroll-contain" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-modal-entrance">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-[#E5E7EB] shrink-0 bg-white text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">{viewingTeam.teamName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-[#DBEAFE] text-blue-700 rounded text-[11px] font-bold uppercase">{viewingTeam.sport}</span>
                    <span className="text-sm text-[#6B7280]">• {viewingTeam.members.length} Members</span>
                  </div>
                </div>
                <button onClick={() => setViewingTeam(null)} className="p-2 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                  <XCircle className="w-6 h-6 text-[#9CA3AF]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">Team Members List</h4>
              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      {['Name', 'Student ID', 'Year', 'Sec', 'Role', 'Phone Number'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {viewingTeam.members.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50 bg-white">
                        <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{m.name}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{m.studentId}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{m.year}</td>
                        <td className="px-4 py-3 text-[#6B7280]">{m.section}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.role === 'Captain' ? 'bg-blue-100 text-blue-700' :
                            m.role === 'Vice Captain' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{m.role}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{m.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-[#E5E7EB] bg-gray-50 shrink-0">
              <button
                onClick={() => setViewingTeam(null)}
                className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#333333] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg"
              >
                Close Members List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}