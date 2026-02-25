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
  });

  // Template Function
  const downloadTemplate = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_STUDENT_TEMPLATE, {
        headers: { Authorization: `Bearer ${JSON.parse(token || '""')}` },
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
        headers: { Authorization: `Bearer ${JSON.parse(token || '""')}` },
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
            headers: { Authorization: `Bearer ${JSON.parse(token || '""')}` },
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
        headers: { Authorization: `Bearer ${JSON.parse(token || '""')}` },
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
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">
            Student Bulk Operations
          </h2>
          <p className="text-slate-500 font-medium">
            Bulk onboard students or extract batch records to Excel.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === "upload" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Upload size={14} /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === "export" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Download size={14} /> Batch Export
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            {/* Summary Step */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <FileDown size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">
                    Step 1: Get the Framework
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Download the standard template to ensure data compatibility.
                  </p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-3xl text-slate-900 font-black uppercase tracking-widest text-xs transition-all"
              >
                <FileSpreadsheet size={18} /> Download Excel Template
              </button>
            </div>

            {/* Upload Step */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl text-white">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">
                    Step 2: Sync Records
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Upload your filled records to update or create student
                    profiles.
                  </p>
                </div>
              </div>

              <div
                className={`
                                border-4 border-dashed rounded-[2rem] p-12 text-center transition-all relative
                                ${file ? "border-slate-900 bg-slate-50" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"}
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
                    className={`p-6 rounded-3xl transition-all ${file ? "bg-slate-900 text-white animate-pulse" : "bg-white text-slate-300 shadow-sm"}`}
                  >
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {file ? file.name : "Choose XLSX File"}
                    </p>
                    <p className="text-slate-400 font-medium text-xs mt-1">
                      Maximum 5000 records per upload
                    </p>
                  </div>
                </label>
                {file && (
                  <button
                    onClick={() => setFile(null)}
                    className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-lg text-red-500 hover:scale-110 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || loading || !!uploadId}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
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
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <History
                        size={24}
                        className={uploadId ? "animate-spin" : ""}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Status
                      </p>
                      <p className="font-black text-xl tracking-tight capitalize">
                        {progress?.status || "Processing"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/60">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          ((progress?.processed || 0) /
                            (progress?.total || 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{
                          width: `${((progress?.processed || 0) / (progress?.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                        Processed
                      </p>
                      <p className="text-2xl font-black mt-1">
                        {progress?.processed || 0}
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                        Issues
                      </p>
                      <p className="text-2xl font-black mt-1 text-red-400">
                        {progress?.failed || 0}
                      </p>
                    </div>
                  </div>

                  {progress?.status === "completed" && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
                      <CheckCircle2 size={18} />
                      <p className="text-xs font-bold leading-tight">
                        Database synchronization finalized successfully.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 text-center space-y-6 flex flex-col items-center justify-center">
                  <div className="p-8 bg-slate-50 rounded-[2rem] text-slate-200">
                    <History size={64} strokeWidth={1} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">
                      Active Operation Monitor
                    </h4>
                    <p className="text-slate-400 text-sm font-medium mt-2 max-w-[240px] mx-auto">
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 text-slate-900 animate-in slide-in-from-right-8 duration-500">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-xl">
                <Filter size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight">
                  Filtering Engine
                </h3>
                <p className="text-slate-500 font-medium">
                  Export selective student cohorts with specific data fields.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Branch Focus
                </label>
                <select
                  value={exportParams.branch}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, branch: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-slate-900"
                >
                  <option value="">All Departments</option>
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                    (b) => (
                      <option key={b}>{b}</option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Academic Year
                </label>
                <select
                  value={exportParams.year}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, year: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-slate-900"
                >
                  <option value="">All Batches</option>
                  {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Data Columns (Comma Separated)
                </label>
                <input
                  type="text"
                  value={exportParams.fields}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, fields: e.target.value })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                Generate Excel Report
              </button>
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-6 italic">
                Secure export. All activity is logged in the system audits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
