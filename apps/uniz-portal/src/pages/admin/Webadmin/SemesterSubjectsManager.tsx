/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import { BASE_URL, DEAN_REVIEW } from "../../../api/endpoints";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import { AdminDialog } from "../../../components/admin/AdminDialog";
import { cn } from "../../../utils/cn";
import { toast } from "@/utils/toast-ref";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";
import {
  adminCardClass,
  adminInputClass,
  adminLabelClass,
  adminPageWrapClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";

const BRANCH_OPTIONS = ["ALL", ...ENGINEERING_BRANCH_OPTIONS];
const YEAR_OPTIONS = ["ALL", "E1", "E2", "E3", "E4"];

type AllocationRow = {
  id: string;
  branch: string;
  academicYear?: string;
  customName?: string | null;
  customCode?: string | null;
  customCredits?: number | null;
  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
};

export default function SemesterSubjectsManager({
  semester,
  onBack,
}: {
  semester: { id: string; name: string; batch?: string };
  onBack: () => void;
}) {
  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [editing, setEditing] = useState<AllocationRow | null>(null);
  const [form, setForm] = useState({
    customName: "",
    customCode: "",
    customCredits: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = branch === "ALL" ? "all" : branch;
      const params = new URLSearchParams({ semesterId: semester.id });
      if (year !== "ALL") params.set("year", year);
      const data = await apiClient<AllocationRow[]>(
        `${DEAN_REVIEW(branchParam)}?${params.toString()}`,
        {},
        false,
      );
      setRows(data || []);
    } catch {
      setRows([]);
      toast.error("Failed to load semester subjects");
    } finally {
      setLoading(false);
    }
  }, [semester.id, branch, year]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const openEdit = (row: AllocationRow) => {
    setEditing(row);
    setForm({
      customName: row.customName || row.subject.name,
      customCode: row.customCode || "",
      customCredits: row.customCredits ?? row.subject.credits,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          customName: form.customName.trim(),
          customCode: form.customCode.trim().toUpperCase() || null,
          customCredits: Number(form.customCredits) || editing.subject.credits,
        }),
      });
      toast.success("Subject updated");
      setEditing(null);
      fetchAllocations();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<AllocationRow>[] = [
    {
      id: "subject",
      header: "Subject",
      primary: true,
      cell: (row) => row.customName || row.subject.name,
    },
    {
      id: "internal",
      header: "Internal code",
      meta: true,
      cell: (row) => <span className="font-mono text-caption">{row.subject.code}</span>,
    },
    {
      id: "academic",
      header: "Academic code",
      cell: (row) =>
        row.customCode?.trim() ? (
          <span className="font-mono text-caption">{row.customCode}</span>
        ) : (
          <Badge tone="warning">Not set</Badge>
        ),
    },
    {
      id: "branch",
      header: "Branch",
      meta: true,
      cell: (row) => row.branch,
    },
    {
      id: "year",
      header: "Year",
      cell: (row) => row.academicYear || "—",
    },
    {
      id: "credits",
      header: "Credits",
      numeric: true,
      cell: (row) => row.customCredits ?? row.subject.credits,
    },
    {
      id: "edit",
      header: "Edit",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="compact"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
        >
          <Pencil size={14} />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <Button type="button" variant="ghost" size="compact" onClick={onBack} className="mb-4">
        <ArrowLeft size={16} /> Back
      </Button>

      <SectionHeader
        icon={<BookOpen size={18} />}
        eyebrow="Semester subjects"
        title="Edit subject codes & names"
        subtitle={`Set official academic codes for ${semester.name}. Internal codes stay fixed for system use.`}
      />

      <div className={cn(adminCardClass, "p-5 space-y-4")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Branch", value: branch, onChange: setBranch, options: BRANCH_OPTIONS },
            { label: "Year", value: year, onChange: setYear, options: YEAR_OPTIONS },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <span className={adminLabelClass}>{f.label}</span>
              <div className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className={adminSelectClass}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-caption text-text-2">
          <span className="font-semibold">Internal code</span> — stable system ID (do not change).{" "}
          <span className="font-semibold">Academic code</span> — official code on registration slips, grade sheets, and exports.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 text-text-3">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-caption">Loading…</p>
        </div>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          onRowClick={openEdit}
          empty={<EmptyState title="No subjects for these filters" />}
        />
      )}

      <AdminDialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit subject"
        description={
          editing ? (
            <>
              Internal: <span className="font-mono">{editing.subject.code}</span>
            </>
          ) : undefined
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveEdit()} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={adminLabelClass}>Display name</label>
            <input
              className={adminInputClass}
              value={form.customName}
              onChange={(e) => setForm({ ...form, customName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>Academic code</label>
            <input
              className={cn(adminInputClass, "font-mono")}
              placeholder="e.g. 23PEG1201"
              value={form.customCode}
              onChange={(e) =>
                setForm({ ...form, customCode: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>Credits</label>
            <input
              type="number"
              className={adminInputClass}
              value={form.customCredits}
              onChange={(e) =>
                setForm({ ...form, customCredits: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>
        </div>
      </AdminDialog>
    </div>
  );
}
