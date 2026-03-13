'use client';
import { useState, useEffect, useRef } from 'react';
import { Trophy, Award, Medal, Search, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getCompletedMatches } from '@/actions/fixtureActions';
import { getSportsListForFilter } from '@/actions/sportGetters';
import {
  getSportWinnerAnnouncement,
  createSportWinnerAnnouncement,
} from '@/actions/sportWinnerActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from 'next-auth/react';

interface SportOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
}

const ALLOWED_BRANCHES = ['CSE', 'MECH', 'ECE', 'EEE', 'CIVIL'];

/** Extracts the sub-type from a sport name like "Athletics - 100M" → "100M" */
function getAthleticsSubType(name: string): string {
  const parts = name.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
}

/** Single athletics event card with top-3 winner form */
function AthleticsWinnerCard({
  sport,
  isAdmin,
}: {
  sport: SportOption;
  isAdmin: boolean;
}) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [positions, setPositions] = useState({
    first: { branch: '', email: '', name: '' },
    second: { branch: '', email: '', name: '' },
    third: { branch: '', email: '', name: '' },
  });
  const [loaded, setLoaded] = useState(false);

  // Load existing winners on mount
  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    getSportWinnerAnnouncement(sport.id).then((res) => {
      if (res.success && res.data) {
        setExisting(res.data);
        const pos: any = res.data.positions || {};
        setPositions({
          first: { branch: pos.first?.branch || pos.first || '', email: pos.first?.email || '', name: pos.first?.name || '' },
          second: { branch: pos.second?.branch || pos.second || '', email: pos.second?.email || '', name: pos.second?.name || '' },
          third: { branch: pos.third?.branch || pos.third || '', email: pos.third?.email || '', name: pos.third?.name || '' },
        });
      }
    });
  }, [sport.id, loaded]);

  const updatePos = (place: 'first' | 'second' | 'third', field: 'branch' | 'email' | 'name', value: string) =>
    setPositions((prev) => ({ ...prev, [place]: { ...prev[place], [field]: value } }));

  const handleSave = async () => {
    if (!positions.first.branch.trim()) {
      showToast('Please select the 1st place branch', 'error');
      return;
    }
    if (!positions.first.email.trim()) {
      showToast('Please enter the 1st place winner email', 'error');
      return;
    }
    setIsSaving(true);
    const res = await createSportWinnerAnnouncement(sport.id, positions);
    if (res.success) {
      setExisting(res.data);
      showToast('Winners saved successfully', 'success');
    } else {
      showToast(res.error || 'Failed to save winners', 'error');
    }
    setIsSaving(false);
  };

  const genderLabel = sport.gender === 'MALE' ? 'Boys' : sport.gender === 'FEMALE' ? 'Girls' : 'Mixed';
  const hasWinners = existing && (existing.positions as any)?.first;

  const medals = [
    { label: 'Winner', key: 'first' as const, icon: '🥇', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { label: 'Runner', key: 'second' as const, icon: '🥈', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
    { label: '2nd Runner', key: 'third' as const, icon: '🥉', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  ];

  return (
    <div className="group animate-card-entrance flex flex-col h-full">
      <div className="w-full bg-[#F4F2F0] rounded-[24px] p-4 flex flex-col flex-1 gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Card Header with Accent */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1A1A1A] text-base leading-snug truncate">
              {sport.name} <span className="text-[#6B7280] font-medium opacity-80">• {genderLabel}</span>
            </span>
          </div>
          {hasWinners && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1 shadow-sm">
              <Check className="w-2.5 h-2.5" /> Result Set
            </span>
          )}
        </div>

        {/* Inner White Dashboard Card */}
        <div className="bg-white rounded-[20px] overflow-hidden flex flex-col shadow-sm border border-black/5 flex-1 p-4">
          {/* Winners display Area */}
          {hasWinners ? (
            <div className="flex gap-2 mb-4">
              {medals.map(({ label, key, icon, bg, border, text }) => {
                const val: any = (existing.positions as any)?.[key];
                if (!val) return null;
                const branch = val?.branch || val || '';
                const email = val?.email || '';
                const name = val?.name || '';
                return (
                  <div key={key} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl ${bg} border ${border} shadow-sm transition-transform hover:scale-105`}>
                    <span className="text-xl mb-0.5">{icon}</span>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${text}`}>{label}</div>
                    <div className="font-bold text-[11px] text-[#1A1A1A] mt-1 text-center truncate w-full px-1">{name || branch}</div>
                    {name && <div className="text-[9px] text-[#6B7280] text-center truncate w-full px-1 font-medium">{branch}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 opacity-40">
              <Medal className="w-8 h-8 text-[#9CA3AF] mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Awaiting Results</p>
            </div>
          )}

          {/* Admin edit form */}
          {isAdmin && (
            <div className="space-y-4 border-t border-[#F3F4F6] pt-4 mt-auto">
              {medals.map(({ label, key, icon }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{label}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Winner Name"
                      value={positions[key].name}
                      onChange={(e) => updatePos(key, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[11px] font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-[#9CA3AF] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Branch Select */}
                    <Select
                      value={positions[key].branch}
                      onValueChange={(val) => updatePos(key, 'branch', val)}
                    >
                      <SelectTrigger className="w-full h-9 bg-[#FAFAFA] border-[#E5E7EB] text-[11px] font-bold text-[#1A1A1A] focus:ring- amber-300 rounded-lg">
                        <SelectValue placeholder="Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWED_BRANCHES.map((b) => (
                          <SelectItem key={b} value={b} className="text-xs font-semibold">
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Email Input */}
                    <input
                      type="email"
                      placeholder="Winner Email"
                      value={positions[key].email}
                      onChange={(e) => updatePos(key, 'email', e.target.value)}
                      className="w-full px-2 py-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[11px] font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-[#9CA3AF] transition-all"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-2 h-10 bg-[#1A1A1A] text-white rounded-[14px] text-xs font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-black/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="animate-pulse">Updating...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save {genderLabel} Results</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchResultsPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const [selectedSport, setSelectedSport] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSports, setAvailableSports] = useState<SportOption[]>([]);
  const [athleticsSports, setAthleticsSports] = useState<SportOption[]>([]);
  const [selectedAthleticsSubType, setSelectedAthleticsSubType] = useState('All');

  const isSportsCoordinator = session?.user?.role === 'BRANCH_SPORTS_ADMIN';
  const isMainSportsAdmin = session?.user?.role === 'SPORTS_ADMIN';

  const fetchResults = async () => {
    setIsLoading(true);
    const result = await getCompletedMatches(selectedSport, 'All');
    if (result.success) {
      setMatches(result.data || []);
    } else {
      showToast('Failed to load results', 'error');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [sportsRes, resultRes] = await Promise.all([
        getSportsListForFilter(),
        getCompletedMatches('All', 'All'),
      ]);
      if (sportsRes.success && sportsRes.sports) {
        const allSports = (sportsRes.sports as SportOption[]).filter((sport) => sport?.id && sport?.name);
        setAvailableSports(allSports.filter((s) => !s.name.startsWith('Athletics')));
        setAthleticsSports(allSports.filter((s) => s.name.startsWith('Athletics')));
      }
      if (resultRes.success) {
        setMatches(resultRes.data || []);
      } else {
        showToast('Failed to load results', 'error');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    if (selectedSport !== 'All' && availableSports.length > 0 && !availableSports.some((sport) => sport.id === selectedSport)) {
      setSelectedSport('All');
    } else {
      fetchResults();
    }
  }, [selectedSport, availableSports]);

  // Unique sub-types extracted from athletics sports names (e.g., "100M", "400M", ...)
  const athleticsSubTypes = Array.from(
    new Set(athleticsSports.map((s) => getAthleticsSubType(s.name)).filter(Boolean))
  ).sort();

  // Athletics sports filtered by selected sub-type
  const filteredAthleticsSports =
    selectedAthleticsSubType === 'All'
      ? athleticsSports
      : athleticsSports.filter((s) => getAthleticsSubType(s.name) === selectedAthleticsSubType);

  // Group filtered athletics sports by sub-type for display
  const athleticsBySubType = filteredAthleticsSports.reduce<Record<string, SportOption[]>>((acc, sport) => {
    const sub = getAthleticsSubType(sport.name) || sport.name;
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(sport);
    return acc;
  }, {});

  const normalizeSearch = (value: unknown) =>
    String(value ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const normalizedQuery = normalizeSearch(searchQuery);

  const filteredMatches = matches.filter((match) => {
    if (!normalizedQuery) return true;
    const defaultFields = [match.team1Name, match.team2Name, match.round, match.winner];
    if (!isMainSportsAdmin) return defaultFields.some((field) => normalizeSearch(field).includes(normalizedQuery));
    const sportsAdminFields = [...defaultFields, match.sport, match.gender, match.venue, match.status, match.score1, match.score2,
    match.date ? new Date(match.date).toLocaleDateString() : ''];
    return sportsAdminFields.some((field) => normalizeSearch(field).includes(normalizedQuery));
  });

  // Always show athletics section if there are any athletics sports
  const showAthletics = athleticsSports.length > 0;

  return (
    <div className="p-4 md:p-8 animate-page-entrance bg-white min-h-full">
      <div className="mb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span className="text-[#9CA3AF]">›</span>
          <span>Sports</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="text-[#1A1A1A] font-medium">Official Results</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Championship Results</h1>
            <p className="text-[10px] md:text-sm text-[#6B7280]">Official records of all completed matches and victory points.</p>
          </div>

          <div className="flex justify-between md:justify-start items-center gap-1 md:gap-3 p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm h-11 w-full md:w-auto transition-all">
            <div className="relative pl-2 md:pl-3 flex items-center flex-1 gap-2 min-w-0">
              <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 text-xs font-semibold text-[#1A1A1A] w-full min-w-[60px] md:w-32 placeholder:text-[#9CA3AF]"
              />
            </div>
            <div className="w-[1px] h-4 bg-[#E5E7EB] shrink-0 mx-1" />
            <div className="shrink-0">
              <Select value={selectedSport} onValueChange={(v) => {
                if (v === 'athletics-nav') {
                  document.getElementById('athletics-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  return;
                }
                setSelectedSport(v);
                setSelectedAthleticsSubType('All');
              }}>
                <SelectTrigger className="w-auto max-w-[140px] md:min-w-[120px] md:max-w-[200px] border-0 bg-transparent font-bold text-xs h-full focus:ring-0 [&>span]:truncate px-2">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sports</SelectItem>
                  <SelectItem value="athletics-nav">Athletics Events</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name} ({sport.gender === 'MALE' ? 'Boys' : sport.gender === 'FEMALE' ? 'Girls' : 'Mixed'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-[#E5E7EB]" />)}
          </div>
        ) : (
          <>
            {/* ── Team Sport Match Results ── */}
            {filteredMatches.length > 0 && (
              <div className="mb-12">
                <h2 className="text-base font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Team Sport Results
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                  {filteredMatches.map((match: any) => {
                    const getSportAccent = (sportName: string) => {
                      const s = sportName.toLowerCase();
                      if (s.includes('cricket')) return 'bg-blue-500';
                      if (s.includes('football')) return 'bg-emerald-500';
                      if (s.includes('basketball')) return 'bg-orange-500';
                      if (s.includes('volleyball')) return 'bg-rose-500';
                      if (s.includes('kabaddi')) return 'bg-amber-500';
                      if (s.includes('kho')) return 'bg-pink-500';
                      if (s.includes('badminton')) return 'bg-indigo-500';
                      return 'bg-slate-500';
                    };
                    const getDisplaySportName = (sportName: string) => {
                      if (availableSports.some((s) => s.name === sportName)) return sportName;
                      const sTemp = sportName.toLowerCase();
                      const found = availableSports.find((s) => s.name.toLowerCase().includes(sTemp));
                      return found?.name || sportName;
                    };
                    return (
                      <div key={match.id} className="group animate-card-entrance flex flex-col">
                        <div className="w-full bg-[#F4F2F0] rounded-[24px] p-4 flex flex-col flex-1 gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                          <div className="px-2 pt-1 font-bold text-[#1A1A1A] text-base leading-snug line-clamp-2">
                            {getDisplaySportName(match.sport)}{' '}
                            <span className="text-[#6B7280] font-medium opacity-80 whitespace-nowrap">
                              • {match.round}
                              <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border align-text-bottom ${match.gender === 'Boys' ? 'bg-blue-50 text-blue-600 border-blue-200' : match.gender === 'Girls' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {match.gender}
                              </span>
                            </span>
                          </div>
                          <div className="bg-white rounded-[20px] overflow-hidden flex flex-col shadow-sm border border-black/5 flex-1 relative">
                            <div className="relative w-full h-[180px] bg-slate-100">
                              <img
                                src={
                                  match.sport.toLowerCase().includes('cricket') ? 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000' :
                                    match.sport.toLowerCase().includes('football') ? 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000' :
                                      match.sport.toLowerCase().includes('basketball') ? 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000' :
                                        match.sport.toLowerCase().includes('volleyball') ? 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1000' :
                                          match.sport.toLowerCase().includes('badminton') ? 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000' :
                                            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'
                                }
                                alt={match.sport}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute top-4 right-4 bg-[#E8F5E9] text-[#1B5E20] px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                Completed
                              </div>
                            </div>
                            <div className="px-[7px] pb-[7px] pt-4 flex-1 flex flex-col">
                              <div className="flex items-center justify-between gap-1 mb-4 relative z-10 flex-1">
                                {/* Team 1 */}
                                <div className={`flex flex-col items-center gap-3 flex-1 transition-all duration-500 ${match.winner === match.team1Name ? 'opacity-100 scale-105' : 'opacity-70'}`}>
                                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all ${match.winner === match.team1Name ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}`}>
                                    {match.winner === match.team1Name && (
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1"><Trophy className="w-2 h-2" /> Win</div>
                                    )}
                                    <Medal className={`w-7 h-7 ${match.winner === match.team1Name ? 'text-amber-500' : 'text-slate-400'}`} />
                                  </div>
                                  <div className="text-center w-full">
                                    <div className="font-bold text-slate-800 text-[11px] md:text-[13px] leading-tight mb-1 truncate px-1">{match.team1Name}</div>
                                    <div className={`text-3xl md:text-4xl font-bold tracking-tighter ${match.winner === match.team1Name ? 'text-slate-800' : 'text-slate-300'}`}>{match.score1 || '0'}</div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center justify-center -mt-6 opacity-30">
                                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic">VS</span>
                                </div>
                                {/* Team 2 */}
                                <div className={`flex flex-col items-center gap-3 flex-1 transition-all duration-500 ${match.winner === match.team2Name ? 'opacity-100 scale-105' : 'opacity-70'}`}>
                                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all ${match.winner === match.team2Name ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}`}>
                                    {match.winner === match.team2Name && (
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1"><Trophy className="w-2 h-2" /> Win</div>
                                    )}
                                    <Award className={`w-7 h-7 ${match.winner === match.team2Name ? 'text-amber-500' : 'text-slate-400'}`} />
                                  </div>
                                  <div className="text-center w-full">
                                    <div className="font-bold text-slate-800 text-[11px] md:text-[13px] leading-tight mb-1 truncate px-1">{match.team2Name}</div>
                                    <div className={`text-3xl md:text-4xl font-bold tracking-tighter ${match.winner === match.team2Name ? 'text-slate-800' : 'text-slate-300'}`}>{match.score2 || '0'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-xl p-3 flex items-center justify-center gap-2 mb-2 ${match.winner === 'Draw' ? 'bg-amber-50/80 text-amber-700' : 'bg-emerald-50/80 text-emerald-700'}`}>
                                {match.winner !== 'Draw' && <Trophy className="w-4 h-4" />}
                                <span className="font-bold text-[12px] tracking-wide uppercase">
                                  {match.winner === 'Draw' ? 'Match Drawn' : `${match.winner} Wins`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Athletics Individual Events ── */}
            {showAthletics && (
              <div id="athletics-section" className="scroll-mt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" />
                    Athletics Events — Top 3 Winners
                  </h2>

                  {/* Sub-category filter pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAthleticsSubType('All')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedAthleticsSubType === 'All'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                        : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                        }`}
                    >
                      All Events
                    </button>
                    {athleticsSubTypes.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedAthleticsSubType(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedAthleticsSubType === sub
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-amber-400 hover:text-amber-600'
                          }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display each sub-type as a group */}
                <div className="space-y-8">
                  {Object.entries(athleticsBySubType).map(([subType, sports]) => (
                    <div key={subType}>
                      {/* Sub-type heading */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1A1A1A]">🏃 {subType}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                            {sports.length} {sports.length === 1 ? 'event' : 'events'}
                          </span>
                        </div>
                        <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
                      </div>

                      {/* Boys + Girls cards side by side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sports
                          .sort((a, b) => {
                            // Boys first, then Girls
                            if (a.gender === 'MALE' && b.gender !== 'MALE') return -1;
                            if (a.gender !== 'MALE' && b.gender === 'MALE') return 1;
                            return 0;
                          })
                          .map((sport) => (
                            <AthleticsWinnerCard
                              key={sport.id}
                              sport={sport}
                              isAdmin={isMainSportsAdmin}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredMatches.length === 0 && (!showAthletics || Object.keys(athleticsBySubType).length === 0) && (
              <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Award className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No Results Recorded</h3>
                <p className="text-[#7A7772] text-sm max-w-sm mx-auto font-medium">Results will appear here once matches are marked as 'Completed' in the tournament schedule.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
