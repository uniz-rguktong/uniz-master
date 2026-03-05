/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  UPLOAD_ATTENDANCE,
  UPLOAD_GRADES,
  GET_ATTENDANCE_TEMPLATE,
  GET_GRADES_TEMPLATE,
  GET_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient, downloadFile } from "../../../api/apiClient";

type UploadType = "attendance" | "grades";

export default function UploadSection({ type }: { type: UploadType }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Template Parameters
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E2");
  const [semester, setSemester] = useState("SEM-1");
  const [subjectCode, setSubjectCode] = useState("");
  const [remedialsOnly, setRemedialsOnly] = useState(false);

  // Dynamic subject list
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>(
    [],
  );
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Fetch subjects whenever branch or semester changes (only for grades upload)
  useEffect(() => {
    if (type !== "grades") return;
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      setSubjectCode(""); // reset selection on criteria change
      try {
        const token = (
          localStorage.getItem("admin_token") ||
          localStorage.getItem("faculty_token") ||
          ""
        ).replace(/"/g, "");
        const url = `${GET_SUBJECTS}?department=${branch}&semester=${encodeURIComponent(semester)}&limit=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.subjects) {
          setSubjects(
            data.subjects.map((s: any) => ({ code: s.code, name: s.name })),
          );
        } else {
          setSubjects([]);
        }
      } catch {
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [branch, semester, type]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const endpoint = type === "attendance" ? UPLOAD_ATTENDANCE : UPLOAD_GRADES;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Using raw fetch here because apiClient defaults to JSON content-type
      // but we need to pass the token still. We can enhance apiClient or do it manually.
      // Let's use apiClient with null headers to let browser set boundary
      const res = await apiClient<any>(endpoint, {
        method: "POST",
        headers: {
          // "Content-Type" will be overridden or excluded to allow FormData boundary
        },
        body: formData as any,
      });

      if (res && res.success) {
        setResult({ success: true, ...res });
        toast.success(
          `${type === "attendance" ? "Attendance" : "Grades"} uploaded successfully`,
        );
      } else if (res) {
        setResult({ success: false, msg: res.msg || "Upload failed" });
      }
    } catch (error) {
      toast.error(`Error uploading ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const url =
      type === "attendance"
        ? GET_ATTENDANCE_TEMPLATE(branch, year, semester)
        : GET_GRADES_TEMPLATE(
            branch,
            year,
            semester,
            subjectCode,
            remedialsOnly,
          );
    const fileName = `${type}_${branch}_${year}_${semester}_template.xlsx`;
    await downloadFile(url, fileName);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none capitalize">
          {type} Bulk Management
        </h2>
        <p className="text-slate-500 font-medium text-[15px]">
          Synchronize institutional {type} records with the core system.
        </p>
      </div>

      <div className="flex flex-col gap-6 bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Branch
            </label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
              >
                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                  (b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Year
            </label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
              >
                {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
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
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`SEM-${s}`}>
                    SEM-{s}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          {type === "grades" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Subject Code
                  {subjectsLoading && (
                    <span className="ml-2 text-blue-500 normal-case tracking-normal font-medium">
                      loading...
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none disabled:opacity-50"
                    disabled={subjectsLoading}
                  >
                    <option value="">
                      {subjectsLoading
                        ? "Loading subjects..."
                        : subjects.length === 0
                          ? "No subjects found"
                          : "Select Subject"}
                    </option>
                    {subjects.map((s) => (
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
                {subjectCode && (
                  <p className="text-[10px] text-blue-600 font-semibold ml-2 mt-1">
                    ✓ {subjects.find((s) => s.code === subjectCode)?.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Scope
                </label>
                <div className="flex bg-slate-100/80 p-1 rounded-full w-fit border border-slate-200/50 shadow-inner">
                  <button
                    onClick={() => setRemedialsOnly(false)}
                    className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${!remedialsOnly ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => setRemedialsOnly(true)}
                    className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${remedialsOnly ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Remedial
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-50">
          <button
            onClick={downloadTemplate}
            disabled={type === "grades" && !subjectCode}
            className="h-11 px-6 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-full text-blue-700 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            <FileDown size={14} /> Download {type} Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div
            className={`
            border-4 border-dashed rounded-3xl p-12 text-center transition-all relative
            ${file ? "border-blue-600 bg-blue-50/30" : "border-slate-100 hover:border-blue-200 bg-white"}
          `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".xlsx,.csv"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-5"
            >
              <div
                className={`p-6 rounded-[28px] transition-all duration-300 ${file ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105" : "bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500"}`}
              >
                <Upload size={48} />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900 tracking-tight leading-none mb-2">
                  {file ? file.name : `Select ${type} file`}
                </p>
                <p className="text-slate-400 font-medium text-[15px]">
                  Supports XLSX, XLS or CSV files
                </p>
              </div>
            </label>

            {file && (
              <button
                onClick={() => setFile(null)}
                className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-md text-red-500 hover:scale-110 transition-transform"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            disabled={!file || loading}
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-semibold uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Upload size={20} />
            )}
            Process & Record {type}
          </button>
        </div>

        <div className="space-y-6">
          {result ? (
            <div
              className={`p-8 rounded-2xl border animate-in slide-in-from-right-8 duration-500 h-full ${
                result.success
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`p-3.5 rounded-2xl ${result.success ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-red-500 text-white shadow-lg shadow-red-200"}`}
                >
                  {result.success ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <AlertCircle size={26} />
                  )}
                </div>
                <h3
                  className={`text-2xl font-semibold tracking-[-0.02em] ${result.success ? "text-emerald-900" : "text-red-900"}`}
                >
                  {result.success ? "Sync Completed" : "Sync Failed"}
                </h3>
              </div>

              <div className="space-y-4">
                {result.success ? (
                  <>
                    <p className="text-emerald-800 font-medium">
                      Successfully processed {result.processed || 0} records
                      into the central database.
                    </p>
                    <div className="p-4 bg-white/50 rounded-2xl border border-emerald-200/50">
                      <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-widest mb-1.5 leading-none">
                        Status
                      </p>
                      <p className="text-emerald-900 font-semibold text-[15px] leading-tight">
                        All systems green. Student dashboards updated.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-red-800 font-medium">{result.msg}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-[28px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center h-full shadow-inner">
              <div className="p-5 bg-white rounded-2xl shadow-sm text-slate-300 mb-8 border border-slate-100">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                Ready for synchronization
              </h3>
              <p className="text-slate-400 max-w-[240px] font-medium text-[15px] leading-relaxed">
                Upload a file to see the system status and processing results
                here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
