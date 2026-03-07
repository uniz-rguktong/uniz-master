"use client";
import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Clock,
  MapPin,
} from "lucide-react";

const liveMatch = {
  id: 1,
  sport: "Cricket",
  sportColor: "#3B82F6",
  championship: "Inter-Department Cricket Championship",
  round: "Semi-Final 1",
  venue: "Sports Ground A",
  date: "2025-11-27",
  time: "10:00 AM",
  status: "live",

  team1: {
    name: "CSE Thunder",
    logo: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=100&h=100&fit=crop",
    score: 156,
    wickets: 4,
    overs: 28.3,
    runRate: 5.48,
    batting: true,
  },
  team2: {
    name: "ECE Warriors",
    logo: "https://images.unsplash.com/photo-1614030424754-24d0eebd46b2?w=100&h=100&fit=crop",
    score: 142,
    wickets: 10,
    overs: 35.0,
    runRate: 4.06,
    batting: false,
  },

  currentBatsmen: [
    {
      name: "Raj Kumar",
      runs: 45,
      balls: 38,
      fours: 6,
      sixes: 1,
      strikeRate: 118.42,
      onStrike: true,
    },
    {
      name: "Amit Sharma",
      runs: 23,
      balls: 29,
      fours: 2,
      sixes: 0,
      strikeRate: 79.31,
      onStrike: false,
    },
  ],

  currentBowler: {
    name: "Vikram Singh",
    overs: 5.3,
    runs: 32,
    wickets: 2,
    economy: 5.82,
  },

  recentBalls: ["1", "4", "0", "W", "2", "6", "1", "0", "4", "1", "0", "2"],
};

