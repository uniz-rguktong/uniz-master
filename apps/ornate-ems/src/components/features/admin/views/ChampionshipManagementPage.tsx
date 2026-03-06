'use client';
import { useState } from 'react';
import { Trophy, Plus, Edit, Trash2, Users, Calendar, Play, CheckCircle, Clock } from 'lucide-react';

const championships = [
{
  id: 1,
  name: 'Inter-Department Cricket Championship',
  sport: 'Cricket',
  sportColor: '#3B82F6',
  format: 'Knockout',
  startDate: '2025-11-25',
  endDate: '2025-11-28',
  venue: 'Sports Ground A',
  totalTeams: 8,
  registeredTeams: 8,
  status: 'ongoing',
  currentRound: 'Semi Finals',
  organizer: 'Sports Committee',
  entryFee: '₹500',
  prizePool: '₹50,000'
},
{
  id: 2,
  name: 'Basketball League 2025',
  sport: 'Basketball',
  sportColor: '#F59E0B',
  format: 'Round Robin',
  startDate: '2025-11-20',
  endDate: '2025-11-30',
  venue: 'Indoor Stadium',
  totalTeams: 6,
  registeredTeams: 6,
  status: 'ongoing',
  currentRound: 'League Stage',
  organizer: 'Athletic Department',
  entryFee: '₹300',
  prizePool: '₹30,000'
},
{
  id: 3,
  name: 'Football Championship',
  sport: 'Football',
  sportColor: '#10B981',
  format: 'Knockout',
  startDate: '2025-12-01',
  endDate: '2025-12-05',
  venue: 'Football Field',
  totalTeams: 12,
  registeredTeams: 10,
  status: 'registration',
  currentRound: 'Pre-Tournament',
  organizer: 'Sports Committee',
  entryFee: '₹600',
  prizePool: '₹75,000'
},
{
  id: 4,
  name: 'Volleyball Tournament',
  sport: 'Volleyball',
  sportColor: '#EF4444',
  format: 'Round Robin',
  startDate: '2025-10-15',
  endDate: '2025-10-25',
  venue: 'Sports Complex',
  totalTeams: 8,
  registeredTeams: 8,
  status: 'completed',
  currentRound: 'Completed',
  organizer: 'CSE Department',
  entryFee: '₹400',
  prizePool: '₹40,000',
  winner: 'Ace Servers'
}];


export function ChampionshipManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

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

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Sports</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Championship Management</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Championship Management</h1>
            <p className="text-sm text-[#6B7280]">Create and manage sports tournaments and championships</p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">

            <Plus className="w-5 h-5" />
            Create Championship
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5F3FF] rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-sm text-[#6B7280]">Total Championships</div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-sm text-[#6B7280]">Registration Open</div>
                <div className="text-2xl font-semibold text-[#F59E0B]">{stats.registration}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-sm text-[#6B7280]">Ongoing</div>
                <div className="text-2xl font-semibold text-[#3B82F6]">{stats.ongoing}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <div className="text-sm text-[#6B7280]">Completed</div>
                <div className="text-2xl font-semibold text-[#10B981]">{stats.completed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-2 gap-6">
        {filteredChampionships.map((championship: any) =>
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
                <button className="flex-1 px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                  View Details
                </button>
                <button className="p-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button className="p-2 bg-[#FEE2E2] hover:bg-[#FECACA] rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Championship Modal */}
      {showCreateForm &&
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="text-xl font-semibold text-[#1A1A1A]">Create New Championship</h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Championship Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                  type="text"
                  placeholder="Enter championship name"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Sport <span className="text-[#EF4444]">*</span>
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                    <option>Select sport</option>
                    <option>Cricket</option>
                    <option>Basketball</option>
                    <option>Football</option>
                    <option>Volleyball</option>
                    <option>Badminton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Format <span className="text-[#EF4444]">*</span>
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                    <option>Select format</option>
                    <option>Knockout</option>
                    <option>Round Robin</option>
                    <option>League + Knockout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Start Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    End Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Venue <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                  type="text"
                  placeholder="Enter venue"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Total Teams <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                  type="number"
                  placeholder="Enter number of teams"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Entry Fee
                  </label>
                  <input
                  type="text"
                  placeholder="₹0"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Prize Pool
                  </label>
                  <input
                  type="text"
                  placeholder="₹0"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Organizer
                  </label>
                  <input
                  type="text"
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
              <button className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors">
                Create Championship
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}