/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import {
  Upload,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import {
  ADMIN_STUDENT_PROGRESS,
  ADMIN_STUDENT_TEMPLATE,
  ADMIN_STUDENT_UPLOAD,
} from "../../api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "../../components/Input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, type TableColumn } from "@/components/ui/table";
import { apiClient, downloadFile } from "../../api/apiClient";
import { adminCardClass, adminPageWrapClass } from "../../components/admin/admin-ui";
import { cn } from "../../utils/cn";

export default function AddStudents() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const pollRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleFile = async (f: File) => {
    try {
      setFile(f);
      setError(null);
      const buffer = await f.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);

      const json: any[] = [];
      const headerRow = worksheet?.getRow(1);
      const headers_found: string[] = [];

      headerRow?.eachCell((cell, colNumber) => {
        headers_found[colNumber] = cell.text;
      });

      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers_found[colNumber];
          if (header) rowData[header] = cell.text;
        });
        if (Object.keys(rowData).length > 0) {
          json.push(rowData);
        }
      });

      if (!json.length) throw new Error("File is empty or invalid format");
      setHeaders(headers_found.filter(Boolean));
      setRows(json.map((r, i) => ({ id: i + 1, ...r })));
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
      setFile(null);
      setRows([]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setRows([]);
    setHeaders([]);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const handleUpload = async () => {
    if (!file || !rows.length) return setError("Select a valid file first");
    setUploading(true);
    setError(null);
    setProgress({ status: "processing", percentage: 0 });
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await apiClient<any>(ADMIN_STUDENT_UPLOAD, {
        method: "POST",
        body,
      });

      if (data && data.success) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(async () => {
          const tick = await apiClient<{ percent?: number; status?: string }>(
            ADMIN_STUDENT_PROGRESS,
            {},
            false,
          );
          if (!tick) return;
          const done = tick.status === "completed" || tick.status === "done";
          const failed = tick.status === "failed" || tick.status === "error";
          setProgress({
            percentage: done ? 100 : tick.percent || 0,
            status: done ? "completed" : failed ? "failed" : "processing",
          });
          if (!done && !failed) return;
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          if (failed) setError("Upload failed");
        }, 2000);
      } else {
        setProgress(null);
        setError(data?.message || data?.msg || "Upload failed");
      }
    } catch {
      setProgress(null);
      setError("Upload failed due to network error");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadFile(ADMIN_STUDENT_TEMPLATE, "Student_Upload_Template.xlsx");
    } catch {
      setError("Error downloading template");
    }
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    return rows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase()),
    );
  }, [rows, search]);

  const primaryHeader =
    headers.find((header) => /name/i.test(header)) ?? headers[0];
  const metaHeaders = headers.filter((header) => header !== primaryHeader).slice(0, 2);

  const columns: TableColumn<any>[] = headers.map((header) => ({
    id: header,
    header,
    primary: header === primaryHeader,
    meta: metaHeaders.includes(header),
    cell: (row) => row[header] ?? "—",
  }));

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      <Button
        variant="ghost"
        size="compact"
        onClick={() => navigate("/admin")}
      >
        <ArrowLeft size={16} /> Back
      </Button>

      <PageHeader
        title="Add Students"
        meta="Import student records via bulk spreadsheet upload."
        action={
          <Button variant="outline" onClick={downloadTemplate}>
            <FileDown className="w-4 h-4" /> Template
          </Button>
        }
      />

      {!rows.length ? (
        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-12 text-center transition-colors",
            error
              ? "border-error bg-surface-2"
              : "border-border-strong hover:border-head hover:bg-surface-2",
          )}
        >
          <input
            id="fileInput"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-h3 text-text">Click to upload spreadsheet</p>
              <p className="mt-1 text-dense text-text-2">Supports .xlsx, .xls, .csv</p>
            </div>
          </label>
          {error && (
            <p className="mt-4 flex items-center justify-center gap-2 font-medium text-error">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between rounded-xl bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary-hover p-2">
                <FileSpreadsheet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{file?.name}</p>
                <p className="text-caption text-primary-foreground/80">
                  {rows.length} records found
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearFile}
              title="Remove File"
              className="text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Table
            columns={columns}
            rows={filteredRows}
            getRowId={(row) => String(row.id)}
            toolbar={
              <>
                <h3 className="font-semibold text-text">Data Preview</h3>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Filter records..."
                    value={search}
                    onchangeFunction={(e: any) => setSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
              </>
            }
            empty={
              <EmptyState
                title="No records match"
                body="Try a different filter, or clear the search to see every imported row."
              />
            }
            footer={
              <Button onClick={handleUpload} isLoading={uploading} disabled={uploading}>
                <Upload className="w-4 h-4" /> Confirm & Upload
              </Button>
            }
          />
          {error && (
            <p className="flex items-center gap-2 font-medium text-error">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
        </div>
      )}

      {progress && (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-right-10 duration-500">
          <div className={cn(adminCardClass, "p-6")}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-text">Upload Status</span>
              <Badge tone={progress.status === "completed" ? "success" : "neutral"}>
                {progress.status === "completed" ? "Completed" : "Processing"}
              </Badge>
            </div>

            {progress.status === "completed" ? (
              <div className="mb-2 flex items-center gap-3 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-dense font-medium">Successfully processed</span>
              </div>
            ) : (
              <div className="mb-2 flex items-center gap-3 font-semibold text-text">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-dense font-medium">Uploading data...</span>
              </div>
            )}

            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  "h-full rounded-md transition-all duration-500",
                  progress.status === "completed" ? "bg-primary" : "bg-text-3",
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
