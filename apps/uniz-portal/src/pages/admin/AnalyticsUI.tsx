import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Panel } from "@/components/ui/panel";

const COLORS = ["var(--navy-600)", "var(--navy-300)", "var(--navy-800)", "var(--text-3)"];

const chartTick = { fill: "var(--text-3)", fontSize: 12, fontWeight: 600 };

const chartTooltipStyle = {
  backgroundColor: "var(--surface)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "none",
};

type LineTone = "success" | "warning" | "error" | "neutral";

const STATUS_LINES: Record<string, { tone: LineTone; icon: LucideIcon }> = {
  active: { tone: "success", icon: CheckCircle2 },
  enabled: { tone: "success", icon: CheckCircle2 },
  clear: { tone: "success", icon: CheckCircle2 },
  running: { tone: "neutral", icon: Activity },
  restricted: { tone: "error", icon: AlertCircle },
  suspended: { tone: "error", icon: AlertCircle },
  "at risk": { tone: "warning", icon: AlertTriangle },
  "needs review": { tone: "warning", icon: AlertCircle },
};

function lineStatus(badge?: string, iconColor?: string) {
  const word = STATUS_LINES[(badge || "").trim().toLowerCase()];
  const color = iconColor || "";
  if (color.includes("text-error")) {
    return { tone: "error" as const, icon: word?.icon ?? AlertCircle };
  }
  if (color.includes("text-warning")) {
    return { tone: "warning" as const, icon: word?.icon ?? AlertTriangle };
  }
  if (color.includes("text-success")) {
    return { tone: "success" as const, icon: word?.icon ?? CheckCircle2 };
  }
  return word ?? null;
}

function statusIconClass(tone: LineTone) {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "error") return "text-error";
  return "text-text-2";
}

/**
 * KPI Card - High fidelity metric box matching the requested UI
 */
export const KPICard = ({
  title,
  value,
  icon: _icon,
  badge = "Active",
  iconColor,
  iconBg: _iconBg,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string;
  iconColor?: string;
  /** Retained for API compatibility — visuals are now monochrome. */
  iconBg?: string;
}) => {
  void _icon;
  void _iconBg;
  const status = badge ? lineStatus(badge, iconColor) : null;
  return (
    <div className="flex min-h-[148px] flex-col rounded-lg border border-border bg-tile p-6">
      <p className="text-dense leading-5 text-text-2">{title}</p>
      <p className="mt-3 font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
        {value}
      </p>
      {badge ? (
        <p className="mt-3 flex items-center gap-1.5 text-dense leading-5 text-text-2">
          {status ? <StatusGlyph status={status} /> : null}
          {badge}
        </p>
      ) : null}
    </div>
  );
};

function StatusGlyph({
  status,
}: {
  status: { tone: LineTone; icon: LucideIcon };
}) {
  const Icon = status.icon;
  return (
    <Icon
      size={16}
      strokeWidth={1.75}
      aria-hidden
      className={statusIconClass(status.tone)}
    />
  );
}

export const KPICardSkeleton = () => (
  <div className="flex min-h-[148px] flex-col rounded-lg border border-border bg-tile p-6">
    <div className="h-5 w-24 animate-pulse rounded-md bg-tint" />
    <div className="mt-3 h-9 w-20 animate-pulse rounded-md bg-tint" />
    <div className="mt-3 h-5 w-28 animate-pulse rounded-md bg-tint" />
  </div>
);

/**
 * Premium Trend Chart - Area chart with smooth lines and gradients
 */
