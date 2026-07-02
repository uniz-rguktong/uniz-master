/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Home } from "lucide-react";
import {
  ADMIN_STUDENT_RESET_CAMPUS_PRESENCE,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
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

interface CampusPresenceResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampusPresenceResetModal({
  isOpen,
  onClose,
  onSuccess,
}: CampusPresenceResetModalProps) {
  const [loading, setLoading] = useState(false);
  const [presence, setPresence] = useState<"IN" | "OUT">("IN");
  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");

  const years = ["ALL", "E1", "E2", "E3", "E4", "PASSED_OUT"];
  const branches = ["ALL", ...ENGINEERING_BRANCH_OPTIONS];
  const confirmPhrase = presence === "IN" ? "mark in" : "mark out";

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("admin_token");
    fetch(GET_AVAILABLE_BATCHES, {
      headers: { Authorization: `Bearer ${(token || "").replace(/"/g, "")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAvailableBatches(data.batches || []);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText.toLowerCase() !== confirmPhrase) {
      toast.error(`Type "${confirmPhrase}" to confirm this action`);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch(ADMIN_STUDENT_RESET_CAMPUS_PRESENCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify({ presence, branch, year, batch }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Campus presence updated");
        onSuccess();
        onClose();
        setConfirmText("");
      } else {
        toast.error(data.message || "Campus presence reset failed");
      }
    } catch {
      toast.error("Network error during campus presence reset");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = confirmText.toLowerCase() === confirmPhrase && !loading;

  return (
    <AdminDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Reset campus presence"
      description="Mark students as IN or OUT of campus. Only students currently on the opposite status are updated."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleReset} className="space-y-6">
        <div className={adminWarningBannerClass}>
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className={adminWarningTitleClass}>Bulk campus status change</p>
            <p className={adminWarningTextClass}>
              Use after holidays or system recovery to mark everyone back IN.
              Students actively checked out via security will be updated too.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className={adminLabelClass}>Target status</label>
          <select
            value={presence}
            onChange={(e) => {
              setPresence(e.target.value as "IN" | "OUT");
              setConfirmText("");
            }}
            className={adminSelectClass}
          >
            <option value="IN">Mark IN campus</option>
            <option value="OUT">Mark OUT of campus</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <label className={adminLabelClass}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={adminSelectClass}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === "ALL" ? "All years" : y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
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
        </div>

        <div className="space-y-2">
          <label className={cn(adminLabelClass, "text-rose-500")}>
            Type {confirmPhrase} to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmPhrase}
            className={adminDangerInputClass}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={cn(adminGhostButtonClass, "flex-1")}
          >
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
              <Home size={16} />
            )}
            {presence === "IN" ? "Mark all IN" : "Mark all OUT"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
