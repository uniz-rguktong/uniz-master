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
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            Student Bulk Operations
          </h2>
          <p className="text-slate-500 font-medium text-[16px]">
            Bulk onboard students or extract batch records to Excel.
          </p>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-none">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "upload" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-indigo-500"}`}
          >
            <Upload size={14} strokeWidth={2.5} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "export" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-indigo-500"}`}
          >
            <Download size={14} strokeWidth={2.5} /> Batch Export
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
          <div className="flex justify-end pr-2">
            <button
              onClick={handleDownloadTemplate}
              className="group flex items-center gap-2.5 px-4 py-2 bg-white text-slate-500 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold uppercase tracking-widest text-[9px] shadow-sm active:scale-95"
            >
              <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                <Download size={13} className="group-hover:scale-110 transition-transform" />
              </div>
              Download Template
            </button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-none space-y-6 transition-all relative">
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
              className="w-full h-16 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-none hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : uploadId ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Processing Records... {progress}%</span>
                </div>
              ) : (
                <CheckCircle2 size={20} />
              )}
              {!loading && !uploadId && "Initiate Bulk Provisioning"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Branch Focus
                </label>
                <div className="relative">
                  <select
                    value={exportParams.branch}
                    onChange={(e) =>
                      setExportParams({
                        ...exportParams,
                        branch: e.target.value,
                      })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-slate-50/50 border border-slate-100/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer"
                  >
                    <option value="ALL">All Departments</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                      (b) => (
                        <option key={b}>{b}</option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Academic Year
                </label>
                <div className="relative">
                  <select
                    value={exportParams.year}
                    onChange={(e) =>
                      setExportParams({ ...exportParams, year: e.target.value })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-slate-50/50 border border-slate-100/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer"
                  >
                    <option value="ALL">All Years</option>
                    {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Batch Focus
                </label>
                <div className="relative">
                  <select
                    value={exportParams.batch}
                    onChange={(e) =>
                      setExportParams({
                        ...exportParams,
                        batch: e.target.value,
                      })
                    }
                    className="w-full h-14 pl-6 pr-10 bg-slate-50/50 border border-slate-100/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] appearance-none uppercase tracking-widest cursor-pointer"
                  >
                    <option value="ALL">All Batches</option>
                    {availableBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Data Columns (Comma Separated)
              </label>
              <input
                type="text"
                value={exportParams.fields}
                onChange={(e) =>
                  setExportParams({ ...exportParams, fields: e.target.value })
                }
                className="w-full h-14 px-8 bg-slate-50/50 border border-slate-100/50 rounded-2xl outline-none font-bold text-slate-900 text-[13px] tracking-wide"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full h-16 flex items-center justify-center gap-3.5 bg-slate-950 text-white rounded-[1.2rem] font-bold uppercase tracking-widest text-[11px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Download size={18} strokeWidth={3} />
              )}
              Generate Excel Report
            </button>
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.5em] mt-8 opacity-40">
              Secure Export Engine Active
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
