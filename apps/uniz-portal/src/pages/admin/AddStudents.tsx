/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
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
import { BASE_URL } from "../../api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "../../components/Input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, type TableColumn } from "@/components/ui/table";
import { apiClient, downloadFile } from "../../api/apiClient";
import {
  adminCardClass,
  adminLabelClass,
  adminPageWrapClass,
  adminSelectClass,
} from "../../components/admin/admin-ui";
import { cn } from "../../utils/cn";

export default function AddStudents() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [year, setYear] = useState("E1");
  const [sem, setSem] = useState("Sem - 1");
  const [branch, setBranch] = useState("CSE");
  const [_processId, setProcessId] = useState<string | null>(null);
  const [progress, _setProgress] = useState<any>(null);
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

  const handleUpload = async () => {
    if (!rows.length) return setError("Select a valid file first");
    setUploading(true);
    setError(null);
    try {
      const data = await apiClient<any>(`${BASE_URL}/admin/addstudents`, {
        method: "POST",
        body: JSON.stringify({
          year,
          SemesterName: sem,
          branch,
          Students: rows.map((r) => ({
            Username: r.Username,
            RollNumber: r.RollNumber,
            FullName: r.FullName,
            Email: r.Email,
          })),
        }),
      });

      if (data && data.success) {
        setProcessId(data.processId);
        _setProgress({ status: "completed", percentage: 100 });
      } else {
        setError(data?.msg || "Upload failed");
      }
    } catch {
      setError("Upload failed due to network error");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadFile(
        `${BASE_URL}/admin/students/template`,
        `${year}_${sem}_${branch}_students_template.xlsx`,
        { year, semester: sem, branch },
      );
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

      <div className={cn(adminCardClass, "grid grid-cols-1 gap-6 p-6 md:grid-cols-3")}>
        <div className="space-y-2">
          <label className={adminLabelClass}>Year</label>
          <div className="flex rounded-lg bg-surface-2 p-1">
            {["E1", "E2", "E3", "E4"].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={cn(
                  "flex-1 rounded-md py-2 text-dense font-medium transition-colors",
                  year === y
                    ? "bg-surface text-text"
                    : "text-text-2 hover:text-text",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className={adminLabelClass}>Semester</label>
          <select
            value={sem}
            onChange={(e) => setSem(e.target.value)}
            className={adminSelectClass}
          >
            <option value="Sem - 1">Semester 1</option>
            <option value="Sem - 2">Semester 2</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={adminLabelClass}>Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className={adminSelectClass}
          >
            {["CSE", "ECE", "EEE", "CIVIL", "MECH"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

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
