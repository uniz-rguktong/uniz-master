/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  ADMIN_STUDENT_COHORT_ACTION,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { AdminDialog } from "../../../components/admin/AdminDialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  adminLabelClass,
  adminSelectClass,
  adminDangerInputClass,
} from "../../../components/admin/admin-ui";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";
import {
  COHORT_YEARS,
  PROMOTE_YEARS,
  type CohortActionConfig,
} from "./studentBulkActions.config";

type StudentCohortActionModalProps = {
  action: CohortActionConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function StudentCohortActionModal({
  action,
  isOpen,
  onClose,
  onSuccess,
}: StudentCohortActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [fromYear, setFromYear] = useState("E1");
  const [toYear, setToYear] = useState("E2");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");

  const branches = ["ALL", ...ENGINEERING_BRANCH_OPTIONS];
  const confirmPhrase = action?.confirmPhrase ?? "";

  useEffect(() => {
    if (!isOpen) return;
    setConfirmText("");
    const token = localStorage.getItem("admin_token");
    fetch(GET_AVAILABLE_BATCHES, {
      headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAvailableBatches(data.batches || []);
      })
      .catch(() => {});
  }, [isOpen, action?.id]);

  if (!action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toLowerCase() !== confirmPhrase) {
      toast.error(`Type "${confirmPhrase}" to confirm`);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const body: Record<string, string> = {
      action: action.id,
      branch,
      batch,
    };
    if (action.filterMode === "promote") {
      body.fromYear = fromYear;
      body.toYear = toYear;
    } else {
      body.year = year;
    }

    try {
      const res = await fetch(ADMIN_STUDENT_COHORT_ACTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Cohort action completed");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Network error during cohort action");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = confirmText.toLowerCase() === confirmPhrase && !loading;

  return (
    <AdminDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={action.title}
      description={action.description}
      maxWidth="max-w-[640px]"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="cohort-action-form"
            variant={action.tone === "danger" ? "destructive" : "primary"}
            disabled={!canSubmit}
            isLoading={loading}
          >
            {action.submitLabel}
          </Button>
        </>
      }
    >
      <form id="cohort-action-form" onSubmit={handleSubmit} className="mx-auto max-w-[640px] space-y-4">
        <Alert tone="warning" title={action.warningTitle}>
          {action.warningText}
        </Alert>

        {action.filterMode === "promote" ? (
          <>
            <div>
              <label className={adminLabelClass}>From year</label>
              <select
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                className={adminSelectClass}
              >
                {PROMOTE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={adminLabelClass}>To year</label>
              <select
                value={toYear}
                onChange={(e) => setToYear(e.target.value)}
                className={adminSelectClass}
              >
                {PROMOTE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
            <div>
              <label className={adminLabelClass}>Batch (optional)</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className={adminSelectClass}
              >
                <option value="ALL">All batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
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
            <div>
              <label className={adminLabelClass}>Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={adminSelectClass}
              >
                {COHORT_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y === "ALL" ? "All years" : y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={adminLabelClass}>Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className={adminSelectClass}
              >
                <option value="ALL">All batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className={adminLabelClass}>Type {confirmPhrase} to confirm</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmPhrase}
            className={adminDangerInputClass}
            autoComplete="off"
          />
        </div>
      </form>
    </AdminDialog>
  );
}
