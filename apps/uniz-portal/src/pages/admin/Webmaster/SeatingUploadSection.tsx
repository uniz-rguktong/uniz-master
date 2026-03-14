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
  UPLOAD_SEATING,
  GET_SEATING_TEMPLATE,
  SEMESTERS,
  ACADEMICS_PROGRESS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient, downloadFile } from "../../../api/apiClient";
import { FileUploader } from "../../../components/ui/FileUploader";

export default function SeatingUploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  // Template Parameters
  const [semesterId, setSemesterId] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E3");
  const [examName, setExamName] = useState("MID-1");

  // Semesters list
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semestersLoading, setSemestersLoading] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await apiClient<any>(SEMESTERS);
        if (data) {
          setSemesters(data);
          // Set default to first active one
          const active = data.find(
            (s: any) =>
              s.status === "REGISTRATION_OPEN" || s.status === "APPROVED",
          );
          if (active) setSemesterId(active.id);
          else if (data.length > 0) setSemesterId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch semesters", err);
      } finally {
        setSemestersLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  const handleUpload = async () => {
    if (!file || !semesterId) {
      toast.warning("Please select a file and semester");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("semesterId", semesterId);

      const res = await apiClient<any>(UPLOAD_SEATING, {
        method: "POST",
        headers: {},
        body: formData as any,
      });

      if (res && res.success) {
        if (res.uploadId) {
          setUploadId(res.uploadId);
          setProgress(0);
          toast.info("Upload started. Monitoring progress...");
        } else {
          setResult({ success: true, message: res.message });
          toast.success(
            res.message || "Seating arrangement uploaded successfully",
          );
        }
      } else if (res) {
        setResult({
          success: false,
          msg: res.msg || res.error || "Upload failed",
        });
      }
    } catch (error) {
      toast.error("Error uploading seating arrangement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (uploadId) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient<any>(ACADEMICS_PROGRESS(uploadId), {
            showToast: false,
          } as any);
          if (res && res.success && res.progress) {
            if (res.progress.percent !== undefined) {
              setProgress(res.progress.percent);
            }
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
                  message: "Synchronization completed successfully",
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
    if (!semesterId) {
      toast.warning("Please select a semester first");
      return;
    }
    const url = GET_SEATING_TEMPLATE(semesterId, branch, year, examName);
    const fileName = `SeatingTemplate_${branch}_${year}_${examName}.xlsx`;
    await downloadFile(url, fileName);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Exam Seating Management
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Upload seating arrangements for students based on their exam schedule.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="group flex items-center gap-2.5 px-4 py-2 bg-white text-slate-500 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-navy-900 hover:border-navy-100 transition-all font-bold uppercase tracking-widest text-[9px] shadow-none active:scale-95 mb-1"
        >
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-navy-50 transition-colors">
            <FileDown size={13} className="group-hover:scale-110 transition-transform" />
          </div>
          Download Template
        </button>
      </div>

      <div className="flex flex-col gap-6 bg-white p-7 rounded-xl border border-slate-100 shadow-none animate-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Academic Semester
            </label>
            <div className="relative group">
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
                disabled={semestersLoading}
              >
                {semestersLoading ? (
                  <option>Loading...</option>
                ) : (
                  semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
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
              Target Branch
            </label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
              Year (Batch)
            </label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
              >
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
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Examination
            </label>
            <div className="relative group">
              <select
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
              >
                {["MID-1", "MID-2", "SEM-END", "REMEDIAL"].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>
        </div>

        <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-6">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-none space-y-8 relative overflow-hidden transition-all">
              <FileUploader
                onFileSelect={(f) => {
                  setFile(f);
                  setResult(null);
                  setProgress(0);
                }}
                label="Choose Seating Layout"
                description="Upload XLSX, XLS or CSV files with student-seat mappings."
                isUploading={loading || !!uploadId}
                isSuccess={result?.success === true}
                isError={result?.success === false}
                progress={progress}
              />

              <button
                disabled={!file || loading || !!uploadId || !semesterId}
                onClick={handleUpload}
                className="w-full h-20 bg-navy-900 text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[12px] shadow-none hover:bg-navy-800 hover:scale-[1.01] transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading || uploadId ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="animate-spin w-6 h-6" />
                    <span className="animate-pulse">
                      {uploadId ? `Synchronizing Records... ${progress}%` : "Initiating Upload..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} />
                    <span>Finalize Seating Arrangement</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {result && (
            <div
              className={`p-8 rounded-xl border animate-in slide-in-from-top-4 duration-500 shadow-none ${result.success
                ? "bg-emerald-50 border-emerald-100"
                : "bg-red-50 border-red-100"
                }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`p-3.5 rounded-xl ${result.success ? "bg-emerald-500 text-white shadow-none" : "bg-red-500 text-white shadow-none"}`}
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
                  {result?.success ? "Upload successful" : "Process failed"}
                </h3>
              </div>

              <div className="space-y-4">
                {result.success ? (
                  <>
                    <p className="text-emerald-800 font-medium">
                      {result.message}
                    </p>
                    <div className="p-4 bg-white/50 rounded-xl border border-emerald-200/50 shadow-none">
                      <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-widest mb-1.5 leading-none">
                        Immediate Update
                      </p>
                      <p className="text-emerald-900 font-semibold text-[15px] leading-tight">
                        Student portals will reflect these changes on the next
                        refresh.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-red-800 font-medium">{result.msg}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
