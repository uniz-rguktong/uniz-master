"use client";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SportSetupData {
  sportName?: string | undefined;
  sportCategory?: string | undefined;
  athleticsType?: string | undefined;
  category?: string | undefined;
  genderType?: string | undefined;
  format?: string | undefined;
  winnerPoints?: number | undefined;
  runnerupPoints?: number | undefined;
  participationPoints?: number | undefined;
  minPlayers?: number | undefined;
  maxPlayers?: number | undefined;
  notes?: string | undefined;
}

interface SportSetupStepProps {
  data: SportSetupData;
  updateData: (patch: Partial<SportSetupData>) => void;
}

export function SportSetupStep({ data, updateData }: SportSetupStepProps) {
  const getFixedPointsByCategory = (selectedCategory: string) => {
    if (selectedCategory === "Team") {
      return { winnerPoints: 10, runnerupPoints: 5, participationPoints: 0 };
    }
    if (selectedCategory === "Individual") {
      return { winnerPoints: 5, runnerupPoints: 3, participationPoints: 1 };
    }
    return { winnerPoints: 0, runnerupPoints: 0, participationPoints: 0 };
  };

  const [showNewSportInput, setShowNewSportInput] = useState(false);
  const [newSportName, setNewSportName] = useState("");

  const handleAddNewSport = () => {
    const trimmedSport = newSportName.trim();
    if (!trimmedSport) return;

    const existingMatch = sportOptions.find(
      (item) => item.toLowerCase() === trimmedSport.toLowerCase(),
    );
    const finalSport = existingMatch || trimmedSport;

    if (!existingMatch) {
      setSportOptions((prev) => [...prev, finalSport]);
    }

    updateData({
      sportCategory: finalSport,
      sportName: finalSport,
      athleticsType: finalSport === "Athletics" ? data.athleticsType : "",
    });

    setNewSportName("");
    setShowNewSportInput(false);
  };

  const defaultSportOptions = [
    "Cricket",
    "Volleyball",
    "Badminton",
    "Basketball",
    "Football",
    "Kabaddi",
    "Kho-Kho",
    "Throwball",
    "Athletics",
  ];
  const [sportOptions, setSportOptions] = useState<string[]>(() => {
    if (
      data.sportCategory &&
      !defaultSportOptions.includes(data.sportCategory)
    ) {
      return [...defaultSportOptions, data.sportCategory];
    }
    return defaultSportOptions;
  });

  const athleticsTypes = [
    "100M",
    "400M",
    "800M",
    "4X100M Relay",
    "Shotput",
    "5K",
  ];
  const categories = ["Individual", "Team"];
  const genderTypes = [
    { label: "Boys", value: "MALE" },
    { label: "Girls", value: "FEMALE" },
  ];
  const formats = [{ label: "Knockout", value: "KNOCKOUT" }];

  const category = data.category || "Individual";
  const genderType = data.genderType || "MALE";
  const format = data.format || "KNOCKOUT";
  const sportCategory = data.sportCategory || "Cricket";
  const athleticsType = data.athleticsType || "";

  const maxPlayersValue = Number.parseInt(String(data.maxPlayers || "0"), 10);
  const minPlayersValue = Number.parseInt(String(data.minPlayers || "0"), 10);
  const isTeamSizeLessThanOne =
    category === "Team" && data.maxPlayers !== undefined && maxPlayersValue < 1;
  const isTeamSizeLessThanMin =
    category === "Team" &&
    data.maxPlayers !== undefined &&
    maxPlayersValue >= 1 &&
    minPlayersValue > 0 &&
    maxPlayersValue <= minPlayersValue;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-full min-w-0">
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Sport Name <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Select
                value={sportCategory}
                onValueChange={(value) => {
                  const shouldClearAthleticsType = value !== "Athletics";
                  const nextCategory =
                    value === "Athletics" ? "Individual" : "Team";
                  const fixedPoints = getFixedPointsByCategory(nextCategory);
                  const isTeam = nextCategory === "Team";

                  const derivedSportName = shouldClearAthleticsType
                    ? value
                    : athleticsType
                      ? `${value} - ${athleticsType}`
                      : value;

                  updateData({
                    sportCategory: value,
                    athleticsType: shouldClearAthleticsType
                      ? ""
                      : athleticsType,
                    sportName: derivedSportName,
                    category: nextCategory,
                    winnerPoints: fixedPoints.winnerPoints,
                    runnerupPoints: fixedPoints.runnerupPoints,
                    participationPoints: fixedPoints.participationPoints,
                    minPlayers: isTeam ? 11 : 1,
                    maxPlayers: isTeam ? 12 : 1,
                  });
                }}
              >
                <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A1A1A] shadow-sm">
                  <SelectValue placeholder="Select sport name" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5E7EB]">
                  {sportOptions.map((item: string) => (
                    <SelectItem
                      key={item}
                      value={item}
                      className="font-medium text-sm py-2 focus:bg-[#F9FAFB]"
                    >
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setShowNewSportInput((prev) => !prev)}
              className="h-12 px-4 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            >
              New Sport
            </button>
          </div>

          {showNewSportInput && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newSportName}
                onChange={(e) => setNewSportName(e.target.value)}
                placeholder="Enter new sport name"
                className="flex-1 h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
              <button
                type="button"
                onClick={handleAddNewSport}
                className="px-3 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {sportCategory === "Athletics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Athletics Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={athleticsType}
              onValueChange={(value) => {
                updateData({
                  athleticsType: value,
                  sportName: `${sportCategory} - ${value}`,
                });
              }}
            >
              <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A1A1A] shadow-sm">
                <SelectValue placeholder="Select athletics type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E5E7EB]">
                {athleticsTypes.map((item: string) => (
                  <SelectItem
                    key={item}
                    value={item}
                    className="font-medium text-sm py-2 focus:bg-[#F9FAFB]"
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={category}
            onValueChange={(value) => {
              const fixedPoints = getFixedPointsByCategory(value);
              const isTeam = value === "Team";

              const parsedCurrentMin = Number.parseInt(
                String(data.minPlayers || ""),
                10,
              );
              const parsedCurrentMax = Number.parseInt(
                String(data.maxPlayers || ""),
                10,
              );

              const nextMin = isTeam
                ? Number.isNaN(parsedCurrentMin)
                  ? 11
                  : parsedCurrentMin
                : 1;
              const nextMax = isTeam
                ? Number.isNaN(parsedCurrentMax)
                  ? 12
                  : Math.max(parsedCurrentMax, nextMin)
                : 1;

              updateData({
                category: value,
                minPlayers: nextMin,
                maxPlayers: nextMax,
                winnerPoints: fixedPoints.winnerPoints,
                runnerupPoints: fixedPoints.runnerupPoints,
                participationPoints: fixedPoints.participationPoints,
              });
            }}
          >
            <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A1A1A] shadow-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E5E7EB]">
              {categories.map((cat: any) => (
                <SelectItem
                  key={cat}
                  value={cat}
                  className="font-medium text-sm py-2 focus:bg-[#F9FAFB]"
                >
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className={`grid grid-cols-1 gap-3 mt-4 ${category === "Individual" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-2">
                Winner Points
              </label>
              <input
                type="number"
                min="0"
                value={data.winnerPoints ?? 0}
                readOnly
                disabled
                className="w-full px-3 py-2 border rounded-lg text-sm bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-2">
                Runner Points
              </label>
              <input
                type="number"
                min="0"
                value={data.runnerupPoints ?? 0}
                readOnly
                disabled
                className="w-full px-3 py-2 border rounded-lg text-sm bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {category === "Individual" && (
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-2">
                  2nd Runner Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.participationPoints ?? 0}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Competition Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 p-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl h-12 shadow-sm">
            {genderTypes.map((type: any) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  updateData({ genderType: type.value });
                }}
                className={`flex-1 h-full rounded-lg text-sm font-semibold tracking-wide transition-all border ${
                  genderType === type.value
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm"
                    : "bg-white text-[#1A1A1A] border-[#D1D5DB] hover:bg-[#FAFAFA]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {category === "Team" && (
        <div className="pl-0 md:pl-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">
              Min Size
            </label>
            <input
              type="number"
              min="1"
              value={data.minPlayers ?? ""}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (rawValue === "") {
                  updateData({ minPlayers: undefined });
                  return;
                }
                const parsed = Number.parseInt(rawValue, 10);
                if (!Number.isNaN(parsed)) {
                  updateData({ minPlayers: parsed });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">
              Max Size
            </label>
            <input
              type="number"
              min="1"
              value={data.maxPlayers ?? ""}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (rawValue === "") {
                  updateData({ maxPlayers: undefined });
                  return;
                }
                const parsed = Number.parseInt(rawValue, 10);
                if (!Number.isNaN(parsed)) {
                  updateData({ maxPlayers: parsed });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {isTeamSizeLessThanOne && (
              <p className="mt-2 text-[11px] font-medium text-[#DC2626]">
                Maximum size should not be less than 1.
              </p>
            )}
            {isTeamSizeLessThanMin && (
              <p className="mt-2 text-[11px] font-medium text-[#DC2626]">
                Maximum size should not be less than or equal to minimum size.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Tournament Format <span className="text-red-500">*</span>
          </label>
          <Select
            value={format}
            onValueChange={(value) => {
              updateData({ format: value });
            }}
          >
            <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A1A1A] shadow-sm">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E5E7EB]">
              {formats.map((item: any) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="font-medium text-sm py-2 focus:bg-[#F9FAFB]"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="h-full border border-[#E5E7EB] rounded-lg px-4 py-3 bg-[#FAFAFA] text-sm text-[#6B7280] flex items-center">
            Match scheduling happens later in fixtures.
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Special Announcements / Notes
        </label>
        <textarea
          rows={4}
          value={data.notes || ""}
          onChange={(e) => updateData({ notes: e.target.value })}
          placeholder="Any specific instructions for teams or captains..."
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent shadow-sm resize-none"
        />
      </div>
    </div>
  );
}
