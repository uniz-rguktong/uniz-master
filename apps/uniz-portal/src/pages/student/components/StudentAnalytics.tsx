"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Cell,
  ResponsiveContainer,
  Area,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Monitor,
  Activity,
  Award,
} from "lucide-react";
import {
  STUDENT_ATTENDANCE_ANALYTICS,
  STUDENT_GRADES_TREND_ANALYTICS,
} from "../../../api/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../../api/apiClient";

interface AttendanceData {
  subjectId: string;
  subject_name: string;
  totalClasses: number;
  attendedClasses: number;
  attendance_percentage: number;
}

interface GradeTrendData {
  semesterId: string;
  sgpa: number;
}

interface AnalyticsProps {
  studentId: string;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[20px] border border-white/40 bg-white/70 backdrop-blur-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] min-w-[200px] text-slate-900 animate-in zoom-in-95 duration-200">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-slate-100/50">
          {mode === "subject" ? "Intelligence Unit" : `${label} Overview`}
        </div>

        {mode === "subject" ? (
          <div className="space-y-3">
            <div className="text-xs font-black leading-tight text-slate-900">
              {payload[0].payload.subject_name}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Attendance
              </span>
              <span
                className={`text-xs font-black ${payload[0].value < 75 ? "text-rose-500" : "text-emerald-500"}`}
              >
                {payload[0].value}%
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs font-black tabular-nums text-slate-900">
                  {entry.name?.includes("Attendance")
                    ? `${Number(entry.value).toFixed(1)}%`
                    : Number(entry.value).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const StudentAnalytics: React.FC<AnalyticsProps> = ({ studentId }) => {
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [gradesTrend, setGradesTrend] = useState<GradeTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"semester" | "subject">("semester");
  const [timeHorizon, setTimeHorizon] = useState("overall");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [hoverData, _setHoverData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attendanceRes, gradesRes] = await Promise.all([
          apiClient<any>(STUDENT_ATTENDANCE_ANALYTICS(studentId)),
          apiClient<any>(STUDENT_GRADES_TREND_ANALYTICS(studentId)),
        ]);

        // Robust data extraction
        const attData = Array.isArray(attendanceRes)
          ? attendanceRes
          : attendanceRes?.attendance || [];
        const grdData = Array.isArray(gradesRes)
          ? gradesRes
          : gradesRes?.grades || [];

        setAttendance(attData);
        setGradesTrend(grdData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    if (studentId) fetchData();
  }, [studentId]);

  const filteredAttendance = useMemo(() => {
    if (!Array.isArray(attendance)) return [];
    return attendance.filter((sub) => {
      if (subjectFilter === "theory")
        return !sub.subject_name?.toLowerCase().includes("lab");
      if (subjectFilter === "lab")
        return sub.subject_name?.toLowerCase().includes("lab");
      if (subjectFilter === "low") return sub.attendance_percentage < 75;
      return true;
    });
  }, [attendance, subjectFilter]);

  const semesterData = useMemo(() => {
    if (!Array.isArray(gradesTrend) || !Array.isArray(attendance)) return [];
    let data = [...gradesTrend];
    if (timeHorizon === "recent") data = data.slice(-2);
    if (timeHorizon === "year") data = data.slice(-4);

    return data.map((sem) => {
      const idx = gradesTrend.indexOf(sem);
      const chunk = Math.ceil(
        attendance.length / Math.max(gradesTrend.length, 1),
      );
      const semAttItems = attendance.slice(idx * chunk, (idx + 1) * chunk);
      const avgAtt = semAttItems.length
        ? semAttItems.reduce((a, b: any) => a + b.attendance_percentage, 0) /
          semAttItems.length
        : 85;

      return {
        period: sem.semesterId,
        grades: sem.sgpa,
        attendance: avgAtt,
      };
    });
  }, [gradesTrend, attendance, timeHorizon]);

  const finalCGPA = useMemo(() => {
    if (!gradesTrend || !Array.isArray(gradesTrend) || !gradesTrend.length)
      return 0;
    const sum = gradesTrend.reduce((acc, curr) => acc + curr.sgpa, 0);
    return sum / Math.max(gradesTrend.length, 1);
  }, [gradesTrend]);

  const trends = useMemo(() => {
    if (!semesterData || semesterData.length < 2) return { att: 0, gpa: 0 };
    const last = semesterData[semesterData.length - 1];
    const prev = semesterData[semesterData.length - 2];

    const attTrend =
      prev.attendance === 0
        ? 0
        : ((last.attendance - prev.attendance) / prev.attendance) * 100;
    const gpaTrend =
      prev.grades === 0 ? 0 : ((last.grades - prev.grades) / prev.grades) * 100;

    return { att: attTrend, gpa: gpaTrend };
  }, [semesterData]);

  const globalStats = useMemo(() => {
    if (hoverData) return hoverData;
    const avgAtt =
      attendance && attendance.length
        ? attendance.reduce((a, b: any) => a + b.attendance_percentage, 0) /
          attendance.length
        : 0;
    const latestG =
      gradesTrend && gradesTrend.length
        ? gradesTrend[gradesTrend.length - 1].sgpa
        : 0;
    return { avgAtt, latestG, isLive: false };
  }, [attendance, gradesTrend, hoverData]);

  const highestAttendance = useMemo(
    () =>
      attendance && attendance.length > 0
        ? [...attendance].sort(
            (a, b) => b.attendance_percentage - a.attendance_percentage,
          )[0]
        : null,
    [attendance],
  );

  const lowestAttendance = useMemo(
    () =>
      attendance && attendance.length > 0
        ? [...attendance].sort(
            (a, b) => a.attendance_percentage - b.attendance_percentage,
          )[0]
        : null,
    [attendance],
  );

  if (loading)
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-slate-100 flex items-center justify-center">
              <Activity className="w-8 h-8 text-navy-900 animate-pulse" />
            </div>
            <div className="absolute inset-0 border-t-2 border-navy-900 rounded-full animate-spin" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-900/40">
            Piping Academic Intelligence
          </span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="space-y-8">
        {/* DASHBOARD CARD */}
        <div className="bg-white rounded-[40px] border border-slate-100/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-8 lg:p-12 space-y-12">
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-navy-900 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-navy-900/40">
                    Real-time Visualizer
                  </span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                  Academic Analytics
                </h2>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-slate-400 capitalize">
                    Visualizing{" "}
                    <span className="text-slate-900">
                      {view === "semester"
                        ? "Semester Trends"
                        : "Subject Proficiency"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-[20px] border border-slate-100">
                <button
                  onClick={() => setView("semester")}
                  className={`px-6 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${
                    view === "semester"
                      ? "bg-white text-navy-900 shadow-xl shadow-slate-200"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Semesters
                </button>
                <button
                  onClick={() => setView("subject")}
                  className={`px-6 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${
                    view === "subject"
                      ? "bg-white text-navy-900 shadow-xl shadow-slate-200"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Subjects
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2" />
                <Select
                  value={view === "semester" ? timeHorizon : subjectFilter}
                  onValueChange={
                    view === "semester" ? setTimeHorizon : setSubjectFilter
                  }
                >
                  <SelectTrigger className="w-[140px] h-10 rounded-[14px] bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] border-slate-100 shadow-2xl">
                    {view === "semester" ? (
                      <>
                        <SelectItem
                          value="overall"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Overall
                        </SelectItem>
                        <SelectItem
                          value="year"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Past Year
                        </SelectItem>
                        <SelectItem
                          value="recent"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Recent
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem
                          value="all"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          All Classes
                        </SelectItem>
                        <SelectItem
                          value="theory"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Theory
                        </SelectItem>
                        <SelectItem
                          value="lab"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Labs
                        </SelectItem>
                        <SelectItem
                          value="low"
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          Low (75%)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Monitor size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Presence
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter text-nowrap">
                    {Number(globalStats?.avgAtt || 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <Award size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Latest SGPA
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
                    {Number(globalStats?.latestG || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Activity size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Cumulative
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter underline decoration-blue-100 decoration-8 underline-offset-[-2px]">
                    {finalCGPA.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <TrendingUp size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Momentum
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-4 py-2 rounded-2xl text-[13px] font-black ${trends.gpa >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                  >
                    {trends.gpa >= 0 ? "+" : ""}
                    {trends.gpa.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* CHART VISUALIZER */}
            <div className="h-[400px] w-full relative">
              <AnimatePresence mode="wait">
                {view === "semester" ? (
                  <motion.div
                    key="sem-chart-v4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={semesterData}
                        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillAtt"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f59e0b"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e0b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="fillGrd"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#a855f7"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#a855f7"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="8 8"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                          dy={15}
                        />
                        <YAxis yAxisId="left" hide domain={[0, 100]} />
                        <YAxis yAxisId="right" hide domain={[0, 10]} />
                        <Tooltip
                          content={<CustomTooltip mode="semester" />}
                          cursor={{
                            stroke: "#f1f5f9",
                            strokeWidth: 20,
                            strokeOpacity: 0.5,
                          }}
                        />

                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="attendance"
                          stroke="none"
                          fill="url(#fillAtt)"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="attendance"
                          stroke="#f59e0b"
                          strokeWidth={4}
                          dot={{
                            r: 4,
                            fill: "#fff",
                            stroke: "#f59e0b",
                            strokeWidth: 3,
                          }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
                          name="Attendance"
                        />

                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="grades"
                          stroke="none"
                          fill="url(#fillGrd)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="grades"
                          stroke="#a855f7"
                          strokeWidth={4}
                          strokeDasharray="10 6"
                          dot={{
                            r: 4,
                            fill: "#fff",
                            stroke: "#a855f7",
                            strokeWidth: 3,
                          }}
                          name="SGPA"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="subject-chart-v4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full w-full"
                  >
                    <div className="w-full h-full overflow-x-auto custom-scrollbar">
                      <style>{`
                            .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                         `}</style>
                      <div
                        style={{
                          minWidth: `${Math.max(filteredAttendance.length * 100, 1000)}px`,
                          height: "100%",
                        }}
                      >
                        <ResponsiveContainer width="100%" height="90%">
                          <ComposedChart
                            data={filteredAttendance}
                            margin={{ left: 0, top: 40, right: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="subject_name"
                              axisLine={false}
                              tickLine={false}
                              interval={0}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                return (
                                  <g transform={`translate(${x},${y})`}>
                                    <text
                                      x={0}
                                      y={0}
                                      dy={16}
                                      textAnchor="end"
                                      fill="#94a3b8"
                                      transform="rotate(-30)"
                                      className="text-[10px] font-black uppercase tracking-tighter"
                                    >
                                      {payload.value?.length > 20
                                        ? payload.value.substring(0, 18) + ".."
                                        : payload.value}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                              content={<CustomTooltip mode="subject" />}
                              cursor={{ fill: "#f8fafc" }}
                            />
                            <Bar
                              dataKey="attendance_percentage"
                              radius={[12, 12, 0, 0]}
                              barSize={44}
                            >
                              {filteredAttendance.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.attendance_percentage < 75
                                      ? "#f43f5e"
                                      : "#0f172a"
                                  }
                                  fillOpacity={
                                    entry.attendance_percentage < 75 ? 0.9 : 0.8
                                  }
                                />
                              ))}
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* BOTTOM INSIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard
            title="Highest Presence"
            subject={highestAttendance?.subject_name}
            value={`${highestAttendance?.attendance_percentage || 0}%`}
            icon={<Zap size={18} />}
            color="emerald"
          />
          <InsightCard
            title="Critical Risk"
            subject={lowestAttendance?.subject_name}
            value={`${lowestAttendance?.attendance_percentage || 0}%`}
            icon={<AlertCircle size={18} />}
            color="rose"
          />
          <InsightCard
            title="Curriculum Info"
            subject="Total Active Subjects"
            value={attendance.length.toString()}
            icon={<BookOpen size={18} />}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, subject, value, icon, color }: any) => {
  const colorClasses: any = {
    emerald: "bg-emerald-50 text-emerald-500",
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100/80 shadow-sm flex items-center justify-between group hover:bg-slate-50 transition-all duration-500">
      <div className="flex items-center gap-5">
        <div
          className={`w-14 h-14 rounded-[22px] flex items-center justify-center ${colorClasses[color]} group-hover:scale-110 transition-transform duration-500`}
        >
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {title}
          </p>
          <p className="text-sm font-black text-slate-900 leading-none truncate max-w-[150px]">
            {subject || "No Data"}
          </p>
        </div>
      </div>
      <div className="text-xl font-black text-slate-900">{value}</div>
    </div>
  );
};

export default StudentAnalytics;
