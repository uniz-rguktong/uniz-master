'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  GripVertical,
  CalendarDays,
  Settings2,
  Trophy as TrophyIcon,
  LayoutGrid,
  Info,
  Maximize2,
  ChevronLeft,
  RotateCcw,
  MapPin,
  Timer,
  CheckCircle,
  Search
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { initializeTournament, updateMatch, getTeams } from '@/actions/fixtureActions';
import { getSportsListForFilter } from '@/actions/sportGetters';
import { useSession } from 'next-auth/react';

interface SportOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
}

export function PollsFixturesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  const isBranchSportsAdmin = session?.user?.role === 'BRANCH_SPORTS_ADMIN';

  // Persistence-aware state
  const [selectedSport, setSelectedSport] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tournamentSport') || 'All';
    }
    return 'All';
  });
  const [availableSports, setAvailableSports] = useState<SportOption[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [initialFixtures, setInitialFixtures] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('MALE');
  const [zoom, setZoom] = useState(1);
  const [lastClearedState, setLastClearedState] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetLocked, setIsResetLocked] = useState(false);
  const bracketContainerRef = useRef(null);
  const [dragOverTarget, setDragOverTarget] = useState<any>(null); // { id: matchId, pos: 'team1'|'team2'|'match' }
  const [assigningSlot, setAssigningSlot] = useState<{ id: string, pos: 'team1' | 'team2' } | null>(null);
  const { showToast } = useToast();
  const isSportsAdminRoute = pathname?.startsWith('/sports/');

  const cloneFixtures = (data: any[]) => JSON.parse(JSON.stringify(data));
  const getResetLockKey = (sportId: string) => `fixturesResetLocked_${sportId || 'All'}`;

  const getDefaultPlaceholder = (matchId: string, position: 'team1' | 'team2') => {
    if (matchId === 'SF-M1' && position === 'team2') return 'Winner of R1-M1';
    if (matchId === 'GF-M1' && position === 'team1') return 'Winner of SF-M1';
    if (matchId === 'GF-M1' && position === 'team2') return 'Winner of SF-M2';
    return null;
  };

  const buildDefaultFixtures = (currentFixtures: any[]) =>
    currentFixtures.map((round) => ({
      ...round,
      matches: round.matches.map((match: any) => ({
        ...match,
        team1: null,
        team1Id: null,
        team1Name: getDefaultPlaceholder(match.matchId, 'team1'),
        team2: null,
        team2Id: null,
        team2Name: getDefaultPlaceholder(match.matchId, 'team2'),
      })),
    }));

  const hasIncompleteFixtures = (currentFixtures: any[]) => {
    const allMatches = currentFixtures.flatMap((round) => round.matches || []);
    return allMatches.length === 0 || allMatches.some((match: any) => {
      const team1 = (match.team1Name || '').trim();
      const team2 = (match.team2Name || '').trim();
      const team1Upper = team1.toUpperCase();
      const team2Upper = team2.toUpperCase();
      const team1IsPlaceholder = !team1 || team1Upper === 'TBD';
      const team2IsPlaceholder = !team2 || team2Upper === 'TBD';
      return team1IsPlaceholder || team2IsPlaceholder;
    });
  };

  const isTbdLabel = (value: string | null | undefined) => (value || '').trim().toUpperCase() === 'TBD';
  const isWinnerPlaceholderLabel = (value: string | null | undefined) => (value || '').trim().toUpperCase().startsWith('WINNER OF ');
  const winnerPlaceholderOptions = [
    { label: 'Winner of R1-M1', icon: '⚡' },
    { label: 'Winner of SF-M1', icon: '🏅' },
    { label: 'Winner of SF-M2', icon: '🏅' },
  ];

  const isPlaceholderAlreadyLinked = (label: string) => {
    const normalizedLabel = label.trim().toUpperCase();
    return fixtures.some((round) =>
      round.matches.some((match: any) => {
        const team1 = (match.team1Name || '').trim().toUpperCase();
        const team2 = (match.team2Name || '').trim().toUpperCase();
        return team1 === normalizedLabel || team2 === normalizedLabel;
      })
    );
  };

  const availableWinnerPlaceholders = winnerPlaceholderOptions.filter(
    (placeholder) => !isPlaceholderAlreadyLinked(placeholder.label)
  );

  const getSlotDisplayName = (match: any, value: string | null | undefined) => {
    if (match?.matchId === 'GF-M1' && !value) return 'TBD';
    return value || '';
  };

  const isFixedWinnerSlot = (match: any, position: 'team1' | 'team2') => {
    return Boolean(getDefaultPlaceholder(match?.matchId || '', position));
  };

  const allowedBranches = ['CSE', 'MECH', 'ECE', 'EEE', 'CIVIL'];

  const loadSportsList = async () => {
    try {
      const sportsRes = await getSportsListForFilter();
      if (sportsRes.success && sportsRes.sports) {
        let sports = (sportsRes.sports as SportOption[]).filter((sport) => sport?.id && sport?.name);

        // Athletics sports use individual event results (not bracket fixtures)
        sports = sports.filter((s) => !s.name.startsWith('Athletics'));

        if (selectedGender !== 'All') {
          sports = sports.filter(s => s.gender === selectedGender);
        }

        setAvailableSports(sports);

        if (sports.length > 0 && selectedSport !== 'All' && !sports.some((sport) => sport.id === selectedSport)) {
          setSelectedSport(sports[0]!.id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Parallelize: fetch teams + tournament matches at the same time
      const hasSport = selectedSport && selectedSport !== 'All';

      const [teamsRes, tourneyRes] = await Promise.all([
        // Only refetch teams if we don't already have them cached in state
        allTeams.length > 0
          ? Promise.resolve(null)
          : getTeams(),
        // Only fetch tournament if a specific sport is selected
        // Pass 'All' as gender when a specific sport ID is selected — the sport ID
        // already identifies the exact sport, so adding a gender filter causes
        // "Sport not found" for newly created sports whose gender doesn't match the filter.
        hasSport
          ? initializeTournament(selectedSport, 'All')
          : Promise.resolve(null),
      ]);

      // Process teams (use cached state if we skipped the fetch)
      let filteredTeams: any[] = allTeams;
      if (teamsRes && teamsRes.success && teamsRes.data) {
        filteredTeams = teamsRes.data.filter((team: any) => {
          const code = (team.teamCode || '').toUpperCase().replace('BR-', '');
          return allowedBranches.includes(code);
        });
        setAllTeams(filteredTeams);
      }

      // Process tournament matches
      if (hasSport && tourneyRes && tourneyRes.success && tourneyRes.data) {
        const dbMatches = tourneyRes.data;
        const roundsMap = dbMatches.reduce((acc: any, m: any) => {
          const roundKey = m.round;
          if (!acc[roundKey]) {
            acc[roundKey] = {
              level: m.round,
              roundOrder: m.roundOrder || 0,
              matches: []
            };
          }
          const team1 = m.team1Id ? filteredTeams.find(t => t.id === m.team1Id) : null;
          const team2 = m.team2Id ? filteredTeams.find(t => t.id === m.team2Id) : null;
          acc[roundKey].matches.push({
            ...m,
            team1,
            team2
          });
          return acc;
        }, {});

        const mappedFixtures = Object.values(roundsMap)
          .sort((a: any, b: any) => (a.roundOrder || 0) - (b.roundOrder || 0))
          .map((round: any) => ({
            ...round,
            matches: round.matches.sort((a: any, b: any) => (a.matchOrder || 0) - (b.matchOrder || 0))
          }));

        setFixtures(mappedFixtures);
        if (showLoading) {
          setInitialFixtures(cloneFixtures(mappedFixtures));
          setHasUnsavedChanges(false);
          setLastClearedState(null);
        }
      } else if (hasSport && tourneyRes && !tourneyRes.success) {
        showToast('Failed to initialize tournament', 'error');
      } else if (!hasSport) {
        setFixtures([]);
      }
    } catch (error) {
      console.error(error);
      showToast('Data synchronization failed', 'error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredBranches = allTeams.filter(team => {
    const isAssigned = fixtures.some(round =>
      round.matches.some((match: any) =>
        (match.team1?.id === team.id) || (match.team2?.id === team.id)
      )
    );
    if (isAssigned) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (team.teamName || team.name || '').toLowerCase().includes(q) ||
      (team.teamCode || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setIsLoading(false);
      return;
    }

    // Parallelize sports list + fixture data loading
    Promise.all([
      loadSportsList(),
      loadData(),
    ]);

    if (selectedSport && selectedSport !== 'All') {
      localStorage.setItem('tournamentSport', selectedSport);
    } else {
      setFixtures([]);
    }

    const lockKey = getResetLockKey(selectedSport);
    setIsResetLocked(localStorage.getItem(lockKey) === 'true');
  }, [selectedSport, session, selectedGender, status]);

  // Sync to LocalStorage (Secondary reference for other pages)
  useEffect(() => {
    if (fixtures.length > 0) {
      const shouldSyncFixtures = !isSportsAdminRoute || !hasUnsavedChanges;
      if (shouldSyncFixtures) {
        localStorage.setItem('hasActiveTournament', 'true');
        localStorage.setItem('tournamentFixtures', JSON.stringify(fixtures));
        localStorage.setItem('tournamentSport', selectedSport);
      }
    }
  }, [fixtures, selectedSport, hasUnsavedChanges, isSportsAdminRoute]);

  const handleDragStart = (e: any, item: any, type = 'team') => {
    e.dataTransfer.setData('dragSource', JSON.stringify({ item, type }));
    // Add visual ghosting effect
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e: any) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: any, id: string, pos: string) => {
    const targetRound = fixtures.find(r => r.matches.some((m: any) => m.id === id));
    const targetMatch = targetRound?.matches.find((m: any) => m.id === id);
    if (targetMatch && (pos === 'team1' || pos === 'team2') && isFixedWinnerSlot(targetMatch, pos as 'team1' | 'team2')) {
      return;
    }

    e.preventDefault();
    if (dragOverTarget?.id !== id || dragOverTarget?.pos !== pos) {
      setDragOverTarget({ id, pos });
    }
  };

  const handleDragLeave = (e: any) => {
    setDragOverTarget(null);
  };

  const performAssignment = async (matchId: string, position: 'team1' | 'team2', item: any, type: string) => {
    if (isBranchSportsAdmin) return;
    if (isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) {
      showToast('Saved fixtures cannot be modified', 'error');
      return;
    }

    const targetRound = fixtures.find(r => r.matches.some((m: any) => m.id === matchId));
    const targetMatch = targetRound?.matches.find((m: any) => m.id === matchId);
    if (targetMatch && isFixedWinnerSlot(targetMatch, position)) {
      showToast('Winner link positions are fixed and cannot be replaced', 'error');
      return;
    }

    if (type === 'team') {
      const team = allTeams.find(t => t.id === item.id);
      if (!team) return;

      const isAlreadyInRound = targetRound?.matches.some((match: any) =>
        (match.team1?.id === team.id && match.id !== matchId) ||
        (match.team2?.id === team.id && match.id !== matchId)
      );

      if (isAlreadyInRound) {
        showToast(`${team.teamName || team.name} is already scheduled for this round!`, 'error');
        return;
      }

      const teamName = team.teamName || team.name || item.teamName;

      if (isSportsAdminRoute) {
        setFixtures((prevFixtures) => prevFixtures.map((round) => ({
          ...round,
          matches: round.matches.map((match: any) => {
            if (match.id === matchId) {
              return {
                ...match,
                [position]: team,
                [`${position}Id`]: team.id,
                [`${position}Name`]: teamName,
              };
            }
            return match;
          })
        })));
        setHasUnsavedChanges(true);
        showToast('Squad deployed successfully', 'success');
      } else {
        const result = await updateMatch(matchId, {
          [position + 'Id']: team.id,
          [position + 'Name']: teamName
        });
        if (result.success) {
          showToast('Squad deployed successfully', 'success');
          loadData(false);
        } else {
          showToast('Failed to assign team', 'error');
        }
      }
    } else if (type === 'placeholder') {
      const label = item.label;
      if (isSportsAdminRoute) {
        setFixtures(fixtures.map(round => ({
          ...round,
          matches: round.matches.map((match: any) => {
            if (match.id === matchId) {
              return { ...match, [position]: null, [`${position}Id`]: null, [`${position}Name`]: label };
            }
            return match;
          })
        })));
        setHasUnsavedChanges(true);
        showToast(`Linked to ${label}`, 'success');
      } else {
        const res = await updateMatch(matchId, {
          [`${position}Id`]: null,
          [`${position}Name`]: label
        });
        if (res.success) {
          showToast(`Linked to ${label}`, 'success');
          loadData(false);
        }
      }
    }
    setAssigningSlot(null);
  };

  const handleDrop = async (e: any, matchId: string, position?: string) => {
    if (isBranchSportsAdmin) return;
    e.preventDefault();
    setDragOverTarget(null);

    if (isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) {
      showToast('Saved fixtures cannot be modified', 'error');
      return;
    }

    const rawData = e.dataTransfer.getData('dragSource');
    if (!rawData) return;
    const { item, type } = JSON.parse(rawData);

    if (type === 'match') {
      // Swipe logic: Swap matchOrder within the same round
      const sourceMatch = item;
      const targetMatch = fixtures.flatMap(r => r.matches).find((m: any) => m.id === matchId);

      if (sourceMatch.id === targetMatch.id) return;
      if (sourceMatch.round !== targetMatch.round) {
        showToast('Cannot move matches between different rounds', 'error');
        return;
      }

      if (isSportsAdminRoute) {
        const tempOrder = sourceMatch.matchOrder;
        setFixtures((prevFixtures) => prevFixtures.map((round) => ({
          ...round,
          matches: round.matches
            .map((match: any) => {
              if (match.id === sourceMatch.id) {
                return { ...match, matchOrder: targetMatch.matchOrder };
              }
              if (match.id === targetMatch.id) {
                return { ...match, matchOrder: tempOrder };
              }
              return match;
            })
            .sort((a: any, b: any) => (a.matchOrder || 0) - (b.matchOrder || 0))
        })));
        setHasUnsavedChanges(true);
        showToast('Fixture positions reordered', 'success');
        return;
      }

      const tempOrder = sourceMatch.matchOrder;
      await updateMatch(sourceMatch.id, { matchOrder: targetMatch.matchOrder });
      await updateMatch(targetMatch.id, { matchOrder: tempOrder });

      showToast('Fixture positions reordered', 'success');
      loadData(false);
    } else if (position) {
      performAssignment(matchId, position as 'team1' | 'team2', item, type);
    }
  };

  const clearTeam = async (matchId: any, position: any) => {
    if (isBranchSportsAdmin) return;
    if (isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) {
      showToast('Saved fixtures cannot be modified', 'error');
      return;
    }

    // Find the current match matchId to determine the correct placeholder
    const targetRound = fixtures.find(r => r.matches.some((m: any) => m.id === matchId));
    const targetMatch = targetRound?.matches.find((m: any) => m.id === matchId);

    if (!targetMatch) return;

    // Save for Undo
    setLastClearedState({
      matchId,
      position,
      teamId: targetMatch[`${position}Id`],
      teamName: targetMatch[`${position}Name`]
    });

    const mid = targetMatch.matchId;
    let restoredPlaceholder = null;
    if (mid === 'SF-M1' && position === 'team2') restoredPlaceholder = 'Winner of R1-M1';
    if (mid === 'GF-M1' && position === 'team1') restoredPlaceholder = 'Winner of SF-M1';
    if (mid === 'GF-M1' && position === 'team2') restoredPlaceholder = 'Winner of SF-M2';

    // Optimistic UI update
    setFixtures(fixtures.map(round => ({
      ...round,
      matches: round.matches.map((match: any) => {
        if (match.id === matchId) {
          return { ...match, [position]: null, [`${position}Name`]: restoredPlaceholder };
        }
        return match;
      })
    })));

    if (isSportsAdminRoute) {
      setHasUnsavedChanges(true);
      showToast('Deployment cleared', 'success');
      return;
    }

    // DB update
    const updatePayload = {
      [`${position}Id`]: null,
      [`${position}Name`]: restoredPlaceholder
    };

    const res = await updateMatch(matchId, updatePayload);
    if (res.success) {
      showToast('Deployment cleared', 'success');
      loadData(false); // Ensure team returns to sidebar immediately
    } else {
      showToast('Failed to clear node', 'error');
      loadData(false);
    }
  };

  const handleUndo = async () => {
    if (isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) {
      showToast('Saved fixtures cannot be modified', 'error');
      return;
    }

    if (!lastClearedState) return;
    const { matchId, position, teamId, teamName } = lastClearedState;

    // Optimistic UI update
    setFixtures(fixtures.map(round => ({
      ...round,
      matches: round.matches.map((match: any) => {
        if (match.id === matchId) {
          const team = allTeams.find(t => t.id === teamId);
          return { ...match, [position]: team, [`${position}Name`]: teamName };
        }
        return match;
      })
    })));

    if (isSportsAdminRoute) {
      showToast('Action Undone', 'success');
      setLastClearedState(null);
      setHasUnsavedChanges(true);
      return;
    }

    const updatePayload = { [`${position}Id`]: teamId, [`${position}Name`]: teamName };
    const res = await updateMatch(matchId, updatePayload);

    if (res.success) {
      showToast('Action Undone', 'success');
      setLastClearedState(null);
      loadData(false);
    } else {
      showToast('Undo failed', 'error');
      loadData(false);
    }
  };

  const handleResetFixtures = async () => {
    const allMatches = fixtures.flatMap(r => r.matches || []);
    const completedMatch = allMatches.find(m => m.status === 'completed');
    const liveMatch = allMatches.find(m => m.status === 'live');
    const scheduledMatch = allMatches.find(m => m.status === 'scheduled');

    if (completedMatch) {
      showToast('Reset not possible: Tournament has already been completed!', 'error');
      return;
    }
    if (liveMatch) {
      showToast('Reset not possible: Matches are currently live!', 'error');
      return;
    }
    if (scheduledMatch) {
      showToast('Reset not possible: Matches have already been scheduled!', 'error');
      return;
    }

    // If no matches are scheduled/live/completed, allow reset even if previously locked
    if (isBranchSportsAdmin) return;
    if (isSportsAdminRoute) {
      setFixtures(buildDefaultFixtures(cloneFixtures(initialFixtures)));
      setHasUnsavedChanges(true);
      setLastClearedState(null);

      // Unlock on reset
      const lockKey = getResetLockKey(selectedSport);
      localStorage.removeItem(lockKey);
      setIsResetLocked(false);

      showToast('Fixtures reset successfully', 'success');
      return;
    }

    await loadData();
    setLastClearedState(null);
    showToast('Fixtures reset successfully', 'success');
  };

  const handleSaveFixtures = async () => {
    if (isBranchSportsAdmin) return;
    if (!isSportsAdminRoute) return;

    if (isResetLocked && !hasUnsavedChanges) {
      showToast('Saved fixtures cannot be modified', 'error');
      return;
    }

    if (hasIncompleteFixtures(fixtures)) {
      showToast('Fixtures are not completed', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const pendingUpdates = fixtures.flatMap((round) =>
        round.matches.map((match: any) =>
          updateMatch(match.id, {
            team1Id: match.team1Id || null,
            team1Name: match.team1Name || null,
            team2Id: match.team2Id || null,
            team2Name: match.team2Name || null,
            matchOrder: match.matchOrder,
            date: '',
            time: '',
            venue: '',
          })
        )
      );

      const results = await Promise.all(pendingUpdates);
      const allSuccessful = results.every((result: any) => result?.success);

      if (!allSuccessful) {
        showToast('Failed to save some fixture changes', 'error');
        setIsSaving(false);
        return;
      }

      setInitialFixtures(cloneFixtures(fixtures));
      setHasUnsavedChanges(false);
      const lockKey = getResetLockKey(selectedSport);
      localStorage.setItem(lockKey, 'true');
      setIsResetLocked(true);
      showToast('Fixtures saved successfully', 'success');
      router.refresh();
      router.push('/sports/match-schedule');
    } catch (error) {
      showToast('Failed to save fixture changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-page-entrance">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <Skeleton width={180} height={12} className="bg-gray-200" />
            <Skeleton width={320} height={40} className="bg-gray-200" />
          </div>
        </div>
        <div className="h-[500px] bg-gray-50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const isSaveDisabled = isSaving || hasIncompleteFixtures(fixtures) || (isSportsAdminRoute && isResetLocked && !hasUnsavedChanges);
  const isResetDisabled = false; // Enable to allow status-based toasts in handleResetFixtures

  return (
    <div className="p-3 md:p-8 animate-page-entrance flex flex-col min-h-screen bg-white">
      {/* Precision Header for 5-Branch Tournaments */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-2 md:mb-3">
            <span>Dashboard</span>
            <span className="text-[#9CA3AF]">›</span>
            <span>Sports Management</span>
            <span className="text-[#9CA3AF]">›</span>
            <span className="text-[#1A1A1A] font-medium">Polls & Fixtures</span>
          </div>
          <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1 md:mb-2">Polls & Fixtures</h1>
          <p className="text-sm text-[#6B7280] max-w-xl">Organize the 5-branch competition grid and manage match fixtures.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 md:gap-4">
          <div className="flex flex-col gap-1.5 w-full md:flex-none md:min-w-[140px]">
            <span className="text-xs md:text-xs font-medium text-[#6B7280] pl-1">Search Branches</span>
            <div className="relative group">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#9CA3AF] group-focus-within:text-[#1A1A1A] transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full md:w-[200px] h-10 md:h-12 pl-9 md:pl-11 pr-3 md:pr-4 bg-white rounded-xl border-[#E5E7EB] text-xs md:text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#1A1A1A]/5 outline-none transition-all placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          <div className="flex flex-row items-end gap-3 w-full md:w-auto">
            <div className="flex-1 flex flex-col gap-1.5 md:flex-none">
              <span className="text-xs md:text-xs font-medium text-[#6B7280] pl-1">Gender</span>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-full md:w-[120px] h-10 md:h-12 bg-white rounded-xl border-[#E5E7EB] text-xs md:text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#1A1A1A]/5">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Boys</SelectItem>
                  <SelectItem value="FEMALE">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-[2] flex flex-col gap-1.5 md:flex-none">
              <span className="text-xs md:text-xs font-medium text-[#6B7280] pl-1">Sport</span>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-full md:w-[220px] h-10 md:h-12 bg-white rounded-xl border-[#E5E7EB] text-xs md:text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#1A1A1A]/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Select Sport</SelectItem>
                  {availableSports.map((sport: any) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isSportsAdminRoute && !isBranchSportsAdmin && (
            <div className="flex items-end gap-2 w-full md:w-auto">
              <button
                onClick={handleResetFixtures}
                disabled={isResetDisabled}
                className="flex-1 md:w-[140px] h-10 md:h-12 bg-white border border-[#E5E7EB] rounded-xl text-xs md:text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleSaveFixtures}
                disabled={isSaveDisabled}
                className="flex-[2] md:w-[140px] h-10 md:h-12 bg-[#1A1A1A] text-white rounded-xl text-xs md:text-sm font-medium hover:bg-[#2D2D2D] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 overflow-hidden min-h-0">
        {/* Left: Branch Roster & Winner Placeholders */}
        <div className="w-full md:w-[320px] flex flex-row md:flex-col shrink-0 gap-3 md:gap-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="bg-white rounded-2xl md:rounded-[32px] border border-[#E5E7EB] p-3 md:p-6 shadow-sm flex-[2] min-w-[180px] md:min-w-0 overflow-hidden flex flex-col">
            <div className="mb-2 md:mb-6 lowercase">
              <h3 className="text-sm md:text-xl font-bold tracking-tight mb-1 capitalize">RGUKT Branches</h3>
              <p className="text-[8px] md:text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                {isBranchSportsAdmin ? 'Competition Roster' : 'Deploy Squads'}
              </p>
            </div>

            <div className="flex-1 space-y-2 md:space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {filteredBranches.map((team: any, idx: any) => (
                <div
                  key={team.id}
                  draggable={!isBranchSportsAdmin}
                  onDragStart={(e) => !isBranchSportsAdmin && handleDragStart(e, team, 'team')}
                  className={`group flex items-center gap-2 md:gap-3 p-2 md:p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl md:rounded-2xl transition-all animate-card-entrance ${isBranchSportsAdmin
                    ? 'opacity-80'
                    : 'hover:bg-white hover:border-[#1A1A1A] cursor-grab active:cursor-grabbing hover:shadow-xl'
                    }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 bg-white border border-[#E5E7EB] rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl shadow-xs group-hover:scale-110 transition-transform">
                    {team.logo || '🎓'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] md:text-[13px] font-bold text-[#1A1A1A] truncate">{team.teamName || team.name}</div>
                    <div className="text-[7px] md:text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{team.teamCode?.replace('BR-', '') || 'Branch'} Div.</div>
                  </div>
                  {!isBranchSportsAdmin && <GripVertical className="w-3 h-3 md:w-4 md:h-4 text-[#E5E7EB] group-hover:text-[#1A1A1A]" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Branch Bracket Layout */}
        <div className="flex-1 bg-white rounded-2xl md:rounded-[40px] border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
          <div className="p-3 md:p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white rounded-lg md:rounded-xl border border-[#E5E7EB] shadow-xs">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">Official Grid</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
                className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold hover:bg-gray-50 transition-all active:scale-95"
              >-</button>
              <span className="text-[8px] md:text-[10px] font-bold text-[#1A1A1A] w-8 md:w-12 text-center bg-white/50 py-1 md:py-2 rounded-lg">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}
                className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold hover:bg-gray-50 transition-all active:scale-95"
              >+</button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto p-3 md:p-12 scrollbar-thin scrollbar-thumb-gray-200 bg-[#FDFDFD]"
            ref={bracketContainerRef}
          >
            <div
              className="flex gap-6 md:gap-16 items-center min-w-max h-full justify-start pl-1 md:pl-8 transition-transform duration-300"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'left center' }}
            >
              {fixtures.map((round: any, rIndex: any) => (
                <div key={rIndex} className="flex flex-col gap-4 md:gap-8 h-full justify-center">
                  <div className="text-center">
                    <div className="inline-block px-3 md:px-5 py-1 md:py-2 bg-[#1A1A1A] text-white rounded-lg md:rounded-xl text-[7px] md:text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl mb-2 md:mb-4">
                      {round.level}
                    </div>
                  </div>

                  <div className="flex flex-col gap-12 md:gap-24 justify-center">
                    {round.matches.map((match: any, mIndex: any) => (
                      <div key={match.id || `${round.level}-${match.matchId}-${mIndex}`} className="relative">
                        {/* Specialized Connectors */}
                        {rIndex < fixtures.length - 1 && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 w-8 md:w-16 h-full pointer-events-none">
                            <svg className="w-full h-full overflow-visible">
                              <path
                                d={(() => {
                                  const isRound1 = round.level === 'Round 1';
                                  const isSF = round.level === 'Semi-Finals';
                                  const width = innerWidth < 768 ? 32 : 64;
                                  const halfWidth = width / 2;

                                  if (isRound1) {
                                    // Round 1 (Centered) -> SF1 (Top)
                                    return `M 0,0 L ${halfWidth},0 L ${halfWidth},-140 L ${width},-140`;
                                  }

                                  if (isSF) {
                                    // SF1 (Top) -> Final (Center) : offset 140 down
                                    // SF2 (Bottom) -> Final (Center) : offset 140 up
                                    const offset = mIndex % 2 === 0 ? 140 : -140;
                                    return `M 0,0 L ${halfWidth},0 L ${halfWidth},${offset} L ${width},${offset}`;
                                  }

                                  // Default straight line
                                  return `M 0,0 L ${width},0`;
                                })()}
                                fill="none"
                                stroke={match.status === 'completed' ? '#10B981' : '#E5E7EB'}
                                strokeWidth="2"
                                strokeDasharray={match.status === 'completed' ? '0' : '4 3'}
                                className="transition-all duration-500"
                              />
                            </svg>
                          </div>
                        )}

                        <div
                          className={`w-40 md:w-64 flex flex-col gap-0.5 md:gap-2 group/match ${isBranchSportsAdmin ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                          draggable={!isBranchSportsAdmin}
                          onDragStart={(e) => !isBranchSportsAdmin && handleDragStart(e, match, 'match')}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => {
                            // If it's a match being dropped, handle swap
                            const rawData = e.dataTransfer.getData('dragSource');
                            if (rawData) {
                              const { type } = JSON.parse(rawData);
                              if (type === 'match') handleDrop(e, match.id);
                            }
                          }}
                          onDragOver={(e) => handleDragOver(e, match.id, 'match')}
                        >
                          <div className="flex items-center justify-between px-2">
                            <div className="text-[6px] md:text-[8px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] md:tracking-[0.15em]">
                              {match.time} • {match.date}
                            </div>
                            {match.note && (
                              <span className="text-[5px] md:text-[7px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1 md:px-2 py-0.5 rounded-md border border-indigo-100/50 tracking-tighter">
                                {match.note}
                              </span>
                            )}
                          </div>

                          {/* Match Card */}
                          <div className={`relative bg-white border-2 rounded-[20px] md:rounded-[28px] overflow-hidden transition-all duration-500 shadow-sm ${match.status === 'completed'
                            ? 'border-emerald-500/50 shadow-emerald-500/5'
                            : 'border-[#E5E7EB] hover:border-[#1A1A1A] hover:shadow-2xl'
                            }`}>

                            {/* Blur Overlay for Completed Matches */}
                            {match.status === 'completed' && (
                              <div className="absolute inset-0 bg-emerald-50/40 backdrop-blur-[2px] z-0 pointer-events-none" />
                            )}

                            <div className="relative z-10">
                              {/* Slot 1 */}
                              <div
                                onDragOver={(e) => handleDragOver(e, match.id, 'team1')}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, match.id, 'team1')}
                                className={`flex items-center justify-between py-2 md:py-3.5 px-2 md:px-4 border-b border-[#F3F4F6] transition-all relative group/slot 
                                    ${match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name))) ? 'bg-white' : 'bg-gray-50/50'} 
                                    ${match.status === 'completed' ? 'bg-transparent' : ''}
                                    ${dragOverTarget?.id === match.id && dragOverTarget?.pos === 'team1' ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/50' : ''}
                                  `}
                              >
                                <div
                                  onClick={() => {
                                    const isAssigned = match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)));
                                    if (!isAssigned && !isBranchSportsAdmin && !isFixedWinnerSlot(match, 'team1')) {
                                      setAssigningSlot({ id: match.id, pos: 'team1' });
                                    }
                                  }}
                                  className="flex items-center gap-1.5 md:gap-3 cursor-pointer group/assign"
                                >
                                  <div
                                    draggable={!!(match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team1Name))}
                                    onDragStart={(e) => (match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team1Name)) && handleDragStart(e, { id: match.team1Id, teamName: match.team1Name }, 'team')}
                                    onDragEnd={handleDragEnd}
                                    className={`w-5 h-5 md:w-8 md:h-8 rounded-md md:rounded-xl flex items-center justify-center shrink-0 border border-[#E5E7EB] shadow-xs text-[10px] md:text-sm ${(match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team1Name)) ? 'bg-white cursor-pointer' : 'bg-white/80'}`}
                                  >
                                    {match.team1 ? (match.team1.logo || '🎓') : (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)) ? '🏆' : <Plus className={`w-2 h-2 transition-colors ${dragOverTarget?.id === match.id && dragOverTarget?.pos === 'team1' ? 'text-indigo-600' : 'text-[#9CA3AF] group-hover/assign:text-[#1A1A1A]'}`} />)}
                                  </div>
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <span className={`text-[8px] md:text-[12px] font-bold tracking-tight truncate max-w-[60px] md:max-w-none transition-colors ${match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name))) ? 'text-[#1A1A1A]' : 'text-[#9CA3AF] uppercase text-[6px] md:text-[9px] font-bold tracking-widest opacity-60 group-hover/assign:text-[#1A1A1A] group-hover/assign:opacity-100'}`}>
                                      {match.team1?.teamName || match.team1?.name || (!isTbdLabel(getSlotDisplayName(match, match.team1Name)) ? getSlotDisplayName(match, match.team1Name) : '') || 'Assign'}
                                    </span>
                                    {match.status === 'completed' && match.winner === (match.team1?.teamName || match.team1?.name || match.team1Name) && (
                                      <div className="flex items-center gap-0.5 md:gap-1 bg-emerald-500 text-white text-[5px] md:text-[7px] font-bold px-1 md:px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-bounce">
                                        <TrophyIcon className="w-1 md:w-1.5 h-1 md:h-1.5" />
                                        Win
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(match.team1 || (getSlotDisplayName(match, match.team1Name) && !isTbdLabel(getSlotDisplayName(match, match.team1Name)))) &&
                                  !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team1Name)) &&
                                  match.status !== 'completed' &&
                                  !isBranchSportsAdmin &&
                                  !(isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) && (
                                    <button
                                      onClick={() => clearTeam(match.id, 'team1')}
                                      className="hidden group-hover/slot:flex w-4 h-4 md:w-6 md:h-6 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="w-2 md:w-3 md:h-3" />
                                    </button>
                                  )}
                              </div>

                              {/* Slot 2 */}
                              <div
                                onDragOver={(e) => handleDragOver(e, match.id, 'team2')}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, match.id, 'team2')}
                                className={`flex items-center justify-between py-2 md:py-3.5 px-2 md:px-4 transition-all relative group/slot 
                                    ${match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name))) ? 'bg-white' : 'bg-gray-50/50'} 
                                    ${match.status === 'completed' ? 'bg-transparent' : ''}
                                    ${dragOverTarget?.id === match.id && dragOverTarget?.pos === 'team2' ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/50' : ''}
                                  `}
                              >
                                <div
                                  onClick={() => {
                                    const isAssigned = match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)));
                                    if (!isAssigned && !isBranchSportsAdmin && !isFixedWinnerSlot(match, 'team2')) {
                                      setAssigningSlot({ id: match.id, pos: 'team2' });
                                    }
                                  }}
                                  className="flex items-center gap-1.5 md:gap-3 cursor-pointer group/assign"
                                >
                                  <div
                                    draggable={!!(match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team2Name))}
                                    onDragStart={(e) => (match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team2Name)) && handleDragStart(e, { id: match.team2Id, teamName: match.team2Name }, 'team')}
                                    onDragEnd={handleDragEnd}
                                    className={`w-5 h-5 md:w-8 md:h-8 rounded-md md:rounded-xl flex items-center justify-center shrink-0 border border-[#E5E7EB] shadow-xs text-[10px] md:text-sm ${(match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)))) && !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team2Name)) ? 'bg-white cursor-pointer' : 'bg-white/80'}`}
                                  >
                                    {match.team2 ? (match.team2.logo || '🎓') : (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)) ? '🏆' : <Plus className={`w-2 h-2 transition-colors ${dragOverTarget?.id === match.id && dragOverTarget?.pos === 'team2' ? 'text-indigo-600' : 'text-[#9CA3AF] group-hover/assign:text-[#1A1A1A]'}`} />)}
                                  </div>
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <span className={`text-[8px] md:text-[12px] font-bold tracking-tight truncate max-w-[60px] md:max-w-none transition-colors ${match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name))) ? 'text-[#1A1A1A]' : 'text-[#9CA3AF] uppercase text-[6px] md:text-[9px] font-bold tracking-widest opacity-60 group-hover/assign:text-[#1A1A1A] group-hover/assign:opacity-100'}`}>
                                      {match.team2?.teamName || match.team2?.name || (!isTbdLabel(getSlotDisplayName(match, match.team2Name)) ? getSlotDisplayName(match, match.team2Name) : '') || 'Assign'}
                                    </span>
                                    {match.status === 'completed' && match.winner === (match.team2?.teamName || match.team2?.name || match.team2Name) && (
                                      <div className="flex items-center gap-0.5 md:gap-1 bg-emerald-500 text-white text-[5px] md:text-[7px] font-bold px-1 md:px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-bounce">
                                        <TrophyIcon className="w-1 md:w-1.5 h-1 md:h-1.5" />
                                        Win
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(match.team2 || (getSlotDisplayName(match, match.team2Name) && !isTbdLabel(getSlotDisplayName(match, match.team2Name)))) &&
                                  !isWinnerPlaceholderLabel(getSlotDisplayName(match, match.team2Name)) &&
                                  match.status !== 'completed' &&
                                  !isBranchSportsAdmin &&
                                  !(isSportsAdminRoute && isResetLocked && !hasUnsavedChanges) && (
                                    <button
                                      onClick={() => clearTeam(match.id, 'team2')}
                                      className="hidden group-hover/slot:flex w-4 h-4 md:w-6 md:h-6 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="w-2 md:w-3 md:h-3" />
                                    </button>
                                  )}
                              </div>
                            </div>
                            {match.status === 'completed' && (
                              <div className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                                <CheckCircle className="w-6 h-6 md:w-12 md:h-12 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Champion Finale Centerpiece */}
              <div className="flex flex-col items-center justify-center ml-4 md:ml-12">
                {(() => {
                  const finalMatch = fixtures.flatMap(r => r.matches).find((m: any) => m.matchId === 'GF-M1');
                  const isCompleted = finalMatch?.status === 'completed';
                  const winnerName = finalMatch?.winner;
                  const winnerTeam = winnerName === finalMatch?.team1Name ? finalMatch?.team1 :
                    (winnerName === finalMatch?.team2Name ? finalMatch?.team2 : null);

                  return (
                    <div className="w-40 h-40 md:w-64 md:h-64 relative group">
                      {/* Dynamic Background Glow */}
                      <div className={`absolute inset-0 blur-[40px] md:blur-[80px] rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500/20 scale-125' : 'bg-[#1A1A1A]/5'}`} />

                      <div className={`relative h-full flex flex-col items-center justify-center bg-white border-[2px] md:border-[4px] rounded-2xl md:rounded-[48px] shadow-2xl p-3 md:p-8 text-center ring-2 md:ring-8 transition-all duration-700 ${isCompleted ? 'border-emerald-500 ring-emerald-500/10' : 'border-[#1A1A1A] ring-[#1A1A1A]/5'}`}>
                        {isCompleted ? (
                          <>
                            <div className="w-10 h-10 md:w-20 md:h-20 bg-emerald-500 rounded-xl md:rounded-[24px] flex items-center justify-center shadow-2xl mb-2 md:mb-5 transform scale-110 rotate-0 animate-bounce">
                              <TrophyIcon className="w-5 h-5 md:w-10 md:h-10 text-white" />
                            </div>
                            <div className="space-y-0.5 md:space-y-1">
                              <h3 className="text-[7px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] md:tracking-[0.4em]">Branch King</h3>
                              <div className="text-sm md:text-xl font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1 md:mb-2">
                                {winnerName}
                              </div>
                              <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-0.5 md:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[7px] md:text-[9px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm">
                                {winnerTeam?.logo || '🏆'} Champion
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-[#1A1A1A] rounded-xl md:rounded-[20px] flex items-center justify-center shadow-2xl mb-2 md:mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                              <TrophyIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                            </div>
                            <h3 className="text-[10px] md:text-[14px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] mb-1">Branch King</h3>
                            <div className="px-2 md:px-4 py-0.5 md:py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[7px] md:text-[9px] font-bold uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                              Finale Ready
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Assignment Selection UI */}
          {assigningSlot && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/20 backdrop-blur-sm p-4" onClick={() => setAssigningSlot(null)}>
              <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Assign Entity</h3>
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Select to deploy to bracket</p>
                  </div>
                  <button
                    onClick={() => setAssigningSlot(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
                  >
                    <Plus className="w-5 h-5 rotate-45 text-[#9CA3AF]" />
                  </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                  {/* Branches Section */}
                  {filteredBranches.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest px-2">RGUKT Branches</div>
                      <div className="grid grid-cols-1 gap-2">
                        {filteredBranches.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => performAssignment(assigningSlot.id, assigningSlot.pos, team, 'team')}
                            className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl hover:bg-white hover:border-[#1A1A1A] hover:shadow-xl transition-all text-left w-full"
                          >
                            <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center text-xl shadow-xs">
                              {team.logo || '🎓'}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#1A1A1A]">{team.teamName || team.name}</div>
                              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{team.teamCode?.replace('BR-', '') || 'Branch'} Div.</div>
                            </div>
                            <ChevronRight className="w-4 h-4 ml-auto text-[#E5E7EB]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No entities available */}
                  {filteredBranches.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Info className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">All entities have been deployed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
