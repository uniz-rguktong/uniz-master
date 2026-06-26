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
import { Users } from "lucide-react";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminSegmentWrapClass,
  adminSegmentActiveClass,
  adminSegmentInactiveClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

export default function StudentBulkSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "export">("upload");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Export State
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [exportParams, setExportParams] = useState({
    branch: "CSE",
    year: "E1",
    batch: "ALL",
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "username",
    "name",
    "email",
    "branch",
    "section",
  ]);

  const FIELD_GROUPS = {
    Core: [
      "username",
      "name",
      "email",
      "phone",
      "gender",
      "branch",
      "year",
      "semester",
      "section",
      "batch",
      "roomno",
    ],
    Parents: [
      "fatherName",
      "motherName",
      "fatherOccupation",
      "motherOccupation",
      "fatherEmail",
      "motherEmail",
      "fatherAddress",
      "motherAddress",
    ],
    Identity: ["category", "campus", "bloodGroup", "dateOfBirth", "createdAt"],
    Status: ["isPresentInCampus", "isApplicationPending", "isSuspended"],
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
      await downloadFile(
        ADMIN_STUDENT_TEMPLATE,
        "Student_Upload_Template.xlsx",
      );
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
      selectedFields.join(","),
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
    <div className={cn(adminPageWrapClass, "pb-20")}>
      <SectionHeader
        icon={<Users size={18} />}
        eyebrow="Students"
        title="Student Bulk Operations"
        subtitle="Bulk onboard identities or extract global batch records."
        actions={
          <div className={adminSegmentWrapClass}>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex items-center gap-2",
                activeTab === "upload"
                  ? adminSegmentActiveClass
                  : adminSegmentInactiveClass,
              )}
            >
              <Upload size={13} /> Bulk Upload
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={cn(
                "flex items-center gap-2",
                activeTab === "export"
                  ? adminSegmentActiveClass
                  : adminSegmentInactiveClass,
              )}
            >
              <Download size={13} /> Batch Export
            </button>
          </div>
        }
      />

      {activeTab === "upload" ? (
        <div className="w-full space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadTemplate}
              className={adminGhostButtonClass}
            >
              <Download size={14} />
              Download Template
            </button>
          </div>

          <div className="w-full space-y-6">
            <div className={cn(adminCardClass, "overflow-hidden border-dashed border-zinc-300 bg-zinc-50/40 p-6")}>
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
              className={cn(adminPrimaryButtonClass, "h-12 w-full")}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : uploadId ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Processing...</span>
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
              <label className={adminLabelClass}>Branch Focus</label>
              <div className="relative group">
                <select
                  value={exportParams.branch}
                  onChange={(e) =>
                    setExportParams({
                      ...exportParams,
                      branch: e.target.value,
                    })
                  }
                  className={adminSelectClass}
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
              <label className={adminLabelClass}>Academic Year</label>
              <div className="relative group">
                <select
                  value={exportParams.year}
                  onChange={(e) =>
                    setExportParams({ ...exportParams, year: e.target.value })
                  }
                  className={adminSelectClass}
                >
                  <option value="ALL">All Levels</option>
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className={adminLabelClass}>Batch Target</label>
              <div className="relative group">
                <select
                  value={exportParams.batch}
                  onChange={(e) =>
                    setExportParams({
                      ...exportParams,
                      batch: e.target.value,
                    })
                  }
                  className={adminSelectClass}
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
          </div>

          {/* New Attribute Schema Checkbox Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className={adminLabelClass}>
                Attribute Schema Selector
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setSelectedFields(Object.values(FIELD_GROUPS).flat())
                  }
                  className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedFields(["username", "name"])}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className={cn(adminCardClass, "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-zinc-50/40 p-6")}>
              {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
                <div key={group} className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em] px-2 border-l-2 border-zinc-300">
                    {group}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {fields.map((field) => (
                      <label
                        key={field}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border group ${
                          selectedFields.includes(field)
                            ? "bg-white border-zinc-300 shadow-[0_1px_2px_rgba(10,10,10,0.04)]"
                            : "bg-transparent border-transparent hover:bg-white/60"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            selectedFields.includes(field)
                              ? "bg-zinc-900 border-zinc-900"
                              : "border-zinc-300 bg-white group-hover:border-zinc-400"
                          }`}
                        >
                          {selectedFields.includes(field) && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedFields.includes(field)}
                          onChange={() => {
                            if (selectedFields.includes(field)) {
                              setSelectedFields(
                                selectedFields.filter((f) => f !== field),
                              );
                            } else {
                              setSelectedFields([...selectedFields, field]);
                            }
                          }}
                        />
                        <span
                          className={`text-[12px] font-medium capitalize tracking-tight ${
                            selectedFields.includes(field)
                              ? "text-zinc-900"
                              : "text-zinc-500"
                          }`}
                        >
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-5">
            <button
              onClick={handleExport}
              disabled={loading}
              className={cn(adminPrimaryButtonClass, "h-12 w-full")}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Download size={16} />
              )}
              Download the data
            </button>
            <p className="text-center text-zinc-300 text-[10px] font-medium uppercase tracking-[0.24em]">
              Encrypted data streams active • Protocol 04-X
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
