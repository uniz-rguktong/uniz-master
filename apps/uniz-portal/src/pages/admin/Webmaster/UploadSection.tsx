/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
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
  ACADEMICS_PROGRESS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
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
  }, [branch, semester, type, year]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const endpoint = type === "attendance" ? UPLOAD_ATTENDANCE : UPLOAD_GRADES;
    try {
      const formData = new FormData();
      formData.append("file", file);
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

  useEffect(() => {
    let interval: any;
    if (uploadId) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient<any>(ACADEMICS_PROGRESS(uploadId), {
            showToast: false,
          } as any);
          if (res && res.success && res.progress) {
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none capitalize">
          {type} Synchronize
        </h2>
        <p className="text-slate-500 font-medium text-[15px]">
          Seamless institutional {type} synchronization with core databases.
        </p>
      </div>

      <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-none animate-in slide-in-from-top-4 duration-500 space-y-8">
        <div className={`grid grid-cols-1 md:grid-cols-3 ${type === 'grades' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-4 items-end`}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Branch</label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-600 appearance-none outline-none focus:border-blue-500"
              >
                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Year</label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-600 appearance-none outline-none focus:border-blue-500"
              >
                {["E1", "E2", "E3", "E4"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Semester</label>
            <div className="relative group">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-600 appearance-none outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={`SEM-${s}`}>SEM-{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Batch</label>
            <input
              type="text"
              placeholder="ALL"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full h-11 px-5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:border-blue-500"
            />
          </div>

          {type === "grades" ? (
            <>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                <div className="relative group">
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-600 appearance-none outline-none focus:border-blue-500 disabled:opacity-50"
                    disabled={subjectsLoading}
                  >
                    <option value="">{subjectsLoading ? "Loading..." : "ALL SUBJECTS"}</option>
                    {subjects.map(s => (
                      <option key={s.code} value={s.code}>{s.code}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Remedial</label>
                <button
                  onClick={() => setRemedialsOnly(!remedialsOnly)}
                  className={`w-full h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border ${remedialsOnly ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                >
                  {remedialsOnly ? "ONLY REM" : "REG + REM"}
                </button>
              </div>
            </>
          ) : (
            <div className="hidden lg:block lg:col-span-1"></div>
          )}

          <div className="lg:col-span-1">
            <button
              onClick={downloadTemplate}
              className="h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-blue-700 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 w-full hover:bg-blue-50 transition-colors"
            >
              <FileDown size={14} /> Download Template
            </button>
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-slate-50">
          <FileUploader
            onFileSelect={(f) => { setFile(f); setResult(null); }}
            label={`Select ${type} Excel/CSV`}
            description={`Drag and drop the official ${type} record file.`}
            isUploading={loading || !!uploadId}
            isSuccess={result?.success}
            isError={result?.success === false}
          />

          <button
            disabled={!file || loading || !!uploadId}
            onClick={handleUpload}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading || uploadId ? (
              <Loader2 className="animate-spin w-5 h-5 opacity-50" />
            ) : (
              <Upload size={18} className="opacity-70" />
            )}
            {uploadId ? "Synchronizing..." : `Launch ${type} Sync`}
          </button>
        </div>

        {/* Results / Status positioned below */}
        <div className="mt-4">
          {result ? (
            <div className={`p-8 rounded-2xl border ${result.success ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-red-50 border-red-100 text-red-900"}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${result.success ? "bg-emerald-500" : "bg-red-500"} text-white`}>
                  {result.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <h3 className="text-xl font-bold tracking-tight">{result.success ? "Sync Successful" : "Sync Failed"}</h3>
              </div>
              <p className="font-medium text-sm opacity-80">{result.success ? `Successfully integrated ${result.processed || 0} student records.` : result.msg}</p>
            </div>
          ) : (
            <div className="p-10 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-white rounded-xl shadow-sm text-slate-300 mb-5">
                <Info size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">System Standby</h3>
              <p className="text-slate-400 max-w-[300px] font-medium text-[13px]">Awaiting record upload to initialize institutional synchronization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