export function LiveScoreTrackingPage() {
  const [isLive, setIsLive] = useState(true);
  const [team1Score, setTeam1Score] = useState(liveMatch.team1.score);
  const [team1Wickets, setTeam1Wickets] = useState(liveMatch.team1.wickets);

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Sports</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">
            Live Score Tracking
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] font-semibold text-[#1A1A1A]">
                Live Match Tracking
              </h1>
              {isLive && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444] text-white rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-semibold">LIVE</span>
                </div>
              )}
            </div>
            <p className="text-sm text-[#6B7280]">
              {liveMatch.championship} - {liveMatch.round}
            </p>
          </div>
        </div>
      </div>

      {/* Live Scoreboard */}
      <div
        className="bg-gradient-to-br from-[#1A1A1A] to-[#3B82F6] rounded-xl p-8 mb-6 text-white animate-card-entrance"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{liveMatch.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{liveMatch.time}</span>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: liveMatch.sportColor }}
          >
            {liveMatch.sport}
          </span>
        </div>

        {/* Teams Score */}
        <div className="grid grid-cols-2 gap-6">
          {/* Team 1 */}
          <div
            className={`p-6 rounded-xl ${liveMatch.team1.batting ? "bg-white bg-opacity-20 ring-2 ring-white" : "bg-white bg-opacity-10"}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={liveMatch.team1.logo}
                alt={liveMatch.team1.name}
                className="w-16 h-16 rounded-full border-4 border-white object-cover"
              />

              <div className="flex-1">
                <div className="text-xl font-bold mb-1">
                  {liveMatch.team1.name}
                </div>
                {liveMatch.team1.batting && (
                  <div className="text-xs bg-[#10B981] text-white px-2 py-0.5 rounded-full inline-block">
                    BATTING
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold">{team1Score}</div>
              <div className="text-2xl font-semibold pb-1">
                / {team1Wickets}
              </div>
              <div className="text-lg text-white text-opacity-75 pb-2">
                ({liveMatch.team1.overs})
              </div>
            </div>
            <div className="text-sm text-white text-opacity-75 mt-2">
              Run Rate: {liveMatch.team1.runRate}
            </div>
          </div>

          {/* Team 2 */}
          <div
            className={`p-6 rounded-xl ${liveMatch.team2.batting ? "bg-white bg-opacity-20 ring-2 ring-white" : "bg-white bg-opacity-10"}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={liveMatch.team2.logo}
                alt={liveMatch.team2.name}
                className="w-16 h-16 rounded-full border-4 border-white object-cover"
              />

              <div className="flex-1">
                <div className="text-xl font-bold mb-1">
                  {liveMatch.team2.name}
                </div>
                {liveMatch.team2.batting && (
                  <div className="text-xs bg-[#10B981] text-white px-2 py-0.5 rounded-full inline-block">
                    BATTING
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold">{liveMatch.team2.score}</div>
              <div className="text-2xl font-semibold pb-1">
                / {liveMatch.team2.wickets}
              </div>
              <div className="text-lg text-white text-opacity-75 pb-2">
                ({liveMatch.team2.overs})
              </div>
            </div>
            <div className="text-sm text-white text-opacity-75 mt-2">
              Run Rate: {liveMatch.team2.runRate}
            </div>
          </div>
        </div>

        {/* Target/Lead */}
        <div className="mt-6 text-center py-3 bg-white bg-opacity-20 rounded-lg">
          <div className="text-lg font-semibold">
            CSE Thunder need 15 runs from 65 balls
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Current Batsmen */}
        <div
          className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 animate-card-entrance"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
            Current Partnership
          </h3>
          <div className="space-y-4">
            {liveMatch.currentBatsmen.map((batsman: any, index: any) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${batsman.onStrike ? "border-[#10B981] bg-[#D1FAE5]" : "border-[#E5E7EB] bg-[#F7F8FA]"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-base font-bold text-[#1A1A1A]">
                      {batsman.name}
                    </div>
                    {batsman.onStrike && (
                      <span className="px-2 py-0.5 bg-[#10B981] text-white text-xs font-semibold rounded-full">
                        ON STRIKE
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    {batsman.runs}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-[#6B7280]">Balls</div>
                    <div className="font-semibold text-[#1A1A1A]">
                      {batsman.balls}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280]">4s</div>
                    <div className="font-semibold text-[#1A1A1A]">
                      {batsman.fours}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280]">6s</div>
                    <div className="font-semibold text-[#1A1A1A]">
                      {batsman.sixes}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280]">SR</div>
                    <div className="font-semibold text-[#1A1A1A]">
                      {batsman.strikeRate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Bowler */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Current Bowler
            </h4>
            <div className="p-4 bg-[#F7F8FA] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-bold text-[#1A1A1A]">
                  {liveMatch.currentBowler.name}
                </div>
                <div className="text-lg font-bold text-[#1A1A1A]">
                  {liveMatch.currentBowler.wickets} -{" "}
                  {liveMatch.currentBowler.runs}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-[#6B7280]">Overs</div>
                  <div className="font-semibold text-[#1A1A1A]">
                    {liveMatch.currentBowler.overs}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Economy</div>
                  <div className="font-semibold text-[#1A1A1A]">
                    {liveMatch.currentBowler.economy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Control Panel */}
        <div
          className="bg-white rounded-xl border border-[#E5E7EB] p-6 animate-card-entrance"
          style={{ animationDelay: "150ms" }}
        >
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
            Score Controls
          </h3>

          {/* Quick Score Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["0", "1", "2", "3", "4", "6"].map((run: any) => (
              <button
                key={run}
                onClick={() => setTeam1Score(team1Score + parseInt(run))}
                className={`py-3 rounded-lg font-bold text-lg transition-all ${
                  run === "4" || run === "6"
                    ? "bg-[#10B981] text-white hover:bg-[#059669]"
                    : "bg-[#F7F8FA] text-[#1A1A1A] hover:bg-[#E5E7EB]"
                }`}
              >
                {run}
              </button>
            ))}
          </div>

          {/* Wicket Button */}
          <button
            onClick={() => setTeam1Wickets(team1Wickets + 1)}
            className="w-full py-3 bg-[#EF4444] text-white rounded-lg font-bold text-lg hover:bg-[#DC2626] transition-colors mb-4"
          >
            WICKET
          </button>

          {/* Wide & No Ball */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button className="py-2 bg-[#F59E0B] text-white rounded-lg font-semibold text-sm hover:bg-[#D97706] transition-colors">
              Wide
            </button>
            <button className="py-2 bg-[#F59E0B] text-white rounded-lg font-semibold text-sm hover:bg-[#D97706] transition-colors">
              No Ball
            </button>
          </div>

          {/* Manual Adjustment */}
          <div className="p-4 bg-[#F7F8FA] rounded-lg mb-4">
            <div className="text-xs font-semibold text-[#6B7280] mb-2">
              Manual Score
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}
                className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center font-bold text-xl">
                {team1Score}
              </div>
              <button
                onClick={() => setTeam1Score(team1Score + 1)}
                className="p-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Match Controls */}
          <div className="space-y-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-colors ${
                isLive
                  ? "bg-[#F59E0B] text-white hover:bg-[#D97706]"
                  : "bg-[#10B981] text-white hover:bg-[#059669]"
              }`}
            >
              {isLive ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Match
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume Match
                </>
              )}
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#E5E7EB] rounded-lg font-semibold text-sm text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
              <RotateCcw className="w-4 h-4" />
              Undo Last Ball
            </button>
          </div>
        </div>
      </div>

      {/* Recent Balls */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">This Over</h3>
        <div className="flex items-center gap-3">
          {liveMatch.recentBalls.map((ball: any, index: any) => (
            <div
              key={index}
              className={`w-12 h-12 flex items-center justify-center rounded-full font-bold ${
                ball === "W"
                  ? "bg-[#EF4444] text-white"
                  : ball === "4" || ball === "6"
                    ? "bg-[#10B981] text-white"
                    : ball === "0"
                      ? "bg-[#6B7280] text-white"
                      : "bg-[#3B82F6] text-white"
              }`}
            >
              {ball}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
