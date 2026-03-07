import {
  Users,
  Trophy,
  Edit,
  Eye,
  UserPlus,
  Swords,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { ActionMenu } from "@/components/ActionMenu";
import { useSession } from "next-auth/react";

import type { SVGProps } from "react";

interface SportCardItem {
  id: string;
  name: string;
  status?: string;
  poster?: string;
  category?: string;
  type?: string; // Gender display: Boys / Girls / Mixed
  format?: string; // KNOCKOUT / LEAGUE / GROUP_KNOCKOUT
  registrations?: number;
  capacity?: number;
  winnerPoints?: number;
  runnerPoints?: number;
  secondRunnerPoints?: number;
  matchesCount?: number;
  teamsCount?: number;
  isDraft?: boolean;
  isArchived?: boolean;
}

interface SportCardProps {
  sport: SportCardItem;
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onEdit: (sport: SportCardItem) => void;
  onCopy: (sport: SportCardItem) => void;
  onArchive: (sport: SportCardItem) => void;
  onDelete: (sport: SportCardItem) => void;
  onPublish: (sport: SportCardItem) => void;
}

export function SportCard({
  sport,
  onNavigate,
  onEdit,
  onCopy,
  onArchive,
  onDelete,
  onPublish,
}: SportCardProps) {
  const { data: session } = useSession();
  const isCompleted = sport.status === "Completed";

  // A user is considered a branch sports coordinator if they have the explicit role
  // or if they are a sports admin assigned to a specific branch (the 5 branch portals)
  const isSportsCoordinator = session?.user?.role === "BRANCH_SPORTS_ADMIN";

  return (
    <div className="group animate-card-entrance">
      {/* Premium Outer Container */}
      <div className="w-full bg-[#F4F2F0] rounded-[24px] p-[10px] flex flex-col gap-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* TITLE Section */}
        <div className="flex items-center justify-between px-[12px] py-[4px] mt-[4px]">
          <h3 className="text-[15px] font-bold text-[#1A1A1A] leading-tight truncate max-w-[70%] tracking-tight">
            {sport.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                sport.type === "Girls" || sport.type === "FEMALE"
                  ? "bg-pink-50 text-pink-600 border border-pink-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}
            >
              {sport.type || "Boys"}
            </span>
            {isCompleted && (
              <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckIcon className="w-3.5 h-3.5 text-[#10B981]" />
              </div>
            )}
          </div>
        </div>

        {/* Inner Card Container */}
        <div className="bg-white rounded-[18px] p-[10px] flex flex-col gap-4 border border-[#E5E7EB]/50 shadow-sm">
          {/* 1. IMAGE SECTION (16:9 ratio) */}
          <div className="relative w-full aspect-video rounded-[14px] overflow-hidden group/thumbnail bg-[#F7F8FA]">
            <Image
              src={
                sport.poster ||
                "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070"
              }
              alt={sport.name}
              fill
              className="object-cover transition-transform duration-700 group-hover/thumbnail:scale-110"
            />

            {/* Status Badge - Top Left */}
            <div
              className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white shadow-lg bg-black/60`}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1 h-1 rounded-full animate-pulse bg-white`}
                />
                {sport.status}
              </div>
            </div>

            {/* Category Badge - Bottom Left */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-medium bg-white text-[#1A1A1A] border border-[#E5E7EB] shadow-sm">
              {sport.category}
            </div>
          </div>

          {/* 2. STATS & ACTION ROW */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4 text-[#7A7772]">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 opacity-60" />
                <span className="text-[11px] font-medium">
                  {sport.registrations} reg
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 opacity-60" />
                <span className="text-[11px] font-medium">
                  {(sport.category === "Individual" ||
                    sport.name.toLowerCase().includes("athletics")) &&
                  sport.winnerPoints === 10
                    ? 5
                    : sport.winnerPoints || 0}{" "}
                  pts
                </span>
              </div>
              {sport.matchesCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 opacity-60" />
                  <span className="text-[11px] font-medium">
                    {sport.matchesCount} matches
                  </span>
                </div>
              )}
            </div>

            <ActionMenu
              actions={[
                {
                  label: "View Bracket/Polls",
                  icon: "view",
                  onClick: () => onNavigate("polls-fixtures"),
                },
                {
                  label: "View Teams",
                  icon: "users",
                  onClick: () =>
                    onNavigate("all-registrations", {
                      eventId: sport.id,
                      filterSport: sport.name,
                    }),
                },
                ...(!isSportsCoordinator
                  ? [
                      { divider: true },
                      {
                        label: "Edit Competition",
                        icon: "edit",
                        onClick: () => onEdit(sport),
                      },
                      {
                        label: "Duplicate Sport",
                        icon: "copy",
                        onClick: () => onCopy(sport),
                      },
                      ...(sport.isDraft
                        ? [
                            {
                              label: "Restore to All Sports",
                              icon: "check",
                              onClick: () => onPublish(sport),
                            },
                          ]
                        : []),
                      {
                        label: sport.isArchived ? "Restore" : "Archive",
                        icon: "archive",
                        onClick: () => onArchive(sport),
                      },
                      {
                        label: "Delete",
                        icon: "delete",
                        onClick: () => onDelete(sport),
                        danger: true,
                      },
                    ]
                  : []),
              ]}
              size="sm"
            />
          </div>

          {/* 3. SPORT INFO GRID */}
          <div className="grid grid-cols-2 gap-2 px-1">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <Swords className="w-3 h-3 text-[#1A1A1A]/40" />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  Format
                </span>
                <span className="text-[11px] font-bold text-[#1A1A1A]">
                  {sport.format || "Knockout"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <Layers className="w-3 h-3 text-[#1A1A1A]/40" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  Category
                </span>
                <span className="text-[11px] font-bold text-[#1A1A1A] truncate">
                  {sport.category || "Team"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. RUNNER-UP POINTS */}
          {sport.runnerPoints !== undefined && sport.runnerPoints > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">
                RUNNER-UP POINTS
              </span>
              <span className="text-[10px] font-bold text-[#1A1A1A]">
                {(sport.category === "Individual" ||
                  sport.name.toLowerCase().includes("athletics")) &&
                sport.runnerPoints === 5
                  ? 3
                  : sport.runnerPoints}{" "}
                pts
              </span>
            </div>
          )}

          {/* 4b. 2nd RUNNER-UP POINTS */}
          {(sport.category === "Individual" ||
            sport.name.toLowerCase().includes("athletics") ||
            (sport.secondRunnerPoints !== undefined &&
              sport.secondRunnerPoints > 0)) && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">
                2nd RUNNER-UP POINTS
              </span>
              <span className="text-[10px] font-bold text-[#1A1A1A]">
                {(sport.category === "Individual" ||
                  sport.name.toLowerCase().includes("athletics")) &&
                (sport.secondRunnerPoints === 0 || !sport.secondRunnerPoints)
                  ? 1
                  : sport.secondRunnerPoints || 0}{" "}
                pts
              </span>
            </div>
          )}

          {/* 5. ACTION BUTTON ROW */}
          <div className="flex gap-2 pt-2 border-t border-[#F1F3F5]">
            <button
              onClick={() =>
                onNavigate(
                  isSportsCoordinator ? "add-registration" : "polls-fixtures",
                  isSportsCoordinator ? { initialData: sport } : undefined,
                )
              }
              className={`flex-1 h-9 ${isSportsCoordinator ? "bg-[#10B981]" : "bg-[#1A1A1A]"} text-white rounded-[12px] hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn shadow-sm`}
            >
              {isSportsCoordinator ? (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-white group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Add Registration
                  </span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-white group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Polls and Fixtures
                  </span>
                </>
              )}
            </button>
            <button
              onClick={() =>
                isSportsCoordinator
                  ? onNavigate("polls-fixtures")
                  : onEdit(sport)
              }
              className="flex-1 h-9 bg-white border border-[#E5E7EB] rounded-[12px] hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn shadow-sm"
            >
              {isSportsCoordinator ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#1A1A1A] group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    View Polls
                  </span>
                </>
              ) : (
                <>
                  <Edit className="w-3.5 h-3.5 text-[#1A1A1A] group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Edit
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
