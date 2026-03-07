/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Filter,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  ADMIN_STUDENT_UPLOAD,
  ADMIN_STUDENT_PROGRESS,
  ADMIN_STUDENT_EXPORT,
  ADMIN_STUDENT_TEMPLATE,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { FileUploader } from "../../../components/ui/FileUploader";

export default function StudentBulkSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "export">("upload");

  // Export State
  const [exportParams, setExportParams] = useState({
    branch: "CSE",
    year: "E1",
    fields: "username,name,email,branch,section",
  });

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
          // setProgress(data); // Removed UI
          if (data.status === "completed" || data.status === "done") {
            setUploadId(null);
            clearInterval(interval);
            toast.success("Bulk provisioning completed successfully");
          } else if (data.status === "failed" || data.status === "error") {
            setUploadId(null);
            clearInterval(interval);
            toast.error("Bulk provisioning failed");
          }
        } catch (e) {
          console.error("Progress poll error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [uploadId]);

  // Export Function
  const handleExport = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const url = ADMIN_STUDENT_EXPORT(
      exportParams.branch,
      exportParams.year,
      exportParams.fields,
    );
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Export failed");
      }

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

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(ADMIN_STUDENT_TEMPLATE, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download template");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "student_onboarding_template.xlsx";
      a.click();
      toast.success("Template downloaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to download template");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Student Bulk Operations
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Bulk onboard students or extract batch records to Excel.
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 backdrop-blur-sm shadow-none">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "upload" ? "bg-white text-blue-700 shadow-none border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Upload size={14} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "export" ? "bg-white text-blue-700 shadow-none border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Download size={14} /> Batch Export
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
          {/* Upload Step */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-100 shadow-none space-y-6 transition-all">
            <FileUploader
              onFileSelect={setFile}
              label="Choose Student Records"
              description="Upload XLSX or CSV with mandatory fields (username, name, email)."
            />

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!uploadId}
              className="w-full h-16 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-none hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : uploadId ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              {uploadId
                ? "Processing Records..."
                : "Initiate Bulk Provisioning"}
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 rounded-xl border border-slate-200 border-dashed hover:bg-slate-100 hover:text-blue-600 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Download size={14} /> Download Sample Template (XLSX)
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-slate-900 animate-in slide-in-from-right-8 duration-700 shadow-none transition-all">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-blue-600 text-white rounded-xl shadow-none">
                <Filter size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-3xl font-semibold tracking-tight leading-none">
                  Filtering Engine
                </h3>
                <p className="text-slate-500 font-medium text-[17px]">
                  Export selective student cohorts with specific data fields.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">
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
                    className="w-full h-14 pl-7 pr-12 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] cursor-pointer transition-all shadow-none appearance-none uppercase tracking-widest"
                  >
                    <option value="">All Departments</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                      (b) => (
                        <option key={b}>{b}</option>
                      ),
                    )}
                  </select>
                  <ChevronDown
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Academic Year
                </label>
                <div className="relative group">
                  <select
                    value={exportParams.year}
                    onChange={(e) =>
                      setExportParams({ ...exportParams, year: e.target.value })
                    }
                    className="w-full h-14 pl-7 pr-12 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] cursor-pointer transition-all shadow-none appearance-none uppercase tracking-widest"
                  >
                    <option value="">All Batches</option>
                    {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Data Columns (Comma Separated)
                </label>
                <input
                  type="text"
                  value={exportParams.fields}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, fields: e.target.value })
                  }
                  className="w-full h-14 px-8 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] transition-all shadow-none tracking-wide"
                />
              </div>
            </div>

            <div className="pt-8 space-y-6">
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full h-16 flex items-center justify-center gap-3.5 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-none active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Download size={20} />
                )}
                Generate Excel Report
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50/50 text-slate-400 rounded-xl border border-slate-100 border-dashed hover:bg-slate-50 hover:text-blue-600 transition-all font-bold uppercase tracking-widest text-[9px]"
              >
                <Download size={14} /> Need a template? Download Sample
              </button>

              <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
                Secure export protocol active • All access events timestamped
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
