'use client';
import { useState } from 'react';
import { RotateCw, Settings2, Users } from 'lucide-react';

interface BracketsFixturesData {
  tournamentType?: string;
  format?: string;
  seedingType?: string;
  matchDuration?: string;
}

interface BracketsFixturesStepProps {
  data: BracketsFixturesData;
  updateData: (patch: Partial<BracketsFixturesData>) => void;
}

export function BracketsFixturesStep({ data, updateData }: BracketsFixturesStepProps) {
  const [tournamentType, setTournamentType] = useState(data.tournamentType || data.format || 'KNOCKOUT');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tournament Type Selection */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-4 px-1">Tournament Format</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'KNOCKOUT', name: 'Single Knockout', desc: 'Teams are eliminated immediately after a single loss.' },
            { id: 'LEAGUE', name: 'League', desc: 'Every team plays against all other teams in the group.' },
            { id: 'GROUP_KNOCKOUT', name: 'Group Knockout', desc: 'Group stage followed by knockout rounds.' },
          ].map((type: any) => (
            <button
              key={type.id}
              onClick={() => {
                setTournamentType(type.id);
                updateData({ tournamentType: type.id, format: type.id });
              }}
              className={`p-4 rounded-xl border text-left transition-all group ${tournamentType === type.id
                ? 'border-[#1A1A1A] bg-[#1A1A1A]/5 shadow-sm'
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1A1A1A]/30 hover:bg-[#F9FAFB]'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${tournamentType === type.id ? 'text-[#1A1A1A]' : 'text-[#6B7280]'}`}>{type.name}</span>
                {tournamentType === type.id ? (
                  <div className="w-4 h-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#E5E7EB] bg-white group-hover:border-[#1A1A1A]/30" />
                )}
              </div>
              <p className="text-xs text-[#6B7280] opacity-80">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#F3F4F6]" />

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Match Duration (Minutes)
        </label>
        <div className="relative">
          <input
            type="number"
            placeholder="e.g. 40"
            value={data.matchDuration || ''}
            onChange={(e) => updateData({ matchDuration: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] outline-none shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <Settings2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
