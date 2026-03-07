/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  X,
  Filter,
  Download,
  History,
  ChevronDown,
} from "lucide-react";
import {
  ADMIN_STUDENT_UPLOAD,
  ADMIN_STUDENT_PROGRESS,
  ADMIN_STUDENT_EXPORT,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function StudentBulkSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
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
        headers: { Authorization: `Bearer ${(token || '').replace(/"/g, '')}` },
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
            headers: { Authorization: `Bearer ${(token || '').replace(/"/g, '')}` },
          });
          const data = await res.json();
          setProgress(data);
          if (data.status === "completed" || data.status === "failed") {
            setUploadId(null);
            clearInterval(interval);
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
        headers: { Authorization: `Bearer ${(token || '').replace(/"/g, '')}` },
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

        <div className="flex bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-sm shadow-inner">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "upload" ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50 border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Upload size={14} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === "export" ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50 border border-blue-100" : "text-slate-500 hover:text-blue-600"}`}
          >
            <Download size={14} /> Batch Export
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Upload Step */}
          <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6 transition-all hover:shadow-2xl">
            <div
              className={`
                border-4 border-dashed rounded-[32px] p-8 md:p-12 text-center transition-all relative
                ${file ? "border-blue-600 bg-blue-50/50 shadow-inner" : "border-slate-100 hover:border-blue-200 bg-slate-50/30 hover:bg-slate-50/50"}
              `}
            >
              <input
                type="file"
                id="bulk-student-file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="bulk-student-file"
                className="cursor-pointer flex flex-col items-center gap-6"
              >
                <div
                  className={`p-6 rounded-[28px] transition-all duration-500 ${file ? "bg-blue-600 text-white animate-pulse shadow-2xl shadow-blue-200" : "bg-white text-slate-300 shadow-xl border border-slate-50"}`}
                >
                  <Upload size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">
                    {file ? file.name : "Choose XLSX File"}
                  </p>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                    Maximum 5000 records per upload
                  </p>
                </div>
              </label>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-2xl text-red-500 hover:scale-110 hover:bg-red-50 transition-all border border-red-50"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!uploadId}
              className="w-full h-16 bg-blue-600 text-white rounded-[24px] font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Initiate Bulk Provisioning
            </button>

            {/* Progress UI integrated inside the card or below it */}
            {(progress || uploadId) && (
              <div className="pt-10 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-8 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                        <History size={20} className={uploadId ? "animate-spin" : ""} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Status</p>
                        <p className="font-semibold text-xl capitalize">{progress?.status || "Processing"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Progress</p>
                      <p className="font-bold text-3xl">
                        {Math.round(((progress?.processed || 0) / (progress?.total || 1)) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      style={{ width: `${((progress?.processed || 0) / (progress?.total || 1)) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Processed</p>
                      <p className="text-2xl font-bold">{progress?.processed || 0}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-400">{progress?.failed || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 p-12 text-slate-900 animate-in slide-in-from-right-8 duration-700 shadow-sm transition-all hover:shadow-2xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-blue-600 text-white rounded-[28px] shadow-2xl shadow-blue-200">
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
                    className="w-full h-14 pl-7 pr-12 bg-slate-50/50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] cursor-pointer transition-all shadow-sm appearance-none uppercase tracking-widest"
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
                    className="w-full h-14 pl-7 pr-12 bg-slate-50/50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] cursor-pointer transition-all shadow-sm appearance-none uppercase tracking-widest"
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
                  className="w-full h-14 px-8 bg-slate-50/50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] transition-all shadow-sm tracking-wide"
                />
              </div>
            </div>

            <div className="pt-8 space-y-8">
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full h-16 flex items-center justify-center gap-3.5 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Download size={20} />
                )}
                Generate Excel Report
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