export const TrendChart = ({
  title,
  subtitle,
  data,
  dataKey,
  color = "var(--navy-600)",
  height = 300,
}: {
  title: string;
  subtitle: string;
  data?: any[];
  dataKey: string;
  color?: string;
  height?: number;
}) => {
  const safeData = Array.isArray(data) ? data : [];
  const stroke = COLORS.includes(color) ? color : "var(--navy-600)";
  return (
    <Panel title={title}>
      <div className="flex flex-col gap-4 min-[821px]:flex-row min-[821px]:items-start">
        <div style={{ height }} className="min-w-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={chartTick}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={chartTick} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                itemStyle={{ color: "var(--text)" }}
                labelStyle={{ color: "var(--text)" }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                strokeWidth={2}
                fill={stroke}
                fillOpacity={0}
                dot={false}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-dense leading-5 text-text-2 min-[821px]:max-w-xs">{subtitle}</p>
      </div>
    </Panel>
  );
};

/**
 * Donut Chart - Distribution view
 */
export const DonutChart = ({
  title,
  subtitle,
  data = [],
}: {
  title: string;
  subtitle: string;
  data?: any[];
}) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <Panel title={title} className="h-full">
      <div className="flex flex-col gap-4 min-[821px]:flex-row min-[821px]:items-center">
        <div className="relative h-[250px] min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeData}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                animationDuration={1500}
              >
                {safeData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                itemStyle={{ color: "var(--text)" }}
                labelStyle={{ color: "var(--text)" }}
                cursor={{ fill: "transparent" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-dense leading-5 text-text-2">Total</p>
            <p className="font-sans text-[28px] font-semibold leading-9 text-head tabular-nums">
              {safeData.reduce((acc, curr) => acc + (curr.value || 0), 0)}
            </p>
          </div>
        </div>
        <div className="min-[821px]:max-w-xs">
          <p className="text-dense leading-5 text-text-2">{subtitle}</p>
          <div className="mt-4 flex flex-col gap-2">
            {safeData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-dense text-text-2">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export const DonutChartSkeleton = () => (
  <div className="flex h-full w-full flex-col rounded-xl border border-border bg-panel p-4 min-[821px]:p-8">
    <div className="h-8 w-40 animate-pulse rounded-md bg-tint" />
    <div className="mt-2 h-5 w-32 animate-pulse rounded-md bg-tint" />
    <div className="mt-6 h-[250px] animate-pulse rounded-md bg-tint" />
  </div>
);

export const AreaChartSkeleton = () => (
  <div className="w-full rounded-xl border border-border bg-panel p-4 min-[821px]:p-8">
    <div className="h-8 w-40 animate-pulse rounded-md bg-tint" />
    <div className="mt-2 h-5 w-64 animate-pulse rounded-md bg-tint" />
    <div className="mt-6 h-[250px] animate-pulse rounded-md bg-tint" />
  </div>
);

/**
 * Pulse Feed - Vertical activity timeline
 */
export const PulseFeed = ({
  title,
  activities = [],
}: {
  title: string;
  activities?: any[];
}) => {
  const safeActivities = Array.isArray(activities) ? activities : [];
  return (
    <Panel title={title} className="h-full">
      <div className="space-y-6 border-l border-border pl-4">
        {safeActivities.map((act, i) => (
          <div key={i} className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              {act?.status === "success" ? (
                <CheckCircle2 size={16} strokeWidth={1.75} className="text-success" aria-hidden />
              ) : act?.status === "warning" ? (
                <AlertTriangle size={16} strokeWidth={1.75} className="text-warning" aria-hidden />
              ) : (
                <AlertCircle size={16} strokeWidth={1.75} className="text-error" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-small leading-[18px] text-text-2">{act?.time}</p>
              <p className="text-dense font-medium text-head">{act?.message}</p>
              {act?.detail && (
                <p className="mt-1 truncate text-dense text-text-2">{act?.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/**
 * Comparison Chart - Dual axis or dual line
 */
export const ComparisonChart = ({
  title,
  data = [],
  lines = [],
}: {
  title: string;
  data?: any[];
  lines?: any[];
}) => {
  const safeData = Array.isArray(data) ? data : [];
  const safeLines = Array.isArray(lines) ? lines : [];
  const summary = safeLines
    .map((l) => l?.label)
    .filter(Boolean)
    .join(" compared with ");

  return (
    <Panel title={title}>
      <div className="mb-4 flex flex-col gap-3 min-[821px]:flex-row min-[821px]:items-start min-[821px]:justify-between">
        <p className="text-dense leading-5 text-text-2 min-[821px]:max-w-sm">
          {summary || "Comparison"}
        </p>
        <div className="flex flex-wrap gap-4">
          {safeLines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-dense text-text-2">{l?.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={chartTick}
              dy={20}
            />
            <YAxis axisLine={false} tickLine={false} tick={chartTick} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              itemStyle={{ color: "var(--text)" }}
              labelStyle={{ color: "var(--text)" }}
            />
            {safeLines.map((l, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={l?.key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0}
                dot={{
                  fill: COLORS[i % COLORS.length],
                  strokeWidth: 2,
                  r: 4,
                  stroke: "var(--surface)",
                }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                strokeDasharray={l?.dashed ? "10 10" : "0"}
                animationDuration={2500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};

/**
 * Subject Heatmap - Grid-based visualization for subject performance
 */
export const SubjectHeatmap = ({
  title,
  data = [],
  branches = [],
  selectedBranch,
  onBranchChange,
}: {
  title: string;
  data: any[];
  branches: string[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
}) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 8.5) return "bg-navy-800";
    if (grade >= 8.0) return "bg-navy-600";
    if (grade >= 7.5) return "bg-navy-300";
    return "bg-text-3";
  };

  const [hoveredItem, setHoveredItem] = useState<any | null>(null);

  return (
    <Panel title={title} className="h-full w-full">
      <div className="mb-6 flex flex-col gap-4 min-[821px]:flex-row min-[821px]:items-start min-[821px]:justify-between">
        <p className="text-dense leading-5 text-text-2 min-[821px]:max-w-sm">
          Average grade by subject
        </p>

        <div className="relative">
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="h-11 cursor-pointer appearance-none rounded-md border border-border-strong bg-surface pl-4 pr-10 text-body text-text focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3"
          />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          <AnimatePresence>
            {data.map((item, i) => (
              <motion.div
                key={`${item.branch}-${item.subject_name}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(i * 0.01, 0.5) }}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "relative aspect-square cursor-pointer rounded-md transition-opacity duration-150 hover:z-20 hover:opacity-80",
                  getGradeColor(Number(item.average_grade)),
                )}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <AnimatePresence mode="wait">
            {hoveredItem ? (
              <motion.div
                key={hoveredItem.subject_name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4"
              >
                <p className="font-sans text-[28px] font-semibold leading-9 text-head tabular-nums">
                  {Number(hoveredItem.average_grade).toFixed(1)}
                </p>
                <div>
                  <p className="text-dense leading-5 text-text-2">{selectedBranch}</p>
                  <p className="text-dense font-medium text-head">{hoveredItem.subject_name}</p>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-dense leading-5 text-text-2"
              >
                Hover a cell to see the subject and grade
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-end">
            <span className="text-dense leading-5 text-text-2">Grade scale</span>
            <div className="mt-2 flex gap-1">
              <div className="h-3 w-3 rounded-sm bg-text-3" />
              <div className="h-3 w-3 rounded-sm bg-navy-300" />
              <div className="h-3 w-3 rounded-sm bg-navy-600" />
              <div className="h-3 w-3 rounded-sm bg-navy-800" />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};
