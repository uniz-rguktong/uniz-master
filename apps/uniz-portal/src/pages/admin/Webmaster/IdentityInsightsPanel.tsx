import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDisplayText } from "@/utils/displayText";
import { Panel } from "@/components/ui/panel";

const STAFF_ROLES = new Set([
  "webadmin",
  "dean",
  "hod",
  "admin",
  "staff",
  "swo",
  "director",
  "coe",
]);

type RoleRow = {
  role?: string;
  Active?: number | string;
  Disabled?: number | string;
};

type IdentityInsightsPanelProps = {
  data: RoleRow[];
};

export default function IdentityInsightsPanel({
  data,
}: IdentityInsightsPanelProps) {
  const {
    staffRoles,
    totalActive,
    totalDisabled,
    totalUsers,
    studentCount,
    staffCount,
    enablementPct,
    studentShare,
    staffShare,
  } = useMemo(() => {
    let active = 0;
    let disabled = 0;
    let students = 0;
    let staff = 0;

    const staffMap = new Map<string, number>();

    for (const row of data) {
      const roleKey = (row.role || "unknown").toLowerCase();
      const rowActive = Number(row.Active) || 0;
      const rowDisabled = Number(row.Disabled) || 0;
      const rowTotal = rowActive + rowDisabled;

      active += rowActive;
      disabled += rowDisabled;

      if (roleKey === "student") {
        students += rowTotal;
      } else if (STAFF_ROLES.has(roleKey)) {
        staff += rowTotal;
        const label = formatDisplayText(roleKey);
        staffMap.set(label, (staffMap.get(label) || 0) + rowTotal);
      }
    }

    const total = active + disabled;

    const staffRoles = [...staffMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return {
      staffRoles,
      totalActive: active,
      totalDisabled: disabled,
      totalUsers: total,
      studentCount: students,
      staffCount: staff,
      enablementPct: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
      studentShare: total > 0 ? Math.round((students / total) * 1000) / 10 : 0,
      staffShare: total > 0 ? Math.round((staff / total) * 1000) / 10 : 0,
    };
  }, [data]);

  const staffMax = Math.max(...staffRoles.map((r) => r.value), 1);

  return (
    <Panel title="Access landscape" className="h-full w-full">
      <p className="text-dense leading-5 text-text-2">
        Staff roles, enablement & student share
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightStat
          label="Students"
          value={studentCount.toLocaleString()}
          hint={`${studentShare.toFixed(1)}% of accounts`}
        />
        <InsightStat
          label="Staff & admin"
          value={staffCount.toLocaleString()}
          hint={`${staffShare.toFixed(1)}% of accounts`}
        />
        <InsightStat
          label="Restricted"
          value={totalDisabled.toLocaleString()}
          hint={
            totalDisabled === 0
              ? "No disabled accounts"
              : `${(100 - enablementPct).toFixed(1)}% restricted`
          }
          status={totalDisabled > 0 ? "error" : "success"}
        />
      </div>

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-dense leading-5 text-text-2">
            Staff & admin by role
          </p>
          <div className="space-y-3">
            {staffRoles.length === 0 ? (
              <p className="text-dense text-text-2">No staff role data.</p>
            ) : (
              staffRoles.map((row, i) => {
                const pct = Math.round((row.value / staffMax) * 100);
                return (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-dense">
                      <span className="font-medium text-head">{row.label}</span>
                      <span className="font-semibold tabular-nums text-head">
                        {row.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-tint">
                      <div
                        className="h-full rounded-full bg-navy-600 transition-[width] duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="mb-3 text-dense leading-5 text-text-2">
            Account enablement
          </p>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
                  {totalActive.toLocaleString()}
                </p>
                <p className="mt-3 text-dense leading-5 text-text-2">
                  active of {totalUsers.toLocaleString()} total
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-dense leading-5 text-text-2">
                {enablementPct >= 99 ? (
                  <CheckCircle2 size={16} strokeWidth={1.75} className="text-success" aria-hidden />
                ) : (
                  <AlertTriangle size={16} strokeWidth={1.75} className="text-warning" aria-hidden />
                )}
                {enablementPct.toFixed(1)}%
              </p>
            </div>

            <div className="flex h-2 overflow-hidden rounded-full bg-tint">
              <div
                className="h-full bg-navy-600 transition-[width] duration-700"
                style={{ width: `${enablementPct}%` }}
              />
              {totalDisabled > 0 && (
                <div
                  className="h-full bg-text-3 transition-[width] duration-700"
                  style={{ width: `${100 - enablementPct}%` }}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-dense text-text-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-navy-600" />
                {totalActive.toLocaleString()} enabled
              </span>
              {totalDisabled > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-text-3" />
                  {totalDisabled.toLocaleString()} restricted
                </span>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between text-dense">
                <span className="text-text-2">Student share</span>
                <span className="font-semibold tabular-nums text-head">
                  {studentShare.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-tint">
                <div
                  className="h-full rounded-full bg-navy-300 transition-[width] duration-700"
                  style={{ width: `${studentShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function InsightStat({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string;
  hint: string;
  status?: "success" | "error";
}) {
  const StatusIcon = status === "error" ? AlertCircle : status === "success" ? CheckCircle2 : null;
  return (
    <div className="flex min-h-[148px] flex-col rounded-lg border border-border bg-tile p-6">
      <p className="text-dense leading-5 text-text-2">{label}</p>
      <p className="mt-3 font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
        {value}
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-dense leading-5 text-text-2">
        {StatusIcon ? (
          <StatusIcon
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className={status === "error" ? "text-error" : "text-success"}
          />
        ) : null}
        {hint}
      </p>
    </div>
  );
}
