import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CalendarClock,
  Home,
  MessageSquareWarning,
} from "lucide-react";
import { ADMIN_OVERVIEW_SUMMARY } from "../../../api/endpoints";
import { KPICard, KPICardSkeleton } from "../AnalyticsUI";
import { DonutChart } from "../../../components/ui/donut-chart";
import IdentityInsightsPanel from "./IdentityInsightsPanel";
import InstitutionAnalytics from "./InstitutionAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { formatDisplayText } from "@/utils/displayText";
import { cn } from "../../../utils/cn";
import { Panel } from "@/components/ui/panel";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  systemUserAnalyticsAtom,
  webadminInstitutionAnalyticsAtom,
} from "../../../store/atoms";

const ROLE_COLORS = ["var(--navy-600)", "var(--navy-300)", "var(--navy-800)", "var(--text-3)"];

const STAFF_ROLES = [
  "webadmin",
  "dean",
  "hod",
  "admin",
  "staff",
  "swo",
  "director",
  "coe",
];

type AccountRow = { role: string; active: number; disabled: number };
type OverviewData = {
  campus: {
    totalStudents: number;
    activeStudents: number;
    onCampus: number;
    offCampus: number;
    withBacklogs: number;
    avgCgpa: number | null;
  };
  branches: { branch: string; count: number }[];
  grievances: { category: string; status: string; count: number }[];
  academics: {
    totalStudents: number;
    avgGPA: number | null;
    backlogCount: number;
    activeSemesters: number;
    currentSemester: string | null;
  } | null;
  accounts: AccountRow[] | null;
  partial: { academics: boolean; accounts: boolean };
};

function CardError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[148px] flex-col rounded-lg border border-border bg-tile p-6">
      <p className="text-dense leading-5 text-text-2">{title}</p>
      <p className="mt-3 text-body text-head">Couldn&apos;t load</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 w-fit text-dense font-medium text-link"
      >
        Try again
      </button>
    </div>
  );
}

function CardRow({
  loading,
  failed,
  onRetry,
  titles,
  children,
}: {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  titles: string[];
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {titles.map((title) => (
          <KPICardSkeleton key={title} />
        ))}
      </div>
    );
  }
  if (failed) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {titles.map((title) => (
          <CardError key={title} title={title} onRetry={onRetry} />
        ))}
      </div>
    );
  }
  return <>{children}</>;
}

