/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/endpoints";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, downloadFile } from "../../api/apiClient";
import { GET_GRADES_TEMPLATE } from "../../api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Alert } from "@/components/ui/alert";

export default function AddGrades() {
  const navigate = useNavigate();

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
      formData.append("file", file);

      const data = await apiClient<any>(`${BASE_URL}/academics/grades/upload`, {
        method: "POST",
        body: formData,
      });

      if (data && data.success) {
        setSuccess(data);
      } else {
        setError(data?.message || "Upload failed");
        if (data?.errors && data.errors.length > 0) {
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
    await downloadFile(
      GET_GRADES_TEMPLATE("", "", "", "", false),
      "Grades_Template.xlsx",
    );
  };

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8">
      <PageHeader
        title="Add grades"
        meta="Bulk upload academic grades from a spreadsheet."
        action={
          <Button variant="outline" size="compact" onClick={downloadTemplate}>
            <FileDown className="h-4 w-4" />
            Template
          </Button>
        }
      />

      <Panel title="Upload sheet">
        <ul className="mb-6 space-y-2 text-dense text-text-2">
          <li>Accepted files: .xlsx, .xls, .csv</li>
          <li>One row per student grade</li>
          <li>Use the template so the column order matches the importer</li>
        </ul>

        {!file ? (
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-4 py-8 text-center">
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="sr-only"
            />
            <p className="text-dense font-medium text-text">Drop a grades sheet</p>
            <p className="mt-1 text-small text-text-2">or click to choose a file</p>
          </label>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-dense font-medium text-text">{file.name}</p>
              <p className="text-caption text-text-3">Ready to upload</p>
            </div>
            <Button type="button" variant="ghost" size="compact" onClick={clearFile}>
              Remove
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Alert tone="error" title="Upload failed">
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mt-4 space-y-3">
            <Alert tone="success" title="Upload successful">
              Processed {success.processed} records. Success: {success.successCount},
              Failed: {success.failCount}.
            </Alert>
            {success.errors && success.errors.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-dense text-text-2">
                {success.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate("/admin")}>
            Back
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            isLoading={uploading}
            disabled={!file || uploading}
          >
            Process file
          </Button>
        </div>
      </Panel>
    </div>
  );
}
