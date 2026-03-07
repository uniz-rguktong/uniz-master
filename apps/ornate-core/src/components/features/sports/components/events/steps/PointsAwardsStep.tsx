"use client";
import { useState, useEffect } from "react";
import { Trophy, Award, Star, ListChecks } from "lucide-react";

interface PointsAwardsData {
  category?: string;
  winnerPoints?: number;
  runnerupPoints?: number;
  participationPoints?: number;
  awards?: string[];
}

interface PointsAwardsStepProps {
  data: PointsAwardsData;
  updateData: (patch: Partial<PointsAwardsData>) => void;
}

export function PointsAwardsStep({ data, updateData }: PointsAwardsStepProps) {
  const [awards, setAwards] = useState(
    data.awards || ["Certificate of Excellence", "Medal"],
  );

  const isTeamCategory = data.category === "Team";
  const winnerPoints = isTeamCategory ? 10 : 5;
  const runnerupPoints = isTeamCategory ? 5 : 3;
  const participationPoints = isTeamCategory ? 0 : 1;

  useEffect(() => {
    setAwards(data.awards || ["Certificate of Excellence", "Medal"]);
  }, [data]);

  useEffect(() => {
    updateData({ winnerPoints, runnerupPoints, participationPoints });
  }, [data.category]);

  const commonAwards = [
    "E-Certificate",
    "Hardcopy Certificate",
    "Gold Medal",
    "Silver Medal",
    "Bronze Medal",
    "Trophy",
    "Cash Prize",
    "Recognition at Annual Sport Day",
  ];

  const toggleAward = (award: string) => {
    const newAwards = awards.includes(award)
      ? awards.filter((a) => a !== award)
      : [...awards, award];
    setAwards(newAwards);
    updateData({ awards: newAwards });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Point Distribution */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">
            Championship Point System
          </h3>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 ${isTeamCategory ? "md:grid-cols-2" : "md:grid-cols-3"}`}
        >
          <div className="p-6 bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl group transition-all">
            <label className="block text-xs font-semibold text-[#92400E] uppercase tracking-wider mb-3 opacity-80">
              Winner Points
            </label>
            <div className="flex items-end gap-2">
              <input
                type="number"
                value={winnerPoints}
                readOnly
                disabled
                className="w-full bg-transparent border-b-2 border-[#FCD34D] text-2xl font-bold text-[#92400E] focus:outline-none transition-colors pb-1 cursor-not-allowed"
              />
              <span className="text-xs font-bold text-[#D97706] uppercase tracking-widest mb-2">
                pts
              </span>
            </div>
          </div>

          <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl group transition-all">
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3 opacity-80">
              Runner-up Points
            </label>
            <div className="flex items-end gap-2">
              <input
                type="number"
                value={runnerupPoints}
                readOnly
                disabled
                className="w-full bg-transparent border-b-2 border-[#CBD5E1] text-2xl font-bold text-[#475569] focus:outline-none transition-colors pb-1 cursor-not-allowed"
              />
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2">
                pts
              </span>
            </div>
          </div>

          {!isTeamCategory && (
            <div className="p-6 bg-[#F0F9FF] border border-[#E0F2FE] rounded-2xl group transition-all">
              <label className="block text-xs font-semibold text-[#0369A1] uppercase tracking-wider mb-3 opacity-80">
                2nd Runner-up Points
              </label>
              <div className="flex items-end gap-2">
                <input
                  type="number"
                  value={participationPoints}
                  readOnly
                  disabled
                  className="w-full bg-transparent border-b-2 border-[#BAE6FD] text-2xl font-bold text-[#0369A1] focus:outline-none transition-colors pb-1 cursor-not-allowed"
                />
                <span className="text-xs font-bold text-[#0EA5E9] uppercase tracking-widest mb-2">
                  pts
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incentives and Recognition */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-1 flex flex-col">
        <div className="flex items-center justify-between my-2 px-3">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">
            Awards & Recognition
          </h3>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {commonAwards.map((award: any) => (
              <button
                key={award}
                onClick={() => toggleAward(award)}
                className={`p-4 rounded-xl border text-left transition-all group ${
                  awards.includes(award)
                    ? "bg-[#1A1A1A]/5 border-[#1A1A1A] text-[#1A1A1A] shadow-sm"
                    : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#1A1A1A]/30 hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${awards.includes(award) ? "bg-[#1A1A1A]/5" : "bg-[#F9FAFB] border border-[#E5E7EB]"}`}
                  >
                    {award.includes("Medal") ? (
                      <Award className="w-3.5 h-3.5" />
                    ) : award.includes("Trophy") ? (
                      <Trophy className="w-3.5 h-3.5" />
                    ) : (
                      <Star className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {awards.includes(award) ? (
                    <div className="w-4 h-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#E5E7EB] bg-white group-hover:border-[#1A1A1A]/30" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider leading-tight block ${awards.includes(award) ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}
                >
                  {award}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
