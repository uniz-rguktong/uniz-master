import { X } from "lucide-react";

interface EventFiltersPanelProps {
  onClose: () => void;
}

export function EventFiltersPanel({ onClose }: EventFiltersPanelProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Filters</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#6B7280]" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[#374151] mb-3">
            Event Status
          </h3>
          <div className="space-y-2">
            {["Upcoming", "Ongoing", "Completed", "Draft"].map(
              (status: any) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#1A1A1A] focus:ring-[#1A1A1A]"
                  />
                  <span className="text-sm text-[#4B5563]">{status}</span>
                </label>
              ),
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#374151] mb-3">
            Event Type
          </h3>
          <div className="space-y-2">
            {["Technical", "Workshops", "Hackathons", "Cultural"].map(
              (type: any) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#1A1A1A] focus:ring-[#1A1A1A]"
                  />
                  <span className="text-sm text-[#4B5563]">{type}</span>
                </label>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
