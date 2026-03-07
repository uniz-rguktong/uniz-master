"use client";

import { useState } from "react";
import { ModalContainer } from "./ModalContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ExportReportPayload {
  format: string;
  dateRange: string;
  includeCharts: boolean;
  includeDetails: boolean;
  events: string[];
}

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (payload: ExportReportPayload) => void;
}

export function ExportReportModal({
  isOpen,
  onClose,
  onExport,
}: ExportReportModalProps) {
  const [format, setFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState(["all"]);

  const handleExport = () => {
    onExport({
      format,
      dateRange,
      includeCharts,
      includeDetails,
      events: selectedEvents,
    });
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3 px-[6px]">
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[16px] font-normal text-[#1A1A1A] hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleExport}
        className="px-6 py-2.5 bg-[#22C55E] rounded-[10px] text-[16px] font-normal text-white hover:bg-[#16A34A] transition-colors"
      >
        Export Report
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Export Analytics Report"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Report Settings */}
        <div>
          <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-4">
            Report Settings
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Export Format */}
            <div>
              <label className="block text-[14px] font-normal text-[#1A1A1A] mb-2">
                Export Format *
              </label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-[10px] text-[14px]">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[14px] font-normal text-[#1A1A1A] mb-2">
                Date Range *
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full h-[42px] bg-white border border-[#E5E7EB] rounded-[10px] text-[14px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-4">
            Event Selection
          </h4>

          <div>
            <label className="block text-[14px] font-normal text-[#1A1A1A] mb-2">
              Select Events *
            </label>
            <select
              multiple
              value={selectedEvents}
              onChange={(e) => {
                const options = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );
                setSelectedEvents(options);
              }}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#10B981] h-32"
            >
              <option value="all">All Events</option>
              <option value="ai-ml-workshop">AI/ML Workshop 2025</option>
              <option value="hackathon">Hackathon 2025</option>
              <option value="tech-quiz">Tech Quiz Competition</option>
              <option value="robotics">Robotics Challenge</option>
              <option value="gaming">Gaming Tournament</option>
            </select>
            <p className="text-xs text-[#6B7280] mt-1">
              Hold Ctrl (Cmd on Mac) to select multiple events
            </p>
          </div>
        </div>

        {/* Include Options */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-4">
            Include in Report
          </h4>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#10B981] focus:ring-2 focus:ring-[#10B981]"
              />

              <div>
                <div className="text-[14px] font-normal text-[#1A1A1A]">
                  Include Charts and Graphs
                </div>
                <div className="text-xs text-[#6B7280]">
                  Visual representations of analytics data
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#10B981] focus:ring-2 focus:ring-[#10B981]"
              />

              <div>
                <div className="text-[14px] font-normal text-[#1A1A1A]">
                  Include Detailed Breakdown
                </div>
                <div className="text-xs text-[#6B7280]">
                  Event-wise registration and revenue details
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}
