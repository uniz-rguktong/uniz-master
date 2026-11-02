import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import {
  FEES_STRUCTURES,
  FEES_ISSUE,
  FEES_INVOICES,
  FEES_RECORD,
} from "@/api/endpoints";
import { leaveFetch as apiFetch } from "@/pages/faculty/leave/api";
import { rupees, PAYMENTS_COMING_SOON } from "@/pages/student/fees/format";

const METHODS = ["cash", "dd", "bank_transfer", "challan"];
const input =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none";

/** Admin view: fee structures, issue invoices, record offline payments. */
export default function FeesAdmin() {
  const [structures, setStructures] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    academicYear: "",
    batch: "",
    branch: "",
    year: "",
    dueDate: "",
    items: "Tuition:0",
  });
  const [rec, setRec] = useState<
    Record<string, { amount: string; method: string; reference: string }>
  >({});

  const load = useCallback(async () => {
    try {
      const [s, i] = await Promise.all([
        apiFetch(FEES_STRUCTURES),
        apiFetch(`${FEES_INVOICES}${status ? `?status=${status}` : ""}`),
      ]);
      setStructures(s.structures || []);
      setInvoices(i.invoices || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Fees is turned off" : e.message);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("FEES")) {
    return <DisabledState reason="Fees is turned off" />;
  }

  const create = async () => {
    const items = form.items
      .split(/\n|,/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, amt] = l.split(":");
        return {
          label: (label || "").trim(),
          amountPaise: Math.round(Number(amt) * 100),
        };
      });
    if (items.some((i) => !i.label || !Number.isFinite(i.amountPaise))) {
      return toast.error("Items must look like Tuition:35000, Hostel:12000");
    }
    try {
      await apiFetch(FEES_STRUCTURES, {
        method: "POST",
        body: JSON.stringify({ ...form, items }),
      });
      toast.success("Fee structure created");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const issue = async (id: string) => {
    try {
      const r = await apiFetch(FEES_ISSUE(id), { method: "POST" });
      toast.success(
        `Issued ${r.created} new invoices (${r.matched} students matched)`,
      );
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const record = async (id: string) => {
    const r = rec[id];
    if (!r?.amount || !r.reference)
      return toast.error("Enter amount and reference");
    try {
      await apiFetch(FEES_RECORD(id), {
        method: "POST",
        body: JSON.stringify({
          amountPaise: Math.round(Number(r.amount) * 100),
          method: r.method || "cash",
          reference: r.reference,
        }),
      });
      toast.success("Payment recorded");
      setRec((p) => ({
        ...p,
        [id]: { amount: "", method: "cash", reference: "" },
      }));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setR = (id: string, k: string, v: string) =>
    setRec((p) => ({
      ...p,
      [id]: {
        ...(p[id] || { amount: "", method: "cash", reference: "" }),
        [k]: v,
      },
    }));

  return (
    <ModulePage
      title="Fees"
      description={`Fee structures and invoices. Record counter and bank payments here. Online payment: ${PAYMENTS_COMING_SOON}.`}
    >
 {error && <p className="text-sm text-red-600">{error}</p>}
 <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input
          className={input}
          placeholder="Name (e.g. Tuition 2026-27)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className={input}
          placeholder="Academic year (2026-27)"
          value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
        />
        <input
          className={input}
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <input
          className={input}
          placeholder="Batch (blank = all)"
          value={form.batch}
          onChange={(e) => setForm({ ...form, batch: e.target.value })}
        />
        <input
          className={input}
          placeholder="Branch (blank = all)"
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
        />
        <input
          className={input}
          placeholder="Year, e.g. E1 (blank = all)"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />
        <textarea
          className={`${input} md:col-span-3`}
          rows={2}
          placeholder="Tuition:35000, Hostel:12000"
          value={form.items}
          onChange={(e) => setForm({ ...form, items: e.target.value })}
        />
        <button
          type="button"
          onClick={create}
 className="rounded-md bg-navy-900 px-3 py-1.5 text-sm text-white md:col-span-3"
        >
          Create structure
        </button>
      </div>

      <div className="space-y-2">
 <p className="font-medium text-slate-900">Structures</p>
        {structures.length === 0 && (
 <p className="text-sm text-slate-500">None yet.</p>
        )}
        {structures.map((s) => (
          <div
            key={s.id}
 className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <span>
              {s.name} . {s.academicYear} .{" "}
              {[s.batch, s.branch, s.year].filter(Boolean).join(" / ") ||
                "All students"}{" "}
              . {rupees(s.amountPaise)} . due {String(s.dueDate).slice(0, 10)}
            </span>
            <button
              type="button"
              onClick={() => issue(s.id)}
 className="rounded-md border border-slate-300 px-3 py-1"
            >
              Issue invoices
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
 <p className="font-medium text-slate-900">Invoices</p>
          <select
            className={input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="due">Due</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {invoices.length === 0 && (
 <p className="text-sm text-slate-500">No invoices.</p>
        )}
        {invoices.map((i) => (
          <div
            key={i.id}
 className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <span>
              {i.username} . {i.title} . {rupees(i.paidPaise)} /{" "}
              {rupees(i.amountPaise)} . {i.status}
            </span>
            {i.status !== "paid" && (
              <span className="flex flex-wrap gap-1">
                <input
                  className={`${input} w-24`}
                  placeholder="Rs"
                  value={rec[i.id]?.amount || ""}
                  onChange={(e) => setR(i.id, "amount", e.target.value)}
                />
                <select
                  className={input}
                  value={rec[i.id]?.method || "cash"}
                  onChange={(e) => setR(i.id, "method", e.target.value)}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  className={`${input} w-32`}
                  placeholder="Receipt / DD no"
                  value={rec[i.id]?.reference || ""}
                  onChange={(e) => setR(i.id, "reference", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => record(i.id)}
 className="rounded-md border border-slate-300 px-3 py-1"
                >
                  Record
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
