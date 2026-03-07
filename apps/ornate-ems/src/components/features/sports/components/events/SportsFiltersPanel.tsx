import { X, Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

interface SportsFiltersPanelProps {
  onClose: () => void;
  onApply?: (filters: Record<string, string[]>) => void;
}

export function SportsFiltersPanel({
  onClose,
  onApply,
}: SportsFiltersPanelProps) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});

  const filterSections = [
    {
      title: "Competition Status",
      key: "status",
      options: ["Registration Open", "Ongoing", "Upcoming", "Completed"],
    },
    {
      title: "Gender Category",
      key: "gender",
      options: ["Boys", "Girls", "Mixed"],
    },
    {
      title: "Sport Category",
      key: "category",
      options: ["Team", "Individual"],
    },
    {
      title: "Tournament Format",
      key: "format",
      options: ["Knockout", "League", "Group Knockout"],
    },
  ];

  const toggleOption = (sectionKey: string, option: string) => {
    setSelected((prev) => {
      const copy = { ...prev };
      const set = new Set(copy[sectionKey] || []);
      if (set.has(option)) set.delete(option);
      else set.add(option);
      copy[sectionKey] = set;
      return copy;
    });
  };

  const isChecked = (sectionKey: string, option: string) => {
    return selected[sectionKey]?.has(option) ?? false;
  };

  const handleApply = () => {
    const result: Record<string, string[]> = {};
    for (const [key, set] of Object.entries(selected)) {
      if (set.size > 0) result[key] = Array.from(set);
    }
    onApply?.(result);
    onClose();
  };

  const handleReset = () => {
    setSelected({});
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1A1A1A]" />
          <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest">
            Advanced Filters
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
        >
          <X className="w-5 h-5 text-[#6B7280] group-hover:text-black" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
        {filterSections.map((section: any) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.options.map((option: any) => (
                <label
                  key={option}
                  className="flex items-center group cursor-pointer"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isChecked(section.key, option)}
                      onChange={() => toggleOption(section.key, option)}
                      className="peer appearance-none w-5 h-5 rounded-lg border-2 border-[#E5E7EB] checked:bg-[#1A1A1A] checked:border-[#1A1A1A] transition-all cursor-pointer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>
                  <span className="ml-3 text-xs font-bold text-[#4B5563] group-hover:text-black transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#F3F4F6] bg-[#F9FAFB] flex gap-3">
        <button
          onClick={handleApply}
          className="flex-1 h-12 bg-[#1A1A1A] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="w-12 h-12 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-2xl text-[#6B7280] hover:text-black hover:bg-gray-50 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
