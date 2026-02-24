/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Upload, FileDown, CheckCircle2, AlertCircle, X, Loader2, Info } from "lucide-react";
import { UPLOAD_ATTENDANCE, UPLOAD_GRADES, GET_ATTENDANCE_TEMPLATE, GET_GRADES_TEMPLATE } from "../../../api/endpoints";
import { toast } from "react-toastify";

type UploadType = "attendance" | "grades";

export default function UploadSection({ type }: { type: UploadType }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Template Parameters
    const [branch, setBranch] = useState("CSE");
    const [year, setYear] = useState("E2");
    const [semester, setSemester] = useState("SEM-1");
    const [subjectCode, setSubjectCode] = useState("");
    const [remedialsOnly, setRemedialsOnly] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const token = localStorage.getItem("admin_token");
        const endpoint = type === "attendance" ? UPLOAD_ATTENDANCE : UPLOAD_GRADES;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`
                },
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setResult({ success: true, ...data });
                toast.success(`${type === "attendance" ? "Attendance" : "Grades"} uploaded successfully`);
            } else {
                setResult({ success: false, msg: data.msg || "Upload failed" });
                toast.error(data.msg || "Upload failed");
            }
        } catch (error) {
            toast.error(`Error uploading ${type}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const token = localStorage.getItem("admin_token");
        const url = type === "attendance"
            ? GET_ATTENDANCE_TEMPLATE(branch, year, semester)
            : GET_GRADES_TEMPLATE(branch, year, semester, subjectCode, remedialsOnly);

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${JSON.parse(token || '""')}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_${branch}_${year}_${semester}_template.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Download error:', error);
                toast.error("Failed to download template");
            });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch</label>
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-sm"
                        >
                            {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-sm"
                        >
                            {["E1", "E2", "E3", "E4", "P1", "P2"].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-sm"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={`SEM-${s}`}>SEM-{s}</option>
                            ))}
                        </select>
                    </div>

                    {type === "grades" && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CS201"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={remedialsOnly}
                                        onChange={(e) => setRemedialsOnly(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-slate-900"></div>
                                    <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Remedials Only</span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={downloadTemplate}
                        disabled={type === "grades" && !subjectCode}
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <FileDown size={16} /> Download {type} Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className={`
            border-4 border-dashed rounded-[2rem] p-12 text-center transition-all relative
            ${file ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200 bg-white'}
          `}>
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".xlsx,.csv"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                            <div className={`p-6 rounded-3xl transition-colors ${file ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <Upload size={40} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-900">{file ? file.name : `Select ${type} file`}</p>
                                <p className="text-slate-400 font-medium mt-1">Supports XLSX, XLS or CSV files</p>
                            </div>
                        </label>

                        {file && (
                            <button
                                onClick={() => setFile(null)}
                                className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-md text-red-500 hover:scale-110 transition-transform"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <button
                        disabled={!file || loading}
                        onClick={handleUpload}
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload size={20} />}
                        Process & Record {type}
                    </button>
                </div>

                <div className="space-y-6">
                    {result ? (
                        <div className={`p-8 rounded-[2rem] border animate-in slide-in-from-right-8 duration-500 h-full ${result.success ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                            }`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-2xl ${result.success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                    {result.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <h3 className={`text-2xl font-black tracking-tight ${result.success ? "text-emerald-900" : "text-red-900"}`}>
                                    {result.success ? "Sync Completed" : "Sync Failed"}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {result.success ? (
                                    <>
                                        <p className="text-emerald-800 font-medium">Successfully processed {result.processed || 0} records into the central database.</p>
                                        <div className="p-4 bg-white/50 rounded-2xl border border-emerald-200/50">
                                            <p className="text-xs uppercase font-black text-emerald-600 tracking-widest mb-1">Status</p>
                                            <p className="text-emerald-900 font-bold">All systems green. Student dashboards updated.</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-800 font-medium">{result.msg}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center h-full">
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 mb-6">
                                <Info size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for synchronization</h3>
                            <p className="text-slate-500 max-w-xs font-medium">Upload a file to see the system status and processing results here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
