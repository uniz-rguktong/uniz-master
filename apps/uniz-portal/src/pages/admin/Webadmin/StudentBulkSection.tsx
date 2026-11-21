/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { webadminInstitutionAnalyticsAtom } from "../../../store/atoms";
import { Download, ChevronDown } from "lucide-react";
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
import StudentBulkActionsPanel from "./StudentBulkActionsPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  adminPageWrapClass,
  adminLabelClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import { ENGINEERING_BRANCHES } from "@/constants/branches";

export default function StudentBulkSection() {
  const resetInstitutionAnalytics = useSetRecoilState(
    webadminInstitutionAnalyticsAtom,
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "export" | "actions">(
    "upload",
  );
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

  const refreshAnalytics = () =>
    resetInstitutionAnalytics({
      fetched: false,
      snapshot: null,
      branches: [],
      grievances: [],
    });

  useEffect(() => {
    if (sessionStorage.getItem("uniz_bulk_tab") === "actions") {
      setActiveTab("actions");
      sessionStorage.removeItem("uniz_bulk_tab");
    }
  }, []);

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
      if (!res.ok || data.success === false) {
        const detail =
          Array.isArray(data.errors) && data.errors.length
            ? data.errors.map((e: any) => e.message).join("\n")
            : data.message || data.msg || "Upload failed";
        toast.error(detail);
        return;
      }
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
      <PageHeader
        title="Student bulk operations"
        meta="Upload, export, and apply cohort-wide status changes."
      />
      <Tabs
        className="mb-6"
        label="Bulk operations"
        value={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        tabs={[
          { id: "upload", label: "Bulk upload" },
          { id: "export", label: "Batch export" },
          { id: "actions", label: "Cohort actions" },
        ]}
      />

      {activeTab === "actions" ? (
        <StudentBulkActionsPanel onActionSuccess={refreshAnalytics} />
      ) : activeTab === "upload" ? (
        <Panel title="Student file">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="compact" onClick={handleDownloadTemplate}>
              <Download size={14} />
              Download template
            </Button>
          </div>
          <ul className="mb-6 space-y-2 text-dense text-text-2">
            <li>Student ID</li>
            <li>Name</li>
            <li>Email</li>
            <li>Branch (may be N/A until allocation is finalized)</li>
            <li>Year</li>
            <li>Section</li>
            <li>Batch</li>
          </ul>
          <div className="rounded-lg border border-dashed border-border-strong bg-surface p-4">
            <FileUploader
              onFileSelect={(f) => {
                setFile(f);
                setUploadSuccess(null);
                setProgress(0);
              }}
              label="Student file"
              description="Upload student data as XLSX or CSV."
              isUploading={loading || !!uploadId}
              isSuccess={uploadSuccess === true}
              isError={uploadSuccess === false}
              progress={progress}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading || !!uploadId}
              isLoading={loading || !!uploadId}
            >
              {uploadId ? "Processing…" : "Start uploading"}
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="w-full space-y-10">
          <div className="mx-auto grid max-w-[640px] grid-cols-1 gap-4">
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
                  {ENGINEERING_BRANCHES.map(
                    (b) => (
                      <option key={b}>{b}</option>
                    ),
                  )}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                  className="text-caption font-semibold text-text hover:text-text transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedFields(["username", "name"])}
                  className="text-caption font-semibold text-text-3 hover:text-text-2 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
              {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
                <div key={group} className="space-y-3">
                  <h4 className="text-caption font-semibold text-text-3 px-2 border-l-2 border-border-strong">
                    {group}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {fields.map((field) => (
                      <label
                        key={field}
                        className={`flex items-center gap-3 cursor-pointer rounded-lg border p-2.5 transition-colors ${
                          selectedFields.includes(field)
                            ? "border-border-strong bg-surface"
                            : "border-transparent hover:bg-tint"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-[color,background-color,border-color,opacity,transform,box-shadow] ${
                            selectedFields.includes(field)
                              ? "bg-primary border-head"
                              : "border-border-strong bg-surface group-hover:border-border-strong"
                          }`}
                        >
                          {selectedFields.includes(field) && (
                            <div className="w-1.5 h-1.5 bg-surface rounded-full" />
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
                              ? "text-text"
                              : "text-text-2"
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
            <div className="flex justify-end">
              <Button type="button" onClick={handleExport} disabled={loading} isLoading={loading}>
                Download the data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
