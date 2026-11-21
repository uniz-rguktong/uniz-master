import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DonutChart } from "../../../components/ui/donut-chart";
import { formatDisplayText } from "@/utils/displayText";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

type BranchRow = { branch: string; count: number };
type GrievanceRow = { category: string; status: string; count: number };
type Campus = {
  activeStudents: number;
  onCampus: number;
  offCampus: number;
};

function LazyWhenVisible({
  children,
  minHeight = 280,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {show ? (
        children
      ) : (
        <div
          className="rounded-md bg-tint"
          style={{ minHeight }}
          aria-hidden
        />
      )}
    </div>
  );
}

export default function InstitutionAnalytics({
  campus,
  branches,
  grievances,
}: {
  campus: Campus;
  branches: BranchRow[];
  grievances: GrievanceRow[];
}) {
  const totalStudents = campus.activeStudents;
  const onCampus = campus.onCampus;
  const campusPct =
    totalStudents > 0 ? Math.round((onCampus / totalStudents) * 100) : 0;

  const branchMax = useMemo(
    () => Math.max(...branches.map((b) => Number(b.count) || 0), 1),
    [branches],
  );

  const campusData = useMemo(
    () => [
      { label: "On campus", value: onCampus, color: "var(--navy-600)" },
      {
        label: "Off campus",
        value: Math.max(campus.offCampus, 0),
        color: "var(--navy-300)",
      },
    ],
    [onCampus, campus.offCampus],
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

  return (
    <LazyWhenVisible minHeight={320}>
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <Panel title="Students by branch" className="h-full">
          <p className="text-dense leading-5 text-text-2">Top programmes</p>
          <div className="mt-4 space-y-3">
            {branches.length === 0 ? (
              <p className="text-dense text-text-2">No branch data yet.</p>
            ) : (
              branches.map((row) => {
                const count = Number(row.count) || 0;
                const pct = Math.round((count / branchMax) * 100);
                return (
                  <div key={row.branch}>
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
                        className="h-full rounded-full bg-navy-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Campus presence" className="h-full">
          <p className="text-dense leading-5 text-text-2">Headcount split</p>
          <div className="mt-4 flex flex-col items-center gap-4">
            <DonutChart
              data={campusData}
              size={168}
              strokeWidth={22}
              animationDuration={0.6}
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
    </LazyWhenVisible>
  );
}
