import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import { adminCardClass, adminLabelClass } from "../../../components/admin/admin-ui";
import {
  STUDENT_COHORT_ACTIONS,
  type CohortActionConfig,
} from "./studentBulkActions.config";
import StudentCohortActionModal from "./StudentCohortActionModal";

type StudentBulkActionsPanelProps = {
  onActionSuccess: () => void;
};

const toneBorder: Record<CohortActionConfig["tone"], string> = {
  neutral: "border-zinc-200/80 hover:border-zinc-300",
  warning: "border-amber-200/80 hover:border-amber-300",
  danger: "border-rose-200/80 hover:border-rose-300",
};

const toneIcon: Record<CohortActionConfig["tone"], string> = {
  neutral: "bg-zinc-100 text-[#800000]",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
};

export default function StudentBulkActionsPanel({
  onActionSuccess,
}: StudentBulkActionsPanelProps) {
  const [activeAction, setActiveAction] = useState<CohortActionConfig | null>(
    null,
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className={adminLabelClass}>Cohort bulk actions</p>
          <p className="text-[13px] text-zinc-500 mt-1 max-w-2xl">
            Filter by department, year, and batch — then apply one action at a
            time. Each combination is supported (e.g. all O23 CSE E1 → mark IN).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STUDENT_COHORT_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setActiveAction(action)}
                className={cn(
                  adminCardClass,
                  "text-left p-5 transition-all duration-200 group",
                  toneBorder[action.tone],
                  "hover:shadow-[0_4px_12px_rgba(10,10,10,0.06)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      toneIcon[action.tone],
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-zinc-300 group-hover:text-zinc-500 mt-1 transition-colors"
                  />
                </div>
                <h3 className="text-[14px] font-semibold text-zinc-900 mt-4 tracking-tight">
                  {action.title}
                </h3>
                <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed">
                  {action.description}
                </p>
                <p className="text-[10px] font-medium text-zinc-400 mt-3 tracking-[0.12em] uppercase">
                  {action.filterMode === "promote"
                    ? "Dept · from/to year · batch"
                    : "Dept · year · batch"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <StudentCohortActionModal
        action={activeAction}
        isOpen={!!activeAction}
        onClose={() => setActiveAction(null)}
        onSuccess={onActionSuccess}
      />
    </>
  );
}
