/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Zap,
  ShieldAlert,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import { ADMIN_STUDENT_PROMOTE } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/utils/cn";

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
  const branches = ["ALL", "CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME", "AI&ML"];

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmText !== "PROMOTE") {
      toast.error("Please type PROMOTE to confirm this destructive operation");
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
        toast.success(data.message);
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Promotion Protocol Failure");
      }
    } catch (err) {
      toast.error("Network Synchronicity Lost during promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%", filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%", filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%", filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] z-[201] overflow-hidden flex flex-col p-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                  <Zap size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight uppercase italic">
                  Cohort <span className="text-indigo-600">Promotion</span> logic
                </h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">
                  Bulk upgrade academic identities for a specific cohort
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all hover:scale-110 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl mb-8 flex gap-5">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Destructive Operation</p>
                <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed uppercase tracking-tighter">
                  This protocol will modify the "Year" field for all students in the selected branch and origin year. This cannot be undone automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handlePromote} className="space-y-8">
              {/* Promotion Grid */}
              <div className="grid grid-cols-[1fr,40px,1fr] items-end gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Origin Year</label>
                  <select
                    value={fromYear}
                    onChange={(e) => setFromYear(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-[13px] outline-none focus:bg-white focus:border-indigo-300 transition-all appearance-none"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="h-14 flex items-center justify-center text-slate-300">
                  <ArrowRight size={20} />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Year</label>
                  <select
                    value={toYear}
                    onChange={(e) => setToYear(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-[13px] outline-none focus:bg-white focus:border-indigo-300 transition-all appearance-none"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Department</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-[13px] outline-none focus:bg-white focus:border-indigo-300 transition-all appearance-none"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b === "ALL" ? "All Departments" : b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] ml-1">Safety Lock: Type "PROMOTE"</label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="PROMOTE"
                    className="w-full h-14 bg-red-50 border border-red-100 rounded-2xl px-6 font-black text-red-600 text-[13px] outline-none placeholder:text-red-300 focus:bg-white transition-all uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || confirmText !== "PROMOTE"}
                className={cn(
                  "w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-4 active:scale-95",
                  confirmText === "PROMOTE" 
                    ? "bg-slate-900 text-white shadow-2xl shadow-indigo-200" 
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <RefreshCcw size={18} />
                )}
                Initialize Global Promotion Protocol
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
