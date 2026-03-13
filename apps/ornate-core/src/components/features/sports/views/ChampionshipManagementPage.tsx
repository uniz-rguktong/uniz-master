'use client';
import { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Users, Calendar, Play, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getSports } from '@/actions/sportGetters';


export function ChampionshipManagementPage() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const { showToast } = useToast();

  const fetchChampionships = async () => {
    setIsLoading(true);
    const res = await getSports();
    if (res.success) {
      const sportNames = Array.from(new Set((res.sports || [])
        .map((sport: any) => sport.name)
        .filter((name: any): name is string => Boolean(name))));
      setAvailableSports(sportNames);

      setChampionships((res.sports || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        sport: s.name,
        sportColor: '#3B82F6',
        format: 'Knockout',
        startDate: s.date,
        endDate: s.date,
        venue: s.venue,
        totalTeams: s.capacity,
        registeredTeams: s.registrations,
        status: s.status.toLowerCase(),
        currentRound: s.status === 'Ongoing' ? 'Active' : 'Not Started',
        organizer: 'Sports Committee',
        entryFee: '₹0',
        prizePool: '₹0'
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  // Form State
  const [formData, setFormData] = useState<any>({
    name: '',
    sport: '',
    format: '',
    startDate: '',
    endDate: '',
    venue: '',
    totalTeams: '',
    entryFee: '',
    prizePool: '',
    organizer: ''
  });

  const statuses = ['All', 'registration', 'ongoing', 'completed'];

  const filteredChampionships = championships.filter((champ: any) =>
    filterStatus === 'All' || champ.status === filterStatus
  );

  const stats = {
    total: championships.length,
    registration: championships.filter((c: any) => c.status === 'registration').length,
    ongoing: championships.filter((c: any) => c.status === 'ongoing').length,
    completed: championships.filter((c: any) => c.status === 'completed').length
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'ongoing':
        return <Play className="w-4 h-4" />;
      case 'registration':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'ongoing':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'registration':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46' };
      default:
        return { bg: '#F3F4F6', text: '#1F2937' };
    }
  };

  const getSportColor = (sport: any) => {
    switch (sport) {
      case 'Cricket': return '#3B82F6';
      case 'Basketball': return '#F59E0B';
      case 'Football': return '#10B981';
      case 'Volleyball': return '#EF4444';
      case 'Badminton': return '#8B5CF6';
      case 'Kho-Kho': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const handleInputChange = (field: any, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreate = () => {
    if (!formData.name || !formData.sport || !formData.format || !formData.startDate || !formData.totalTeams) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newChampionship = {
      id: Date.now(),
      ...formData,
      sportColor: getSportColor(formData.sport),
      registeredTeams: 0,
      status: 'registration',
      currentRound: 'Not Started',
    };

    setChampionships([newChampionship, ...championships]);
    setShowCreateForm(false);
    showToast('Championship created successfully!', 'success');

    // Reset form
    setFormData({
      name: '',
      sport: '',
      format: '',
      startDate: '',
      endDate: '',
      venue: '',
      totalTeams: '',
      entryFee: '',
      prizePool: '',
      organizer: ''
    });
  };

  const handleDelete = (id: any) => {
    setChampionships(championships.filter(c => c.id !== id));
    showToast('Championship deleted successfully', 'success');
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] md:text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span className="text-[#9CA3AF]">›</span>
          <span>Sports</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="text-[#1A1A1A] font-medium">Championship Management</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1 md:mb-2">Championship Management</h1>
            <p className="text-[10px] md:text-sm text-[#6B7280]">Create and manage sports tournaments and championships</p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 w-full md:w-auto bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            Create Championship
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex w-10 h-10 bg-[#F5F3FF] rounded-lg items-center justify-center">
                <Trophy className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <div className="text-[10px] md:text-sm text-[#6B7280] truncate">Total</div>
                <div className="text-lg md:text-2xl font-semibold text-[#1A1A1A]">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex w-10 h-10 bg-[#FEF3C7] rounded-lg items-center justify-center">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <div className="text-[10px] md:text-sm text-[#6B7280] truncate">Registration</div>
                <div className="text-lg md:text-2xl font-semibold text-[#F59E0B]">{stats.registration}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex w-10 h-10 bg-[#DBEAFE] rounded-lg items-center justify-center">
                <Play className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <div className="text-[10px] md:text-sm text-[#6B7280] truncate">Ongoing</div>
                <div className="text-lg md:text-2xl font-semibold text-[#3B82F6]">{stats.ongoing}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex w-10 h-10 bg-[#D1FAE5] rounded-lg items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <div className="text-[10px] md:text-sm text-[#6B7280] truncate">Completed</div>
                <div className="text-lg md:text-2xl font-semibold text-[#10B981]">{stats.completed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {statuses.map((status: any) =>
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === status ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>
              {status}
            </button>
          )}
        </div>
      </div>

      {/* Championships Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {filteredChampionships.map((championship: any) => (
          <div
            key={championship.id}
            className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-all animate-card-entrance"
            style={{ animationDelay: `${filteredChampionships.indexOf(championship) * 40}ms` }}>

            {/* Header */}
            <div
              className="h-32 p-6 relative"
              style={{
                background: `linear-gradient(135deg, ${championship.sportColor}20 0%, ${championship.sportColor}40 100%)`
              }}>

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[#1A1A1A]">{championship.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: championship.sportColor }}>
                      {championship.sport}
                    </span>
                    <span className="px-2.5 py-1 bg-white bg-opacity-90 text-[#1A1A1A] rounded-full text-xs font-semibold">
                      {championship.format}
                    </span>
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
                  style={{
                    backgroundColor: getStatusColor(championship.status).bg,
                    color: getStatusColor(championship.status).text
                  }}>
                  {getStatusIcon(championship.status)}
                  {championship.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Duration</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">
                    {new Date(championship.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(championship.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-1">
                    <Users className="w-4 h-4" />
                    <span>Teams</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">
                    {championship.registeredTeams} / {championship.totalTeams}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Venue</div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">{championship.venue}</div>
                </div>

                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Current Round</div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">{championship.currentRound}</div>
                </div>

                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Entry Fee</div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">{championship.entryFee}</div>
                </div>

                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Prize Pool</div>
                  <div className="text-sm font-bold text-[#10B981]">{championship.prizePool}</div>
                </div>
              </div>

              {/* Winner (if completed) */}
              {championship.winner &&
                <div className="mb-4 p-3 bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <div className="text-xs text-[#92400E]">Champion</div>
                    <div className="text-sm font-bold text-[#92400E]">{championship.winner}</div>
                  </div>
                </div>
              }

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                  <span>Registration Progress</span>
                  <span>{Math.round(championship.registeredTeams / championship.totalTeams * 100)}%</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${championship.registeredTeams / championship.totalTeams * 100}%`,
                      backgroundColor: championship.sportColor
                    }} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => showToast(`Viewing details for ${championship.name}`, 'info')}
                  className="flex-1 px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                  View Details
                </button>
                <button
                  onClick={() => showToast(`Edit mode for ${championship.name}`, 'info')}
                  className="p-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button
                  onClick={() => handleDelete(championship.id)}
                  className="p-2 bg-[#FEE2E2] hover:bg-[#FECACA] rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Championship Modal */}
      {showCreateForm &&
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8 overscroll-contain">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-modal-entrance shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#1A1A1A]">Create New Championship</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-[#6B7280] hover:text-[#1A1A1A]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Championship Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter championship name"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Sport <span className="text-[#EF4444]">*</span>
                  </label>
                  <Select value={formData.sport} onValueChange={(val) => handleInputChange('sport', val)}>
                    <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSports.map((sportName: string) => (
                        <SelectItem key={sportName} value={sportName}>{sportName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Format <span className="text-[#EF4444]">*</span>
                  </label>
                  <Select value={formData.format} onValueChange={(val) => handleInputChange('format', val)}>
                    <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Knockout">Knockout</SelectItem>
                      <SelectItem value="Round Robin">Round Robin</SelectItem>
                      <SelectItem value="League + Knockout">League + Knockout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Start Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Venue <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="Enter venue"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Total Teams <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalTeams}
                    onChange={(e) => handleInputChange('totalTeams', e.target.value)}
                    placeholder="Enter number of teams"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Entry Fee
                  </label>
                  <input
                    type="text"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange('entryFee', e.target.value)}
                    placeholder="₹0"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Prize Pool
                  </label>
                  <input
                    type="text"
                    value={formData.prizePool}
                    onChange={(e) => handleInputChange('prizePool', e.target.value)}
                    placeholder="₹0"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                    placeholder="Enter organizer name"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#E5E7EB]">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-md shadow-emerald-100">
                Create Championship
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  );
}
