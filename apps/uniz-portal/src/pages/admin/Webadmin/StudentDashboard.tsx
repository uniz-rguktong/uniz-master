/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Shield,
  ShieldAlert,
  KeyRound,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { DEFAULT_STUDENT_BRANCH } from "@/constants/branches";
import {
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminDangerButtonClass,
} from "../../../components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

const SERIES_COLORS = ["var(--navy-600)", "var(--navy-300)", "var(--navy-800)", "var(--text-3)"];

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

interface StudentDashboardProps {
  data: any;
  readOnly?: boolean;
  onSuspendToggle?: (username: string, currentStatus: boolean) => void;
  onResetPassword?: (username: string) => void;
  onDeleteStudent?: (username: string) => void;
  onEditDetails?: (student: any) => void;
  isActionLoading?: boolean;
}

export default function StudentDashboard({
  data,
  readOnly = false,
  onSuspendToggle,
  onResetPassword,
  onDeleteStudent,
  onEditDetails,
  isActionLoading,
}: StudentDashboardProps) {
  const student = data;
  if (!student) return null;

  // Prepare graph data
  const gpaData = Object.entries(student.gpa_stats || {})
    .map(([name, stats]: [string, any]) => ({
      name,
      gpa: stats.gpa,
    }))
    .reverse();

  const attendanceSeries = Object.entries(student.attendance_summary || {}).map(
    ([name, stats]: [string, any]) => ({
      name,
      percentage: stats.percentage,
    }),
  );

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Redesigned Profile Hero (Matches Webadmin Overview) */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {/* Absolute Decorative Icon Cloud */}
            {/* Avatar */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-tint">
              {student.profile_url ? (
                <img
                  src={student.profile_url}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-serif text-h2 text-head">
                  {(student.name || "S")[0]}
                </span>
              )}

              {isActionLoading && (
                <div className="absolute inset-0 animate-pulse bg-tint" />
              )}
            </div>

            {/* Name & Email */}
            <div className="min-w-0">
              <h2 className="font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head">
                {student.name}
              </h2>
              <p className="mt-1 break-all text-body leading-6 text-text-2">
                {student.email}
              </p>
              <div className="mt-2">
                <Badge tone={student.is_suspended ? "error" : "success"}>
                  {student.is_suspended ? "Suspended" : "Active"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onSuspendToggle?.(student.username, student.is_suspended)
              }
              disabled={isActionLoading}
              className={
                student.is_suspended ? adminPrimaryButtonClass : adminDangerButtonClass
              }
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : student.is_suspended ? (
                <Shield className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              {student.is_suspended ? "Restore access" : "Suspend"}
            </button>

            <button
              type="button"
              onClick={() => onResetPassword?.(student.username)}
              disabled={isActionLoading}
              className={adminGhostButtonClass}
            >
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>

            <button
              type="button"
              onClick={() => onEditDetails?.(student)}
              className={adminPrimaryButtonClass}
            >
              <Edit3 className="h-4 w-4" />
              Edit profile
            </button>

            <button
              type="button"
              onClick={() => onDeleteStudent?.(student.username)}
              disabled={isActionLoading}
              className={adminDangerButtonClass}
            >
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </button>
          </div>
        )}

        <Panel title="Profile">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Fact label="Username" value={student.username} />
            <Fact label="Email" value={student.email} />
            <Fact label="Branch" value={student.branch || DEFAULT_STUDENT_BRANCH} />
            <Fact label="Batch" value={student.batch || "O21"} />
            <Fact
              label="Enrollment"
              value={`${student.year} · ${student.section || "—"}`}
            />
            <Fact
              label="Gender"
              value={
                student.gender === "M"
                  ? "Male"
                  : student.gender === "F"
                    ? "Female"
                    : student.gender || "—"
              }
            />
            <Fact label="Phone" value={student.phone_number || "—"} />
            <Fact label="Blood group" value={student.blood_group || "—"} />
            <Fact label="Backlogs" value={String(student.total_backlogs || 0)} />
            <Fact
              label="Campus"
              value={student.is_in_campus ? "In campus" : "Outside"}
            />
          </dl>
        </Panel>
      </div>

      {/* Performance Graphs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Academic Results Graph */}
        <GraphCard
          title="Results Overview"
          subtitle="Semester-wise Grade Point Average"
          value={student.cgpa}
          label="CGPA"
          data={gpaData}
          dataKey="gpa"
          color="var(--navy-600)"
        />

        {/* Attendance Graph */}
        <GraphCard
          title="Attendance Trends"
          subtitle="Percentage of sessions logged"
          value={`${(Object.values(student.attendance_summary || {})[0] as any)?.percentage || 0}%`}
          label="Latest"
          data={attendanceSeries}
          dataKey="percentage"
          color="var(--navy-300)"
        />
      </div>

      {/* Bottom Intelligence */}
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Motivation Quote */}
        <Panel title="Motivation" className="w-full">
          <p className="text-body leading-6 text-text-2">
            "{student.motivation || "—"}"
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-dense leading-5 text-text-2">{label}</dt>
      <dd className="mt-1 break-words text-body text-head">{value}</dd>
    </div>
  );
}

function GraphCard({
  title,
  subtitle,
  value,
  label,
  data,
  dataKey,
  color,
}: any) {
  const stroke = SERIES_COLORS.includes(color) ? color : "var(--navy-600)";
  return (
    <Panel title={title} className="h-full">
      <div className="flex flex-col gap-4 min-[821px]:flex-row min-[821px]:items-start">
        <div className="h-[220px] min-w-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
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
                cursor={{ stroke, strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={stroke}
                strokeWidth={2}
                fill={stroke}
                fillOpacity={0}
                dot={{ fill: stroke, strokeWidth: 2, r: 4, stroke: "var(--surface)" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="min-[821px]:max-w-[180px]">
          <p className="text-dense leading-5 text-text-2">{subtitle}</p>
          <p className="mt-2 text-dense leading-5 text-text-2">{label}</p>
          <p className="mt-1 font-sans text-[28px] font-semibold leading-9 text-head tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </Panel>
  );
}
