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
import { Card } from "../../../components/ui/card";
import IdentityInsightsPanel from "./IdentityInsightsPanel";
import InstitutionAnalytics from "./InstitutionAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { formatDisplayText } from "@/utils/displayText";
import { cn } from "../../../utils/cn";
import { useAdminDashboardStats } from "../../../hooks/useAdminDashboardStats";

import { useRecoilState } from "recoil";
import { systemUserAnalyticsAtom } from "../../../store/atoms";
import { KPICardSkeleton, DonutChartSkeleton } from "../AnalyticsUI";

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
    const colors: Record<string, string> = {
      STUDENT: "#0B2A47",
      DEAN: "hsl(142.1 76.2% 36.3%)",
      HOD: "hsl(47.9 95.8% 53.1%)",
      WEBMASTER: "hsl(262.1 83.3% 57.8%)",
      ADMIN: "hsl(262.1 83.3% 57.8%)",
      COE: "hsl(199 89% 48%)",
      DIRECTOR: "hsl(346 77% 50%)",
      SWO: "hsl(25 95% 53%)",
    };

    // Group by role name and aggregate values
    const grouped = data.reduce((acc: Record<string, any>, curr) => {
      const roleKey = (curr.role || "unknown").toUpperCase();
      if (!acc[roleKey]) {
        acc[roleKey] = {
          label: formatDisplayText(roleKey),
          value: 0,
          color: colors[roleKey] || "hsl(0 0% 63.9%)",
        };
      }
      acc[roleKey].value +=
        (Number(curr.Active) || 0) + (Number(curr.Disabled) || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => b.value - a.value);
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
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex">
            <DonutChartSkeleton />
          </div>
          <div className="lg:col-span-8 flex">
            <div className="w-full bg-zinc-50/50 rounded-xl animate-pulse min-h-[400px]" />
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Academic Insights */}
      {academicStats && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.14em] uppercase">
              Academic overview
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mt-1">
              {academicStats.currentSemester || "Current Semester"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  ? "text-amber-500"
                  : "text-emerald-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      )}

      <InstitutionAnalytics />

      <div>
        <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.14em] uppercase">
          Access & identity
        </p>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mt-1">
          Platform accounts
        </h2>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total accounts"
          value={totalUsers.toLocaleString()}
          icon={Users}
          badge="Registered"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KPICard
          title="Active accounts"
          value={totalActive.toLocaleString()}
          icon={UserCheck}
          badge="Enabled"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KPICard
          title="Disabled accounts"
          value={totalDisabled.toLocaleString()}
          icon={UserX}
          badge="Restricted"
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <KPICard
          title="Staff accounts"
          value={staffTotal.toLocaleString()}
          icon={Shield}
          badge="Admin roles"
          iconColor="text-zinc-600"
          iconBg="bg-zinc-50"
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.14em] uppercase">
          Operations
        </p>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mt-1">
          Identity mix & access health
        </h2>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* New Interactive Donut Chart */}
        <div className="lg:col-span-4 flex">
          <Card className="p-7 w-full flex flex-col items-center justify-center space-y-7 bg-white border border-zinc-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] rounded-2xl transition-colors duration-300 hover:border-zinc-300">
            <div className="text-center space-y-1">
              <h2 className="text-[15px] font-semibold text-zinc-900 tracking-[-0.01em]">
                Accounts by role
              </h2>
              <p className="text-[11px] font-medium text-zinc-400 tracking-[0.14em]">
                Students, faculty & admin
              </p>
            </div>

            <div className="relative flex items-center justify-center">
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
                      <p className="text-zinc-400 text-[10px] font-medium tracking-[0.12em] mb-1 max-w-[120px] truncate">
                        {displayLabel}
                      </p>
                      <p className="text-[32px] font-semibold text-zinc-900 leading-none tracking-[-0.03em] tabular-nums">
                        {displayValue.toLocaleString()}
                      </p>
                      {activeSegment && (
                        <p className="text-xs font-semibold text-zinc-500 mt-1.5 tabular-nums">
                          {displayPercentage.toFixed(1)}%
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            <div className="flex flex-col space-y-1 w-full pt-5 border-t border-zinc-100">
              {roleData.map((segment, index) => (
                <motion.div
                  key={segment.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors duration-200 group cursor-pointer",
                    hoveredSegment === segment.label
                      ? "bg-zinc-50"
                      : "hover:bg-zinc-50/60",
                  )}
                  onMouseEnter={() => setHoveredSegment(segment.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="h-2 w-2 rounded-full group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-[12.5px] font-medium text-zinc-600 capitalize tracking-tight">
                      {segment.label.toLowerCase()}
                    </span>
                  </div>
                  <span className="text-[12.5px] font-semibold text-zinc-900 tabular-nums">
                    {segment.value.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 flex">
          <IdentityInsightsPanel data={data} />
        </div>
      </div>
    </div>
  );
}
