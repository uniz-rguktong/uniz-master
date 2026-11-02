import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  AlertCircle,
  HelpCircle,
  Clock,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { enableOutingsAndOutpasses } from "@/config/featureFlags";
import {
  portalEyebrowClass,
  portalIconTileClass,
  portalNumsClass,
  portalQuickTileClass,
  portalSectionHeaderClass,
  portalSectionTitleClass,
  portalStatItemClass,
  portalStatLabelClass,
  portalStatStripClass,
  portalStatValueClass,
  portalTitleClass,
  portalSubtitleClass,
} from "@/lib/portal-ui";
import { cn } from "@/lib/utils";

type AttendanceRow = { totalClasses?: number; attendedClasses?: number };
type GradeRow = { grade?: number | string };

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function overallAttendance(rows: unknown): number | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let total = 0;
  let attended = 0;
  for (const r of rows as AttendanceRow[]) {
    total += Number(r?.totalClasses) || 0;
    attended += Number(r?.attendedClasses) || 0;
  }
  return total > 0 ? Math.round((attended / total) * 1000) / 10 : null;
}

function averageGrade(rows: unknown): number | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const nums = (rows as GradeRow[])
    .map((g) => Number(g?.grade))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

type Tile = {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
};

export default function DashboardOverview({ user }: { user: any }) {
  const navigate = useNavigate();
  const firstName = String(user?.name || "").trim().split(/\s+/)[0] || "there";
  const attendance = overallAttendance(user?.attendance);
  const avg = averageGrade(user?.grades);
  const graded = Array.isArray(user?.grades) ? user.grades.length : 0;
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const stats: { label: string; value: string; icon: LucideIcon; accent?: boolean }[] = [
    {
      label: "Overall attendance",
      value: attendance === null ? "--" : `${attendance}%`,
      icon: CalendarCheck,
      accent: attendance !== null && attendance < 75,
    },
    { label: "Average grade points", value: avg === null ? "--" : avg.toFixed(2), icon: TrendingUp },
    { label: "Subjects graded", value: String(graded), icon: BookOpen },
    { label: "Current year", value: String(user?.year || "--"), icon: Layers },
  ];

  const tiles: Tile[] = [
    { label: "Results", hint: "Grades and semester GPA", href: "/student/gradehub", icon: GraduationCap },
    { label: "Attendance", hint: "Subject-wise records", href: "/student/attendance", icon: CalendarCheck },
    { label: "Registration", hint: "This semester's courses", href: "/student/registration", icon: ClipboardCheck },
    ...(enableOutingsAndOutpasses
      ? [
          { label: "Outing", hint: "Request a short outing", href: "/student/outing", icon: Clock },
          { label: "Outpass", hint: "Request leave from campus", href: "/student/outpass", icon: CalendarDays },
        ]
      : []),
    { label: "Grievance", hint: "Raise an issue", href: "/student/grievance", icon: AlertCircle },
    { label: "Help", hint: "Support and contacts", href: "/student/help", icon: HelpCircle },
  ];

  return (
    <section className="mb-10 space-y-8" aria-label="Overview">
      <header className="flex flex-col gap-2">
        <p className={portalEyebrowClass}>{today}</p>
        <h1 className={portalTitleClass}>
          {greeting()}, {firstName}
        </h1>
        <p className={portalSubtitleClass}>
          <span className={portalNumsClass}>{user?.username}</span>
          {user?.branch ? ` · ${user.branch}` : ""}
          {user?.year ? ` · ${user.year}` : ""}
          {user?.section ? ` · Section ${user.section}` : ""}
        </p>
      </header>

      <div className={portalStatStripClass}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={portalStatItemClass}>
              <div className="mb-4 flex items-center justify-between">
                <span className={cn(portalIconTileClass, "size-9 [&_svg]:size-[18px]")}>
                  <Icon strokeWidth={1.75} aria-hidden="true" />
                </span>
                {s.accent && (
 <span className="rounded-full bg-[#EA2027]/[0.08] px-2 py-0.5 text-[12px] font-medium text-[#C81A20]">
                    Below 75%
                  </span>
                )}
              </div>
              <p className={portalStatValueClass}>{s.value}</p>
              <p className={portalStatLabelClass}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className={portalSectionHeaderClass}>
          <div>
 <h2 className={cn(portalSectionTitleClass, "text-[16px]")}>Quick actions</h2>
 <p className="mt-1 text-[13px] text-[#64748B]">Jump to what you need most.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.href}
                type="button"
                onClick={() => navigate(t.href)}
                className={portalQuickTileClass}
              >
                <div className="flex w-full items-start justify-between">
                  <span className={portalIconTileClass}>
                    <Icon strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
 className="text-[#94A3B8] transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0A2540] motion-reduce:transition-none"
                  />
                </div>
                <div>
 <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#0A2540]">{t.label}</p>
 <p className="mt-0.5 text-[12px] leading-5 text-[#64748B]">{t.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
