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
    <div className="p-6 space-y-8 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Exam Seating Management
          </h2>
          <p className="text-slate-500 font-medium text-[13px]">
            Upload seating arrangements for students based on their exam
            schedule.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="group flex items-center gap-2.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-all font-bold uppercase tracking-widest text-[9px] active:scale-95"
        >
          <FileDown
            size={13}
            className="text-slate-500 group-hover:scale-110 transition-transform"
          />
          Download Template
        </button>
      </div>

      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Academic Semester
            </label>
            <div className="relative group">
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
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
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Target Branch
            </label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
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
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Year (Batch)
            </label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
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
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Examination
            </label>
            <div className="relative group">
              <select
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer appearance-none shadow-none"
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

        <div className="w-full space-y-6">
          <div className="rounded-xl border border-slate-900 overflow-hidden bg-transparent p-6">
            <FileUploader
              onFileSelect={(f) => {
                setFile(f);
                setResult(null);
                setProgress(0);
              }}
              label="Seating Layout"
              description="Upload student-seat mapping protocols."
              isUploading={loading || !!uploadId}
              isSuccess={result?.success === true}
              isError={result?.success === false}
              progress={progress}
            />
          </div>

          <button
            disabled={!file || loading || !!uploadId || !semesterId}
            onClick={handleUpload}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-none hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading || uploadId ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin w-4 h-4" />
                <span>{uploadId ? "Synchronizing..." : "Processing..."}</span>
              </div>
            ) : (
              <>
                <Upload size={16} />
                <span>Finalize Seating Layout</span>
              </>
            )}
          </button>
        </div>

        {result && (
          <div
            className={`p-6 rounded-xl border shadow-none ${
              result.success
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-red-50/50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-lg ${result.success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
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
                {result?.success ? "Upload successful" : "Process failed"}
              </h3>
            </div>

            <div className="space-y-3">
              {result.success ? (
                <>
                  <p className="text-emerald-800 font-medium text-[13px]">
                    {result.message}
                  </p>
                  <div className="p-4 bg-white/40 rounded-xl border border-emerald-200/40">
                    <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-widest mb-1 leading-none">
                      Immediate Sync
                    </p>
                    <p className="text-emerald-900 font-medium text-[13px]">
                      Student portals will reflect these updates instantly.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-red-800 font-medium text-[13px]">
                  {result.msg}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
