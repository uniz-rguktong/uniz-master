/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Upload,
  FileDown,
  FileSpreadsheet,
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
  ADMIN_STUDENT_TEMPLATE,
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
    batch: "",
  });

  // Template Function
  const downloadTemplate = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_STUDENT_TEMPLATE, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_upload_template.xlsx";
      a.click();
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

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
          setProgress(data);
          if (
            data.status?.toLowerCase() === "done" ||
            data.status?.toLowerCase() === "completed" ||
            data.status?.toLowerCase() === "failed"
          ) {
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
      exportParams.batch,
    );
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
      });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const fileNameStr =
        [exportParams.batch, exportParams.branch, exportParams.year]
          .filter(Boolean)
          .join("_") || "all";
      a.download = `students_export_${fileNameStr}.xlsx`;
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Summary Step */}
            <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm space-y-5 transition-all hover:shadow-2xl hover:translate-y-[-2px] group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-[22px] shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <FileDown size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg tracking-tight">
                    Step 1: Get the Framework
                  </h3>
                  <p className="text-slate-500 text-[13px] font-medium mt-0.5">
                    Download the standard template to ensure data compatibility.
                  </p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="w-full h-12 flex items-center justify-center gap-3 bg-slate-50/50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-full text-blue-700 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet size={16} className="opacity-70" /> Download
                Excel Template
              </button>
            </div>

            {/* Upload Step */}
            <div className="bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm space-y-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl">
                  <Upload size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg tracking-tight">
                    Step 2: Sync Records
                  </h3>
                  <p className="text-slate-500 text-[13px] font-medium mt-0.5">
                    Upload your filled records to update student profiles.
                  </p>
                </div>
              </div>

              <div
                className={`
                                  border-4 border-dashed rounded-[32px] p-12 text-center transition-all relative
                                  ${file ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-200 bg-slate-50/30"}
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
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div
                    className={`p-6 rounded-3xl transition-all duration-500 ${file ? "bg-blue-600 text-white animate-pulse shadow-2xl shadow-blue-200" : "bg-white text-slate-300 shadow-inner border border-slate-50"}`}
                  >
                    <Upload size={32} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xl font-semibold text-slate-900 tracking-tight">
                      {file ? file.name : "Choose XLSX File"}
                    </p>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                      Maximum 5000 records per upload
                    </p>
                  </div>
                </label>
                {file && (
                  <button
                    onClick={() => setFile(null)}
                    className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-2xl text-red-500 hover:scale-110 transition-all border border-red-50"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || loading || !!uploadId}
                className="w-full h-14 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                Initiate Bulk Provisioning
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24">
              {progress || uploadId ? (
                <div className="bg-blue-600 rounded-[32px] p-10 text-white shadow-2xl shadow-blue-200 space-y-10 animate-in slide-in-from-right-8 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <History size={200} />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="p-4 bg-white/10 rounded-[22px] backdrop-blur-md border border-white/20 shadow-xl">
                      <History
                        size={26}
                        className={uploadId ? "animate-spin" : ""}
                      />
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 leading-none">
                        Current Status
                      </p>
                      <p className="font-semibold text-3xl tracking-tight capitalize leading-none pt-2">
                        {progress?.status || "Processing"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                      <span>Sync Progress</span>
                      <span className="font-black">
                        {Math.round(
                          ((progress?.processed || 0) /
                            (progress?.total || 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-4 bg-black/10 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                        style={{
                          width: `${((progress?.processed || 0) / (progress?.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 relative z-10">
                    <div className="bg-white/10 p-6 rounded-[28px] border border-white/10 backdrop-blur-md shadow-xl">
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 leading-none mb-4">
                        Processed
                      </p>
                      <p className="text-4xl font-semibold tracking-tighter leading-none">
                        {progress?.processed || 0}
                      </p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-[28px] border border-white/10 backdrop-blur-md shadow-xl">
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 leading-none mb-4">
                        Failed
                      </p>
                      <p className="text-4xl font-semibold tracking-tighter leading-none text-red-100">
                        {progress?.failed || 0}
                      </p>
                    </div>
                  </div>

                  {progress?.status === "completed" && (
                    <div className="flex items-center gap-3.5 p-5 bg-emerald-500/20 text-emerald-300 rounded-[22px] border border-emerald-500/30 backdrop-blur-sm animate-in zoom-in-95 duration-500 relative z-10">
                      <CheckCircle2 size={24} className="shrink-0" />
                      <p className="text-[11px] font-bold leading-relaxed tracking-wide">
                        Database synchronization finalized successfully.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center space-y-7 flex flex-col items-center justify-center shadow-sm">
                  <div className="p-12 bg-slate-50 rounded-full text-slate-200 border border-slate-50 shadow-inner">
                    <History size={72} strokeWidth={1} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                      Operation Monitor
                    </h4>
                    <p className="text-slate-400 text-[15px] font-medium max-w-[260px] mx-auto leading-relaxed">
                      Real-time feedback on your background sync tasks will
                      appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Batch Focus (e.g. O21)
                </label>
                <input
                  type="text"
                  placeholder="OPTIONAL"
                  value={exportParams.batch}
                  onChange={(e) =>
                    setExportParams({
                      ...exportParams,
                      batch: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full h-14 px-8 bg-slate-50/50 border border-slate-100 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-slate-900 text-[13px] transition-all shadow-sm tracking-wide"
                />
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
