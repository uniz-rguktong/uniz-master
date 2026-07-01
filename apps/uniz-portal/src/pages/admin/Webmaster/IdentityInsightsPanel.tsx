import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, Users } from "lucide-react";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../utils/cn";
import { formatDisplayText } from "@/utils/displayText";

const STAFF_ROLES = new Set([
  "webmaster",
  "dean",
  "hod",
  "admin",
  "staff",
  "swo",
  "director",
  "coe",
]);

const MAROON = "#800000";
const MAROON_LIGHT = "#a31f1f";

type RoleRow = {
  role?: string;
  Active?: number | string;
  Disabled?: number | string;
};

type IdentityInsightsPanelProps = {
  data: RoleRow[];
};

export default function IdentityInsightsPanel({ data }: IdentityInsightsPanelProps) {
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
    <Card className="p-7 w-full h-full flex flex-col bg-white border border-zinc-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] rounded-2xl transition-colors duration-300 hover:border-zinc-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900 tracking-[-0.01em]">
            Access landscape
          </h2>
          <p className="text-[11px] font-medium text-zinc-400 tracking-[0.12em] mt-0.5">
            Staff roles, enablement & student share
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1">
          <UserCheck size={13} className="text-emerald-600" />
          <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
            {enablementPct.toFixed(1)}% enabled
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
        <InsightStat
          icon={Users}
          label="Students"
          value={studentCount.toLocaleString()}
          hint={`${studentShare.toFixed(1)}% of accounts`}
          accent="text-blue-600"
        />
        <InsightStat
          icon={Shield}
          label="Staff & admin"
          value={staffCount.toLocaleString()}
          hint={`${staffShare.toFixed(1)}% of accounts`}
          accent="text-[#800000]"
        />
        <InsightStat
          icon={UserCheck}
          label="Restricted"
          value={totalDisabled.toLocaleString()}
          hint={
            totalDisabled === 0
              ? "No disabled accounts"
              : `${(100 - enablementPct).toFixed(1)}% restricted`
          }
          accent={totalDisabled > 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] uppercase mb-3">
            Staff & admin by role
          </p>
          <div className="space-y-3">
            {staffRoles.length === 0 ? (
              <p className="text-sm text-zinc-400">No staff role data.</p>
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
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="font-medium text-zinc-700">{row.label}</span>
                      <span className="tabular-nums font-semibold text-zinc-900">
                        {row.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${MAROON}, ${MAROON_LIGHT})`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] uppercase mb-3">
            Account enablement
          </p>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold text-zinc-900 tracking-tighter tabular-nums leading-none">
                  {totalActive.toLocaleString()}
                </p>
                <p className="text-[12px] font-medium text-zinc-500 mt-1.5">
                  active of {totalUsers.toLocaleString()} total
                </p>
              </div>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  enablementPct >= 99 ? "text-emerald-600" : "text-amber-600",
                )}
              >
                {enablementPct.toFixed(1)}%
              </p>
            </div>

            <div className="h-3 rounded-full bg-zinc-200/80 overflow-hidden flex">
              <div
                className="h-full rounded-l-full transition-all duration-700"
                style={{
                  width: `${enablementPct}%`,
                  background: `linear-gradient(90deg, ${MAROON}, ${MAROON_LIGHT})`,
                }}
              />
              {totalDisabled > 0 && (
                <div
                  className="h-full bg-rose-300 transition-all duration-700"
                  style={{ width: `${100 - enablementPct}%` }}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] font-medium text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: MAROON }}
                />
                {totalActive.toLocaleString()} enabled
              </span>
              {totalDisabled > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  {totalDisabled.toLocaleString()} restricted
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200/70">
              <div className="flex items-center justify-between text-[12px] mb-2">
                <span className="text-zinc-600">Student share</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  {studentShare.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${studentShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function InsightStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/40 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent} />
        <span className="text-[11px] font-semibold text-zinc-500">{label}</span>
      </div>
      <p className="text-xl font-semibold text-zinc-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[10px] font-medium text-zinc-400 mt-1.5">{hint}</p>
    </div>
  );
}
