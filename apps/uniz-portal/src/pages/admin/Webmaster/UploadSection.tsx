/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  UPLOAD_ATTENDANCE,
  UPLOAD_GRADES,
  GET_ATTENDANCE_TEMPLATE,
  GET_GRADES_TEMPLATE,
  GET_SUBJECTS,
  ACADEMICS_PROGRESS,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient, downloadFile } from "../../../api/apiClient";
import { FileUploader } from "../../../components/ui/FileUploader";

type UploadType = "attendance" | "grades";

export default function UploadSection({ type }: { type: UploadType }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Template Parameters
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E2");
  const [semester, setSemester] = useState("SEM-1");
  const [subjectCode, setSubjectCode] = useState("");
  const [remedialsOnly, setRemedialsOnly] = useState(false);
  const [batch, setBatch] = useState("");

  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>(
    [],
  );
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

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
          // Year is encoded in the subject code (e.g. CSE-E2-SEM-1-01)
          // Filter client-side by checking if the code contains the selected year
          const filtered = data.subjects.filter((s: any) =>
            s.code.toUpperCase().includes(`-${year}-`),
          );
          setSubjects(
            filtered.map((s: any) => ({ code: s.code, name: s.name })),
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

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await apiClient<{ success: boolean; batches: string[] }>(
          GET_AVAILABLE_BATCHES,
        );
        if (res && res.success) {
          setAvailableBatches(res.batches);
        }
      } catch (e) {
        console.error("Failed to fetch batches", e);
      }
    };
    fetchBatches();
  }, []);

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
        headers: {},
        body: formData as any,
      });

      if (res && res.success) {
        if (res.uploadId) {
          setUploadId(res.uploadId);
          toast.info("Upload started. Monitoring progress...");
        } else {
          setResult({ success: true, ...res });
          toast.success(
            `${type === "attendance" ? "Attendance" : "Grades"} uploaded successfully`,
          );
        }
      } else if (res) {
        setResult({ success: false, msg: res.msg || "Upload failed" });
      }
    } catch (error) {
      toast.error(`Error uploading ${type}`);
    } finally {
      setLoading(false);
    }
  };

  // Progress Polling
  useEffect(() => {
    let interval: any;
    if (uploadId) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient<any>(ACADEMICS_PROGRESS(uploadId), {
            showToast: false,
          } as any);
          if (res && res.success && res.progress) {
            // setProgress(res.progress); // Removed UI
            if (
              res.progress.status === "completed" ||
              res.progress.status === "done" ||
              res.progress.status === "error" ||
              res.progress.status === "failed"
            ) {
              setUploadId(null);
              clearInterval(interval);
              if (
                res.progress.status === "completed" ||
                res.progress.status === "done"
              ) {
                setResult({
                  success: true,
                  processed: res.progress.processed,
                  total: res.progress.total,
                });
                toast.success("Synchronization completed successfully");
              } else {
                setResult({
                  success: false,
                  msg: res.progress.message || "Synchronization failed",
                });
                toast.error("Synchronization failed");
              }
            }
          }
        } catch (e) {
          console.error("Progress poll error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [uploadId]);

  const downloadTemplate = async () => {
    const url =
      type === "attendance"
        ? GET_ATTENDANCE_TEMPLATE(branch, year, semester, batch)
        : GET_GRADES_TEMPLATE(
          branch,
          year,
          semester,
          subjectCode,
          remedialsOnly,
          batch,
        );
    const fileName = `${type}_${branch}_${year}_${semester}_template.xlsx`;
    await downloadFile(url, fileName);
  };

  return (
    <div className="p-6 space-y-8 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none capitalize">
            {type} Bulk Management
          </h2>
          <p className="text-slate-500 font-medium text-[13px]">
            Synchronize institutional {type} records with the core system.
          </p>
        </div>

        {type === "grades" && (
          <button
            onClick={downloadTemplate}
            className="group flex items-center gap-2.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-all font-bold uppercase tracking-widest text-[9px] active:scale-95"
          >
            <FileDown size={13} className="text-slate-500 group-hover:scale-110 transition-transform" />
            Download {type} Template
          </button>
        )}
      </div>

      <div className="w-full">
        <div
          className={`grid grid-cols-1 md:grid-cols-3 ${type === "grades" ? "lg:grid-cols-7" : "lg:grid-cols-6"} gap-6 items-end`}
        >
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Branch
            </label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
              >
                <option value="ALL">ALL BRANCHES</option>
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
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Year
            </label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
              >
                <option value="ALL">ALL YEARS</option>
                {["E1", "E2", "E3", "E4"].map((y) => (
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
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Semester
            </label>
            <div className="relative group">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
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

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Batch
            </label>
            <div className="relative group">
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
              >
                <option value="ALL">ALL BATCHES</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    {b}
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
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Subject
                  {subjectsLoading && (
                    <span className="ml-2 text-slate-900 normal-case tracking-normal font-medium">
                      loading...
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none disabled:opacity-50"
                    disabled={subjectsLoading}
                  >
                    <option value="">
                      {subjectsLoading
                        ? "Loading..."
                        : subjects.length === 0
                          ? "No subjects found"
                          : "ALL SUBJECTS (BULK)"}
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
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Scope
                </label>
                <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/50">
                  <button
                    onClick={() => setRemedialsOnly(false)}
                    className={`px-6 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${!remedialsOnly ? "bg-white text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => setRemedialsOnly(true)}
                    className={`px-6 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${remedialsOnly ? "bg-white text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Remedial
                  </button>
                </div>
              </div>
            </>
          )}

          {type === "attendance" && (
            <div className="flex items-end lg:col-span-2">
              <button
                onClick={downloadTemplate}
                className="h-11 px-10 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2.5 active:scale-95 w-full whitespace-nowrap"
              >
                <FileDown size={14} /> Download Template
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-900 overflow-hidden bg-transparent p-6">
          <FileUploader
            onFileSelect={(f) => {
              setFile(f);
              setResult(null);
            }}
            label={`Select ${type} Excel/CSV`}
            description={`Drag and drop the official ${type} record file.`}
          />
        </div>

        <button
          disabled={!file || loading || !!uploadId}
          onClick={handleUpload}
          className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : uploadId ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Upload size={16} />
          )}
          {uploadId ? "Synchronizing..." : `Process & Record ${type}`}
        </button>

        {result && (
          <div
            className={`p-6 rounded-xl border shadow-none ${result.success
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
              : "bg-red-50/50 border-red-200 text-red-900"
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${result.success ? "bg-emerald-500 text-white shadow-none" : "bg-red-500 text-white shadow-none"}`}
              >
                {result.success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              <h3
                className={`text-lg font-semibold tracking-tight ${result.success ? "text-emerald-900" : "text-red-900"}`}
              >
                {result.success ? "Sync Successful" : "Sync Failed"}
              </h3>
            </div>

            <div className="space-y-3">
              {result.success ? (
                <>
                  <p className="opacity-80 font-medium text-[13px]">
                    Successfully processed {result.processed || 0} records
                    into the central database.
                  </p>
                  <div className="p-4 bg-white/40 rounded-xl border border-emerald-200/40">
                    <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-widest mb-1 leading-none">
                      Immediate Update
                    </p>
                    <p className="text-emerald-900 font-medium text-[13px]">
                      Management portals and student dashboards will reflect updates.
                    </p>
                  </div>
                </>
              ) : (
                <p className="opacity-80 font-medium text-[13px]">{result.msg}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
