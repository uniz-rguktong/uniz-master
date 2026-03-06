'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  X,
  AlertCircle,
  ChevronRight,
  Trophy,
  Search,
  Timer,
  Zap
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { getMatches, createMatch, updateMatch, initializeTournament, getTeams } from '@/actions/fixtureActions';
import { getSportsListForFilter } from '@/actions/sportGetters';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface SportOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
}

export function MatchSchedulePage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isSportsAdminRoute = pathname?.startsWith('/sports/') && (session?.user?.role === 'SPORTS_ADMIN' || session?.user?.role === 'BRANCH_SPORTS_ADMIN');
  const isBranchSportsAdmin = session?.user?.role === 'BRANCH_SPORTS_ADMIN';
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const [availableSports, setAvailableSports] = useState<SportOption[]>([]);

  // Filters
  const [selectedGender, setSelectedGender] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tournamentGender') || 'Boys';
    }
    return 'Boys';
  });

  const [selectedSport, setSelectedSport] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tournamentSport') || 'All';
    }
    return 'All';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tournamentGender', selectedGender);
    }
  }, [selectedGender]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tournamentSport', selectedSport);
    }
  }, [selectedSport]);

  // Data State
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [activeResultMatchId, setActiveResultMatchId] = useState<string | null>(null);
  const [activeScheduleModalMatch, setActiveScheduleModalMatch] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{ date: string; time: string; venue: string }>({ date: '', time: '', venue: '' });
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [resultForm, setResultForm] = useState({
    score1: '',
    score2: '',
    winner: 'TBD'
  });

  const sanitizePositiveIntegerInput = (value: string) => value.replace(/\D/g, '');

  const isValidPositiveInteger = (value: string) => /^[1-9]\d*$/.test(value.trim());

  const deriveWinnerFromScores = (score1: string, score2: string, match: any) => {
    if (!isValidPositiveInteger(score1) || !isValidPositiveInteger(score2)) return 'TBD';

    const first = Number.parseInt(score1, 10);
    const second = Number.parseInt(score2, 10);
    if (Number.isNaN(first) || Number.isNaN(second)) return 'TBD';
    if (first === second) return 'Draw';
    return first > second ? (match.team1Name || 'Team 1') : (match.team2Name || 'Team 2');
  };

  // Form State
  const [newMatch, setNewMatch] = useState<any>({
    team1Name: '',
    team1Id: null,
    team2Name: '',
    team2Id: null,
    sportId: '',
    sport: '',
    gender: 'Boys',
    date: '',
    time: '',
    venue: '',
    round: 'Round 1',
    status: 'pending',
    referee: '',
    score1: '',
    score2: '',
    winner: ''
  });

  const [allTeams, setAllTeams] = useState<any[]>([]);
  const allowedBranches = ['CSE', 'MECH', 'ECE', 'EEE', 'CIVIL'];

  const fetchMatches = async () => {
    if (selectedSport === 'All' || selectedGender === 'All') {
      const result = await getMatches(selectedSport, selectedGender);
      if (result.success) {
        setMatches(result.data || []);
      } else {
        showToast('Failed to load matches', 'error');
      }
    } else {
      const result = await initializeTournament(selectedSport, selectedGender);
      if (result.success) {
        setMatches(result.data || []);
      } else {
        showToast('Failed to load matches', 'error');
      }
    }
  };

  // Fetch data from DB
  const fetchInitialData = async () => {
    setIsLoading(true);

    // Parallelize all independent fetches
    const [sportsRes, teamsRes] = await Promise.all([
      getSportsListForFilter(),
      getTeams(),
    ]);

    if (sportsRes.success && sportsRes.sports) {
      // Athletics sports use individual event results - not bracket fixtures
      const sports = (sportsRes.sports as SportOption[]).filter(
        (sport) => sport?.id && sport?.name && !sport.name.startsWith('Athletics')
      );
      setAvailableSports(sports);
    }

    if (teamsRes.success && teamsRes.data) {
      const filteredTeams = teamsRes.data.filter((team: any) => {
        const code = (team.teamCode || '').toUpperCase().replace('BR-', '');
        return allowedBranches.includes(code);
      });
      setAllTeams(filteredTeams);
    }

    // Fetch matches (depends on sport/gender state, run after filters are set)
    await fetchMatches();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSport !== 'All' && availableSports.length > 0 && !availableSports.some((sport) => sport.id === selectedSport)) {
      setSelectedSport('All');
      return;
    }

    fetchMatches();
    // Persist filter changes (if not 'All')
    if (selectedSport !== 'All') localStorage.setItem('tournamentSport', selectedSport);
    if (selectedGender !== 'All') localStorage.setItem('tournamentGender', selectedGender);
  }, [selectedSport, selectedGender, availableSports]);

  // Filter Logic
  const isPlaceholderTeam = (name: string | null | undefined) => {
    const normalized = (name || '').trim().toUpperCase();
    return !normalized || normalized === 'TBD' || normalized.startsWith('WINNER OF ');
  };

  const filteredMatches = matches.filter((match: any) => {
    const sportMatch = selectedSport === 'All' || match.sportId === selectedSport;
    const genderMatch = selectedGender === 'All' || match.gender === selectedGender;

    if (!sportMatch || !genderMatch) return false;

    // Search Query
    const t1 = match.team1Name || '';
    const t2 = match.team2Name || '';

    const hasRealTeams = !isPlaceholderTeam(t1) || !isPlaceholderTeam(t2);
    const isFinalRound = (match.round || '').toLowerCase() === 'finals';
    if (!hasRealTeams && !isFinalRound) return false;

    const searchMatch =
      t1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t2.toLowerCase().includes(searchQuery.toLowerCase());

    return searchMatch;
  });

  const parseMatchStartDateTime = (dateValue: string | null | undefined, timeValue: string | null | undefined): Date | null => {
    const date = (dateValue || '').trim();
    const time = (timeValue || '').trim();
    if (!date || !time) return null;

    const datePart = `${date}T00:00:00`;
    const baseDate = new Date(datePart);
    if (Number.isNaN(baseDate.getTime())) return null;

    const militaryTimeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (militaryTimeMatch) {
      const hour = Number.parseInt(militaryTimeMatch[1]!, 10);
      const minute = Number.parseInt(militaryTimeMatch[2]!, 10);
      if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return null;
      const composed = new Date(baseDate);
      composed.setHours(hour, minute, 0, 0);
      return composed;
    }

    const meridiemTimeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (meridiemTimeMatch) {
      let hour = Number.parseInt(meridiemTimeMatch[1]!, 10);
      const minute = Number.parseInt(meridiemTimeMatch[2]!, 10);
      const meridiem = meridiemTimeMatch[3]!.toUpperCase();
      if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 1 || hour > 12 || minute > 59) return null;
      if (meridiem === 'PM' && hour !== 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      const composed = new Date(baseDate);
      composed.setHours(hour, minute, 0, 0);
      return composed;
    }

    return null;
  };

  const resultEditLocksByMatchId = useMemo(() => {
    const lockMap: Record<string, string | null> = {};
    const now = new Date();

    for (const match of matches) {
      const status = (match.status || '').toLowerCase();
      const winnerName = (match.winner || '').trim();
      const matchTemplateId = (match.matchId || '').trim();

      if (status !== 'completed' || !winnerName || winnerName === 'TBD' || winnerName === 'Draw') {
        lockMap[match.id] = null;
        continue;
      }

      const candidates = matches
        .filter((candidate: any) => {
          if (candidate.id === match.id) return false;
          if (candidate.sportId !== match.sportId || candidate.gender !== match.gender) return false;

          const candidateRoundOrder = candidate.roundOrder ?? Number.MAX_SAFE_INTEGER;
          const currentRoundOrder = match.roundOrder ?? Number.MAX_SAFE_INTEGER;
          if (candidateRoundOrder < currentRoundOrder) return false;
          if (candidateRoundOrder === currentRoundOrder) {
            const candidateMatchOrder = candidate.matchOrder ?? Number.MAX_SAFE_INTEGER;
            const currentMatchOrder = match.matchOrder ?? Number.MAX_SAFE_INTEGER;
            if (candidateMatchOrder <= currentMatchOrder) return false;
          }

          const t1 = (candidate.team1Name || '').trim();
          const t2 = (candidate.team2Name || '').trim();
          if (t1 === winnerName || t2 === winnerName) return true;

          if (!matchTemplateId) return false;
          const winnerPlaceholder = `winner of ${matchTemplateId.toLowerCase()}`;
          return t1.toLowerCase() === winnerPlaceholder || t2.toLowerCase() === winnerPlaceholder;
        })
        .map((candidate: any) => ({
          match: candidate,
          startsAt: parseMatchStartDateTime(candidate.date, candidate.time)
        }))
        .filter((entry: any) => entry.startsAt)
        .sort((a: any, b: any) => (a.startsAt as Date).getTime() - (b.startsAt as Date).getTime());

      const nextMatch = candidates[0];
      if (!nextMatch) {
        lockMap[match.id] = null;
        continue;
      }

      const nextStatus = (nextMatch.match.status || '').toLowerCase();
      const startedByStatus = nextStatus === 'live' || nextStatus === 'completed';
      const startedBySchedule = (nextMatch.startsAt as Date).getTime() <= now.getTime();
      lockMap[match.id] = startedByStatus || startedBySchedule
        ? 'Score edit is locked because the winner has started the next scheduled match'
        : null;
    }

    return lockMap;
  }, [matches]);

  const getDisplayTeamName = (match: any, side: 'team1' | 'team2') => {
    const name = side === 'team1' ? match.team1Name : match.team2Name;
    return name || 'TBD';
  };

  const stats = {
    total: matches.length,
    pending: matches.filter((m: any) => m.status === 'pending').length
  };

  const selectedSportLabel = selectedSport === 'All'
    ? 'All Sports'
    : (availableSports.find((sport) => sport.id === selectedSport)?.name || selectedSport);

  const resetForm = () => {
    const selectedSportMeta = availableSports.find((sport) => sport.id === selectedSport);
    setNewMatch({
      team1Name: '',
      team1Id: null,
      team2Name: '',
      team2Id: null,
      sportId: selectedSport === 'All' ? '' : selectedSport,
      sport: selectedSportMeta?.name || '',
      gender: selectedGender === 'All' ? 'Boys' : selectedGender,
      date: '',
      time: '',
      venue: '',
      round: 'Round 1',
      status: 'pending',
      referee: '',
      score1: '',
      score2: '',
      winner: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSaveMatch = async () => {
    if (!newMatch.sportId || !newMatch.team1Name || !newMatch.team2Name || !newMatch.date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (newMatch.team1Name === newMatch.team2Name) {
      showToast('A team cannot play against itself', 'error');
      return;
    }

    // Uniqueness check: A team can only appear once in a specific round for a sport/gender
    const isDuplicate = matches.some(m => {
      // Exclude the current match being edited
      if (isEditing && m.id === editingId) return false;

      // Only check within the same round and sport (filters already handle gender usually but let's be safe)
      if (m.round === newMatch.round && m.sportId === newMatch.sportId && m.gender === newMatch.gender) {
        const teamsInNew = [newMatch.team1Name, newMatch.team2Name];
        return teamsInNew.includes(m.team1Name) || teamsInNew.includes(m.team2Name);
      }
      return false;
    });

    if (isDuplicate) {
      showToast(`One of these teams is already scheduled for ${newMatch.round}`, 'error');
      return;
    }

    if (isEditing) {
      const result = await updateMatch(editingId, newMatch);
      if (result.success) {
        showToast('Match updated successfully', 'success');
        await fetchMatches();
        setShowAddForm(false);
        resetForm();
      } else {
        showToast(result.error || 'Error updating match', 'error');
      }
    } else {
      const result = await createMatch(newMatch);
      if (result.success) {
        showToast('Match scheduled successfully', 'success');
        await fetchMatches();
        setShowAddForm(false);
        resetForm();
      } else {
        showToast(result.error || 'Error creating match', 'error');
      }
    }
  };

  const handleEditMatch = (match: any) => {
    const status = (match.status || '').toLowerCase();
    if (status === 'completed') {
      if (isSportsAdminRoute) {
        handleRecordResult(match);
      } else {
        showToast('Completed matches allow only result updates', 'error');
      }
      return;
    }

    setEditingId(match.id);
    setIsEditing(true);
    setNewMatch({
      sportId: match.sportId,
      sport: match.sport,
      gender: match.gender,
      round: match.round,
      team1Id: match.team1Id,
      team1Name: match.team1Name || '',
      team2Id: match.team2Id,
      team2Name: match.team2Name || '',
      date: match.date,
      time: match.time,
      venue: match.venue,
      status: match.status,
      referee: match.referee || '',
      score1: match.score1 || '',
      score2: match.score2 || '',
      winner: match.winner || 'TBD'
    });
    setShowAddForm(true);
  };

  const handleRecordResult = (match: any) => {
    const status = (match.status || '').toLowerCase();
    if (isSportsAdminRoute) {
      const lockReason = resultEditLocksByMatchId[match.id];
      if (lockReason) {
        showToast(lockReason, 'error');
        return;
      }
    }

    const canEditResult = isSportsAdminRoute ? (status === 'live' || status === 'completed') : status === 'live';
    if (!canEditResult) {
      showToast('Result can be updated only when match is live', 'error');
      return;
    }

    if (activeResultMatchId === match.id) {
      setActiveResultMatchId(null);
      return;
    }

    setActiveResultMatchId(match.id);
    const initialScore1 = match.score1 || '';
    const initialScore2 = match.score2 || '';
    setResultForm({
      score1: initialScore1,
      score2: initialScore2,
      winner: isSportsAdminRoute
        ? deriveWinnerFromScores(initialScore1, initialScore2, match)
        : (match.winner || 'TBD')
    });
  };

  const handleSaveMatchResult = async (match: any) => {
    if (isSportsAdminRoute) {
      const lockReason = resultEditLocksByMatchId[match.id];
      if (lockReason) {
        showToast(lockReason, 'error');
        return;
      }
    }

    const score1 = (resultForm.score1 || '').trim();
    const score2 = (resultForm.score2 || '').trim();
    const winnerValue = isSportsAdminRoute
      ? deriveWinnerFromScores(score1, score2, match)
      : resultForm.winner;

    if (isSportsAdminRoute) {
      if (!isValidPositiveInteger(score1) || !isValidPositiveInteger(score2)) {
        showToast('Scores must be positive integers', 'error');
        return;
      }
    } else {
      if (!score1 || !score2 || winnerValue === 'TBD' || winnerValue === 'Draw') {
        showToast('Please enter both scores and select a winning team', 'error');
        return;
      }
    }

    const result = await updateMatch(match.id, {
      score1,
      score2,
      winner: winnerValue,
      status: 'completed'
    });

    if (result.success) {
      showToast('Result updated successfully', 'success');
      setActiveResultMatchId(null);
      await fetchMatches();
    } else {
      showToast(result.error || 'Failed to update result', 'error');
    }
  };

  const handleOpenScheduleModal = (match: any) => {
    setActiveScheduleModalMatch(match);
    setScheduleForm({
      date: match.date || '',
      time: match.time || '',
      venue: match.venue || ''
    });
  };

  const handleSaveScheduleDetails = async () => {
    if (!activeScheduleModalMatch) return;

    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.venue.trim()) {
      showToast('Please fill date, time and venue', 'error');
      return;
    }

    setIsScheduleSaving(true);
    const result = await updateMatch(activeScheduleModalMatch.id, {
      date: scheduleForm.date,
      time: scheduleForm.time,
      venue: scheduleForm.venue.trim(),
      status: activeScheduleModalMatch.status === 'completed' ? 'completed' : 'scheduled',
    });

    if (result.success) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === activeScheduleModalMatch.id
            ? {
              ...m,
              date: scheduleForm.date,
              time: scheduleForm.time,
              venue: scheduleForm.venue.trim(),
              status: m.status === 'completed' ? 'completed' : 'scheduled'
            }
            : m
        )
      );
      setActiveScheduleModalMatch(null);
      showToast('Match scheduled successfully', 'success');
    } else {
      showToast(result.error || 'Failed to schedule match', 'error');
    }

    setIsScheduleSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-[32px]"></div>)}
        </div>
        <div className="h-[600px] bg-gray-50 rounded-[40px]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-page-entrance bg-white min-h-screen">
      {/* Header */}
      <div className="mb-0">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Operations</span>
          <span className="text-[#9CA3AF]">›</span>
          <span>Logistics</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="text-[#1A1A1A] font-medium">Match Schedule</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Tournament Schedule</h1>
            <p className="text-sm text-[#6B7280]">Synchronized schedule tracking across all sports departments.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search Squads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl w-full md:w-64 text-sm focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm h-11">
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-auto min-w-[120px] max-w-[200px] border-0 bg-transparent font-medium text-xs focus:ring-0 h-full [&>span]:truncate">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sports</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name} ({sport.gender === 'MALE' ? 'Boys' : sport.gender === 'FEMALE' ? 'Girls' : 'Mixed'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-[1px] h-4 bg-[#E5E7EB]" />
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-auto min-w-[90px] max-w-[120px] border-0 bg-transparent font-medium text-xs focus:ring-0 h-full [&>span]:truncate">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boys">Boys</SelectItem>
                  <SelectItem value="Girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>


          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <MetricCard title="Total Matches" value={stats.total} icon={Calendar} iconBgColor="#EEF2FF" iconColor="#4F46E5" />
        <MetricCard title="Pending Matches" value={stats.pending} icon={Clock} iconBgColor="#FFFBEB" iconColor="#D97706" />
      </div>

      {/* Daily Operations View */}
      <div className="bg-white rounded-[24px] md:rounded-[40px] border border-[#E5E7EB] p-4 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg md:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
              {selectedGender === 'All' ? 'Combined' : selectedGender} {selectedSport === 'All' ? 'Matches' : selectedSportLabel}
            </h3>
            <p className="text-sm text-[#6B7280] mt-1">
              Tournament Fixtures
            </p>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-gray-100 border-dashed">
              <Calendar className="w-10 h-10 text-[#D1D5DB]" />
            </div>
            <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] opacity-70">No Squads Deployed</h4>
            <p className="text-[13px] text-[#6B7280] font-medium mt-2 max-w-sm mx-auto">
              No matches found for <span className="font-bold text-gray-900">{selectedGender} {selectedSportLabel}</span>.
              Deploy fixtures from the Tournament page or add one manually.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar pb-6">
            {filteredMatches.map((match: any, index: any) => (
              <div
                key={match.id}
                className="group relative bg-white border border-[#E5E7EB] rounded-[24px] md:rounded-[28px] p-4 md:p-5 transition-all duration-300 hover:shadow-md hover:border-[#D1D5DB] animate-card-entrance"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-4 h-4 text-orange-500/20 animate-pulse" />
                </div>
                {(() => {
                  const isScheduleCompleted = Boolean(match.date && match.time && match.venue);
                  const isCompletedMatch = (match.status || '').toLowerCase() === 'completed';
                  const scoreEditLockReason = isSportsAdminRoute ? resultEditLocksByMatchId[match.id] : null;
                  const isResultEditLocked = Boolean(scoreEditLockReason);
                  const currentStatus = (match.status || '').toLowerCase();
                  const isFinalRound = (match.round || '').toLowerCase() === 'finals';
                  const hasFinalPlaceholders =
                    isFinalRound && (isPlaceholderTeam(match.team1Name) || isPlaceholderTeam(match.team2Name));
                  const isPendingFinalPlaceholder = hasFinalPlaceholders && currentStatus === 'pending';
                  const showScheduleDetails = isScheduleCompleted && !isPendingFinalPlaceholder;
                  return (
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Status & Round */}
                      <div className="shrink-0 text-center lg:text-left w-36">
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] mb-4 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${match.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse'}`} />
                          <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-wider">{match.status || 'Pending'}</span>
                        </div>
                        <div className="text-sm font-semibold text-[#1A1A1A] leading-tight pl-1 bg-[#F9FAFB] rounded-lg py-1 w-fit">{match.round}</div>
                      </div>

                      {/* Battle Center */}
                      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 py-5 px-6 bg-[#F9FAFB] rounded-[20px] border border-[#E5E7EB] transition-all duration-300">
                        <div className="flex-1 text-center md:text-right">
                          <div className={`text-xl font-semibold tracking-tight mb-1 transition-all origin-right ${!getDisplayTeamName(match, 'team1') || getDisplayTeamName(match, 'team1') === 'TBD' ? 'text-gray-300 font-medium italic' : (match.winner === match.team1Name ? 'text-emerald-600' : 'text-[#1A1A1A]')}`}>
                            {getDisplayTeamName(match, 'team1')}
                          </div>
                          {match.winner === match.team1Name && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Winner</div>
                          )}
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60">Home Squad</div>
                        </div>

                        <div className="relative shrink-0">
                          <div className="w-12 h-12 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-10 relative">VS</div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <div className={`text-xl font-semibold tracking-tight mb-1 transition-all origin-left ${!getDisplayTeamName(match, 'team2') || getDisplayTeamName(match, 'team2') === 'TBD' ? 'text-gray-300 font-medium italic' : (match.winner === match.team2Name ? 'text-emerald-600' : 'text-[#1A1A1A]')}`}>
                            {getDisplayTeamName(match, 'team2')}
                          </div>
                          {match.winner === match.team2Name && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Winner</div>
                          )}
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60">Away Squad</div>
                        </div>
                      </div>

                      {/* Logistics Grid */}
                      <div className="shrink-0 border-t lg:border-t-0 lg:border-l lg:pl-8 border-[#E5E7EB] pt-4 lg:pt-0 min-w-[320px]">
                        {showScheduleDetails ? (
                          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                Date
                              </div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]">{match.date}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                                <Timer className="w-3 h-3 text-indigo-400" />
                                Time
                              </div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]">{match.time}</div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                Venue
                              </div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]">{match.venue}</div>
                            </div>
                          </div>
                        ) : (
                          !isBranchSportsAdmin && (
                            <div className="flex items-center">
                              <button
                                onClick={() => handleOpenScheduleModal(match)}
                                className="h-10 px-4 rounded-lg border border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                              >
                                Schedule Match
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      {/* Actions */}
                      {!isBranchSportsAdmin && (
                        <div className="flex flex-col gap-2 shrink-0 ml-4">
                          {(!isSportsAdminRoute || !isResultEditLocked) && (
                            <button
                              onClick={() => handleRecordResult(match)}
                              className={`p-2 rounded-xl transition-all shadow-sm border group ${match.status === 'completed'
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100'
                                : 'bg-white hover:bg-gray-50 text-[#6B7280] border-[#E5E7EB]'
                                }`}
                              title="Update Result"
                            >
                              <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          {isScheduleCompleted && !isCompletedMatch && (
                            <button
                              onClick={() => handleEditMatch(match)}
                              className="p-2 hover:bg-blue-100 rounded-xl text-blue-500 transition-colors"
                              title="Edit Match"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeResultMatchId === match.id && (
                  <div className="mt-4 p-5 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Score: {match.team1Name || 'Team 1'}</label>
                        <input
                          value={resultForm.score1}
                          onChange={(e) => {
                            const nextScore1 = isSportsAdminRoute
                              ? sanitizePositiveIntegerInput(e.target.value)
                              : e.target.value;
                            setResultForm(prev => {
                              const nextWinner = isSportsAdminRoute
                                ? deriveWinnerFromScores(nextScore1, prev.score2, match)
                                : prev.winner;
                              return { ...prev, score1: nextScore1, winner: nextWinner };
                            });
                          }}
                          className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          placeholder={isSportsAdminRoute ? 'Enter score (e.g. 2)' : 'e.g. 2, 110/5'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Score: {match.team2Name || 'Team 2'}</label>
                        <input
                          value={resultForm.score2}
                          onChange={(e) => {
                            const nextScore2 = isSportsAdminRoute
                              ? sanitizePositiveIntegerInput(e.target.value)
                              : e.target.value;
                            setResultForm(prev => {
                              const nextWinner = isSportsAdminRoute
                                ? deriveWinnerFromScores(prev.score1, nextScore2, match)
                                : prev.winner;
                              return { ...prev, score2: nextScore2, winner: nextWinner };
                            });
                          }}
                          className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                          placeholder={isSportsAdminRoute ? 'Enter score (e.g. 1)' : 'e.g. 0, 95/10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Match Winner</label>
                      {isSportsAdminRoute ? (
                        <div className="w-full h-11 bg-white rounded-xl border border-[#E5E7EB] font-medium text-sm px-4 flex items-center">
                          {resultForm.winner === 'TBD' ? 'Winner will be auto-declared from score' : resultForm.winner}
                        </div>
                      ) : (
                        <Select
                          value={resultForm.winner}
                          onValueChange={(val) => setResultForm(prev => ({ ...prev, winner: val }))}
                        >
                          <SelectTrigger className="w-full h-11 bg-white rounded-xl border-[#E5E7EB] font-medium text-sm">
                            <SelectValue placeholder="Select Winner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TBD">Still TBD</SelectItem>
                            <SelectItem value={match.team1Name || 'Team 1'}>{match.team1Name || 'Team 1'} Won</SelectItem>
                            <SelectItem value={match.team2Name || 'Team 2'}>{match.team2Name || 'Team 2'} Won</SelectItem>
                            <SelectItem value="Draw">Draw / No Result</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setActiveResultMatchId(null)}
                        className="px-4 h-10 rounded-xl border border-[#E5E7EB] text-sm font-medium hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveMatchResult(match)}
                        className="px-4 h-10 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-black"
                      >
                        Save Result
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Match Modal */}
      {activeScheduleModalMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-8 animate-fade-in text-[#1A1A1A]">
          <div className="bg-white rounded-[30px] w-full max-w-lg p-8 shadow-2xl border border-[#E5E7EB]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Schedule Match</h3>
                <p className="text-[12px] text-[#7A7772] font-semibold mt-1 uppercase tracking-widest opacity-70">Set Date, Time & Venue</p>
              </div>
              <button
                onClick={() => setActiveScheduleModalMatch(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Venue</label>
                <input
                  value={scheduleForm.venue}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="Enter venue"
                  className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActiveScheduleModalMatch(null)}
                className="px-4 h-10 rounded-xl border border-[#E5E7EB] text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScheduleDetails}
                disabled={isScheduleSaving}
                className="px-4 h-10 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isScheduleSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Match Modal */}
      {showAddForm && isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-8 animate-fade-in text-[#1A1A1A]">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 shadow-2xl animate-scale-in border border-[#E5E7EB]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Update Match</h3>
                <p className="text-[13px] text-[#7A7772] font-semibold mt-1 uppercase tracking-widest opacity-60">Modify Match Details</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X className="w-5 h-5 text-[#6B7280]" /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Sport</label>
                <Select
                  value={newMatch.sportId}
                  onValueChange={(val) => {
                    const selectedSportMeta = availableSports.find((sport) => sport.id === val);
                    setNewMatch({
                      ...newMatch,
                      sportId: val,
                      sport: selectedSportMeta?.name || '',
                      gender: selectedSportMeta?.gender === 'MALE' ? 'Boys' : selectedSportMeta?.gender === 'FEMALE' ? 'Girls' : newMatch.gender,
                    });
                  }}
                >
                  <SelectTrigger className="w-full h-12 bg-white rounded-2xl border-[#E5E7EB] font-bold text-[13px] [&>span]:truncate">
                    <SelectValue placeholder="Select Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name} ({sport.gender === 'MALE' ? 'Boys' : sport.gender === 'FEMALE' ? 'Girls' : 'Mixed'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Competition Round</label>
                <Select value={newMatch.round} onValueChange={(val) => setNewMatch({ ...newMatch, round: val })}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-2xl border-[#E5E7EB] font-bold text-[13px]">
                    <SelectValue placeholder="Select Round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round 1">Round 1</SelectItem>
                    <SelectItem value="Semi-Finals">Semi-Finals</SelectItem>
                    <SelectItem value="Finals">Finals</SelectItem>
                    <SelectItem value="Ad-Hoc">Ad-Hoc / Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Date</label>
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                  className="w-full h-12 bg-white border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Team 1</label>
                <Select
                  value={allTeams.find(t => t.id === newMatch.team1Id)?.id || "adhoc"}
                  onValueChange={(val) => {
                    if (val === "adhoc") {
                      setNewMatch({ ...newMatch, team1Id: null });
                    } else {
                      const team = allTeams.find(t => t.id === val);
                      setNewMatch({ ...newMatch, team1Id: team.id, team1Name: team.teamName || team.name });
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 bg-white rounded-2xl border-[#E5E7EB] font-bold text-[13px]">
                    <SelectValue placeholder="Select Team 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhoc">Custom Name...</SelectItem>
                    {allTeams.map(team => {
                      const isAssigned = matches.some(m =>
                        m.round === newMatch.round &&
                        m.sportId === newMatch.sportId &&
                        (isEditing ? m.id !== editingId : true) &&
                        (m.team1Id === team.id || m.team2Id === team.id)
                      );
                      const isSelectedInOtherSlot = newMatch.team2Id === team.id;

                      return (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={isAssigned || isSelectedInOtherSlot}
                        >
                          {team.teamName || team.name} {isAssigned ? '(Scheduled)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {newMatch.team1Id === null && (
                  <input
                    value={newMatch.team1Name}
                    onChange={(e) => setNewMatch({ ...newMatch, team1Name: e.target.value })}
                    className="w-full h-12 bg-white border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all mt-2"
                    placeholder="Enter Custom Team 1 Name"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Team 2</label>
                <Select
                  value={allTeams.find(t => t.id === newMatch.team2Id)?.id || "adhoc"}
                  onValueChange={(val) => {
                    if (val === "adhoc") {
                      setNewMatch({ ...newMatch, team2Id: null });
                    } else {
                      const team = allTeams.find(t => t.id === val);
                      setNewMatch({ ...newMatch, team2Id: team.id, team2Name: team.teamName || team.name });
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 bg-white rounded-2xl border-[#E5E7EB] font-bold text-[13px]">
                    <SelectValue placeholder="Select Team 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhoc">Custom Name...</SelectItem>
                    {allTeams.map(team => {
                      const isAssigned = matches.some(m =>
                        m.round === newMatch.round &&
                        m.sportId === newMatch.sportId &&
                        (isEditing ? m.id !== editingId : true) &&
                        (m.team1Id === team.id || m.team2Id === team.id)
                      );
                      const isSelectedInOtherSlot = newMatch.team1Id === team.id;

                      return (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={isAssigned || isSelectedInOtherSlot}
                        >
                          {team.teamName || team.name} {isAssigned ? '(Scheduled)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {newMatch.team2Id === null && (
                  <input
                    value={newMatch.team2Name}
                    onChange={(e) => setNewMatch({ ...newMatch, team2Name: e.target.value })}
                    className="w-full h-12 bg-white border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all mt-2"
                    placeholder="Enter Custom Team 2 Name"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Time</label>
                <input
                  type="time"
                  value={newMatch.time}
                  onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                  className="w-full h-12 bg-white border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Venue</label>
                <input
                  value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                  className="w-full h-12 bg-white border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all"
                  placeholder="Enter Venue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-1">Match Status</label>
                <Select value={newMatch.status} onValueChange={(val) => setNewMatch({ ...newMatch, status: val })}>
                  <SelectTrigger className="w-full h-12 bg-white rounded-2xl border-[#E5E7EB] font-bold text-[13px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live Now</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowAddForm(false)} className="flex-1 h-14 rounded-2xl border border-[#E5E7EB] text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all text-[#1A1A1A]">Cancel</button>
              <button onClick={handleSaveMatch} className="flex-2 h-14 bg-[#1A1A1A] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
