/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Table,
  CheckCircle2,
  AlertCircle,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Spinner } from "../../../components/ui/ios-spinner";
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
  GET_BATCH_GRADES,
  GET_SUBJECTS,
  UPLOAD_GRADES,
  GET_GRADES_TEMPLATE,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../../api/apiClient";
import { FileUploader } from "../../../components/ui/FileUploader";

export default function GradesSection() {
  const [subTab, setSubTab] = useState<"bulk" | "batch" | "manual" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  // Form States
  const [batchFilters, setBatchFilters] = useState({
    branch: "CSE",
    year: "E1",
    semesterId: "SEM-1",
    failedOnly: true,
  });

  // Template Filters
  const [templateFilters, setTemplateFilters] = useState({
    branch: "CSE",
    year: "E1",
    semesterId: "SEM-1",
    subjectCode: "",
    remedialsOnly: false,
    batch: "",
  });
  const [templateSubjects, setTemplateSubjects] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch subjects for template
  useEffect(() => {
    if (subTab !== "bulk") return;
    const fetchTemplateSubjects = async () => {
      try {
        const token = (localStorage.getItem("admin_token") || "").replace(
          /"/g,
          "",
        );
        const url = `${GET_SUBJECTS}?department=${templateFilters.branch}&semester=${encodeURIComponent(templateFilters.semesterId)}&limit=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.subjects) {
          const filtered = data.subjects.filter((s: any) =>
            s.code.toUpperCase().includes(`-${templateFilters.year}-`),
          );
          setTemplateSubjects(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch template subjects", err);
      }
    };
    fetchTemplateSubjects();
  }, [
    templateFilters.branch,
    templateFilters.year,
    templateFilters.semesterId,
    subTab,
  ]);

  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const { branch, year, semesterId, subjectCode, remedialsOnly, batch } =
        templateFilters;
      const url = GET_GRADES_TEMPLATE(
        branch,
        year,
        semesterId,
        subjectCode,
        remedialsOnly,
        batch,
      );
      const token = (localStorage.getItem("admin_token") || "").replace(
        /"/g,
        "",
      );

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Grades_Template_${branch}_${year}_${semesterId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Template generated successfully");
    } catch (err: any) {
      toast.error("Template generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file first");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const token = (localStorage.getItem("admin_token") || "").replace(
        /"/g,
        "",
      );
      const response = await fetch(UPLOAD_GRADES, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Excel processed. Background ingestion started.");
        setUploadFile(null);
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failure.");
    } finally {
      setUploading(false);
    }
  };

  // handleBulkUpdate was removed in favor of handleFileUpload

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

  return (
    <div className="p-6 space-y-8 pb-20 text-slate-900">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
          Grade Repository
        </h2>
        <p className="text-slate-500 font-medium text-[13px]">
          Bulk updates, batch records, and manual performance entry.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/60 backdrop-blur-sm">
        <button
          onClick={() => setSubTab("bulk")}
          className={`px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${subTab === "bulk" ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          <Zap size={14} /> Resource Ingestion
        </button>
        <button
          onClick={() => setSubTab("batch")}
          className={`px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${subTab === "batch" ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          <Search size={14} /> Batch Grades
        </button>
      </div>

      {!subTab ? (
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-xl border border-slate-50">
          <div className="w-24 h-24 bg-navy-50/50 rounded-xl flex items-center justify-center text-blue-200">
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
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-navy-100" />
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {subTab === "bulk" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              {/* Template Section */}
              <div className="bg-white rounded-xl border border-slate-100 p-10 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-none">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                      Template Generator
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      Provision specialized Excel sheets
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Branch
                    </label>
                    <select
                      value={templateFilters.branch}
                      onChange={(e) =>
                        setTemplateFilters({
                          ...templateFilters,
                          branch: e.target.value,
                        })
                      }
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-600 appearance-none"
                    >
                      <option>CSE</option>
                      <option>ECE</option>
                      <option>EEE</option>
                      <option>MECH</option>
                      <option>CIVIL</option>
                      <option>CHEM</option>
                      <option>MET</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Academic Year
                    </label>
                    <select
                      value={templateFilters.year}
                      onChange={(e) =>
                        setTemplateFilters({
                          ...templateFilters,
                          year: e.target.value,
                        })
                      }
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-600 appearance-none"
                    >
                      <option>E1</option>
                      <option>E2</option>
                      <option>E3</option>
                      <option>E4</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Semester
                    </label>
                    <select
                      value={templateFilters.semesterId}
                      onChange={(e) =>
                        setTemplateFilters({
                          ...templateFilters,
                          semesterId: e.target.value,
                        })
                      }
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-600 appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={`SEM-${s}`}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Subject (Optional)
                    </label>
                    <select
                      value={templateFilters.subjectCode}
                      onChange={(e) =>
                        setTemplateFilters({
                          ...templateFilters,
                          subjectCode: e.target.value,
                        })
                      }
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-600 appearance-none"
                    >
                      <option value="">All Subjects</option>
                      {templateSubjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code.split("-").pop()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Batch (e.g. O21)
                    </label>
                    <input
                      type="text"
                      placeholder="OPTIONAL"
                      value={templateFilters.batch}
                      onChange={(e) =>
                        setTemplateFilters({
                          ...templateFilters,
                          batch: e.target.value,
                        })
                      }
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-xs uppercase tracking-widest text-slate-600 shadow-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-2 bg-emerald-500 rounded-lg text-white">
                    <ShieldCheck size={16} />
                  </div>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                    Templates are pre-populated with student IDs and subject
                    data based on your filters to ensure error-free ingestion.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white h-16 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Spinner size="sm" className="brightness-200" />
                  ) : (
                    <Download size={20} />
                  )}
                  Download Smart Template
                </button>
              </div>

              {/* Upload Section */}
              <div className="w-full space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight leading-none mb-1">
                      Bulk Ingestion
                    </h3>
                    <p className="text-slate-500 font-medium text-[13px]">
                      Commit finished grading assets.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-900 overflow-hidden bg-transparent p-6">
                    <FileUploader
                      onFileSelect={setUploadFile}
                      label="Grade Resource"
                      description="XLSX or CSV based on the smart template."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Ingestion Protocol
                    </h4>
                    <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap size={10} /> Live Validation
                    </span>
                  </div>
                  <div className="p-5 bg-slate-900 rounded-xl text-emerald-400 font-mono text-[9px] leading-relaxed">
                    <p className="opacity-40"># Protocol Configuration:</p>
                    <p>
                      <span className="text-blue-400">Validate</span> (integrity
                      = true)
                    </p>
                    <p>
                      <span className="text-blue-400">Map</span> (headers {"=>"}{" "}
                      V3)
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-white">Status:</span>
                      <span
                        className={
                          uploadFile
                            ? "text-emerald-400"
                            : "text-amber-400 animate-pulse"
                        }
                      >
                        {uploadFile ? "ASSET_LOADED" : "AWAITING_INPUT"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {uploading ? (
                    <Spinner size="sm" className="brightness-200" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Execute System Ingestion
                </button>
              </div>
            </div>
          )}

          {subTab === "batch" && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-6">
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
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                      className="flex items-center gap-3 h-[52px] bg-slate-50 border border-slate-100 rounded-xl px-5 cursor-pointer hover:bg-white hover:border-navy-100 transition-all"
                      onClick={() =>
                        setBatchFilters({
                          ...batchFilters,
                          failedOnly: !batchFilters.failedOnly,
                        })
                      }
                    >
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all ${batchFilters.failedOnly ? "bg-navy-900" : "bg-slate-200"}`}
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
                  className="h-11 px-8 bg-navy-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-navy-800 active:scale-95 transition-all flex items-center justify-center gap-2.5"
                >
                  {loading ? (
                    <Spinner size="sm" className="brightness-200" />
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
                              color: "bg-navy-50 text-navy-900",
                            },
                          ].map((stat, i) => (
                            <div
                              key={i}
                              className="bg-white p-7 rounded-xl border border-slate-100 flex items-center gap-5 transition-all"
                            >
                              <div
                                className={`p-4 rounded-xl ${stat.color} bg-opacity-70`}
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

                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-10 transition-all space-y-10">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] leading-none">
                                Spread Spectrum
                              </h4>
                              <p className="text-xl font-semibold text-slate-900 tracking-tight">
                                Grade Distribution
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
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

                        <div className="bg-white rounded-xl border border-slate-100 p-10 transition-all space-y-10 flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em] leading-none">
                                Status Ratio
                              </h4>
                              <p className="text-xl font-semibold text-slate-900 tracking-tight">
                                Composition Analysis
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
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
                          <div className="w-1.5 h-1.5 rounded-full bg-navy-900" />
                          <h4 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px]">
                            Detailed Cryptographic Trace
                          </h4>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all">
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
                              className="p-3 rounded-xl bg-white border border-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 active:scale-90"
                            >
                              <div className="rotate-[135deg] text-slate-400">
                                <ArrowRight size={20} />
                              </div>
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
                                          ? "bg-navy-900 text-white border-navy-100"
                                          : "bg-white text-slate-400 border-slate-100 hover:border-navy-100 hover:text-navy-900"
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
                              className="p-3 rounded-xl bg-white border border-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 active:scale-90"
                            >
                              <div className="rotate-45 text-slate-400">
                                <ArrowRight size={20} />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
