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
  UPLOAD_SEATING,
  GET_SEATING_TEMPLATE,
  SEMESTERS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient, downloadFile } from "../../../api/apiClient";
import { FileUploader } from "../../../components/ui/FileUploader";

export default function SeatingUploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
        setResult({ success: true, message: res.message });
        toast.success(
          res.message || "Seating arrangement uploaded successfully",
        );
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
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
          Exam Seating Management
        </h2>
        <p className="text-slate-500 font-medium text-[15px]">
          Upload seating arrangements for students based on their exam schedule.
        </p>
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
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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
                className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-xl shadow-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-600 cursor-pointer appearance-none"
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

        <div className="flex justify-end pt-2 border-t border-slate-50">
          <button
            onClick={downloadTemplate}
            className="h-11 px-6 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-xl text-blue-700 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-none"
          >
            <FileDown size={14} /> Download Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FileUploader
            onFileSelect={(f: File | null) => {
              setFile(f);
              setResult(null);
            }}
            label="Choose Seating Layout"
            description="Supports XLSX, XLS or CSV files."
          />

          <button
            disabled={!file || loading || !semesterId}
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-5 rounded-xl font-semibold uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Upload size={20} />
            )}
            Process Seating Layout
          </button>
        </div>

        <div className="space-y-6">
          {result ? (
            <div
              className={`p-8 rounded-xl border animate-in slide-in-from-right-8 duration-500 h-full shadow-none ${result.success
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
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center h-full shadow-none">
              <div className="p-5 bg-white rounded-xl shadow-none text-slate-300 mb-8 border border-slate-100">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                Seating Status
              </h3>
              <p className="text-slate-400 max-w-[240px] font-medium text-[15px] leading-relaxed">
                Download a pre-filled template, adjust the seating values, and
                upload it back to the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
