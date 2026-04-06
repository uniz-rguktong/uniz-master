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

interface StudentDashboardProps {
  data: any;
  onSuspendToggle?: (username: string, currentStatus: boolean) => void;
  onResetPassword?: (username: string) => void;
  onEditDetails?: (student: any) => void;
  isActionLoading?: boolean;
}

export default function StudentDashboard({
  data,
  onSuspendToggle,
  onResetPassword,
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
      <div className="bg-white rounded-[2rem] border border-slate-100 px-4 pt-10 pb-12 flex flex-col items-center justify-center relative overflow-hidden shadow-none animate-in fade-in duration-500">
        {/* Absolute Decorative Icon Cloud */}
        <BackgroundIconCloud />

        {/* Avatar */}
        <div className="relative mb-6">
          <div
            className="relative p-[4px] md:p-[5px] rounded-full"
            style={{
              background: student.is_suspended ? "#f43f5e" : "#2ebd59",
            }}
          >
            <div className="relative bg-slate-50 p-[3px] rounded-full">
              <div
                className={cn(
                  "relative w-[110px] h-[110px] md:w-[130px] md:h-[130px] rounded-full flex justify-center items-center text-white text-[54px] font-medium overflow-hidden shadow-none transition-all duration-500",
                  student.profile_url ? "bg-slate-50" : "bg-emerald-900",
                )}
              >
                {student.profile_url ? (
                  <img
                    src={student.profile_url}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="uppercase tracking-tighter">
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
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-[#1f2122] leading-none text-center uppercase">
              {student.name}
            </h2>
          </div>
          <p className="text-[#3c4043] font-medium text-[13px] tracking-tight text-center flex items-center justify-center gap-1.5">
            {student.email}
            {!student.is_suspended && (
              <BadgeCheck
                className="w-[15px] h-[15px] text-[#2ebd59]"
                fill="#2ebd59"
                fillOpacity={0.15}
                strokeWidth={2.5}
              />
            )}
          </p>
        </div>

        {/* Info Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold mb-8 z-10">
          <span className="text-navy-900 uppercase tracking-widest px-2.5 py-1 bg-navy-50 border border-navy-100 rounded-xl">
            {student.username}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="uppercase tracking-wide text-slate-600">
            {student.batch || "O21"}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="uppercase tracking-wide text-slate-600">
            {student.branch}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="uppercase tracking-wide text-slate-600">
            {student.year} YEAR
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 z-10">
          <button
            onClick={() =>
              onSuspendToggle?.(student.username, student.is_suspended)
            }
            disabled={isActionLoading}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl border font-bold uppercase tracking-widest text-[10px] transition-all group active:scale-95 shadow-sm",
              student.is_suspended
                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white",
            )}
          >
            {isActionLoading ? (
              <Zap className="animate-spin w-3.5 h-3.5" />
            ) : student.is_suspended ? (
              <Shield className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            {student.is_suspended ? "Restore Access" : "Suspend Access"}
          </button>

          <button
            onClick={() => onResetPassword?.(student.username)}
            disabled={isActionLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-widest text-[10px] transition-all group active:scale-95 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900"
          >
            <KeyRound className="w-4 h-4" />
            Reset Password
          </button>

          <button
            onClick={() => onEditDetails?.(student)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-900 bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] transition-all group active:scale-95 shadow-lg shadow-slate-900/10 hover:bg-slate-800"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Structured Info Grid (No Cards) */}
        <div className="w-full pt-12 border-t border-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-6">
            <HeroInfo
              label="OFFICIAL EMAIL"
              value={student.email}
              icon={<Mail size={14} />}
            />
            <HeroInfo
              label="ACADEMIC BRANCH"
              value={student.branch}
              icon={<Target size={14} />}
            />
            <HeroInfo
              label="BATCH"
              value={student.batch || "O21"}
              icon={<Zap size={14} />}
            />
            <HeroInfo
              label="ENROLLMENT"
              value={`${student.year} - ${student.section || "N/A"}`}
              icon={<Calendar size={14} />}
            />
            <HeroInfo
              label="GENDER"
              value={
                student.gender === "M"
                  ? "Male"
                  : student.gender === "F"
                    ? "Female"
                    : student.gender || "N/A"
              }
              icon={<User size={14} />}
            />

            <HeroInfo
              label="EMERGENCY"
              value={student.phone_number || "N/A"}
              icon={<Phone size={14} />}
            />
            <HeroInfo
              label="BLOOD GROUP"
              value={student.blood_group || "N/A"}
              icon={<Heart size={14} />}
            />
            <HeroInfo
              label="BACKLOGS"
              value={student.total_backlogs || 0}
              icon={<Scale size={14} />}
            />
            <HeroInfo
              label="ACTIVITY"
              value={student.is_in_campus ? "IN CAMPUS" : "OUTSIDE"}
              icon={<History size={14} />}
            />
            <HeroInfo
              label="STANDING"
              value={student.is_suspended ? "RESTRICTED" : "GOOD"}
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
          color="#2563eb"
        />

        {/* Attendance Graph */}
        <GraphCard
          title="Attendance Trends"
          subtitle="Percentage of sessions logged"
          value={`${(Object.values(student.attendance_summary || {})[0] as any)?.percentage || 0}%`}
          label="LATEST"
          data={attendanceSeries}
          dataKey="percentage"
          color="#10b981"
        />
      </div>

      {/* Bottom Intelligence */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Motivation Quote */}
        <div className="w-full bg-slate-50 border border-slate-100 p-8 rounded-[2rem] text-center flex flex-col justify-center shadow-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
            Institutional Motivation
          </p>
          <p className="text-base font-black text-slate-600 italic leading-relaxed max-w-2xl mx-auto">
            "{student.motivation}"
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
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-0.5 opacity-80">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
      <p className="text-[13px] font-bold text-slate-900 tracking-tight leading-none text-center">
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
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h4 className="text-base font-black text-slate-900 leading-none mb-1">
            {title}
          </h4>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            {subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">
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
                borderRadius: "12px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
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
