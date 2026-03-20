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
import { toast } from "@/utils/toast-ref";
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
    <div className="p-6 space-y-8 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Student Bulk Operations
          </h2>
          <p className="text-slate-500 font-medium text-[13px]">
            Bulk onboard identities or extract global batch records.
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all ${activeTab === "upload" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Upload size={13} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all ${activeTab === "export" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Download size={13} /> Batch Export
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div className="w-full space-y-6">
          <div className="flex justify-end pr-2">
            <button
              onClick={handleDownloadTemplate}
              className="group flex items-center gap-2.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-all font-bold uppercase tracking-widest text-[9px] active:scale-95"
            >
              <Download size={13} className="text-slate-500" />
              Download Template
            </button>
          </div>

          <div className="w-full space-y-6">
            <div className="rounded-xl border border-slate-900 overflow-hidden bg-transparent p-6">
              <FileUploader
                onFileSelect={(f) => {
                  setFile(f);
                  setUploadSuccess(null);
                  setProgress(0);
                }}
                label="Student Evidence"
                description="Upload student data via XLSX/CSV protocols."
                isUploading={loading || !!uploadId}
                isSuccess={uploadSuccess === true}
                isError={uploadSuccess === false}
                progress={progress}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!uploadId}
              className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-none hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : uploadId ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Processing... {progress}%</span>
                </div>
              ) : (
                <CheckCircle2 size={16} />
              )}
              {!loading && !uploadId && "Start Uploading"}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-10">


          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
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
                  className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none font-black text-slate-900 text-[10px] cursor-pointer transition-all appearance-none uppercase tracking-widest shadow-none"
                >
                  <option value="ALL">All Departments</option>
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                    (b) => (
                      <option key={b}>{b}</option>
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
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Academic Year
              </label>
              <div className="relative group">
                <select
                  value={exportParams.year}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, year: e.target.value })
                  }
                  className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none font-black text-slate-900 text-[10px] cursor-pointer transition-all appearance-none uppercase tracking-widest shadow-none"
                >
                  <option value="ALL">All Levels</option>
                  {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Batch Target
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
                  className="w-full h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none font-black text-slate-900 text-[10px] cursor-pointer transition-all appearance-none uppercase tracking-widest shadow-none"
                >
                  <option value="ALL">All Universal</option>
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

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Attribute Schema
              </label>
              <input
                type="text"
                value={exportParams.fields}
                onChange={(e) =>
                  setExportParams({ ...exportParams, fields: e.target.value })
                }
                className="w-full h-11 px-6 bg-slate-100/50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 outline-none font-bold text-slate-900 text-[12px] transition-all tracking-tight shadow-none"
              />
            </div>
          </div>

          <div className="pt-2 space-y-6">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Download size={16} />
              )}
              Download the data
            </button>
            <p className="text-center text-slate-400 text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">
              Encrypted Data Streams active • Protocol 04-X
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
