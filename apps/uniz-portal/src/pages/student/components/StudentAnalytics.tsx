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
} from "recharts";
import { Card } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/line-charts-5";
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
  TrendingDown,
} from "lucide-react";
import {
  STUDENT_ATTENDANCE_ANALYTICS,
  STUDENT_GRADES_TREND_ANALYTICS,
} from "../../../api/endpoints";
import { motion, AnimatePresence } from "framer-motion";

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

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "#f59e0b",
  },
  grades: {
    label: "SGPA",
    color: "#a855f7",
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/80 backdrop-blur-md p-3 shadow-xl min-w-[180px] text-slate-900 animate-in zoom-in duration-200">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-50">
          {mode === "subject" ? "Module Details" : label}
        </div>

        {mode === "subject" ? (
          <div className="space-y-2">
            <div className="text-[10px] font-bold leading-tight truncate">
              {payload[0].payload.subject_name}
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Attendance</span>
              <span className="font-bold text-amber-500">
                {payload[0].value}%
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[9px] font-medium text-slate-500">
                    {entry.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold tabular-nums">
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
  const [viewMode, setViewMode] = useState<"semester" | "subject">("semester");
  const [timeHorizon, setTimeHorizon] = useState("overall");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [hoverData, setHoverData] = useState<any>(null);

  const API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attendanceRes, gradesRes] = await Promise.all([
          fetch(STUDENT_ATTENDANCE_ANALYTICS(studentId), {
            headers: { "X-API-Key": API_KEY }
          }).then(res => res.json()),
          fetch(STUDENT_GRADES_TREND_ANALYTICS(studentId), {
            headers: { "X-API-Key": API_KEY }
          }).then(res => res.json())
        ]);
        if (attendanceRes) setAttendance(attendanceRes);
        if (gradesRes) setGradesTrend(gradesRes);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    if (studentId) fetchData();
  }, [studentId, API_KEY]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((sub) => {
      if (subjectFilter === "theory")
        return !sub.subject_name.toLowerCase().includes("lab");
      if (subjectFilter === "lab")
        return sub.subject_name.toLowerCase().includes("lab");
      if (subjectFilter === "low") return sub.attendance_percentage < 75;
      return true;
    });
  }, [attendance, subjectFilter]);

  const semesterData = useMemo(() => {
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
        ? semAttItems.reduce((a, b) => a + b.attendance_percentage, 0) /
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
    if (!gradesTrend.length) return 0;
    const sum = gradesTrend.reduce((acc, curr) => acc + curr.sgpa, 0);
    return sum / gradesTrend.length;
  }, [gradesTrend]);

  const trends = useMemo(() => {
    if (semesterData.length < 2) return { att: 0, gpa: 0 };
    const last = semesterData[semesterData.length - 1];
    const prev = semesterData[semesterData.length - 2];

    const attTrend =
      ((last.attendance - prev.attendance) / prev.attendance) * 100;
    const gpaTrend = ((last.grades - prev.grades) / prev.grades) * 100;

    return { att: attTrend, gpa: gpaTrend };
  }, [semesterData]);

  const globalStats = useMemo(() => {
    if (hoverData) return hoverData;
    const avgAtt = attendance.length
      ? attendance.reduce((a, b) => a + b.attendance_percentage, 0) /
        attendance.length
      : 0;
    const latestG = gradesTrend.length
      ? gradesTrend[gradesTrend.length - 1].sgpa
      : 0;
    return { avgAtt, latestG, isLive: false };
  }, [attendance, gradesTrend, hoverData]);

  const highestAttendance = useMemo(
    () =>
      [...attendance].sort(
        (a, b) => b.attendance_percentage - a.attendance_percentage,
      )[0],
    [attendance],
  );

  const lowestAttendance = useMemo(
    () =>
      [...attendance].sort(
        (a, b) => a.attendance_percentage - b.attendance_percentage,
      )[0],
    [attendance],
  );

  if (loading)
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-0.5 bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-blue-600"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Syncing Intelligence
          </span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-0 md:py-8 md:px-6">
      <div className="space-y-4 md:space-y-8 px-3 md:px-0">
        {/* VIEW SELECTOR */}
        <div className="flex justify-center">
          <div className="flex bg-slate-100/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("semester")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === "semester" ? "bg-white text-slate-900 border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
            >
              Semesters
            </button>
            <button
              onClick={() => setViewMode("subject")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === "subject" ? "bg-white text-slate-900 border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
            >
              Modules
            </button>
          </div>
        </div>

        <Card className="rounded-none sm:rounded-[2rem] border-x-0 sm:border border-slate-100 bg-white overflow-hidden w-full mx-auto shadow-none">
          <div className="p-4 md:p-10 space-y-4 md:space-y-10">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                Academic Analytics
              </h2>

              <div className="w-full sm:w-auto">
                <Select
                  value={viewMode === "semester" ? timeHorizon : subjectFilter}
                  onValueChange={
                    viewMode === "semester" ? setTimeHorizon : setSubjectFilter
                  }
                >
                  <SelectTrigger className="w-full sm:w-[130px] h-9 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-slate-100 z-[100]">
                    {viewMode === "semester" ? (
                      <>
                        <SelectItem value="overall">All time</SelectItem>
                        <SelectItem value="year">Past year</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="lab">Laboratories</SelectItem>
                        <SelectItem value="low">Below 75%</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HERO METRICS ROW */}
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-end gap-x-4 gap-y-4 lg:gap-12">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Presence
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {Number(globalStats?.avgAtt || 0).toFixed(1)}%
                  </span>
                  {trends.att !== 0 && (
                    <div
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${trends.att > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {trends.att > 0 ? (
                        <TrendingUp size={8} />
                      ) : (
                        <TrendingDown size={8} />
                      )}
                      {Math.abs(trends.att).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-1 h-3 bg-purple-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    SGPA
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {Number(globalStats?.latestG || 0).toFixed(2)}
                  </span>
                  {trends.gpa !== 0 && (
                    <div
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${trends.gpa > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {trends.gpa > 0 ? (
                        <TrendingUp size={8} />
                      ) : (
                        <TrendingDown size={8} />
                      )}
                      {Math.abs(trends.gpa).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 col-span-2 lg:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-1 h-3 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    CGPA
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {finalCGPA.toFixed(2)}
                  </span>
                  <div className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 rounded-md">
                    AVERAGE
                  </div>
                </div>
              </div>
            </div>

            {/* CHART AREA */}
            <div className="h-[200px] md:h-[350px] w-full pt-2">
              <AnimatePresence mode="wait">
                {viewMode === "semester" ? (
                  <motion.div
                    key="sem-chart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <ComposedChart
                        data={semesterData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        onMouseMove={(e) => {
                          if (
                            e &&
                            e.activePayload &&
                            e.activePayload.length >= 2
                          ) {
                            setHoverData({
                              avgAtt: e.activePayload[0].value,
                              latestG: e.activePayload[1].value,
                              isLive: true,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoverData(null)}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
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
                            fontWeight: 600,
                          }}
                          dy={8}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#cbd5e1", fontSize: 9 }}
                          domain={[0, 100]}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#cbd5e1", fontSize: 9 }}
                          domain={[0, 10]}
                        />
                        <Tooltip
                          content={<CustomTooltip mode="semester" />}
                          cursor={{ stroke: "#f1f5f9", strokeWidth: 1 }}
                        />

                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="attendance"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{
                            r: 3,
                            fill: "#f59e0b",
                            strokeWidth: 1.5,
                            stroke: "#fff",
                          }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          name="Attendance"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="grades"
                          stroke="#a855f7"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{
                            r: 3,
                            fill: "#a855f7",
                            strokeWidth: 1.5,
                            stroke: "#fff",
                          }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          name="SGPA"
                        />
                      </ComposedChart>
                    </ChartContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sub-chart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <ComposedChart
                        data={filteredAttendance}
                        layout="vertical"
                        margin={{ left: 100, top: 0, right: 10, bottom: 0 }}
                      >
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                          dataKey="subject_name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#64748b",
                            fontSize: 8,
                            fontWeight: 600,
                          }}
                          width={100}
                        />
                        <Tooltip
                          content={<CustomTooltip mode="subject" />}
                          cursor={{ fill: "#f8fafc", radius: 8 }}
                        />
                        <Bar
                          dataKey="attendance_percentage"
                          radius={[0, 8, 8, 0]}
                          barSize={10}
                        >
                          {filteredAttendance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.attendance_percentage < 75
                                  ? "#f43f5e"
                                  : entry.attendance_percentage > 90
                                    ? "#10b981"
                                    : "#f59e0b"
                              }
                              fillOpacity={0.9}
                            />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ChartContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* BOTTOM INSIGHTS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 w-full mx-auto px-4 sm:px-0">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Zap size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Peak
              </p>
              <p className="text-[11px] font-bold text-slate-900 truncate">
                {highestAttendance?.subject_name}
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-600">
              {highestAttendance?.attendance_percentage}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <AlertCircle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Risk
              </p>
              <p className="text-[11px] font-bold text-slate-900 truncate">
                {lowestAttendance?.subject_name}
              </p>
            </div>
            <div className="text-[11px] font-bold text-rose-600">
              {lowestAttendance?.attendance_percentage}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <BookOpen size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Catalog
              </p>
              <p className="text-[11px] font-bold text-slate-900">
                Tracked Units
              </p>
            </div>
            <div className="text-[11px] font-bold text-purple-600">
              {attendance.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
