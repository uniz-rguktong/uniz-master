/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  ADMIN_STUDENT_UPLOAD,
  ADMIN_STUDENT_PROGRESS,
  ADMIN_STUDENT_EXPORT,
  GET_AVAILABLE_BATCHES,
  ADMIN_STUDENT_TEMPLATE,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { FileUploader } from "../../../components/ui/FileUploader";
import { downloadFile } from "../../../api/apiClient";

export default function StudentBulkSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "export">("upload");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Export State
  const [exportParams, setExportParams] = useState({
    branch: "CSE",
    year: "E1",
    fields: "username,name,email,branch,section",
    batch: "ALL",
  });
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  // Bulk Upload Function
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(ADMIN_STUDENT_UPLOAD, {
        method: "POST",
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadId(data.uploadId || "checking");
        setUploadSuccess(null);
        setProgress(0);
        toast.info("Upload started. Monitoring progress...");
      } else {
        toast.error(data.msg || "Upload failed");
      }
    } catch (error) {
      toast.error("Network error during upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadFile(ADMIN_STUDENT_TEMPLATE, "Student_Upload_Template.xlsx");
      toast.success("Template downloaded");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  // Progress Polling
  useEffect(() => {
    let interval: any;
    if (uploadId) {
      interval = setInterval(async () => {
        const token = localStorage.getItem("admin_token");
        try {
          const res = await fetch(ADMIN_STUDENT_PROGRESS, {
            headers: {
              Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
            },
          });
          const data = await res.json();
          if (data.percent !== undefined) setProgress(data.percent);
          if (data.status === "completed" || data.status === "done") {
            setUploadId(null);
            setProgress(100);
            setUploadSuccess(true);
            clearInterval(interval);
            toast.success("Bulk provisioning completed successfully");
          } else if (data.status === "failed" || data.status === "error") {
            setUploadId(null);
            setUploadSuccess(false);
            clearInterval(interval);
            toast.error("Bulk provisioning failed");
          }
        } catch (e) {
          console.error("Progress poll error", e);
        }
      }, 2000);
    }
    fetchBatches();
  }, [uploadId]);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(GET_AVAILABLE_BATCHES, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const data = await res.json();
      if (data.success) {
        setAvailableBatches(data.batches);
      }
    } catch (e) {
      console.error("Failed to fetch batches", e);
    }
  };

  // Export Function
  const handleExport = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const url = ADMIN_STUDENT_EXPORT(
      exportParams.branch === "ALL" ? undefined : exportParams.branch,
      exportParams.year === "ALL" ? undefined : exportParams.year,
      exportParams.fields,
      exportParams.batch === "ALL" ? undefined : exportParams.batch,
    );
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `students_export_${exportParams.branch || "all"}_${exportParams.year || "all"}.xlsx`;
      a.click();
      toast.success("Export completed");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700 pb-20 text-slate-900 bg-transparent min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
              Student Bulk Operations
            </h2>
            <p className="text-slate-500 font-medium text-[15px]">
              Bulk onboard students or extract batch records to Excel.
            </p>
          </div>

          {activeTab === "upload" && (
            <button
              onClick={handleDownloadTemplate}
              className="group flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-md text-slate-500 rounded-xl border border-slate-200/50 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-all font-bold uppercase tracking-widest text-[10px] shadow-sm active:scale-95"
            >
              <Download size={14} className="mr-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              Download Template
            </button>
          )}
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm shadow-none group">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "upload" ? "bg-white text-blue-700 shadow-none border border-slate-200/50" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Upload size={14} strokeWidth={2.5} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "export" ? "bg-white text-blue-700 shadow-none border border-slate-200/50" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Download size={14} strokeWidth={2.5} /> Batch Export
          </button>
        </div>

      {activeTab === "upload" ? (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">

          <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl border border-slate-100/50 shadow-sm space-y-8 transition-all relative overflow-hidden">
            <FileUploader
              onFileSelect={(f) => {
                setFile(f);
                setUploadSuccess(null);
                setProgress(0);
              }}
              label="Choose Student Records"
              description="Upload XLSX or CSV with mandatory fields (username, name, email)."
              isUploading={loading || !!uploadId}
              isSuccess={uploadSuccess === true}
              isError={uploadSuccess === false}
              progress={progress}
            />

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!uploadId}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-slate-200/50 hover:bg-black hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] border border-slate-800"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : uploadId ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Processing Records... {progress}%</span>
                </div>
              ) : (
                <CheckCircle2 size={18} />
              )}
              {!loading && !uploadId && "Initiate Bulk Provisioning"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/40 backdrop-blur-md p-10 rounded-3xl border border-slate-100/50 shadow-sm space-y-10 relative overflow-hidden">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                  Branch Focus
                </label>
                <div className="relative group">
                  <select
                    value={exportParams.branch}
                    onChange={(e) =>
                      setExportParams({
                        ...exportParams,
                        branch: e.target.value,
                      })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-white/50 border border-slate-200/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all"
                  >
                    <option value="ALL">All Departments</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                      (b) => (
                        <option key={b}>{b}</option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:scale-110"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                  Academic Year
                </label>
                <div className="relative group">
                  <select
                    value={exportParams.year}
                    onChange={(e) =>
                      setExportParams({ ...exportParams, year: e.target.value })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-white/50 border border-slate-200/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all"
                  >
                    <option value="ALL">All Years</option>
                    {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:scale-110"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                  Batch Focus
                </label>
                <div className="relative group">
                  <select
                    value={exportParams.batch}
                    onChange={(e) =>
                      setExportParams({
                        ...exportParams,
                        batch: e.target.value,
                      })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-white/50 border border-slate-200/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all"
                  >
                    <option value="ALL">All Batches</option>
                    {availableBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:scale-110"
                    size={16}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">
                Data Columns (Comma Separated)
              </label>
              <input
                type="text"
                value={exportParams.fields}
                onChange={(e) =>
                  setExportParams({ ...exportParams, fields: e.target.value })
                }
                className="w-full h-14 px-8 bg-white/50 border border-slate-200/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] tracking-wide focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200/50 border border-slate-800"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Download size={18} strokeWidth={2.5} />
              )}
              Generate Excel Report
            </button>
            <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mt-8 opacity-40">
              Secure Export Engine Active
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
