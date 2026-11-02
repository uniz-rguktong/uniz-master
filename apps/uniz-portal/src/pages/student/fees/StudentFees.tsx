import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { FEES_MINE, FEES_PAY } from "@/api/endpoints";
import { rupees, PAYMENTS_COMING_SOON } from "./format";

async function studentFetch(url: string, init: RequestInit = {}) {
  const token = (localStorage.getItem("student_token") || "").replace(/"/g, "");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(
      body?.message || `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.code = body?.code;
    throw err;
  }
  return body;
}

const badge: Record<string, string> = {
  due: "bg-amber-100 text-amber-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

/** Student view: fee invoices, receipts, and the pay button (coming soon). */
export default function StudentFees() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await studentFetch(FEES_MINE);
      setInvoices(r.invoices || []);
      setPayments(r.payments || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Fees is turned off" : e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("FEES")) {
    return <DisabledState reason="Fees is turned off" />;
  }

  const pay = async (id: string) => {
    try {
      await studentFetch(FEES_PAY(id), { method: "POST" });
    } catch (e: any) {
      if (e.code === "PAYMENTS_DISABLED") toast.warning(PAYMENTS_COMING_SOON);
      else toast.error(e.message);
    }
  };

  const due = invoices.reduce((s, i) => s + (i.amountPaise - i.paidPaise), 0);

  return (
    <ModulePage
      title="Fees"
      description="Your fee invoices and receipts. Online payment is coming soon; pay at the accounts section for now."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Balance due</p>
        <p className="text-2xl font-semibold text-slate-900">{rupees(due)}</p>
        <p className="mt-1 text-xs text-slate-500">{PAYMENTS_COMING_SOON}</p>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-slate-500">No fee invoices yet.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((i) => (
            <div
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{i.title}</p>
                <p className="text-xs text-slate-500">
                  Due {String(i.dueDate).slice(0, 10)} . Paid{" "}
                  {rupees(i.paidPaise)} of {rupees(i.amountPaise)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${badge[i.status] || badge.due}`}
                >
                  {i.status}
                </span>
                {i.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => pay(i.id)}
                    title={PAYMENTS_COMING_SOON}
                    className="rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-600"
                  >
                    Pay online ({PAYMENTS_COMING_SOON})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {payments.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 font-medium text-slate-900">Receipts</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {payments.map((p) => (
              <li key={p.id}>
                {String(p.createdAt).slice(0, 10)} . {rupees(p.amountPaise)} .{" "}
                {p.method} . {p.reference}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModulePage>
  );
}
