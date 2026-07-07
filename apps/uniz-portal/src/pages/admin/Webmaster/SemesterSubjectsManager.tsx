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
import { cn } from "../../../utils/cn";
import { toast } from "@/utils/toast-ref";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";
import {
  adminCardClass,
  adminGhostButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPageWrapClass,
  adminPrimaryButtonClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";

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

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <button
        type="button"
        onClick={onBack}
        className={cn(adminGhostButtonClass, "mb-4 -ml-1")}
      >
        <ArrowLeft size={16} /> Back
      </button>

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
                  className={cn(adminSelectClass, "h-9 text-[11px]")}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          <strong>Internal code</strong> — stable system ID (do not change).{" "}
          <strong>Academic code</strong> — official code on registration slips, grade sheets, and exports.
        </p>
      </div>

      <div className={cn(adminCardClass, "overflow-hidden p-0")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[720px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-semibold tracking-wide text-zinc-500">
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Internal code</th>
                <th className="px-4 py-3 text-left">Academic code</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-right">Credits</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-zinc-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-zinc-500">
                    No subjects for these filters
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.customName || row.subject.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {row.subject.code}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-900">
                      {row.customCode?.trim() || (
                        <span className="text-amber-600 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.branch}</td>
                    <td className="px-4 py-3">{row.academicYear || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.customCredits ?? row.subject.credits}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className={cn(adminCardClass, "w-full max-w-md p-6 space-y-5")}>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Edit subject</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Internal: <span className="font-mono">{editing.subject.code}</span>
              </p>
            </div>
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
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className={cn(adminGhostButtonClass, "flex-1")}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving}
                className={cn(adminPrimaryButtonClass, "flex-[2] inline-flex items-center justify-center gap-2")}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
