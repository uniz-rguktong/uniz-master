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
import { KPICard, KPICardSkeleton } from "../AnalyticsUI";
import { formatDisplayText } from "@/utils/displayText";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import {
  ANALYTICS_BRANCH_DISTRIBUTION,
  ANALYTICS_GRIEVANCE_SUMMARY,
  ANALYTICS_INSTITUTION_SNAPSHOT,
  ADMIN_CAMPUS_PRESENCE_STATS,
  getAnalyticsHeaders,
} from "../../../api/endpoints";
import { webadminInstitutionAnalyticsAtom } from "../../../store/atoms";

function isProdHost() {
  return (
    window.location.hostname !== "localhost" &&
    window.location.hostname === "uniz.rguktong.in"
  );
}

export default function InstitutionAnalytics() {
  const [cached, setCached] = useRecoilState(webadminInstitutionAnalyticsAtom);
  const [loading, setLoading] = useState(!cached.fetched);
  const [campusStats, setCampusStats] = useState<{
    total_students: number;
    on_campus: number;
    off_campus: number;
  } | null>(null);
  const [campusStatsKey] = useState(0);

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
        color: "var(--navy-600)",
      },
      {
        label: "Off campus",
        value: Math.max(totalStudents - onCampus, 0),
        color: "var(--navy-300)",
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-md bg-tint" />
          <div className="h-64 animate-pulse rounded-md bg-tint" />
          <div className="h-64 animate-pulse rounded-md bg-tint" />
        </div>
      </div>
    );
  }

  if (!snapshot && branches.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
        Campus & academic snapshot
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Enrolled students"
          value={totalStudents.toLocaleString()}
          icon={Users}
          badge="Active"
          iconColor="text-link"
        />
        <KPICard
          title="On campus now"
          value={`${campusPct}%`}
          icon={Home}
          badge={`${onCampus.toLocaleString()} present`}
          iconColor="text-success"
        />
        <KPICard
          title="Institution avg CGPA"
          value={Number(snapshot?.avg_cgpa || 0).toFixed(2)}
          icon={GraduationCap}
          badge={`${Number(snapshot?.with_backlogs || 0).toLocaleString()} with backlogs`}
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

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <Panel title="Students by branch" className="h-full">
          <p className="text-dense leading-5 text-text-2">Top programmes</p>
          <div className="mt-4 space-y-3">
            {branches.length === 0 ? (
              <p className="text-dense text-text-2">No branch data yet.</p>
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
                    <div className="mb-1.5 flex items-center justify-between text-dense">
                      <span className="font-medium text-head">
                        {formatDisplayText(row.branch)}
                      </span>
                      <span className="font-semibold tabular-nums text-head">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-tint">
                      <div
                        className="h-full rounded-full bg-navy-600 transition-[width] duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Campus presence" className="h-full">
          <p className="text-dense leading-5 text-text-2">Live headcount split</p>
          <div className="mt-4 flex flex-col items-center gap-4">
            <DonutChart
              data={campusData}
              size={168}
              strokeWidth={22}
              animationDuration={1}
              centerContent={
                <div className="text-center">
                  <p className="text-dense leading-5 text-text-2">On campus</p>
                  <p className="font-sans text-[28px] font-semibold leading-9 text-head tabular-nums">
                    {campusPct}%
                  </p>
                </div>
              }
            />
            <div className="flex gap-6 text-dense">
              {campusData.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-text-2">{d.label}</span>
                  <span className="font-semibold tabular-nums text-head">
                    {d.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Grievance pipeline" className="h-full">
          <p className="text-dense leading-5 text-text-2">By category</p>
          <div className="mt-4 space-y-2.5">
            {grievanceByCategory.length === 0 ? (
              <p className="text-dense text-text-2">No grievances recorded.</p>
            ) : (
              grievanceByCategory.map((g) => (
                <div
                  key={g.category}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                >
                  <span className="text-dense font-medium text-head">
                    {g.category}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {g.pending > 0 && (
                      <Badge tone="warning">{g.pending} open</Badge>
                    )}
                    {g.resolved > 0 && (
                      <Badge tone="success">{g.resolved} done</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
