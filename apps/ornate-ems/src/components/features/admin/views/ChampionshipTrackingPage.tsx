"use client";
import { useState, useEffect } from "react";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Play,
  CheckCircle,
  Clock,
  ChevronRight,
  Info,
  Medal,
} from "lucide-react";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import { getSportWinnerAnnouncements } from "@/actions/sportWinnerActions";
import { getSportsListForFilter } from "@/actions/sportGetters";
import { getMatches, getUpcomingMatches } from "@/actions/fixtureActions";

interface ChampionshipTrackingPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
  cricket: "#3B82F6",
  football: "#10B981",
  basketball: "#F59E0B",
  volleyball: "#EF4444",
  badminton: "#6366F1",
  kabaddi: "#F97316",
  kho: "#EC4899",
  throwball: "#14B8A6",
  athletics: "#F59E0B",
};

function getSportColor(name: string): string {
  const key = Object.keys(SPORT_COLORS).find((k) =>
    name.toLowerCase().includes(k),
  );
  return key ? SPORT_COLORS[key]! : "#6B7280";
}

function normalizeGenderUi(g: string): string {
  if (g === "MALE" || g === "Boys") return "Boys";
  if (g === "FEMALE" || g === "Girls") return "Girls";
  return "Mixed";
}

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL"];

