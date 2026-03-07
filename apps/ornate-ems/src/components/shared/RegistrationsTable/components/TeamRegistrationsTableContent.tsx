"use client";

import { ActionMenu } from "@/components/ActionMenu";
import { Checkbox } from "@/components/Checkbox";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamRegistration, ColumnDefinition } from "../types";

interface TeamRegistrationsTableContentProps {
  isLoading: boolean;
  teams: TeamRegistration[];
  columns: ColumnDefinition<TeamRegistration>[];
  selectedIds: string[];
  toggleSelectAll: () => void;
  toggleSelectRow: (id: string) => void;
  onViewDetails: (team: TeamRegistration) => void;
  onSendEmail: (team: TeamRegistration) => void;
  onDelete: (id: string) => void;
  onAnnounceWinners?: (team: TeamRegistration) => void | Promise<void>;
  title: string;
  tooltipText: string;
  showSelection?: boolean;
}

export function TeamRegistrationsTableContent({
  isLoading,
  teams,
  columns,
  selectedIds,
  toggleSelectAll,
  toggleSelectRow,
  onViewDetails,
  onSendEmail,
  onDelete,
  onAnnounceWinners,
  title,
  tooltipText,
  showSelection = true,
}: TeamRegistrationsTableContentProps) {
  return (
    <div className="mt-8 bg-[#F4F2F0] rounded-[18px] px-[10px] py-[24px] animate-card-entrance">
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
                        teams.length > 0 && selectedIds.length === teams.length
                      }
                      onChange={toggleSelectAll}
                      size="sm"
                    />
                  ) : null}
                </th>
                {columns.map((col: any) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_: any, i: any) => (
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
              ) : teams.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-center py-12"
                  >
                    <p className="text-sm text-[#6B7280]">
                      No team registrations found
                    </p>
                  </td>
                </tr>
              ) : (
                teams.map((team: any, index: any) => (
                  <tr
                    key={team.id}
                    className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors animate-row-entrance ${index === teams.length - 1 ? "border-b-0" : ""}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td className="px-6 py-4">
                      {showSelection ? (
                        <Checkbox
                          checked={selectedIds.includes(team.id)}
                          onChange={() => toggleSelectRow(team.id)}
                          size="sm"
                        />
                      ) : null}
                    </td>
                    {columns.map((col: any) => (
                      <td key={col.key} className="px-6 py-4">
                        {col.render ? col.render(team) : (team as any)[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ActionMenu
                          actions={[
                            {
                              label: "View Details",
                              icon: "view",
                              onClick: () => onViewDetails(team),
                            },
                            {
                              label: "Send Email",
                              icon: "send",
                              onClick: () => onSendEmail(team),
                            },
                            ...(onAnnounceWinners
                              ? [
                                  {
                                    label: "Announce Winners",
                                    icon: "award" as const,
                                    onClick: () => onAnnounceWinners(team),
                                  },
                                ]
                              : []),
                            {
                              label: "Delete",
                              icon: "delete",
                              onClick: () => onDelete(team.id),
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
      </div>
    </div>
  );
}
