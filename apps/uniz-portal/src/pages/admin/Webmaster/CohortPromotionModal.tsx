/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Loader2, ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";
import { ADMIN_STUDENT_PROMOTE } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "../../../utils/cn";
import { AdminDialog } from "../../../components/admin/AdminDialog";
import {
  adminLabelClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminWarningBannerClass,
  adminWarningTitleClass,
  adminWarningTextClass,
  adminDangerInputClass,
} from "../../../components/admin/admin-ui";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";

interface CohortPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CohortPromotionModal({
  isOpen,
  onClose,
  onSuccess,
}: CohortPromotionModalProps) {
  const [loading, setLoading] = useState(false);
  const [fromYear, setFromYear] = useState("E1");
  const [toYear, setToYear] = useState("E2");
  const [branch, setBranch] = useState("ALL");
  const [confirmText, setConfirmText] = useState("");

  const years = ["E1", "E2", "E3", "E4", "PASSED_OUT"];
  const branches = [...ENGINEERING_BRANCH_OPTIONS];

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText.toLowerCase() !== "promote") {
      toast.error("Type Promote to confirm this action");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(ADMIN_STUDENT_PROMOTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify({ fromYear, toYear, branch }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Cohort promoted");
        onSuccess();
        onClose();
        setConfirmText("");
      } else {
        toast.error(data.message || "Promotion failed");
      }
    } catch {
      toast.error("Network error during promotion");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = confirmText.toLowerCase() === "promote" && !loading;

  return (
    <AdminDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Bulk cohort promotion"
      description="Upgrade the academic year for all students in a branch and origin year."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handlePromote} className="space-y-6">
        <div className={adminWarningBannerClass}>
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className={adminWarningTitleClass}>Destructive operation</p>
            <p className={adminWarningTextClass}>
              This updates the year field for every student in the selected branch
              and origin year. It cannot be undone automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr,32px,1fr] items-end gap-2">
          <div className="space-y-2">
            <label className={adminLabelClass}>From year</label>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              className={adminSelectClass}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="h-11 flex items-center justify-center text-zinc-300">
            <ArrowRight size={16} />
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>To year</label>
            <select
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
              className={adminSelectClass}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={adminLabelClass}>Department</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className={adminSelectClass}
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b === "ALL" ? "All departments" : b}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={cn(adminLabelClass, "text-rose-500")}>
            Type Promote to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Promote"
            className={adminDangerInputClass}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={cn(adminGhostButtonClass, "flex-1")}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(adminPrimaryButtonClass, "flex-[2]")}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Promote cohort
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
