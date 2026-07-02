import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Home,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import { useRecoilState } from "recoil";
import { motion } from "framer-motion";
import { DonutChart } from "../../../components/ui/donut-chart";
import { Card } from "../../../components/ui/card";
import { KPICard, KPICardSkeleton } from "../AnalyticsUI";
import { cn } from "../../../utils/cn";
import { formatDisplayText } from "@/utils/displayText";
import {
  ANALYTICS_BRANCH_DISTRIBUTION,
  ANALYTICS_GRIEVANCE_SUMMARY,
  ANALYTICS_INSTITUTION_SNAPSHOT,
  ADMIN_CAMPUS_PRESENCE_STATS,
  getAnalyticsHeaders,
} from "../../../api/endpoints";
import { webmasterInstitutionAnalyticsAtom } from "../../../store/atoms";

function isProdHost() {
  return (
    window.location.hostname !== "localhost" &&
    window.location.hostname === "uniz.rguktong.in"
  );
}

function AnalyticsCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "p-6 w-full bg-white border border-zinc-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] rounded-2xl",
        className,
      )}
    >
      <div className="mb-5">
        <h3 className="text-[15px] font-semibold text-zinc-900 tracking-[-0.01em]">
          {title}
        </h3>
        <p className="text-[11px] font-medium text-zinc-400 tracking-[0.12em] mt-0.5">
          {subtitle}
        </p>
      </div>
      {children}
    </Card>
  );
}

