"use client";

import { ActionMenu } from "@/components/ActionMenu";
import { Checkbox } from "@/components/Checkbox";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Registration,
  TeamRegistration,
  ColumnDefinition,
} from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RegistrationsTableContentProps {
  isLoading: boolean;
  registrations: Registration[];
  columns: ColumnDefinition<Registration>[];
  selectedIds: string[];
  toggleSelectAll: () => void;
  toggleSelectRow: (id: string) => void;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  handleSort: (field: string) => void;
  getSortIndicator: (field: string) => string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: { total: number; totalPages: number; limit: number };
  itemsPerPage: number;
  onViewDetails: (reg: Registration) => void;
  onSendEmail: (reg: Registration) => void;
  onDelete: (id: string) => void;
  onAnnounceWinners?: (reg: Registration) => void | Promise<void>;
  title: string;
  tooltipText: string;
  showSelection?: boolean;
}

export function RegistrationsTableContent({
  isLoading,
  registrations,
  columns,
  selectedIds,
  toggleSelectAll,
  toggleSelectRow,
  sortField,
  sortDirection,
  handleSort,
  getSortIndicator,
  currentPage,
  setCurrentPage,
  pagination,
  itemsPerPage,
  onViewDetails,
  onSendEmail,
  onDelete,
  onAnnounceWinners,
  title,
  tooltipText,
  showSelection = true,
}: RegistrationsTableContentProps) {
  return (
    <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] animate-card-entrance">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[16px] px-[12px] mt-[-4px] gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide text-[14px]">
            {title}
          </h2>
          <InfoTooltip text={tooltipText} />
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-white border-b border-[#F3F4F6]">
              <tr>
                <th className="px-6 py-3 text-left">
                  {showSelection ? (
                    <Checkbox
                      checked={
                        registrations.length > 0 &&
                        selectedIds.length === registrations.length
                      }
                      onChange={toggleSelectAll}
                      size="sm"
                    />
                  ) : null}
                </th>
                {columns.map((col: any) => (
                  <th
                    key={col.key}
                    onClick={() =>
                      col.sortable !== false && handleSort(col.key)
                    }
                    className={`px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider ${col.sortable !== false ? "cursor-pointer hover:bg-[#F9FAFB]" : ""} transition-colors ${col.className || ""}`}
                  >
                    {col.label}
                    {col.sortable !== false && getSortIndicator(col.key)}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_: any, i: any) => (
                  <tr key={i} className="border-b border-[#F3F4F6]">
                    <td className="px-6 py-4">
                      {showSelection ? (
                        <Skeleton width={20} height={20} borderRadius={4} />
                      ) : null}
                    </td>
                    {columns.map((col: any) => (
                      <td key={col.key} className="px-6 py-4">
                        <Skeleton width={100} height={16} />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <Skeleton
                        width={32}
                        height={32}
                        borderRadius={8}
                        className="ml-auto"
                      />
                    </td>
                  </tr>
                ))
              ) : registrations.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-center py-12"
                  >
                    <p className="text-sm text-[#6B7280]">
                      No registrations found
                    </p>
                  </td>
                </tr>
              ) : (
                registrations.map((registration: any, index: any) => (
                  <tr
                    key={registration.id}
                    className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors animate-row-entrance ${index === registrations.length - 1 ? "border-b-0" : ""}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td className="px-6 py-4">
                      {showSelection ? (
                        <Checkbox
                          checked={selectedIds.includes(registration.id)}
                          onChange={() => toggleSelectRow(registration.id)}
                          size="sm"
                        />
                      ) : null}
                    </td>
                    {columns.map((col: any) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render(registration)
                          : (registration as any)[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ActionMenu
                          actions={[
                            {
                              label: "View Details",
                              icon: "view",
                              onClick: () => onViewDetails(registration),
                            },
                            {
                              label: "Send Email",
                              icon: "send",
                              onClick: () => onSendEmail(registration),
                            },
                            ...(onAnnounceWinners
                              ? [
                                  {
                                    label: "Announce Winners",
                                    icon: "award" as const,
                                    onClick: () =>
                                      onAnnounceWinners(registration),
                                  },
                                ]
                              : []),
                            {
                              label: "Delete",
                              icon: "delete",
                              onClick: () => onDelete(registration.id),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {registrations.length > 0 && (
          <div className="px-6 py-4 border-t border-[#F3F4F6] flex items-center justify-between bg-white">
            <div className="text-sm text-[#6B7280]">
              Showing{" "}
              <span className="font-medium text-[#1A1A1A]">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-[#1A1A1A]">
                {(currentPage - 1) * itemsPerPage + registrations.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#1A1A1A]">
                {pagination.total}
              </span>{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(currentPage + 1, pagination.totalPages),
                  )
                }
                disabled={currentPage >= pagination.totalPages || isLoading}
                className="p-2 text-sm font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
