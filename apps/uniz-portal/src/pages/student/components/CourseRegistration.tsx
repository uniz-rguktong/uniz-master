/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import {
  GET_AVAILABLE_SUBJECTS,
  REGISTER_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function CourseRegistration({
  branch,
  year,
  onComplete,
}: {
  branch: string;
  year: string;
  onComplete: () => void;
}) {
  const [available, setAvailable] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailable = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any>(GET_AVAILABLE_SUBJECTS(branch, year));
      setAvailable(data.subjects || []);
      // Pre-select all by default if mandatory? Actually let user choose
    } catch (error) {
      toast.error("Failed to fetch available subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleRegister = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one subject");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient(REGISTER_SUBJECTS, {
        method: "POST",
        body: JSON.stringify({ subjectIds: selectedIds }),
      });
      toast.success("Successfully registered for subjects!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredits = available
    .filter((s) => selectedIds.includes(s.id))
    .reduce((acc, s) => acc + (s.subject?.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Fetching available courses...
        </p>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-slate-100 max-w-2xl mx-auto shadow-xl">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">
          Registration Not Available
        </h3>
        <p className="text-slate-500 font-medium font-outfit mb-8 leading-relaxed px-10">
          The registration window for your branch is either closed or your
          department has not yet published the course list.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
              <ShieldCheck size={14} /> Open Enrollment Phase
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-tight italic">
              Semester Subject <br />
              Registration
            </h2>
            <p className="text-blue-100 font-medium max-w-sm font-outfit leading-relaxed opacity-90">
              Select the core and elective subjects for your current branch to
              finalize your academic session enrollment.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">
                Total Selected Credits
              </p>
              <h3 className="text-5xl font-black text-white italic">
                {totalCredits}
              </h3>
            </div>
            <div className="h-16 w-[1px] bg-white/20" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">
                Subjects Selected
              </p>
              <h3 className="text-5xl font-black text-white italic">
                {selectedIds.length}
              </h3>
            </div>
          </div>
        </div>

        {/* Glossy background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {available.map((sub) => {
          const isSelected = selectedIds.includes(sub.subject?.id);
          return (
            <button
              key={sub.subject?.id}
              onClick={() => toggleSubject(sub.subject?.id)}
              className={`p-6 rounded-[32px] border-2 transition-all flex items-start gap-4 text-left group overflow-hidden relative ${
                isSelected
                  ? "bg-white border-blue-600 shadow-xl shadow-blue-50"
                  : "bg-white border-slate-50 hover:border-slate-200"
              }`}
            >
              <div
                className={`p-4 rounded-xl transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                }`}
              >
                <BookOpen size={24} />
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      isSelected ? "text-blue-600" : "text-slate-300"
                    }`}
                  >
                    {sub.subject?.code}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}
                  >
                    <CreditCard size={10} />
                    <span className="text-[10px] font-black">
                      {sub.subject?.credits}C
                    </span>
                  </div>
                </div>
                <h4
                  className={`text-lg font-black tracking-tight leading-tight truncate transition-colors ${
                    isSelected ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {sub.subject?.name}
                </h4>
              </div>

              {isSelected && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/5 rounded-full flex items-end justify-start p-6">
                  <CheckCircle2 className="text-blue-600" size={24} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center pt-8 border-t border-slate-100 gap-6">
        <div className="flex items-center gap-3 text-slate-400">
          <AlertCircle size={16} />
          <p className="text-xs font-bold font-outfit">
            Double check your selections. You cannot change your registration
            after submission.
          </p>
        </div>
        <button
          disabled={submitting || selectedIds.length === 0}
          onClick={handleRegister}
          className="w-full max-w-md bg-slate-900 text-white h-20 rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-20 active:translate-y-0 active:scale-95 shadow-xl"
        >
          {submitting ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : (
            <>
              Confirm & Submit Registration <Plus size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