export default function SystemUserAnalytics() {
  const [cached, setCached] = useRecoilState(systemUserAnalyticsAtom);
  const institution = useRecoilValue(webadminInstitutionAnalyticsAtom);
  const [reloadKey, setReloadKey] = useState(0);
  const forceFresh = useRef(false);
  const seenInstitution = useRef(institution.fetched);
  const [chartsReady, setChartsReady] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    if (seenInstitution.current && !institution.fetched) {
      forceFresh.current = true;
      setCached({ fetched: false, data: null, error: null });
      setReloadKey((n) => n + 1);
    }
    seenInstitution.current = institution.fetched;
  }, [institution.fetched, setCached]);

  useEffect(() => {
    if (cached.fetched) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let live = true;
    const fresh = forceFresh.current;
    forceFresh.current = false;

    // Analytics fetching is restricted to production host [uniz.rguktong.in]
    // Commented out for localhost (Fast Path)
    // The overview now uses the user-service summary (SQL aggregates, 60s Redis)
    // on every host, instead of the landing-api fan-out that this gate skipped.
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    const url = fresh ? `${ADMIN_OVERVIEW_SUMMARY}?fresh=1` : ADMIN_OVERVIEW_SUMMARY;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || "Overview summary failed");
        }
        if (!live) return;
        setCached({ fetched: true, data: json.data, error: null });
      })
      .catch((err) => {
        if (!live) return;
        console.error("Overview summary failed:", err);
        setCached({
          fetched: true,
          data: null,
          error: "Couldn't load the overview",
        });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [reloadKey, cached.fetched, setCached]);

  useEffect(() => {
    const node = chartRef.current;
    if (!node || !cached.data) return;
    if (typeof IntersectionObserver === "undefined") {
      setChartsReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setChartsReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cached.data]);

  const data = (cached.data || null) as OverviewData | null;
  const loading = !cached.fetched && !cached.error;
  const failed = Boolean(cached.error) || (cached.fetched && !data);
  const retry = () => {
    forceFresh.current = true;
    setCached({ fetched: false, data: null, error: null });
    setReloadKey((n) => n + 1);
  };

  const accounts = useMemo(() => data?.accounts || [], [data]);
  const roleData = useMemo(() => {
    const grouped = new Map<string, { label: string; value: number; color: string }>();
    for (const row of accounts) {
      const roleKey = (row.role || "unknown").toUpperCase();
      const current = grouped.get(roleKey) || {
        label: formatDisplayText(roleKey),
        value: 0,
        color: ROLE_COLORS[0],
      };
      current.value += (Number(row.active) || 0) + (Number(row.disabled) || 0);
      grouped.set(roleKey, current);
    }
    return [...grouped.values()]
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: ROLE_COLORS[index % ROLE_COLORS.length],
      }));
  }, [accounts]);

  const totalUsersCount = roleData.reduce((sum, d) => sum + d.value, 0);
  const activeSegment = roleData.find((s) => s.label === hoveredSegment);
  const totalActive = accounts.reduce((sum, row) => sum + (Number(row.active) || 0), 0);
  const totalDisabled = accounts.reduce((sum, row) => sum + (Number(row.disabled) || 0), 0);
  const totalUsers = totalActive + totalDisabled;
  const staffTotal = accounts
    .filter((row) => STAFF_ROLES.includes((row.role || "").toLowerCase()))
    .reduce((sum, row) => sum + (Number(row.active) || 0) + (Number(row.disabled) || 0), 0);
  const roleRows = accounts.map((row) => ({
    role: row.role,
    Active: row.active,
    Disabled: row.disabled,
  }));

  const openGrievances = (data?.grievances || [])
    .filter((row) => String(row.status || "").toLowerCase() !== "resolved")
    .reduce((sum, row) => sum + (Number(row.count) || 0), 0);
  const campusPct =
    data && data.campus.activeStudents > 0
      ? Math.round((data.campus.onCampus / data.campus.activeStudents) * 100)
      : 0;

  const academicTitles = ["Total Students", "Average GPA", "Backlogs", "Active Semesters"];
  const campusTitles = ["Enrolled students", "On campus now", "Institution avg CGPA", "Open grievances"];
  const accountTitles = ["Total accounts", "Active accounts", "Disabled accounts", "Staff accounts"];

  const displayValue = activeSegment?.value ?? totalUsersCount;
  const displayLabel = activeSegment?.label ?? "Total Identities";
  const displayPercentage =
    activeSegment && totalUsersCount > 0
      ? (activeSegment.value / totalUsersCount) * 100
      : 100;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
          {data?.academics?.currentSemester || "Current semester"}
        </h2>
        <CardRow
          loading={loading}
          failed={failed || Boolean(data?.partial.academics) || !data?.academics}
          onRetry={retry}
          titles={academicTitles}
        >
          {data?.academics ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Students"
                value={data.academics.totalStudents.toLocaleString()}
                icon={GraduationCap}
                badge="Enrolled"
              />
              <KPICard
                title="Average GPA"
                value={data.academics.avgGPA ?? "—"}
                icon={BookOpen}
                badge="Institution"
              />
              <KPICard
                title="Backlogs"
                value={data.academics.backlogCount}
                icon={AlertTriangle}
                badge={data.academics.backlogCount ? "At Risk" : "Clear"}
                iconColor={data.academics.backlogCount ? "text-warning" : "text-success"}
              />
              <KPICard
                title="Active Semesters"
                value={data.academics.activeSemesters}
                icon={CalendarClock}
                badge="Running"
              />
            </div>
          ) : null}
        </CardRow>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
          Campus & academic snapshot
        </h2>
        <CardRow
          loading={loading}
          failed={failed || !data}
          onRetry={retry}
          titles={campusTitles}
        >
          {data ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Enrolled students"
                value={data.campus.activeStudents.toLocaleString()}
                icon={Users}
                badge="Active"
                iconColor="text-link"
              />
              <KPICard
                title="On campus now"
                value={`${campusPct}%`}
                icon={Home}
                badge={`${data.campus.onCampus.toLocaleString()} present`}
                iconColor="text-success"
              />
              <KPICard
                title="Institution avg CGPA"
                value={Number(data.campus.avgCgpa || 0).toFixed(2)}
                icon={GraduationCap}
                badge={`${Number(data.campus.withBacklogs || 0).toLocaleString()} with backlogs`}
                iconColor="text-warning"
              />
              <KPICard
                title="Open grievances"
                value={openGrievances.toLocaleString()}
                icon={MessageSquareWarning}
                badge={openGrievances > 0 ? "Needs review" : "Clear"}
                iconColor={openGrievances > 0 ? "text-error" : "text-success"}
              />
            </div>
          ) : null}
        </CardRow>
        {data ? (
          <InstitutionAnalytics
            campus={data.campus}
            branches={data.branches}
            grievances={data.grievances}
          />
        ) : null}
      </div>

      <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
        Platform accounts
      </h2>
      <CardRow
        loading={loading}
        failed={failed || Boolean(data?.partial.accounts) || !data?.accounts}
        onRetry={retry}
        titles={accountTitles}
      >
        {data?.accounts ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total accounts" value={totalUsers.toLocaleString()} icon={Users} badge="Registered" iconColor="text-link" iconBg="bg-tint" />
            <KPICard title="Active accounts" value={totalActive.toLocaleString()} icon={UserCheck} badge="Enabled" iconColor="text-success" iconBg="bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]" />
            <KPICard title="Disabled accounts" value={totalDisabled.toLocaleString()} icon={UserX} badge="Restricted" iconColor="text-error" iconBg="bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))]" />
            <KPICard title="Staff accounts" value={staffTotal.toLocaleString()} icon={Shield} badge="Admin roles" iconColor="text-text-2" iconBg="bg-surface-2" />
          </div>
        ) : null}
      </CardRow>

      <div ref={chartRef}>
        {data?.accounts && chartsReady ? (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className="flex lg:col-span-4">
              <Panel title="Accounts by role" className="h-full w-full">
                <p className="text-center text-dense leading-5 text-text-2">
                  Students, faculty & admin
                </p>
                <div className="relative mt-4 flex items-center justify-center">
                  <DonutChart
                    data={roleData}
                    size={220}
                    strokeWidth={25}
                    animationDuration={0.8}
                    highlightOnHover
                    onSegmentHover={(s) => setHoveredSegment(s ? s.label : null)}
                    centerContent={
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={displayLabel}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="flex flex-col items-center justify-center text-center"
                        >
                          <p className="mb-1 max-w-[140px] truncate text-dense text-text-2">
                            {displayLabel}
                          </p>
                          <p className="font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
                            {displayValue.toLocaleString()}
                          </p>
                          {activeSegment ? (
                            <p className="mt-1.5 text-dense tabular-nums text-text-2">
                              {displayPercentage.toFixed(1)}%
                            </p>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    }
                  />
                </div>
                <div className="mt-4 flex w-full flex-col space-y-1 border-t border-border pt-4">
                  {roleData.map((segment) => (
                    <div
                      key={segment.label}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5",
                        hoveredSegment === segment.label ? "bg-tint" : "hover:bg-tint",
                      )}
                      onMouseEnter={() => setHoveredSegment(segment.label)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                        <span className="text-dense font-medium text-text-2">{segment.label}</span>
                      </div>
                      <span className="text-dense font-semibold tabular-nums text-head">
                        {segment.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
            <div className="flex lg:col-span-8">
              <IdentityInsightsPanel data={roleRows} />
            </div>
          </div>
        ) : data?.accounts ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-hidden>
            <div className="h-72 rounded-md bg-tint lg:col-span-4" />
            <div className="h-72 rounded-md bg-tint lg:col-span-8" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
