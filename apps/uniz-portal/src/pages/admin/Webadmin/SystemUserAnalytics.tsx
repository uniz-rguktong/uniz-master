import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import {
  ANALYTICS_SYSTEM_USERS,
  getAnalyticsHeaders,
} from "../../../api/endpoints";
import { KPICard } from "../AnalyticsUI";
import { DonutChart } from "../../../components/ui/donut-chart";
import IdentityInsightsPanel from "./IdentityInsightsPanel";
import InstitutionAnalytics from "./InstitutionAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { formatDisplayText } from "@/utils/displayText";
import { cn } from "../../../utils/cn";
import { useAdminDashboardStats } from "../../../hooks/useAdminDashboardStats";
import { Panel } from "@/components/ui/panel";

import { useRecoilState } from "recoil";
import { systemUserAnalyticsAtom } from "../../../store/atoms";
import { KPICardSkeleton, DonutChartSkeleton } from "../AnalyticsUI";

const ROLE_COLORS = ["var(--navy-600)", "var(--navy-300)", "var(--navy-800)", "var(--text-3)"];

export default function SystemUserAnalytics() {
  const [cachedData, setCachedData] = useRecoilState(systemUserAnalyticsAtom);
  const [loading, setLoading] = useState(!cachedData.fetched);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const role = (localStorage.getItem("role") || "webadmin")
    .toLowerCase()
    .replace(/"/g, "");
  const { data: academicStats, loading: statsLoading } =
    useAdminDashboardStats(role);

  useEffect(() => {
    const fetchData = async () => {
      // Analytics fetching is restricted to production host [uniz.rguktong.in]
      // Commented out for localhost (Fast Path)
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname !== "uniz.rguktong.in"
      ) {
        console.log(
          "Analytics fetching skipped on non-production host:",
          window.location.hostname,
        );
        setLoading(false);
        return;
      }

      try {
        if (!cachedData.fetched) setLoading(true);
        const res = await fetch(ANALYTICS_SYSTEM_USERS, {
          headers: getAnalyticsHeaders(),
        });
        const json = await res.json();

        let apiData = [];
        if (json?.success && Array.isArray(json?.data)) {
          apiData = json.data;
        } else if (Array.isArray(json)) {
          apiData = json;
        }
        setCachedData({ fetched: true, data: apiData });
      } catch (err) {
        console.error("System users analytics failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const data = cachedData.data;

  const roleData = useMemo(() => {
    // Group by role name and aggregate values
    const grouped = data.reduce((acc: Record<string, any>, curr) => {
      const roleKey = (curr.role || "unknown").toUpperCase();
      if (!acc[roleKey]) {
        acc[roleKey] = {
          label: formatDisplayText(roleKey),
          value: 0,
          color: ROLE_COLORS[0],
        };
      }
      acc[roleKey].value +=
        (Number(curr.Active) || 0) + (Number(curr.Disabled) || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a: any, b: any) => b.value - a.value)
      .map((item: any, index: number) => ({
        ...item,
        color: ROLE_COLORS[index % ROLE_COLORS.length],
      }));
  }, [data]);

  const totalUsersCount = useMemo(
    () => roleData.reduce((sum, d) => sum + d.value, 0),
    [roleData],
  );
  const activeSegment = useMemo(
    () => roleData.find((s) => s.label === hoveredSegment),
    [roleData, hoveredSegment],
  );

  if (loading && !cachedData.fetched) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex lg:col-span-4">
            <DonutChartSkeleton />
          </div>
          <div className="flex lg:col-span-8">
            <div className="min-h-[400px] w-full animate-pulse rounded-md bg-tint" />
          </div>
        </div>
      </div>
    );
  }

  const totalActive = data.reduce(
    (acc, curr) => acc + (Number(curr.Active) || 0),
    0,
  );
  const totalDisabled = data.reduce(
    (acc, curr) => acc + (Number(curr.Disabled) || 0),
    0,
  );
  const totalUsers = totalActive + totalDisabled;

  const staffTotal = data
    .filter((item) =>
      [
        "webadmin",
        "dean",
        "hod",
        "admin",
        "staff",
        "swo",
        "director",
        "coe",
      ].includes(item.role?.toLowerCase()),
    )
    .reduce(
      (acc, curr) =>
        acc + (Number(curr.Active) || 0) + (Number(curr.Disabled) || 0),
      0,
    );

  const displayValue = activeSegment?.value ?? totalUsersCount;
  const displayLabel = activeSegment?.label ?? "Total Identities";
  const displayPercentage = activeSegment
    ? (activeSegment.value / totalUsersCount) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Academic Insights */}
      {academicStats && (
        <div className="space-y-4">
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
            {academicStats.currentSemester || "Current Semester"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Students"
              value={academicStats.totalStudents.toLocaleString()}
              icon={GraduationCap}
              badge="Enrolled"
            />
            <KPICard
              title="Average GPA"
              value={academicStats.avgGPA ?? "—"}
              icon={BookOpen}
              badge="Institution"
            />
            <KPICard
              title="Backlogs"
              value={academicStats.backlogCount}
              icon={AlertTriangle}
              badge={academicStats.backlogCount ? "At Risk" : "Clear"}
              iconColor={
                academicStats.backlogCount
                  ? "text-warning"
                  : "text-success"
              }
            />
            <KPICard
              title="Active Semesters"
              value={academicStats.activeSemesters}
              icon={CalendarClock}
              badge="Running"
            />
          </div>
        </div>
      )}
      {statsLoading && !academicStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      )}

      <InstitutionAnalytics />

      <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
        Platform accounts
      </h2>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total accounts"
          value={totalUsers.toLocaleString()}
          icon={Users}
          badge="Registered"
          iconColor="text-link"
          iconBg="bg-tint"
        />
        <KPICard
          title="Active accounts"
          value={totalActive.toLocaleString()}
          icon={UserCheck}
          badge="Enabled"
          iconColor="text-success"
          iconBg="bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]"
        />
        <KPICard
          title="Disabled accounts"
          value={totalDisabled.toLocaleString()}
          icon={UserX}
          badge="Restricted"
          iconColor="text-error"
          iconBg="bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))]"
        />
        <KPICard
          title="Staff accounts"
          value={staffTotal.toLocaleString()}
          icon={Shield}
          badge="Admin roles"
          iconColor="text-text-2"
          iconBg="bg-surface-2"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
        {/* New Interactive Donut Chart */}
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
                animationDuration={1.2}
                animationDelayPerSegment={0.05}
                highlightOnHover={true}
                onSegmentHover={(s) => setHoveredSegment(s ? s.label : null)}
                centerContent={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displayLabel}
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      transition={{ duration: 0.2, ease: "circOut" }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <p className="mb-1 max-w-[140px] truncate text-dense text-text-2">
                        {displayLabel}
                      </p>
                      <p className="font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
                        {displayValue.toLocaleString()}
                      </p>
                      {activeSegment && (
                        <p className="mt-1.5 text-dense tabular-nums text-text-2">
                          {displayPercentage.toFixed(1)}%
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            <div className="mt-4 flex w-full flex-col space-y-1 border-t border-border pt-4">
              {roleData.map((segment, index) => (
                <motion.div
                  key={segment.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors duration-150",
                    hoveredSegment === segment.label ? "bg-tint" : "hover:bg-tint",
                  )}
                  onMouseEnter={() => setHoveredSegment(segment.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-dense font-medium text-text-2">
                      {segment.label}
                    </span>
                  </div>
                  <span className="text-dense font-semibold tabular-nums text-head">
                    {segment.value.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex lg:col-span-8">
          <IdentityInsightsPanel data={data} />
        </div>
      </div>
    </div>
  );
}
