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
} from "recharts";
import { Card } from "@/components/ui/card";
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
      <div className="rounded-xl border border-slate-100 bg-white/80 backdrop-blur-md p-3 shadow-xl min-w-[180px] text-slate-900 animate-in zoom-in duration-200">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-50">
          {mode === "subject" ? "Subject Details" : label}
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
  const [view, setView] = useState<"semester" | "subject">("semester");
  const [timeHorizon, setTimeHorizon] = useState("overall");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [hoverData, setHoverData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attendanceRes, gradesRes] = await Promise.all([
          apiClient<AttendanceData[]>(STUDENT_ATTENDANCE_ANALYTICS(studentId)),
          apiClient<GradeTrendData[]>(STUDENT_GRADES_TREND_ANALYTICS(studentId))
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
  }, [studentId]);

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
    return sum / Math.max(gradesTrend.length, 1);
  }, [gradesTrend]);

  const trends = useMemo(() => {
    if (semesterData.length < 2) return { att: 0, gpa: 0 };
    const last = semesterData[semesterData.length - 1];
    const prev = semesterData[semesterData.length - 2];

    const attTrend = prev.attendance === 0 ? 0 : ((last.attendance - prev.attendance) / prev.attendance) * 100;
    const gpaTrend = prev.grades === 0 ? 0 : ((last.grades - prev.grades) / prev.grades) * 100;

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
              className="absolute inset-0 bg-navy-900"
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
          <div className="flex bg-slate-100/50 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setView("semester")}
              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                view === "semester"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Semesters
            </button>
            <button
              onClick={() => setView("subject")}
              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                view === "subject"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Subjects
            </button>
          </div>
        </div>

        <Card className="rounded-none sm:rounded-[2.5rem] border-x-0 sm:border border-slate-100 bg-white overflow-hidden w-full mx-auto shadow-[0_8px_40px_rgb(0,0,0,0.02)]">
          <div className="p-4 md:p-10 space-y-4 md:space-y-10">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Academic Analytics
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Visualizing {view === "semester" ? "Semester Trends" : "Subject Attendance"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select 
                  value={view === "semester" ? timeHorizon : subjectFilter} 
                  onValueChange={view === "semester" ? setTimeHorizon : setSubjectFilter}
                >
                  <SelectTrigger className="w-[140px] h-10 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 focus:ring-navy-900">
                    <SelectValue placeholder={view === "semester" ? "All Time" : "All Subjects"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                    {view === "semester" ? (
                      <>
                        <SelectItem value="overall" className="text-[10px] font-bold uppercase tracking-widest">Overall</SelectItem>
                        <SelectItem value="year" className="text-[10px] font-bold uppercase tracking-widest">Past Year</SelectItem>
                        <SelectItem value="recent" className="text-[10px] font-bold uppercase tracking-widest">Recent</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All Subjects</SelectItem>
                        <SelectItem value="theory" className="text-[10px] font-bold uppercase tracking-widest">Theory Only</SelectItem>
                        <SelectItem value="lab" className="text-[10px] font-bold uppercase tracking-widest">Labs Only</SelectItem>
                        <SelectItem value="low" className="text-[10px] font-bold uppercase tracking-widest">Critically Low</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HERO METRICS ROW */}
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-end gap-x-4 gap-y-4 lg:gap-12 pb-4 border-b border-slate-50">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Presence
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
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
                  <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
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
                  <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {finalCGPA.toFixed(2)}
                  </span>
                  <div className="px-2 py-0.5 text-[9px] font-black bg-blue-50 text-blue-600 rounded-lg uppercase tracking-wider">
                    Cumulative
                  </div>
                </div>
              </div>
            </div>

            {/* CHART AREA */}
            <div className="h-[300px] md:h-[400px] w-full pt-4 relative">
              <AnimatePresence mode="wait">
                {view === "semester" ? (
                  <motion.div
                    key="sem-chart"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={semesterData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        onMouseMove={(e) => {
                          const payload = e?.activePayload;
                          if (payload && payload.length >= 2) {
                            setHoverData({
                              avgAtt: payload[0].value,
                              latestG: payload[1].value,
                              isLive: true,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoverData(null)}
                      >
                        <defs>
                          <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                          dy={12}
                        />
                        <YAxis yAxisId="left" hide domain={[0, 100]} />
                        <YAxis yAxisId="right" hide domain={[0, 10]} />
                        <Tooltip content={<CustomTooltip mode="semester" />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="attendance"
                          stroke="#f59e0b"
                          strokeWidth={4}
                          dot={{ r: 5, fill: "#f59e0b", strokeWidth: 3, stroke: "#fff" }}
                          activeDot={{ r: 7, strokeWidth: 0 }}
                          name="Attendance"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="grades"
                          stroke="#a855f7"
                          strokeWidth={4}
                          strokeDasharray="8 6"
                          dot={{ r: 5, fill: "#a855f7", strokeWidth: 3, stroke: "#fff" }}
                          activeDot={{ r: 7, strokeWidth: 0 }}
                          name="SGPA"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="subject-chart"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    className="h-full w-full"
                  >
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                      <style>{`
                        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                      `}</style>
                      <div style={{ minWidth: `${Math.max(filteredAttendance.length * 100, 1000)}px`, height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={filteredAttendance}
                            margin={{ left: 20, top: 40, right: 20, bottom: 100 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                                      dy={14}
                                      textAnchor="end"
                                      fill="#64748b"
                                      transform="rotate(-35)"
                                      className="text-[10px] font-bold tracking-tight"
                                    >
                                      {payload.value}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                              domain={[0, 100]}
                              dx={-10}
                            />
                            <Tooltip
                              content={<CustomTooltip mode="subject" />}
                              cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
                            />
                            <Bar
                              dataKey="attendance_percentage"
                              radius={[8, 8, 0, 0]}
                              barSize={40}
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
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* BOTTOM INSIGHTS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 w-full mx-auto px-4 sm:px-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 group transition-all hover:bg-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Highest Presence
              </p>
              <p className="text-[13px] font-black text-slate-900 truncate">
                {highestAttendance?.subject_name}
              </p>
            </div>
            <div className="text-[15px] font-black text-emerald-600">
              {highestAttendance?.attendance_percentage}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 group transition-all hover:bg-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Critical Risk
              </p>
              <p className="text-[13px] font-black text-slate-900 truncate">
                {lowestAttendance?.subject_name}
              </p>
            </div>
            <div className="text-[15px] font-black text-rose-600">
              {lowestAttendance?.attendance_percentage}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 group transition-all hover:bg-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Catalog
              </p>
              <p className="text-[13px] font-black text-slate-900">
                Tracked Subjects
              </p>
            </div>
            <div className="text-[15px] font-black text-purple-600">
              {attendance.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
