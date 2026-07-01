import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * KPI Card - High fidelity metric box matching the requested UI
 */
export const KPICard = ({
  title,
  value,
  icon: Icon,
  badge = "Active",
  iconColor = "text-zinc-400",
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string;
  iconColor?: string;
  /** Retained for API compatibility — visuals are now monochrome. */
  iconBg?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border border-zinc-200/70 bg-white p-5 flex flex-col gap-5 shadow-[0_1px_2px_rgba(10,10,10,0.03)] transition-all duration-200 hover:border-zinc-300"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center ring-1 ring-inset ring-zinc-900/5 transition-colors group-hover:bg-[#800000] group-hover:text-white">
          <Icon size={17} strokeWidth={2} className="text-zinc-500 transition-colors group-hover:text-white" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5">
          <span className={cn("w-1.5 h-1.5 rounded-full bg-current", iconColor)} />
          <span className="text-[10px] font-medium text-zinc-500 tracking-tight">
            {badge}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[28px] font-semibold text-zinc-900 tracking-[-0.02em] leading-none tabular-nums">
          {value}
        </p>
        <p className="text-[12.5px] font-medium text-zinc-500 tracking-tight">
          {title}
        </p>
      </div>
    </motion.div>
  );
};

export const KPICardSkeleton = () => (
  <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 flex flex-col gap-5 shadow-[0_1px_2px_rgba(10,10,10,0.03)] animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-9 h-9 rounded-xl bg-zinc-100" />
      <div className="w-16 h-5 rounded-full bg-zinc-50" />
    </div>
    <div className="space-y-2.5">
      <div className="w-20 h-7 rounded-lg bg-zinc-100" />
      <div className="w-28 h-3.5 rounded-md bg-zinc-50" />
    </div>
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
  color = "#6366f1",
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
  return (
    <div className="bg-transparent p-10 rounded-xl border border-zinc-100 relative overflow-hidden">
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 tracking-tight mb-1">
            {title}
          </h3>
          <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em]">
            {subtitle}
          </p>
        </div>
        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-300">
          <Clock size={18} />
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={safeData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`colorTrend-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "20px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={4}
              fillOpacity={1}
              fill={`url(#colorTrend-${dataKey})`}
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
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
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-transparent p-10 rounded-xl border border-zinc-100 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-zinc-900 tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em]">
          {subtitle}
        </p>
      </div>

      <div className="flex-1 min-h-[250px] relative">
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
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "15px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "#fff",
                padding: "10px 15px",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}
              itemStyle={{ color: "#fff" }}
              cursor={{ fill: "transparent" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em]">
            Total
          </p>
          <p className="text-3xl font-semibold text-zinc-900 tracking-tight">
            {safeData.reduce((acc, curr) => acc + (curr.value || 0), 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {safeData.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DonutChartSkeleton = () => (
  <div className="bg-transparent p-10 rounded-xl border border-zinc-100 flex flex-col h-full animate-pulse">
    <div className="mb-6 space-y-2">
      <div className="w-40 h-6 rounded-lg bg-zinc-100" />
      <div className="w-32 h-3 rounded-md bg-zinc-50" />
    </div>
    <div className="flex-1 min-h-[250px] flex items-center justify-center relative">
      <div className="w-44 h-44 rounded-full border-[20px] border-zinc-50" />
      <div className="absolute flex flex-col items-center gap-2">
        <div className="w-10 h-3 rounded bg-zinc-50" />
        <div className="w-16 h-8 rounded bg-zinc-100" />
      </div>
    </div>
    <div className="mt-8 space-y-3">
      <div className="h-8 w-full rounded-xl bg-zinc-50" />
      <div className="h-8 w-full rounded-xl bg-zinc-50/50" />
    </div>
  </div>
);

export const AreaChartSkeleton = () => (
  <div className="w-full bg-white rounded-xl border border-zinc-100 p-10 animate-pulse">
    <div className="flex justify-between items-start mb-10">
      <div className="space-y-3">
        <div className="w-32 h-4 rounded bg-zinc-50" />
        <div className="w-56 h-12 rounded bg-zinc-100" />
        <div className="w-64 h-4 rounded bg-zinc-50" />
      </div>
      <div className="w-32 h-10 rounded-xl bg-zinc-50" />
    </div>
    <div className="h-[250px] w-full bg-zinc-50/50 rounded-xl border border-dashed border-zinc-100 flex items-end px-4 py-4 gap-4">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-zinc-100 rounded-t-sm"
          style={{ height: `${Math.random() * 60 + 20}%`, opacity: 0.5 }}
        />
      ))}
    </div>
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
    <div className="bg-transparent p-10 rounded-xl border border-zinc-100 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white">
          <Activity size={18} />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
          {title}
        </h3>
      </div>

      <div className="space-y-8 flex-1">
        {safeActivities.map((act, i) => (
          <div key={i} className="flex gap-5 relative">
            {i !== safeActivities.length - 1 && (
              <div className="absolute left-6 top-10 bottom-[-20px] w-[2px] bg-zinc-50" />
            )}
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white bg-white z-10 shrink-0",
                act?.status === "success"
                  ? "text-emerald-500 ring-4 ring-emerald-50"
                  : act?.status === "warning"
                    ? "text-orange-500 ring-4 ring-orange-50"
                    : "text-red-500 ring-4 ring-red-50",
              )}
            >
              {act?.status === "success" ? (
                <CheckCircle2 size={18} />
              ) : act?.status === "warning" ? (
                <AlertCircle size={18} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={18} />
              )}
            </div>
            <div className="pt-1 min-w-0">
              <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] leading-none mb-1.5">
                {act?.time}
              </p>
              <p className="text-[13px] font-semibold text-zinc-900 leading-tight tracking-tight">
                {act?.message}
              </p>
              {act?.detail && (
                <p className="text-[11px] text-zinc-500 font-medium mt-1 truncate">
                  {act?.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
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

  return (
    <div className="bg-transparent p-10 rounded-xl border border-zinc-100">
      <div className="flex justify-between items-center mb-12">
        <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          {title}
        </h3>
        <div className="flex gap-6">
          {safeLines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: l?.color || "#6366f1" }}
              />
              <span className="text-[11px] font-bold text-zinc-400 tracking-[0.14em]">
                {l?.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData}>
            <CartesianGrid
              strokeDasharray="5 5"
              vertical={false}
              stroke="#f8fafc"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
              dy={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "25px",
                padding: "20px",
                border: "none",
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              }}
            />
            {safeLines.map((l, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={l?.key}
                stroke={l?.color}
                strokeWidth={5}
                dot={{ fill: l?.color, strokeWidth: 3, r: 6, stroke: "#fff" }}
                activeDot={{ r: 10, strokeWidth: 0 }}
                strokeDasharray={l?.dashed ? "10 10" : "0"}
                animationDuration={2500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
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
    if (grade >= 8.5) return "bg-blue-600";
    if (grade >= 8.0) return "bg-blue-500";
    if (grade >= 7.8) return "bg-blue-400";
    if (grade >= 7.5) return "bg-blue-300";
    return "bg-blue-200";
  };

  const [hoveredItem, setHoveredItem] = useState<any | null>(null);

  return (
    <div className="bg-transparent p-10 rounded-xl border border-zinc-100 flex flex-col h-full w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">
            {title}
          </h3>
          <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em]">
            Matrix performance intelligence
          </p>
        </div>

        <div className="relative group">
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="appearance-none bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-2.5 pr-10 text-[11px] font-semibold tracking-[0.14em] text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer hover:bg-zinc-100 transition-all shadow-sm"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
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
                  "aspect-square rounded-md cursor-pointer transition-all duration-300 relative",
                  getGradeColor(Number(item.average_grade)),
                  "hover:scale-125 hover:z-20 hover:shadow-xl hover:shadow-blue-500/20",
                )}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="min-h-[100px] border-t border-zinc-50 pt-8 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {hoveredItem ? (
              <motion.div
                key={hoveredItem.subject_name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-6"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-lg font-semibold",
                    getGradeColor(Number(hoveredItem.average_grade)),
                  )}
                >
                  {Number(hoveredItem.average_grade).toFixed(1)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 tracking-[0.14em] mb-1">
                    {selectedBranch} • PERFORMANCE
                  </p>
                  <h4 className="text-sm font-semibold text-zinc-900 tracking-tight max-w-md">
                    {hoveredItem.subject_name}
                  </h4>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-zinc-300 tracking-[0.3em]"
              >
                Hover over a cell to view grade intelligence
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.14em]">
                Efficiency Scale
              </span>
              <div className="flex gap-1 mt-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-200" />
                <div className="w-3 h-3 rounded-sm bg-blue-400" />
                <div className="w-3 h-3 rounded-sm bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
