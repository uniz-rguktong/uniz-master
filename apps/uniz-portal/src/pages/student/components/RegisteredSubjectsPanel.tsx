import { formatStatus } from "@/utils/displayText";
import {
  BookText,
  GraduationCap,
  CheckCircle2,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  adminCardClass,
  adminChipClass,
  adminEyebrowClass,
  adminSectionTitleClass,
} from "@/components/admin/admin-ui";

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
      <div className={cn(adminCardClass, "p-8 text-center")}>
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
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-8 text-center">
        <h3 className="text-lg font-semibold text-amber-900">
          No registered subjects yet
        </h3>
        <p className="text-sm text-amber-800/80 mt-2 max-w-md mx-auto">
          You have not completed registration for{" "}
          <strong>{semester.name}</strong>. Use the Register tab when enrollment
          is open.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", compact ? "space-y-4" : "space-y-8")}>
      <div
        className={cn(
          "bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl text-white shadow-xl shadow-zinc-100/50",
          compact ? "p-5" : "p-8",
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className={cn(adminEyebrowClass, "text-zinc-300")}>
              Current semester
            </span>
            <h2
              className={cn(
                "font-semibold tracking-tight",
                compact ? "text-xl" : "text-3xl",
              )}
            >
              {semester.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[10px] font-bold tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                {formatStatus(semester.status)}
              </span>
              <span className={adminChipClass}>
                {subjects.length} subjects · {totalCredits} credits
              </span>
            </div>
          </div>
          {!compact && (
            <div className="hidden lg:block opacity-20">
              <GraduationCap className="w-24 h-24" />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className={cn(adminSectionTitleClass, "mb-3")}>
          Registered subjects
        </h3>
        <div
          className={cn(
            "grid gap-3",
            compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 gap-4",
          )}
        >
          {subjects.map((row, idx) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group bg-white border border-zinc-100 p-4 rounded-xl hover:border-zinc-200 transition-all flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-zinc-50 rounded-lg text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <BookText size={16} />
                </div>
                <span className="px-2 py-0.5 bg-zinc-50 rounded-lg text-[9px] font-semibold tracking-wide text-zinc-500 border border-zinc-100">
                  {row.subject?.code}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-zinc-900 leading-snug flex-1">
                {row.subject?.name}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50 text-[10px] font-semibold text-zinc-400 tracking-wide">
                <span>
                  {row.subject?.department || "—"} · {row.subject?.credits}{" "}
                  credits
                </span>
                {row.submittedAt && (
                  <span>
                    {new Date(row.submittedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="flex items-start gap-4 p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
          <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 mb-1">
              Official enrollment record
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              These are your confirmed subjects for this semester. Contact
              Academic Affairs if anything looks incorrect.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
