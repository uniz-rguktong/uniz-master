import type { LucideIcon } from "lucide-react";
import {
  ArrowUp,
  Ban,
  CheckCircle2,
  Home,
  LogOut,
  UserCheck,
} from "lucide-react";

export type CohortActionId =
  | "campus_in"
  | "campus_out"
  | "promote"
  | "clear_pending"
  | "suspend"
  | "unsuspend";

export type CohortActionConfig = {
  id: CohortActionId;
  title: string;
  description: string;
  icon: LucideIcon;
  confirmPhrase: string;
  tone: "neutral" | "warning" | "danger";
  filterMode: "cohort" | "promote";
  submitLabel: string;
  warningTitle: string;
  warningText: string;
};

export const STUDENT_COHORT_ACTIONS: CohortActionConfig[] = [
  {
    id: "campus_in",
    title: "Mark IN campus",
    description: "Set matching students as physically on campus.",
    icon: Home,
    confirmPhrase: "mark in",
    tone: "neutral",
    filterMode: "cohort",
    submitLabel: "Mark all IN",
    warningTitle: "Bulk campus check-in",
    warningText:
      "Updates isPresentInCampus for students currently marked OUT in the selected cohort.",
  },
  {
    id: "campus_out",
    title: "Mark OUT of campus",
    description: "Set matching students as off campus.",
    icon: LogOut,
    confirmPhrase: "mark out",
    tone: "warning",
    filterMode: "cohort",
    submitLabel: "Mark all OUT",
    warningTitle: "Bulk campus check-out",
    warningText:
      "Use for drills or mass checkout. Only students currently IN are updated.",
  },
  {
    id: "promote",
    title: "Promote academic year",
    description: "Move a year cohort forward (e.g. E1 → E2).",
    icon: ArrowUp,
    confirmPhrase: "promote",
    tone: "danger",
    filterMode: "promote",
    submitLabel: "Promote cohort",
    warningTitle: "Year promotion",
    warningText:
      "Updates the year field for every student in the origin year and department filter. Cannot be auto-reversed.",
  },
  {
    id: "clear_pending",
    title: "Clear pending flags",
    description: "Remove stale outpass/outing pending status.",
    icon: CheckCircle2,
    confirmPhrase: "clear pending",
    tone: "neutral",
    filterMode: "cohort",
    submitLabel: "Clear pending",
    warningTitle: "Reset pending requests",
    warningText:
      "Clears isApplicationPending for students with an active pending flag in the selected cohort.",
  },
  {
    id: "suspend",
    title: "Suspend accounts",
    description: "Disable login for matching students.",
    icon: Ban,
    confirmPhrase: "suspend",
    tone: "danger",
    filterMode: "cohort",
    submitLabel: "Suspend cohort",
    warningTitle: "Bulk account suspension",
    warningText:
      "Suspends student accounts and syncs with the auth service. Only currently active accounts are affected.",
  },
  {
    id: "unsuspend",
    title: "Restore accounts",
    description: "Re-enable login for suspended students.",
    icon: UserCheck,
    confirmPhrase: "restore",
    tone: "warning",
    filterMode: "cohort",
    submitLabel: "Restore cohort",
    warningTitle: "Bulk account restoration",
    warningText:
      "Restores suspended student accounts in the selected cohort and syncs with auth.",
  },
];

export const COHORT_YEARS = ["ALL", "E1", "E2", "E3", "E4", "PASSED_OUT"] as const;
export const PROMOTE_YEARS = ["E1", "E2", "E3", "E4", "PASSED_OUT"] as const;
