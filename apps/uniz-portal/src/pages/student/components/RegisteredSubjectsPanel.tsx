import { formatStatus } from "@/utils/displayText";
import { GraduationCap, AlertCircle, Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/api/apiClient";
import { DOWNLOAD_REGISTRATION } from "@/api/endpoints";

export type RegisteredSubjectRow = {
  id: string;
  subject?: {
    code: string;
    name: string;
    credits: number;
    department?: string;
  };
  submittedAt?: string;
};

type SemesterInfo = {
  id: string;
  name: string;
  status: string;
};

function formatRegisteredDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RegisteredSubjectsPanel({
  semester,
  subjects,
  compact = false,
}: {
  semester: SemesterInfo | null;
  subjects: RegisteredSubjectRow[];
  compact?: boolean;
}) {
  if (!semester) {
    return (
      <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-10 text-center">
        <GraduationCap className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-600">No active semester</p>
      </div>
    );
  }

  const totalCredits = subjects.reduce(
    (acc, row) => acc + (row.subject?.credits || 0),
    0,
  );

  if (subjects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400 block mb-1">
              Current semester
            </span>
            <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">
              {semester.name}
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold tracking-wide">
            {formatStatus(semester.status)}
          </span>
        </div>
        <div className="bg-zinc-50 rounded-xl p-8 text-center border border-zinc-200">
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
            <AlertCircle size={28} className="text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-zinc-900">
            No registered subjects yet
          </h3>
          <p className="text-zinc-500 font-medium text-sm max-w-md mx-auto">
            You have not completed registration for {semester.name}. Use the
            Register tab when enrollment is open.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "-mx-4 md:mx-0 space-y-0 md:space-y-4",
        compact && "mx-0 space-y-3",
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-100",
          compact ? "pb-3 px-0" : "px-4 md:px-0 pb-4 pt-1",
        )}
      >
        <div>
          <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400 block mb-1">
            Current semester
          </span>
          <h2
            className={cn(
              "font-semibold tracking-tight text-zinc-900",
              compact ? "text-[15px]" : "text-[17px]",
            )}
          >
            {semester.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold tracking-wide">
              {formatStatus(semester.status)}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
              {subjects.length} subjects · {totalCredits} credits
            </span>
          </div>
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() =>
              downloadFile(
                DOWNLOAD_REGISTRATION(semester.id),
                `REGISTRATION_${semester.id}.pdf`,
              )
            }
            className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Download size={14} />
            Download PDF
          </button>
        )}
      </div>

      <div
        className={cn(
          "md:bg-white md:rounded-xl overflow-hidden md:border md:border-zinc-100 md:shadow-sm bg-transparent",
          compact && "md:rounded-lg",
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-zinc-200 md:bg-zinc-50/50 bg-transparent">
                <th className="px-4 py-3 text-left text-[10px] font-bold tracking-[0.14em] text-zinc-500 w-[18%]">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold tracking-[0.14em] text-zinc-500 w-[34%]">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold tracking-[0.14em] text-zinc-500 w-[16%]">
                  Department
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-bold tracking-[0.14em] text-zinc-500 w-[14%]">
                  Credits
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold tracking-[0.14em] text-zinc-500 w-[18%]">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {subjects.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold tracking-wide">
                      {row.subject?.code || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-xs text-zinc-900 leading-snug">
                    {row.subject?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 font-medium text-xs">
                    {row.subject?.department || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600 font-medium text-xs tabular-nums">
                    {row.subject?.credits != null
                      ? Number(row.subject.credits).toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 font-semibold text-[11px] tabular-nums whitespace-nowrap">
                    {formatRegisteredDate(row.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!compact && (
          <div className="px-4 md:px-6 py-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/40">
            <p className="text-[11px] font-semibold text-zinc-400 tracking-wide">
              Total load
            </p>
            <p className="text-sm font-semibold text-zinc-900 tabular-nums">
              {subjects.length} subjects · {totalCredits} credits
            </p>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-start gap-3 px-4 md:px-0 pt-2 md:pt-0">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Official enrollment record — these are your confirmed subjects for
            this semester. Contact Academic Affairs if anything looks incorrect.
          </p>
        </div>
      )}
    </div>
  );
}
