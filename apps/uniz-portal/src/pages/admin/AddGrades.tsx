/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/endpoints";
import {
  Upload,
  FileDown,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileSpreadsheet,
  X
} from "lucide-react";
import { Button } from "../../components/Button";

export default function AddGrades() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  // --- Parse uploaded file ---
  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setSuccess(null);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  // --- Upload to backend ---
  const handleUpload = async () => {
    if (!file) return setError("Please select a valid file first");
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASE_URL}/academics/grades/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JSON.parse(token!)}`,
        },
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data);
      } else {
        setError(data.message || "Upload failed");
         if (data.errors && data.errors.length > 0) {
             setError(data.errors.join(", "));
         }
      }
    } catch (err: any) {
      console.error("Upload error", err);
      setError("Unexpected error during upload");
    } finally {
      setUploading(false);
    }
  };

  // --- Download template ---
  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${BASE_URL}/academics/grades/template`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(token!)}`,
        },
      });
      if (!res.ok) throw new Error("Failed to download template");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Grades_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Template download error", err);
      setError("Failed to download template");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
         <div className="flex flex-col gap-6">
            <button
                onClick={() => navigate("/admin")}
                className="self-start inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Add Grades</h1>
                    <p className="text-slate-500 mt-1">Bulk upload academic grades via spreadsheet.</p>
                </div>
                 <div className="flex gap-3">
                     <Button variant="secondary" onClick={downloadTemplate} size="sm">
                         <FileDown className="w-4 h-4 mr-2" /> Template
                     </Button>
                 </div>
            </div>
        </div>

        {/* Upload Area */}
        {!file ? (
            <div className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                ${error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}
            `}>
                 <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                    className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-slate-900">Click to upload grades sheet</p>
                        <p className="text-slate-500 text-sm mt-1">Supports .xlsx, .xls, .csv</p>
                    </div>
                </label>
                {error && <p className="text-red-600 font-medium mt-4 flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</p>}
            </div>
      ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* File Info Bar */}
               <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="font-semibold">{file?.name}</p>
                            <p className="text-xs text-slate-400">Ready to upload</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={clearFile}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Remove File"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
               </div>

                <div className="flex justify-end">
                     <Button 
                        onClick={handleUpload} 
                        isLoading={uploading}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Process File
                     </Button>
                </div>
                
                 {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
                        <div className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            Upload Successful
                        </div>
                         <p className="mt-1 text-sm">Processed {success.processed} records. Success: {success.successCount}, Failed: {success.failCount}.</p>
                         {success.errors && success.errors.length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded border border-green-200 max-h-40 overflow-y-auto text-xs text-red-600">
                                <p className="font-semibold text-slate-700 mb-1">Errors:</p>
                                {success.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}
                            </div>
                        )}
                    </div>
                )}
                
                 {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="w-5 h-5" />
                             Upload Failed
                        </div>
                        <p className="mt-1 text-sm">{error}</p>
                    </div>
                )}
          </div>
      )}
    </div>
  );
}
