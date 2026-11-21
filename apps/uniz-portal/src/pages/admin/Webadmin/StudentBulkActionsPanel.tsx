import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  STUDENT_COHORT_ACTIONS,
  type CohortActionConfig,
} from "./studentBulkActions.config";
import StudentCohortActionModal from "./StudentCohortActionModal";
import { Badge } from "@/components/ui/badge";

type StudentBulkActionsPanelProps = {
  onActionSuccess: () => void;
};

const toneBadge: Record<CohortActionConfig["tone"], "neutral" | "warning" | "error"> = {
  neutral: "neutral",
  warning: "warning",
  danger: "error",
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
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
            Cohort bulk actions
          </h2>
          <p className="mt-2 max-w-2xl text-body leading-6 text-text-2">
            Filter by department, year, and batch — then apply one action at a
            time. Each combination is supported (e.g. all O23 CSE E1 → mark IN).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {STUDENT_COHORT_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setActiveAction(action)}
                className={cn(
                  "rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:bg-tint",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge tone={toneBadge[action.tone]} icon={Icon}>
                    {action.tone === "danger"
                      ? "Destructive"
                      : action.tone === "warning"
                        ? "Caution"
                        : "Routine"}
                  </Badge>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-text-3" />
                </div>
                <h3 className="mt-4 text-dense font-medium text-head">{action.title}</h3>
                <p className="mt-1.5 text-small leading-5 text-text-2">{action.description}</p>
                <p className="mt-3 text-caption text-text-3">
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
