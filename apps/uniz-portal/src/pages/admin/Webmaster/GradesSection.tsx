/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  User,
  BookOpen,
  Save,
  Table,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BULK_UPDATE_GRADES,
  GET_BATCH_GRADES,
  ADD_MANUAL_GRADE,
  GET_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function GradesSection() {
  const [subTab, setSubTab] = useState<"bulk" | "batch" | "manual" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  // Form States
  const [bulkJson, setBulkJson] = useState("");
  const [batchFilters, setBatchFilters] = useState({
    branch: "CSE",
    year: "E1",
    semesterId: "SEM-1",
    failedOnly: true,
  });
  const [manualGrade, setManualGrade] = useState({
    studentId: "",
    subjectId: "",
    semesterId: "SEM-1",
    grade: "",
  });
  const [manualDept, setManualDept] = useState("CSE");

  // Dynamic subjects for manual entry
  const [manualSubjects, setManualSubjects] = useState<
    { code: string; name: string }[]
  >([]);
  const [manualSubjectsLoading, setManualSubjectsLoading] = useState(false);

  useEffect(() => {
    if (subTab !== "manual") return;
    const fetchManualSubjects = async () => {
      setManualSubjectsLoading(true);
      setManualGrade((prev) => ({ ...prev, subjectId: "" }));
      try {
        const token = (localStorage.getItem("admin_token") || "").replace(
          /"/g,
          "",
        );
        const url = `${GET_SUBJECTS}?department=${manualDept}&semester=${encodeURIComponent(manualGrade.semesterId)}&limit=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.subjects) {
          setManualSubjects(
            data.subjects.map((s: any) => ({ code: s.code, name: s.name })),
          );
        } else {
          setManualSubjects([]);
        }
      } catch {
        setManualSubjects([]);
      } finally {
        setManualSubjectsLoading(false);
      }
    };
    fetchManualSubjects();
  }, [manualDept, manualGrade.semesterId, subTab]);

  const handleBulkUpdate = async () => {
    if (!bulkJson) {
      toast.error("Please provide JSON data");
      return;
    }
    setLoading(true);
    try {
      const payload = JSON.parse(bulkJson);
      const res = await apiClient<any>(BULK_UPDATE_GRADES, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res && res.success) {
        toast.success("Bulk grades updated successfully");
        setBulkJson("");
      }
    } catch (error) {
      toast.error("Invalid JSON or server error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchGrades = async (p = page) => {
    setLoading(true);
    const { branch, year, failedOnly, semesterId } = batchFilters;

    try {
      const res = await apiClient<any>(GET_BATCH_GRADES, {
        params: {
          branch,
          year,
          failedOnly,
          semesterId,
          page: p,
          limit: 50,
        },
      });

      if (res && res.success) {
        setData(res.students || []);
        setMeta(
          res.meta || {
            total: (res.students || []).length,
            totalPages: 1,
          },
        );
        if (!res.students || res.students.length === 0)
          toast.info("No records found in this batch");
      }
    } catch (error) {
      console.error("GRADES_SYNC: Critical error:", error);
      toast.error("Synchronization failure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === "batch") {
      fetchBatchGrades(page);
    }
  }, [page, subTab]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient<any>(ADD_MANUAL_GRADE, {
        method: "POST",
        body: JSON.stringify(manualGrade),
      });
      if (res && res.success) {
        toast.success("Grade added successfully");
        setManualGrade({
          studentId: "",
          subjectId: "",
          semesterId: "SEM-1",
          grade: "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
          Grade Repository
        </h2>
        <p className="text-slate-500 font-medium text-[15px]">
          Bulk updates, batch records, and manual performance entry.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 bg-slate-100/80 p-1.5 rounded-full w-fit border border-slate-200/60 backdrop-blur-sm">
        <button
          onClick={() => setSubTab("bulk")}
          className={`px-6 py-2.5 rounded-full font-semibold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${subTab === "bulk" ? "bg-white text-blue-700 shadow-sm border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
        >
          <RefreshCw size={14} /> Bulk Update
        </button>
        <button
          onClick={() => setSubTab("batch")}
          className={`px-6 py-2.5 rounded-full font-semibold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${subTab === "batch" ? "bg-white text-blue-700 shadow-sm border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
        >
          <Search size={14} /> Batch Grades
        </button>
        <button
          onClick={() => setSubTab("manual")}
          className={`px-6 py-2.5 rounded-full font-semibold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${subTab === "manual" ? "bg-white text-blue-700 shadow-sm border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
        >
          <Plus size={14} /> Manual Add
        </button>
      </div>

      {!subTab ? (
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[28px] border border-slate-50 shadow-sm">
          <div className="w-24 h-24 bg-blue-50/50 rounded-2xl flex items-center justify-center text-blue-200">
            <GraduationCap size={48} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">
              Select an option to get started
            </p>
            <p className="text-slate-400 font-medium mt-2 max-w-sm">
              Choose between bulk updates, batch retrieval, or manual entry from
              the control switcher.
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-100" />
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {subTab === "bulk" && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-10 space-y-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-[22px] border border-blue-100 shadow-sm">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.01em]">
                    Bulk Update
                  </h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-1">
                    Update multiple student grades via JSON payload
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  JSON Payload Entry
                </label>
                <textarea
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder='{ "updates": [{ "studentId": "O210008", "subjectId": "...", "semesterId": "SEM-1", "grade": "EX" }] }'
                  className="w-full h-48 px-7 py-7 bg-slate-900 text-emerald-400 font-mono text-xs rounded-[24px] border-none outline-none focus:ring-8 focus:ring-slate-900/5 transition-all scrollbar-hide"
                />
              </div>

              <button
                onClick={handleBulkUpdate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-semibold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Save size={18} />
                )}
                Execute Bulk Update
              </button>
            </div>
          )}

          {subTab === "batch" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-slate-900 font-semibold text-sm">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Branch
                    </label>
                    <div className="relative group">
                      <select
                        value={batchFilters.branch}
                        onChange={(e) =>
                          setBatchFilters({
                            ...batchFilters,
                            branch: e.target.value,
                          })
                        }
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                      >
                        <option>CSE</option>
                        <option>ECE</option>
                        <option>EEE</option>
                        <option>MECH</option>
                        <option>CIVIL</option>
                        <option>CHEM</option>
                        <option>MET</option>
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Academic Year
                    </label>
                    <div className="relative group">
                      <select
                        value={batchFilters.year}
                        onChange={(e) =>
                          setBatchFilters({
                            ...batchFilters,
                            year: e.target.value,
                          })
                        }
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                      >
                        <option>E1</option>
                        <option>E2</option>
                        <option>E3</option>
                        <option>E4</option>
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Semester
                    </label>
                    <div className="relative group">
                      <select
                        value={batchFilters.semesterId}
                        onChange={(e) =>
                          setBatchFilters({
                            ...batchFilters,
                            semesterId: e.target.value,
                          })
                        }
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s}>SEM-{s}</option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Target
                    </label>
                    <div
                      className="flex items-center gap-3 h-[52px] bg-slate-50 border border-slate-100 rounded-2xl px-5 cursor-pointer hover:bg-white hover:border-blue-200 transition-all"
                      onClick={() =>
                        setBatchFilters({
                          ...batchFilters,
                          failedOnly: !batchFilters.failedOnly,
                        })
                      }
                    >
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all ${batchFilters.failedOnly ? "bg-blue-600" : "bg-slate-200"}`}
                      >
                        <div
                          className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${batchFilters.failedOnly ? "right-1" : "left-1"}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Remedial Only
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => fetchBatchGrades()}
                  disabled={loading}
                  className="h-11 px-8 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2.5"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Search size={16} />
                  )}
                  Sync Batch
                </button>
              </div>

              {data.length > 0 &&
                (() => {
                  const isPass = (g: any) => {
                    if (g === undefined || g === null) return false;
                    const val = String(g).toUpperCase().trim();
                    if (["R", "F", "FAIL", "REML", "U"].includes(val))
                      return false;
                    const num = parseFloat(val);
                    if (!isNaN(num)) return num >= 4.0;
                    return true;
                  };

                  const passedCount = data.filter((d) =>
                    isPass(d.grade),
                  ).length;
                  const failedCount = data.length - passedCount;
                  const passRate = ((passedCount / data.length) * 100).toFixed(
                    1,
                  );

                  return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            {
                              label: "Dataset Volume",
                              value: data.length,
                              icon: Table,
                              color: "bg-slate-50 text-slate-600",
                            },
                            {
                              label: "Successful Pass",
                              value: passedCount,
                              icon: CheckCircle2,
                              color: "bg-emerald-50 text-emerald-600",
                            },
                            {
                              label: "Remedial/Failures",
                              value: failedCount,
                              icon: AlertCircle,
                              color: "bg-red-50 text-red-600",
                            },
                            {
                              label: "Batch Efficiency",
                              value: `${passRate}%`,
                              icon: GraduationCap,
                              color: "bg-blue-50 text-blue-600",
                            },
                          ].map((stat, i) => (
                            <div
                              key={i}
                              className="bg-white p-7 rounded-[28px] border border-slate-100 flex items-center gap-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all"
                            >
                              <div
                                className={`p-4 rounded-2xl ${stat.color} shadow-inner bg-opacity-70`}
                              >
                                <stat.icon size={24} />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] leading-none mb-2.5">
                                  {stat.label}
                                </p>
                                <p className="text-3xl font-semibold text-slate-900 leading-none tracking-tighter">
                                  {stat.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 p-10 shadow-sm space-y-10">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] leading-none">
                                Spread Spectrum
                              </h4>
                              <p className="text-xl font-semibold text-slate-900 tracking-tight">
                                Grade Distribution
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-[20px] text-slate-400 border border-slate-100">
                              <BarChartIcon size={20} />
                            </div>
                          </div>
                          <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={(() => {
                                  const counts: any = {};
                                  data.forEach((d) => {
                                    const g = String(d.grade || "N/A")
                                      .toUpperCase()
                                      .trim();
                                    counts[g] = (counts[g] || 0) + 1;
                                  });
                                  return Object.keys(counts)
                                    .map((k) => ({ name: k, count: counts[k] }))
                                    .sort((a, b) => b.count - a.count);
                                })()}
                              >
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fill: "#64748b",
                                    fontSize: 11,
                                    fontWeight: 900,
                                  }}
                                  dy={15}
                                />
                                <YAxis hide domain={[0, "dataMax + 5"]} />
                                <Tooltip
                                  cursor={{ fill: "#f8fafc", radius: 15 }}
                                  contentStyle={{
                                    borderRadius: "2rem",
                                    border: "none",
                                    boxShadow: "0 30px 70px rgba(0,0,0,0.12)",
                                    padding: "1.5rem 2rem",
                                  }}
                                  itemStyle={{
                                    fontWeight: 900,
                                    color: "#0f172a",
                                    fontSize: "14px",
                                    textTransform: "uppercase",
                                  }}
                                />
                                <Bar
                                  dataKey="count"
                                  fill="#2563eb"
                                  radius={[15, 15, 15, 15]}
                                  barSize={50}
                                  animationDuration={2000}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 p-10 shadow-sm space-y-10 flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] leading-none">
                                Status Ratio
                              </h4>
                              <p className="text-xl font-semibold text-slate-900 tracking-tight">
                                Composition Analysis
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-[20px] text-slate-400 border border-slate-100">
                              <PieChartIcon size={20} />
                            </div>
                          </div>
                          <div className="h-[350px] w-full relative flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Satisfactory",
                                      value: passedCount,
                                    },
                                    {
                                      name: "Unsatisfactory",
                                      value: failedCount,
                                    },
                                  ]}
                                  innerRadius={85}
                                  outerRadius={115}
                                  paddingAngle={12}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f43f5e" />
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "2rem",
                                    border: "none",
                                    boxShadow: "0 30px 70px rgba(0,0,0,0.12)",
                                  }}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  align="center"
                                  wrapperStyle={{
                                    paddingTop: "40px",
                                    fontSize: "11px",
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.2em",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] leading-none mb-3 opacity-70">
                                Passing
                              </p>
                              <p className="text-4xl font-semibold text-slate-900 leading-none tracking-tighter">
                                {passRate}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3 ml-6">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <h4 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px]">
                            Detailed Cryptographic Trace
                          </h4>
                        </div>
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-10 py-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 leading-none">
                                  Identity Token
                                </th>
                                <th className="px-10 py-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 leading-none">
                                  Curriculum ID
                                </th>
                                <th className="px-10 py-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 leading-none">
                                  Term phase
                                </th>
                                <th className="px-10 py-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 text-right leading-none">
                                  Metric Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {data.map((grade, idx) => {
                                const passed = isPass(grade.grade);
                                return (
                                  <tr
                                    key={idx}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                  >
                                    <td className="px-10 py-7 font-semibold text-slate-900 tracking-tight">
                                      {grade.studentId}
                                    </td>
                                    <td className="px-10 py-7 text-slate-500 font-semibold">
                                      {grade.subjectId}
                                    </td>
                                    <td className="px-10 py-7">
                                      <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] border border-slate-200/50">
                                        {grade.semesterId}
                                      </span>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                      <span
                                        className={`text-xl font-semibold tracking-tighter ${!passed ? "text-red-500" : "text-slate-900"}`}
                                      >
                                        {grade.grade}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {meta.totalPages > 1 && (
                          <div className="flex justify-center items-center gap-4 pt-4 pb-12">
                            <button
                              disabled={page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
                            >
                              <Plus
                                size={20}
                                className="rotate-[135deg] text-slate-400"
                              />
                            </button>

                            <div className="flex items-center gap-2">
                              {[...Array(meta.totalPages)].map((_, i) => {
                                const p = i + 1;
                                if (
                                  p === 1 ||
                                  p === meta.totalPages ||
                                  (p >= page - 1 && p <= page + 1)
                                ) {
                                  return (
                                    <button
                                      key={p}
                                      onClick={() => setPage(p)}
                                      className={`w-10 h-10 rounded-xl font-black text-xs border transition-all ${
                                        page === p
                                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                                          : "bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  );
                                }
                                if (p === 2 || p === meta.totalPages - 1) {
                                  return (
                                    <span
                                      key={p}
                                      className="text-slate-300 font-bold"
                                    >
                                      ...
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>

                            <button
                              disabled={page >= meta.totalPages}
                              onClick={() =>
                                setPage((p) => Math.min(meta.totalPages, p + 1))
                              }
                              className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
                            >
                              <Plus
                                size={20}
                                className="rotate-45 text-slate-400"
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}

          {subTab === "manual" && (
            <div className="bg-blue-50/20 rounded-3xl border border-blue-100/50 p-8 space-y-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white text-blue-600 rounded-[20px] shadow-sm border border-blue-50">
                  <Plus size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    Manual Grade Entry
                  </h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-1">
                    Rapid individual record provisioning
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-8">
                <div className="flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Student ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <input
                        required
                        value={manualGrade.studentId}
                        onChange={(e) =>
                          setManualGrade({
                            ...manualGrade,
                            studentId: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 text-sm"
                        placeholder="O210329"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        value={manualDept}
                        onChange={(e) => setManualDept(e.target.value)}
                        className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                      >
                        {[
                          "CSE",
                          "ECE",
                          "EEE",
                          "MECH",
                          "CIVIL",
                          "CHEM",
                          "MATHEMATICS",
                          "PHYSICS",
                          "IT",
                          "ENGLISH",
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Subject Code
                      {manualSubjectsLoading && (
                        <span className="ml-2 text-blue-500 normal-case tracking-normal font-medium text-[9px]">
                          loading...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none z-10" />
                      <select
                        required
                        value={manualGrade.subjectId}
                        onChange={(e) =>
                          setManualGrade({
                            ...manualGrade,
                            subjectId: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none disabled:opacity-50"
                        disabled={manualSubjectsLoading}
                      >
                        <option value="">
                          {manualSubjectsLoading
                            ? "Loading..."
                            : manualSubjects.length === 0
                              ? "No subjects"
                              : "Select Subject"}
                        </option>
                        {manualSubjects.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} — {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                    {manualGrade.subjectId && (
                      <p className="text-[10px] text-blue-600 font-semibold ml-2">
                        ✓{" "}
                        {
                          manualSubjects.find(
                            (s) => s.code === manualGrade.subjectId,
                          )?.name
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Semester
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <select
                        value={manualGrade.semesterId}
                        onChange={(e) =>
                          setManualGrade({
                            ...manualGrade,
                            semesterId: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s}>SEM-{s}</option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                      Grade
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <input
                        required
                        value={manualGrade.grade}
                        onChange={(e) =>
                          setManualGrade({
                            ...manualGrade,
                            grade: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 text-sm"
                        placeholder="EX, A, B..."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-semibold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Plus size={18} />
                  )}
                  Add Record to Batch
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