export default function InstitutionAnalytics() {
  const [cached, setCached] = useRecoilState(webmasterInstitutionAnalyticsAtom);
  const [loading, setLoading] = useState(!cached.fetched);
  const [campusStats, setCampusStats] = useState<{
    total_students: number;
    on_campus: number;
    off_campus: number;
  } | null>(null);
  const [campusStatsKey, setCampusStatsKey] = useState(0);

  const refreshCampusStats = useCallback(async () => {
    if (!isProdHost()) return;
    try {
      const res = await fetch(ADMIN_CAMPUS_PRESENCE_STATS, {
        headers: {
          ...getAnalyticsHeaders(),
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success && json?.data) {
        setCampusStats({
          total_students: Number(json.data.total_students) || 0,
          on_campus: Number(json.data.on_campus) || 0,
          off_campus: Number(json.data.off_campus) || 0,
        });
      }
    } catch (err) {
      console.error("Campus presence stats failed:", err);
    }
  }, []);

  useEffect(() => {
    void refreshCampusStats();
  }, [refreshCampusStats, campusStatsKey, cached.fetched]);

  useEffect(() => {
    if (!isProdHost()) {
      setLoading(false);
      return;
    }
    if (cached.fetched) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);
        const headers = {
          ...getAnalyticsHeaders(),
          "Cache-Control": "no-cache",
        };
        const fetchOpts = { headers, cache: "no-store" as RequestCache };
        const [snapRes, branchRes, grievanceRes] = await Promise.all([
          fetch(ANALYTICS_INSTITUTION_SNAPSHOT, fetchOpts),
          fetch(ANALYTICS_BRANCH_DISTRIBUTION, fetchOpts),
          fetch(ANALYTICS_GRIEVANCE_SUMMARY, fetchOpts),
        ]);

        const parse = async (res: Response) => {
          const json = await res.json();
          if (json?.success && json?.data !== undefined) return json.data;
          return json;
        };

        const [snapshot, branches, grievances] = await Promise.all([
          parse(snapRes),
          parse(branchRes),
          parse(grievanceRes),
        ]);

        setCached({
          fetched: true,
          snapshot: snapshot && !Array.isArray(snapshot) ? snapshot : null,
          branches: Array.isArray(branches) ? branches : [],
          grievances: Array.isArray(grievances) ? grievances : [],
        });
      } catch (err) {
        console.error("Institution analytics failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [cached.fetched, setCached]);

  const snapshot = cached.snapshot;
  const branches = cached.branches;
  const grievances = cached.grievances;

  const totalStudents =
    campusStats?.total_students || Number(snapshot?.total_students) || 0;
  const onCampus =
    campusStats?.on_campus ??
    (Number(snapshot?.on_campus) || 0);
  const campusPct =
    totalStudents > 0 ? Math.round((onCampus / totalStudents) * 100) : 0;

  const branchMax = useMemo(
    () => Math.max(...branches.map((b) => Number(b.count) || 0), 1),
    [branches],
  );

  const campusData = useMemo(
    () => [
      {
        label: "On campus",
        value: onCampus,
        color: "#800000",
      },
      {
        label: "Off campus",
        value: Math.max(totalStudents - onCampus, 0),
        color: "#d4d4d8",
      },
    ],
    [onCampus, totalStudents],
  );

  const grievanceByCategory = useMemo(() => {
    const map = new Map<
      string,
      { pending: number; resolved: number; total: number }
    >();
    for (const row of grievances) {
      const cat = row.category || "Other";
      const status = String(row.status || "pending").toLowerCase();
      const count = Number(row.count) || 0;
      if (!map.has(cat)) map.set(cat, { pending: 0, resolved: 0, total: 0 });
      const entry = map.get(cat)!;
      entry.total += count;
      if (status === "resolved") entry.resolved += count;
      else entry.pending += count;
    }
    return [...map.entries()]
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [grievances]);

  const openGrievances = grievanceByCategory.reduce(
    (sum, g) => sum + g.pending,
    0,
  );

  if (loading && !cached.fetched) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl bg-zinc-50 animate-pulse" />
          <div className="h-64 rounded-2xl bg-zinc-50 animate-pulse" />
          <div className="h-64 rounded-2xl bg-zinc-50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!snapshot && branches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.14em] uppercase">
          Institution
        </p>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mt-1">
          Campus & academic snapshot
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Enrolled students"
          value={totalStudents.toLocaleString()}
          icon={Users}
          badge="Active"
          iconColor="text-blue-600"
        />
        <KPICard
          title="On campus now"
          value={`${campusPct}%`}
          icon={Home}
          badge={`${onCampus.toLocaleString()} present`}
          iconColor="text-emerald-600"
        />
        <KPICard
          title="Institution avg CGPA"
          value={Number(snapshot?.avg_cgpa || 0).toFixed(2)}
          icon={GraduationCap}
          badge={`${Number(snapshot?.with_backlogs || 0).toLocaleString()} with backlogs`}
          iconColor="text-amber-600"
        />
        <KPICard
          title="Open grievances"
          value={openGrievances.toLocaleString()}
          icon={MessageSquareWarning}
          badge={openGrievances > 0 ? "Needs review" : "Clear"}
          iconColor={openGrievances > 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <AnalyticsCard title="Students by branch" subtitle="Top programmes">
          <div className="space-y-3">
            {branches.length === 0 ? (
              <p className="text-sm text-zinc-400">No branch data yet.</p>
            ) : (
              branches.map((row, i) => {
                const count = Number(row.count) || 0;
                const pct = Math.round((count / branchMax) * 100);
                return (
                  <motion.div
                    key={row.branch}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="font-medium text-zinc-700">
                        {formatDisplayText(row.branch)}
                      </span>
                      <span className="tabular-nums font-semibold text-zinc-900">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, #800000 0%, #a31f1f 100%)",
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Campus presence" subtitle="Live headcount split">
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              data={campusData}
              size={168}
              strokeWidth={22}
              animationDuration={1}
              centerContent={
                <div className="text-center">
                  <p className="text-[10px] text-zinc-400 tracking-[0.1em] mb-0.5">
                    On campus
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
                    {campusPct}%
                  </p>
                </div>
              }
            />
            <div className="flex gap-6 text-[12px]">
              {campusData.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-zinc-600">{d.label}</span>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {d.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Grievance pipeline" subtitle="By category">
          <div className="space-y-2.5">
            {grievanceByCategory.length === 0 ? (
              <p className="text-sm text-zinc-400">No grievances recorded.</p>
            ) : (
              grievanceByCategory.map((g) => (
                <div
                  key={g.category}
                  className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0"
                >
                  <span className="text-[13px] font-medium text-zinc-700">
                    {g.category}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {g.pending > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        {g.pending} open
                      </span>
                    )}
                    {g.resolved > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {g.resolved} done
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