/** Build a real championship entry from matches */
function buildTeamChampionship(
  sport: { id: string; name: string; gender: string },
  matches: any[],
) {
  const completed = matches.filter((m) => m.status === "completed").length;
  const live = matches.filter((m) => m.status === "live").length;
  const total = matches.length;

  const overallStatus =
    total === 0
      ? "upcoming"
      : completed === total
        ? "completed"
        : live > 0 || completed > 0
          ? "ongoing"
          : "upcoming";

  const completedRounds = matches
    .filter((m) => m.status === "completed")
    .map((m) => m.round);
  const liveMatch = matches.find((m) => m.status === "live");
  const currentRound =
    liveMatch?.round ||
    (completedRounds.length > 0
      ? completedRounds[completedRounds.length - 1]
      : "Pre-Tournament");

  // Build standings from match results
  const standingsMap: Record<
    string,
    { wins: number; losses: number; points: number; position?: number }
  > = {};

  for (const m of matches) {
    if (m.status !== "completed" || !m.winner || m.winner === "Draw") continue;
    const wBranch = BRANCHES.find((b) =>
      (m.winner || "").toUpperCase().startsWith(b),
    );
    const loser = m.winner === m.team1Name ? m.team2Name : m.team1Name;
    const lBranch = BRANCHES.find((b) =>
      (loser || "").toUpperCase().startsWith(b),
    );
    if (wBranch) {
      standingsMap[wBranch] = standingsMap[wBranch] || {
        wins: 0,
        losses: 0,
        points: 0,
      };
      standingsMap[wBranch]!.wins += 1;
      standingsMap[wBranch]!.points += 2;
    }
    if (lBranch) {
      standingsMap[lBranch] = standingsMap[lBranch] || {
        wins: 0,
        losses: 0,
        points: 0,
      };
      standingsMap[lBranch]!.losses += 1;
    }
  }

  // Mark final winner/runner-up
  const final = matches.find(
    (m) => m.matchId === "GF-M1" && m.status === "completed",
  );
  if (final?.winner) {
    const wBranch = BRANCHES.find((b) =>
      (final.winner || "").toUpperCase().startsWith(b),
    );
    const rName =
      final.winner === final.team1Name ? final.team2Name : final.team1Name;
    const rBranch = BRANCHES.find((b) =>
      (rName || "").toUpperCase().startsWith(b),
    );
    if (wBranch) {
      standingsMap[wBranch] = standingsMap[wBranch] || {
        wins: 0,
        losses: 0,
        points: 0,
      };
      standingsMap[wBranch]!.position = 1;
    }
    if (rBranch) {
      standingsMap[rBranch] = standingsMap[rBranch] || {
        wins: 0,
        losses: 0,
        points: 0,
      };
      standingsMap[rBranch]!.position = 2;
    }
  }

  const teams = Object.entries(standingsMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort(
      (a, b) =>
        (a.position || 99) - (b.position || 99) ||
        b.points - a.points ||
        b.wins - a.wins,
    );

  const allBranches = new Set<string>();
  for (const m of matches) {
    const b1 = BRANCHES.find((b) =>
      (m.team1Name || "").toUpperCase().startsWith(b),
    );
    const b2 = BRANCHES.find((b) =>
      (m.team2Name || "").toUpperCase().startsWith(b),
    );
    if (b1) allBranches.add(b1);
    if (b2) allBranches.add(b2);
  }

  const dates = matches
    .map((m) => m.date)
    .filter(Boolean)
    .sort();
  return {
    id: sport.id,
    name: `${sport.name} — ${normalizeGenderUi(sport.gender)}`,
    sportBase: sport.name,
    sport: sport.name,
    gender: sport.gender,
    sportColor: getSportColor(sport.name),
    category: "Team",
    format: "Knockout",
    startDate: dates[0] || new Date().toISOString(),
    endDate: dates[dates.length - 1] || new Date().toISOString(),
    status: overallStatus,
    venue: matches.find((m) => m.venue)?.venue || "Sports Ground",
    totalTeams: allBranches.size || 5,
    matchesCompleted: completed,
    matchesTotal: total || 1,
    currentRound,
    teams,
    isPlaceholder: false,
  };
}

/** A placeholder entry for a sport that has no DB record for a given gender */
function buildPlaceholderChampionship(
  sportBase: string,
  gender: "MALE" | "FEMALE",
) {
  return {
    id: `placeholder-${sportBase}-${gender}`,
    name: `${sportBase} — ${normalizeGenderUi(gender)}`,
    sportBase,
    sport: sportBase,
    gender,
    sportColor: getSportColor(sportBase),
    category: "Team",
    format: "Knockout",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: "upcoming",
    venue: "TBD",
    totalTeams: 5,
    matchesCompleted: 0,
    matchesTotal: 1,
    currentRound: "Not Started",
    teams: [],
    isPlaceholder: true,
  };
}

/** Build an aggregated athletics championship entry for ONE gender across all sub-events */
function buildAggregatedAthleticsChampionship(
  announcements: any[],
  gender: string,
) {
  const standingsMap: Record<
    string,
    {
      points: number;
      gold: number;
      silver: number;
      bronze: number;
      email?: string;
    }
  > = {};

  // Initialize branches
  for (const b of BRANCHES) {
    standingsMap[b] = { points: 0, gold: 0, silver: 0, bronze: 0 };
  }

  let totalEvents = announcements.length;

  for (const ann of announcements) {
    const pos = ann.positions as any;
    if (!pos) continue;

    const pts = {
      first: ann.sport?.winnerPoints || 5,
      second: ann.sport?.runnerUpPoints || 3,
      third: ann.sport?.participationPoints || 1,
    };

    const processPosition = (
      key: "first" | "second" | "third",
      medal: "gold" | "silver" | "bronze",
    ) => {
      const p = pos[key];
      if (!p) return;
      const b = p?.branch || (typeof p === "string" ? p : "");
      const branch = BRANCHES.find((bran) => b.toUpperCase().startsWith(bran));
      if (branch && standingsMap[branch]) {
        standingsMap[branch]!.points += pts[key] || 0;
        standingsMap[branch]![medal] += 1;
        if (p?.email) standingsMap[branch]!.email = p.email;
      }
    };

    processPosition("first", "gold");
    processPosition("second", "silver");
    processPosition("third", "bronze");
  }

  const teams = Object.entries(standingsMap)
    .map(([name, s]) => ({
      name,
      points: s.points,
      gold: s.gold,
      silver: s.silver,
      bronze: s.bronze,
      wins: s.gold, // Maps gold to Wins column in common table
      losses: 0,
      position: 0,
    }))
    .sort((a, b) => b.points - a.points || b.gold - a.gold);

  // Assign internal ranking positions for UI
  teams.forEach((t, i) => (t.position = i + 1));

  return {
    id: `athl-agg-${gender}`,
    name: `Athletics (Overall) — ${normalizeGenderUi(gender)}`,
    sportBase: "Athletics",
    sport: "Athletics",
    gender,
    sportColor: "#F59E0B",
    category: "Individual",
    format: "Multi-Event",
    startDate: announcements[0]?.createdAt || new Date().toISOString(),
    endDate:
      announcements[announcements.length - 1]?.createdAt ||
      new Date().toISOString(),
    status: totalEvents > 0 ? "completed" : "upcoming",
    venue: "Athletics Ground",
    totalTeams: 5,
    matchesCompleted: totalEvents,
    matchesTotal: totalEvents || 1,
    currentRound: totalEvents > 0 ? "Results Aggregated" : "Not Started",
    teams: teams.filter((t) => t.points > 0),
    isPlaceholder: totalEvents === 0,
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case "ongoing":
      return { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" };
    case "upcoming":
      return { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" };
    case "completed":
      return { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" };
    default:
      return { bg: "#F3F4F6", text: "#1F2937", dot: "#6B7280" };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ChampionshipTrackingPage({
  onNavigate,
}: ChampionshipTrackingPageProps = {}) {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterGender, setFilterGender] = useState<"All" | "Boys" | "Girls">(
    "All",
  );
  const [filterCategory, setFilterCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [allChampionships, setAllChampionships] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all sports
        const sportsRes = await getSportsListForFilter();
        const allSportsArr: any[] = (sportsRes.sports || []).filter(
          (s: any) => s?.id && s?.name,
        );
        const teamSportsRaw: any[] = allSportsArr.filter(
          (s) =>
            !s.name.toLowerCase().includes("athletic") &&
            s.category !== "INDIVIDUAL",
        );

        // 2. Get unique sport base names for team sports
        const sportBaseNames = Array.from(
          new Set(teamSportsRaw.map((s) => s.name)),
        );
        const sportMap: Record<
          string,
          { id: string; name: string; gender: string }
        > = {};
        for (const s of teamSportsRaw) {
          sportMap[`${s.name}-${s.gender}`] = s;
        }

        const teamEntries: any[] = [];
        for (const baseName of sportBaseNames) {
          for (const gender of ["MALE", "FEMALE"] as const) {
            const key = `${baseName}-${gender}`;
            const sport = sportMap[key];
            if (sport) {
              const matchesRes = await getMatches(sport.id, "All");
              teamEntries.push(
                buildTeamChampionship(sport, (matchesRes.data || []) as any[]),
              );
            } else {
              teamEntries.push(buildPlaceholderChampionship(baseName, gender));
            }
          }
        }

        // 3. Athletics winners - AGGREGATED
        const winnersRes = await getSportWinnerAnnouncements();
        const athleticsAnns = (winnersRes.data || []).filter(
          (ann: any) =>
            (ann.sport?.name?.toLowerCase().includes("athletic") ||
              ann.sport?.category === "INDIVIDUAL") &&
            ann.positions,
        );

        const boysAnns = athleticsAnns.filter(
          (ann: any) =>
            ann.sport?.gender === "MALE" || ann.sport?.gender === "Boys",
        );
        const girlsAnns = athleticsAnns.filter(
          (ann: any) =>
            ann.sport?.gender === "FEMALE" || ann.sport?.gender === "Girls",
        );

        const athleticsEntries = [
          buildAggregatedAthleticsChampionship(boysAnns, "MALE"),
          buildAggregatedAthleticsChampionship(girlsAnns, "FEMALE"),
        ];

        setAllChampionships([...teamEntries, ...athleticsEntries]);

        // 4. Upcoming matches
        const upRes = await getUpcomingMatches(6);
        setUpcomingMatches((upRes.data || []) as any[]);
      } catch (e) {
        console.error("Championship load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const statuses = ["All", "ongoing", "upcoming", "completed"];

  const filtered = allChampionships.filter((c) => {
    const statusOk = filterStatus === "All" || c.status === filterStatus;
    const categoryOk =
      filterCategory === "All" || c.category === filterCategory;
    const genderOk =
      filterGender === "All" ||
      (filterGender === "Boys" &&
        (c.gender === "MALE" || c.gender === "Boys")) ||
      (filterGender === "Girls" &&
        (c.gender === "FEMALE" || c.gender === "Girls"));
    return statusOk && categoryOk && genderOk;
  });

  const stats = {
    total: allChampionships.filter((c) => !c.isPlaceholder).length,
    ongoing: allChampionships.filter((c) => c.status === "ongoing").length,
    upcoming: allChampionships.filter((c) => c.status === "upcoming").length,
    completed: allChampionships.filter((c) => c.status === "completed").length,
  };

  const showUpcoming =
    (filterStatus === "All" || filterStatus === "ongoing") &&
    filterCategory !== "Individual" &&
    upcomingMatches.length > 0;

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span>Sports</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">
            Championship Tracking
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold text-[#1A1A1A] tracking-tight mb-2">
              Championship Tracking
            </h1>
            <p className="text-sm md:text-base text-[#6B7280]">
              Real-time leaderboard across all sporting disciplines
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280] bg-[#F7F8FA] px-3 py-1.5 rounded-full border border-[#E5E7EB]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Data
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? [...Array(4)].map((_: any, i: any) => (
                <MetricCardSkeleton key={i} />
              ))
            : [
                {
                  label: "Total Champs",
                  value: stats.total,
                  Icon: Trophy,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  label: "Ongoing Events",
                  value: stats.ongoing,
                  Icon: Play,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Starting Soon",
                  value: stats.upcoming,
                  Icon: Clock,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Fully Completed",
                  value: stats.completed,
                  Icon: CheckCircle,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
              ].map(({ label, value, Icon, color, bg }, i) => (
                <div
                  key={label}
                  className="bg-[#F4F2F0] rounded-[20px] p-2 animate-card-entrance"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="bg-white rounded-[16px] p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                          {label}
                        </div>
                        <div className={`text-2xl font-bold ${color}`}>
                          {value}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* ── Filter rows ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 p-1.5 bg-[#F4F2F0] rounded-2xl w-fit">
            {(["All", "Boys", "Girls"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  filterGender === g
                    ? g === "Girls"
                      ? "bg-rose-500 text-white shadow-md"
                      : g === "Boys"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-[#1A1A1A] text-white shadow-md"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                {g === "All" ? "⚡ All" : g === "Boys" ? "🔵 Boys" : "🔴 Girls"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap capitalize ${filterStatus === s ? "bg-[#1A1A1A] text-white shadow" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"}`}
              >
                {s}
              </button>
            ))}
            <div className="w-[1px] h-5 bg-[#E5E7EB]" />
            {[
              { label: "All Categories", val: "All" },
              { label: "🏆 Team", val: "Team" },
              { label: "🏃 Individual", val: "Individual" },
            ].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setFilterCategory(val)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${filterCategory === val ? "bg-amber-500 text-white shadow" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-amber-400 hover:text-amber-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upcoming Matches ── */}
      {showUpcoming && (
        <div className="bg-[#F4F2F0] rounded-[24px] mb-10 p-2 pt-6">
          <div className="px-4 mb-4">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-[0.2em]">
              Upcoming Featured Matches
            </h2>
          </div>
          <div className="bg-white/40 backdrop-blur-md rounded-[20px] p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="bg-white rounded-[20px] p-5 border border-[#E5E7EB] hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest"
                      style={{ backgroundColor: getSportColor(match.sport) }}
                    >
                      {match.sport}
                    </span>
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase bg-gray-50 px-2 py-1 rounded-md">
                      {match.round}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex-1 text-center font-bold text-sm text-[#1A1A1A] line-clamp-1">
                      {match.team1Name}
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-black italic">
                      VS
                    </div>
                    <div className="flex-1 text-center font-bold text-sm text-[#1A1A1A] line-clamp-1">
                      {match.team2Name}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        {match.date
                          ? new Date(match.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "TBD"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {match.time || "TBD"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Championships ── */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={320} className="rounded-[24px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
          <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
            No Standings Yet
          </h3>
          <p className="text-sm text-[#6B7280]">
            Matches haven't been completed or results aren't announced.
          </p>
        </div>
      ) : (
        (() => {
          const groups: {
            genderLabel: string;
            genderKey: string;
            items: any[];
          }[] = [];
          const boysItems = filtered.filter(
            (c) => c.gender === "MALE" || c.gender === "Boys",
          );
          const girlsItems = filtered.filter(
            (c) => c.gender === "FEMALE" || c.gender === "Girls",
          );
          if (filterGender === "All" || filterGender === "Boys")
            if (boysItems.length)
              groups.push({
                genderLabel: "🔵 Boys Championships",
                genderKey: "boys",
                items: boysItems,
              });
          if (filterGender === "All" || filterGender === "Girls")
            if (girlsItems.length)
              groups.push({
                genderLabel: "🔴 Girls Championships",
                genderKey: "girls",
                items: girlsItems,
              });

          return (
            <div className="space-y-12">
              {groups.map((group) => (
                <div key={group.genderKey}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight">
                      {group.genderLabel}
                    </h2>
                    <span className="text-[10px] font-black text-white bg-[#1A1A1A] px-2.5 py-1 rounded-full uppercase tracking-widest">
                      {group.items.length} Disciplines
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-200 to-transparent" />
                  </div>

                  <div className="space-y-6">
                    {group.items.map((champ: any) => {
                      const sc = getStatusColor(champ.status);
                      const progress = Math.min(
                        Math.round(
                          (champ.matchesCompleted /
                            Math.max(champ.matchesTotal, 1)) *
                            100,
                        ),
                        100,
                      );

                      return (
                        <div
                          key={champ.id}
                          className={`rounded-[32px] p-2 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group/card ${champ.isPlaceholder ? "opacity-50 grayscale" : ""}`}
                          style={{
                            background: `linear-gradient(135deg, ${champ.sportColor}10 0%, ${champ.sportColor}20 100%)`,
                          }}
                        >
                          <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-8">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-5">
                                <span
                                  className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md"
                                  style={{ backgroundColor: champ.sportColor }}
                                >
                                  {champ.sport}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm bg-white border border-gray-100"
                                  style={{ color: sc.text }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: sc.dot }}
                                  />
                                  {champ.status}
                                </span>
                                {champ.category === "Individual" && (
                                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-amber-500 text-white border-amber-600 shadow-sm animate-bounce-subtle">
                                    Aggregated Athletics
                                  </span>
                                )}
                              </div>

                              <h3 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-6 leading-tight group-hover/card:translate-x-1 transition-transform">
                                {champ.name}
                              </h3>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                {[
                                  {
                                    icon: (
                                      <Calendar className="w-5 h-5 text-indigo-500" />
                                    ),
                                    label: "Event Period",
                                    value: `${new Date(champ.startDate).toLocaleDateString()} – ${new Date(champ.endDate).toLocaleDateString()}`,
                                  },
                                  {
                                    icon: (
                                      <MapPin className="w-5 h-5 text-rose-500" />
                                    ),
                                    label: "Main Venue",
                                    value: champ.venue,
                                  },
                                  {
                                    icon: (
                                      <Users className="w-5 h-5 text-blue-500" />
                                    ),
                                    label: "Branches",
                                    value: `${champ.totalTeams} Participating`,
                                  },
                                ].map(({ icon, label, value }) => (
                                  <div
                                    key={label}
                                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80"
                                  >
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                                      {icon}
                                    </div>
                                    <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                                      {label}
                                    </div>
                                    <div className="text-[13px] font-black text-[#1A1A1A]">
                                      {value}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-white/80 rounded-2xl p-6 border border-white/50 backdrop-blur-md shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.1em] mb-1">
                                      Tournament Status
                                    </div>
                                    <div className="text-xl font-black text-[#1A1A1A]">
                                      {champ.currentRound}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-[0.1em] mb-1">
                                      Event Completion
                                    </div>
                                    <div className="text-xl font-black text-[#1A1A1A]">
                                      {champ.matchesCompleted} /{" "}
                                      {champ.matchesTotal}
                                    </div>
                                  </div>
                                </div>
                                <div className="h-6 bg-white rounded-full overflow-hidden border-2 border-gray-100 shadow-inner p-1">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3"
                                    style={{
                                      width: `${progress}%`,
                                      backgroundColor: champ.sportColor,
                                      boxShadow: `0 0 15px ${champ.sportColor}40`,
                                    }}
                                  >
                                    {progress > 15 && (
                                      <span className="text-[10px] font-black text-white">
                                        {progress}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="w-full lg:w-[400px] shrink-0">
                              <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-full">
                                <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                  <h4 className="text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] flex items-center gap-2">
                                    {champ.category === "Individual" ? (
                                      <Medal className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <Trophy className="w-4 h-4 text-emerald-500" />
                                    )}
                                    Leaderboard Standings
                                  </h4>
                                </div>

                                <div className="flex-1 overflow-x-auto">
                                  {champ.teams.length === 0 ? (
                                    <div className="p-12 text-center text-gray-300">
                                      <Info className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                      <p className="text-sm font-bold">
                                        Waiting for results...
                                      </p>
                                    </div>
                                  ) : (
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-50/30">
                                          <th className="py-4 px-6 text-[10px] font-black text-[#9CA3AF] uppercase">
                                            Dept
                                          </th>
                                          {champ.category === "Individual" ? (
                                            <>
                                              <th className="py-4 px-2 text-center text-[10px] font-black text-[#9CA3AF]">
                                                🥇
                                              </th>
                                              <th className="py-4 px-2 text-center text-[10px] font-black text-[#9CA3AF]">
                                                🥈
                                              </th>
                                              <th className="py-4 px-2 text-center text-[10px] font-black text-[#9CA3AF]">
                                                🥉
                                              </th>
                                            </>
                                          ) : (
                                            <>
                                              <th className="py-4 px-4 text-center text-[10px] font-black text-[#9CA3AF]">
                                                W
                                              </th>
                                              <th className="py-4 px-4 text-center text-[10px] font-black text-[#9CA3AF]">
                                                L
                                              </th>
                                            </>
                                          )}
                                          <th className="py-4 px-6 text-right text-[10px] font-black text-[#1A1A1A] uppercase">
                                            Points
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {champ.teams.map(
                                          (team: any, idx: number) => (
                                            <tr
                                              key={team.name}
                                              className="hover:bg-gray-50/50 transition-colors"
                                            >
                                              <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                  <span
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                                                  >
                                                    {idx + 1}
                                                  </span>
                                                  <span className="text-sm font-black text-[#1A1A1A]">
                                                    {team.name}
                                                  </span>
                                                </div>
                                              </td>
                                              {champ.category ===
                                              "Individual" ? (
                                                <>
                                                  <td className="py-4 px-2 text-center font-bold text-xs text-amber-600">
                                                    {team.gold}
                                                  </td>
                                                  <td className="py-4 px-2 text-center font-bold text-xs text-slate-500">
                                                    {team.silver}
                                                  </td>
                                                  <td className="py-4 px-2 text-center font-bold text-xs text-orange-600">
                                                    {team.bronze}
                                                  </td>
                                                </>
                                              ) : (
                                                <>
                                                  <td className="py-4 px-4 text-center font-bold text-xs text-emerald-600">
                                                    {team.wins}
                                                  </td>
                                                  <td className="py-4 px-4 text-center font-bold text-xs text-rose-500">
                                                    {team.losses}
                                                  </td>
                                                </>
                                              )}
                                              <td className="py-4 px-6 text-right font-black text-sm text-[#1A1A1A]">
                                                {team.points}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                                {champ.category !== "Individual" &&
                                  !champ.isPlaceholder && (
                                    <div className="p-6 bg-gray-100/30 mt-auto">
                                      <button
                                        onClick={() =>
                                          onNavigate?.("championship-bracket")
                                        }
                                        className="w-full py-4 bg-[#1A1A1A] text-white rounded-[16px] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                      >
                                        Full Tournament Bracket{" "}
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}
