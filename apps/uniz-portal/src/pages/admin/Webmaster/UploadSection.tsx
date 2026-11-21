/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { FileDown, ChevronDown } from "lucide-react";
import {
  UPLOAD_ATTENDANCE,
  UPLOAD_GRADES,
  GET_ATTENDANCE_TEMPLATE,
  GET_GRADES_TEMPLATE,
  GET_SUBJECTS,
  ACADEMICS_PROGRESS,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient, downloadFile } from "../../../api/apiClient";
import { FileUploader } from "../../../components/ui/FileUploader";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  adminPageWrapClass,
  adminLabelClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

type UploadType = "attendance" | "grades";

export default function UploadSection({ type }: { type: UploadType }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);

  // Template Parameters
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("E2");
  const [semester, setSemester] = useState("SEM-1");
  const [subjectCode, setSubjectCode] = useState("");
  const [remedialsOnly, setRemedialsOnly] = useState(false);
  const [batch, setBatch] = useState("");

  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>(
    [],
  );
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  // Fetch subjects whenever branch or semester changes (only for grades upload)
  useEffect(() => {
    if (type !== "grades") return;
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      setSubjectCode(""); // reset selection on criteria change
      try {
        const token = (
          localStorage.getItem("admin_token") ||
          localStorage.getItem("faculty_token") ||
          ""
        ).replace(/"/g, "");
        const url = `${GET_SUBJECTS}?department=${branch}&semester=${encodeURIComponent(semester)}&limit=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.subjects) {
          // Year is encoded in the subject code (e.g. CSE-E2-SEM-1-01)
          // Filter client-side by checking if the code contains the selected year
          const filtered = data.subjects.filter((s: any) =>
            s.code.toUpperCase().includes(`-${year}-`),
          );
          setSubjects(
            filtered.map((s: any) => ({ code: s.code, name: s.name })),
          );
        } else {
          setSubjects([]);
        }
      } catch {
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [branch, semester, type]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await apiClient<{ success: boolean; batches: string[] }>(
          GET_AVAILABLE_BATCHES,
        );
        if (res && res.success) {
          setAvailableBatches(res.batches);
        }
      } catch (e) {
        console.error("Failed to fetch batches", e);
      }
    };
    fetchBatches();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setUploadSuccess(null);
    setResult(null);
    const endpoint = type === "attendance" ? UPLOAD_ATTENDANCE : UPLOAD_GRADES;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient<any>(endpoint, {
        method: "POST",
        headers: {},
        body: formData as any,
      }, false);

      if (!res) {
        setUploadSuccess(false);
        return;
      }

      if (res && res.success) {
        if (res.uploadId) {
          setUploadId(res.uploadId);
          toast.info("Upload started. Monitoring progress...");
        } else {
          setUploadSuccess(true);
          setProgress(100);
          setResult({ success: true, ...res });
          toast.success(
            `${type === "attendance" ? "Attendance" : "Grades"} uploaded successfully`,
          );
        }
      } else if (res) {
        setUploadSuccess(false);
        setResult({ success: false, msg: res.msg || "Upload failed" });
      }
    } catch (error) {
      toast.error(`Error uploading ${type}`);
    } finally {
      setLoading(false);
    }
  };

  // Progress Polling
  useEffect(() => {
    let interval: any;
    if (uploadId) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient<any>(ACADEMICS_PROGRESS(uploadId), {
            showToast: false,
          } as any);
          if (res && res.success && res.progress) {
            if (res.progress.percent !== undefined)
              setProgress(res.progress.percent);
            if (res.progress.total && res.progress.processed) {
              setProgress(
                Math.round((res.progress.processed / res.progress.total) * 100),
              );
            }
            if (
              res.progress.status === "completed" ||
              res.progress.status === "done" ||
              res.progress.status === "error" ||
              res.progress.status === "failed"
            ) {
              setUploadId(null);
              clearInterval(interval);
              if (
                res.progress.status === "completed" ||
                res.progress.status === "done"
              ) {
                setProgress(100);
                setUploadSuccess(true);
                setResult({
                  success: true,
                  processed: res.progress.processed,
                  total: res.progress.total,
                });
                toast.success("Synchronization completed successfully");
              } else {
                setUploadSuccess(false);
                setResult({
                  success: false,
                  msg: res.progress.message || "Synchronization failed",
                });
                toast.error("Synchronization failed");
              }
            }
          }
        } catch (e) {
          console.error("Progress poll error", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [uploadId]);

  const downloadTemplate = async () => {
    const url =
      type === "attendance"
        ? GET_ATTENDANCE_TEMPLATE(branch, year, semester, batch)
        : GET_GRADES_TEMPLATE(
            branch,
            year,
            semester,
            subjectCode,
            remedialsOnly,
            batch,
          );
    const fileName = `${type}_${branch}_${year}_${semester}_template.xlsx`;
    await downloadFile(url, fileName);
  };

  return (
    <div className={cn(adminPageWrapClass, "pb-20")}>
      <PageHeader
        title={type === "grades" ? "Grades upload" : "Attendance upload"}
        meta={`Synchronize institutional ${type} records with the core system.`}
        action={
          <Button type="button" variant="outline" size="compact" onClick={downloadTemplate}>
            <FileDown size={14} />
            Download template
          </Button>
        }
      />

      <Panel title="Filters">
        <div className="mx-auto grid max-w-[640px] grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className={adminLabelClass}>Branch</label>
            <div className="relative group">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className={adminSelectClass}
              >
                <option value="ALL">All branches</option>
                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                  (b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
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
            <label className={adminLabelClass}>Year</label>
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={adminSelectClass}
              >
                <option value="ALL">All years</option>
                {["E1", "E2", "E3", "E4"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={adminLabelClass}>Semester</label>
            <div className="relative group">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className={adminSelectClass}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={`SEM-${s}`}>
                    SEM-{s}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={adminLabelClass}>Batch</label>
            <div className="relative group">
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className={adminSelectClass}
              >
                <option value="ALL">All batches</option>
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

          {type === "grades" && (
            <>
              <div className="space-y-2 lg:col-span-1">
                <label className={adminLabelClass}>
                  Subject
                  {subjectsLoading && (
                    <span className="ml-2 text-text-2 normal-case tracking-normal font-medium">
                      loading...
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className={adminSelectClass}
                    disabled={subjectsLoading}
                  >
                    <option value="">
                      {subjectsLoading
                        ? "Loading..."
                        : subjects.length === 0
                          ? "No subjects found"
                          : "ALL SUBJECTS (BULK)"}
                    </option>
                    {subjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Scope</label>
                <Tabs
                  label="Grade scope"
                  value={remedialsOnly ? "remedial" : "regular"}
                  onChange={(id) => setRemedialsOnly(id === "remedial")}
                  tabs={[
                    { id: "regular", label: "Regular" },
                    { id: "remedial", label: "Remedial" },
                  ]}
                />
              </div>
            </>
          )}

        </div>

        <section className="mt-8 space-y-4 border-t border-border pt-8">
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
            File
          </h2>
        <ul className="mb-6 space-y-2 text-dense text-text-2">
          <li>Accepted files: .xlsx, .xls, .csv</li>
          <li>One row per student record</li>
          <li>Download the template so the columns match the importer</li>
        </ul>
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-4">
          <FileUploader
            onFileSelect={(f) => {
              setFile(f);
              setResult(null);
              setProgress(0);
              setUploadSuccess(null);
            }}
            label={`Select ${type} file`}
            description={`Drag and drop the official ${type} record file.`}
            isUploading={loading || !!uploadId}
            isSuccess={uploadSuccess === true}
            isError={uploadSuccess === false}
            progress={progress}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            disabled={!file || loading || !!uploadId}
            isLoading={loading || !!uploadId}
            onClick={handleUpload}
          >
            {uploadId ? "Synchronizing…" : `Process ${type}`}
          </Button>
        </div>

        {/* Only show error result - success is communicated via the progress bar */}
        {result && !result.success && (
          <div className="mt-4">
            <Alert tone="error" title="Sync failed">
              {result.msg}
            </Alert>
          </div>
        )}
        </section>
      </Panel>
    </div>
  );
}
