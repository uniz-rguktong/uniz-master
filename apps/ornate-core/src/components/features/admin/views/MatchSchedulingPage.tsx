"use client";
import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

const matches = [
  {
    id: 1,
    sport: "Cricket",
    sportColor: "#3B82F6",
    championship: "Inter-Department Cricket Championship",
    team1: "CSE Thunder",
    team2: "ECE Warriors",
    date: "2025-11-27",
    time: "10:00 AM",
    duration: "3 hours",
    venue: "Sports Ground A",
    round: "Semi-Final 1",
    referee: "Prof. Anderson",
    status: "scheduled",
  },
  {
    id: 2,
    sport: "Basketball",
    sportColor: "#F59E0B",
    championship: "Basketball League 2025",
    team1: "Hoop Masters",
    team2: "Court Kings",
    date: "2025-11-26",
    time: "2:00 PM",
    duration: "2 hours",
    venue: "Indoor Stadium",
    round: "League Match",
    referee: "Dr. Smith",
    status: "scheduled",
  },
  {
    id: 3,
    sport: "Football",
    sportColor: "#10B981",
    championship: "Football Championship",
    team1: "Goal Crushers",
    team2: "Kick Masters",
    date: "2025-12-01",
    time: "9:00 AM",
    duration: "2.5 hours",
    venue: "Football Field",
    round: "Quarter-Final 1",
    referee: "Prof. Martinez",
    status: "pending",
  },
  {
    id: 4,
    sport: "Cricket",
    sportColor: "#3B82F6",
    championship: "Inter-Department Cricket Championship",
    team1: "Mech Strikers",
    team2: "Civil Champions",
    date: "2025-11-27",
    time: "2:30 PM",
    duration: "3 hours",
    venue: "Sports Ground A",
    round: "Semi-Final 2",
    referee: "Prof. Anderson",
    status: "scheduled",
  },
  {
    id: 5,
    sport: "Volleyball",
    sportColor: "#EF4444",
    championship: "Volleyball Tournament",
    team1: "Ace Servers",
    team2: "Spike Kings",
    date: "2025-10-24",
    time: "11:00 AM",
    duration: "1.5 hours",
    venue: "Sports Complex",
    round: "Final",
    referee: "Dr. Wilson",
    status: "completed",
  },
];

export function MatchSchedulingPage() {
  const [selectedDate, setSelectedDate] = useState("2025-11-27");
  const [showAddForm, setShowAddForm] = useState(false);

  const matchesByDate = matches.filter(
    (match: any) => match.date === selectedDate,
  );

  const stats = {
    total: matches.length,
    scheduled: matches.filter((m: any) => m.status === "scheduled").length,
    pending: matches.filter((m: any) => m.status === "pending").length,
    completed: matches.filter((m: any) => m.status === "completed").length,
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
          <span className="text-[#1A1A1A] font-medium">Match Scheduling</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Match Scheduling
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage match schedules, venues, and timings
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Schedule Match
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div
            className="animate-card-entrance"
            style={{ animationDelay: "40ms" }}
          >
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Total Matches</div>
                  <div className="text-2xl font-semibold text-[#1A1A1A]">
                    {stats.total}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="animate-card-entrance"
            style={{ animationDelay: "80ms" }}
          >
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Scheduled</div>
                  <div className="text-2xl font-semibold text-[#10B981]">
                    {stats.scheduled}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="animate-card-entrance"
            style={{ animationDelay: "120ms" }}
          >
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Pending</div>
                  <div className="text-2xl font-semibold text-[#F59E0B]">
                    {stats.pending}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="animate-card-entrance"
            style={{ animationDelay: "160ms" }}
          >
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#6B7280]" />
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Completed</div>
                  <div className="text-2xl font-semibold text-[#6B7280]">
                    {stats.completed}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-[#1A1A1A]">
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          />

          <div className="text-sm text-[#6B7280]">
            {matchesByDate.length}{" "}
            {matchesByDate.length === 1 ? "match" : "matches"} scheduled
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">
          Schedule for{" "}
          {new Date(selectedDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h3>

        {matchesByDate.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-[#6B7280]">No matches scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchesByDate
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((match, index) => (
                <div
                  key={match.id}
                  className="border-l-4 bg-[#F7F8FA] rounded-lg p-5 hover:shadow-md transition-all animate-card-entrance"
                  style={{
                    borderColor: match.sportColor,
                    animationDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    {/* Match Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: match.sportColor }}
                        >
                          {match.sport}
                        </span>
                        <span className="text-sm font-semibold text-[#6B7280]">
                          {match.round}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            match.status === "scheduled"
                              ? "bg-[#D1FAE5] text-[#065F46]"
                              : match.status === "pending"
                                ? "bg-[#FEF3C7] text-[#92400E]"
                                : "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>

                      <div className="text-sm text-[#6B7280] mb-3">
                        {match.championship}
                      </div>

                      {/* Teams */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 text-center py-2 px-4 bg-white rounded-lg border border-[#E5E7EB]">
                          <div className="text-sm font-bold text-[#1A1A1A]">
                            {match.team1}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#6B7280]">
                          VS
                        </div>
                        <div className="flex-1 text-center py-2 px-4 bg-white rounded-lg border border-[#E5E7EB]">
                          <div className="text-sm font-bold text-[#1A1A1A]">
                            {match.team2}
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#6B7280]" />
                          <div>
                            <div className="text-xs text-[#6B7280]">Time</div>
                            <div className="font-semibold text-[#1A1A1A]">
                              {match.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#6B7280]" />
                          <div>
                            <div className="text-xs text-[#6B7280]">
                              Duration
                            </div>
                            <div className="font-semibold text-[#1A1A1A]">
                              {match.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-[#6B7280]" />
                          <div>
                            <div className="text-xs text-[#6B7280]">Venue</div>
                            <div className="font-semibold text-[#1A1A1A]">
                              {match.venue}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-[#6B7280]" />
                          <div>
                            <div className="text-xs text-[#6B7280]">
                              Referee
                            </div>
                            <div className="font-semibold text-[#1A1A1A]">
                              {match.referee}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-6">
                      <button className="p-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-[#6B7280]" />
                      </button>
                      <button className="p-2 bg-[#FEE2E2] hover:bg-[#FECACA] rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Match Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="text-xl font-semibold text-[#1A1A1A]">
                Schedule New Match
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Championship <span className="text-[#EF4444]">*</span>
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                    <option>Select championship</option>
                    <option>Inter-Department Cricket Championship</option>
                    <option>Basketball League 2025</option>
                    <option>Football Championship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Team 1 <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter team name"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Team 2 <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter team name"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Time <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Duration <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2 hours"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Venue <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter venue"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Round <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Quarter-Final 1"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Referee
                  </label>
                  <input
                    type="text"
                    placeholder="Referee name"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#E5E7EB]">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors">
                Schedule Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
