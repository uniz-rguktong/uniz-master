/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  User,
  Mail,
  Calendar,
  Target,
  Phone,
  Shield,
  Heart,
  Zap,
  Scale,
  ShieldAlert,
  History,
  KeyRound,
  Edit3,
  Trash2,
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
import { BadgeCheck, Loader2 } from "lucide-react";
import { BackgroundIconCloud } from "../../../components/illustrations/FloatingIllustrations";

import { cn } from "../../../utils/cn";
import {
  adminCardClass,
  adminChipClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminDangerButtonClass,
  adminLabelClass,
  adminSectionTitleClass,
  adminNumsClass,
  adminStatValueClass,
} from "../../../components/admin/admin-ui";

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
    <div className="space-y-6 pb-20 font-sans">
      {/* Redesigned Profile Hero (Matches Webmaster Overview) */}
      <div className={cn(adminCardClass, "px-4 pt-10 pb-12 flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500")}>
        {/* Absolute Decorative Icon Cloud */}
        <BackgroundIconCloud />

        {/* Avatar */}
        <div className="relative mb-6">
          <div
            className="relative p-[4px] md:p-[5px] rounded-full"
            style={{
              background: student.is_suspended ? "#f43f5e" : "#18181b",
            }}
          >
            <div className="relative bg-zinc-50 p-[3px] rounded-full">
              <div
                className={cn(
                  "relative w-[110px] h-[110px] md:w-[130px] md:h-[130px] rounded-full flex justify-center items-center text-white text-[54px] font-medium overflow-hidden transition-all duration-500",
                  student.profile_url ? "bg-zinc-50" : "bg-zinc-900",
                )}
              >
                {student.profile_url ? (
                  <img
                    src={student.profile_url}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="tracking-tighter">
                    {(student.name || "S")[0]}
                  </span>
                )}

                {isActionLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-9 h-9 animate-spin text-white/80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Name & Email */}
        <div className="flex flex-col items-center justify-center gap-1 mb-6 mt-1 z-10">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-zinc-900 leading-none text-center">
              {student.name}
            </h2>
          </div>
          <p className="text-zinc-500 font-medium text-[13px] tracking-tight text-center flex items-center justify-center gap-1.5 max-w-full px-4 break-all">
            {student.email}
            {!student.is_suspended && (
              <BadgeCheck
                className="w-[15px] h-[15px] text-zinc-900"
                fill="#18181b"
                fillOpacity={0.12}
                strokeWidth={2.5}
              />
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 z-10">
          <span className={adminChipClass}>{student.username}</span>
          <span className={adminChipClass}>{student.batch || "O21"}</span>
          <span className={adminChipClass}>{student.branch}</span>
          <span className={adminChipClass}>{student.year}</span>
        </div>

        {!readOnly && (
        <div className="flex flex-wrap justify-center gap-2.5 z-10">
              <button
                type="button"
                onClick={() =>
                  onSuspendToggle?.(student.username, student.is_suspended)
                }
                disabled={isActionLoading}
                className={cn(
                  student.is_suspended ? adminPrimaryButtonClass : adminDangerButtonClass,
                  "text-[12px]",
                )}
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin w-3.5 h-3.5" />
                ) : student.is_suspended ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                {student.is_suspended ? "Restore access" : "Suspend"}
              </button>

              <button
                type="button"
                onClick={() => onResetPassword?.(student.username)}
                disabled={isActionLoading}
                className={adminGhostButtonClass}
              >
                <KeyRound className="w-4 h-4" />
                Reset password
              </button>

              <button
                type="button"
                onClick={() => onEditDetails?.(student)}
                className={adminPrimaryButtonClass}
              >
                <Edit3 className="w-4 h-4" />
                Edit profile
              </button>

              <button
                type="button"
                onClick={() => onDeleteStudent?.(student.username)}
                disabled={isActionLoading}
                className={cn(adminDangerButtonClass, "text-[12px]")}
              >
                <Trash2 className="w-4 h-4" />
                Delete permanently
              </button>
        </div>
        )}

        <div className="w-full pt-12 border-t border-zinc-100 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-6">
            <HeroInfo
              label="Email"
              value={student.email}
              icon={<Mail size={14} />}
              className="col-span-2 md:col-span-3 lg:col-span-2"
              valueClassName="break-all text-[12px] font-medium"
            />
            <HeroInfo label="Branch" value={student.branch} icon={<Target size={14} />} />
            <HeroInfo label="Batch" value={student.batch || "O21"} icon={<Zap size={14} />} />
            <HeroInfo
              label="Enrollment"
              value={`${student.year} · ${student.section || "—"}`}
              icon={<Calendar size={14} />}
            />
            <HeroInfo
              label="Gender"
              value={
                student.gender === "M"
                  ? "Male"
                  : student.gender === "F"
                    ? "Female"
                    : student.gender || "—"
              }
              icon={<User size={14} />}
            />
            <HeroInfo label="Phone" value={student.phone_number || "—"} icon={<Phone size={14} />} />
            <HeroInfo label="Blood group" value={student.blood_group || "—"} icon={<Heart size={14} />} />
            <HeroInfo label="Backlogs" value={String(student.total_backlogs || 0)} icon={<Scale size={14} />} />
            <HeroInfo
              label="Campus"
              value={student.is_in_campus ? "In campus" : "Outside"}
              icon={<History size={14} />}
            />
            <HeroInfo
              label="Standing"
              value={student.is_suspended ? "Suspended" : "Active"}
              icon={<Shield size={14} />}
            />
          </div>
        </div>
      </div>

      {/* Performance Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Results Graph */}
        <GraphCard
          title="Results Overview"
          subtitle="Semester-wise Grade Point Average"
          value={student.cgpa}
          label="CGPA"
          data={gpaData}
          dataKey="gpa"
          color="#18181b"
        />

        {/* Attendance Graph */}
        <GraphCard
          title="Attendance Trends"
          subtitle="Percentage of sessions logged"
          value={`${(Object.values(student.attendance_summary || {})[0] as any)?.percentage || 0}%`}
          label="Latest"
          data={attendanceSeries}
          dataKey="percentage"
          color="#52525b"
        />
      </div>

      {/* Bottom Intelligence */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Motivation Quote */}
        <div className={cn(adminCardClass, "p-8 text-center flex flex-col justify-center")}>
          <p className={cn(adminLabelClass, "mb-3")}>Motivation</p>
          <p className="text-[15px] font-medium text-zinc-600 italic leading-relaxed max-w-2xl mx-auto">
            "{student.motivation || "—"}"
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroInfo({
  label,
  value,
  icon,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: any;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 min-w-0 w-full px-1", className)}>
      <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-0.5">
        {icon}
        <span className={adminLabelClass}>{label}</span>
      </div>
      <p
        title={value}
        className={cn(
          "text-[13px] font-semibold text-zinc-900 tracking-tight text-center max-w-full w-full",
          valueClassName,
        )}
      >
        {value}
      </p>
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
  return (
    <div className={cn(adminCardClass, "p-6 flex flex-col")}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className={adminSectionTitleClass}>{title}</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className={adminLabelClass}>{label}</p>
          <p className={cn("text-2xl font-semibold text-zinc-900 mt-1", adminNumsClass)}>
            {value}
          </p>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                fontSize: "12px",
                fontWeight: 500,
              }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
