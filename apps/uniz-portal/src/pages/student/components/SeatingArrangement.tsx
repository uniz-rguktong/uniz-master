/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Calendar, MapPin, Clock, AlertCircle, LayoutGrid } from "lucide-react";
import { GET_STUDENT_SEATING } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { motion } from "framer-motion";
import { InlineError } from "../../../components/feedback/InlineError";

// ─── Module-level singleton cache ───────────────────────────────────────────
// Shared across SeatingArrangement AND SeatingSummaryWidget in student.tsx
// so only ONE network request fires no matter how many components mount.
type SeatingResult = { seating: any[]; semester: any; error?: string };
let seatingCache: SeatingResult | null = null;
let seatingPromise: Promise<SeatingResult> | null = null;

const SEATING_LOAD_ERROR =
  "Couldn't load seating arrangements. Please try again.";

export function resetSeatingCache() {
  seatingCache = null;
  seatingPromise = null;
}

export async function fetchSeatingOnce(): Promise<SeatingResult> {
  if (seatingCache) return seatingCache;
  if (seatingPromise) return seatingPromise;
  seatingPromise = apiClient<any>(GET_STUDENT_SEATING, {}, false)
    .then((data) => {
      if (data === null) {
        return {
          seating: [],
          semester: null,
          error: SEATING_LOAD_ERROR,
        };
      }
      const result: SeatingResult = {
        seating: data.seating ?? [],
        semester: data.semester ?? null,
      };
      seatingCache = result;
      return result;
    })
    .catch(() => ({
      seating: [],
      semester: null,
      error: SEATING_LOAD_ERROR,
    }))
    .finally(() => {
      seatingPromise = null;
    });
  return seatingPromise;
}
// ────────────────────────────────────────────────────────────────────────────

export default function SeatingArrangement() {
  const [seating, setSeating] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadSeating = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetchSeatingOnce().then((result) => {
      if (result.error) {
        setFetchError(result.error);
        setSeating([]);
        setSemester(null);
      } else {
        setSeating(result.seating);
        setSemester(result.semester);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadSeating();
  }, [loadSeating]);

  const handleRetry = () => {
    resetSeatingCache();
    loadSeating();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
        <div className="w-10 h-10 border-4 border-t-zinc-900 border-zinc-100 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <InlineError
        title="Seating unavailable"
        message={fetchError}
        onRetry={handleRetry}
      />
    );
  }

  if (seating.length === 0) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 mx-auto mb-6">
          <LayoutGrid size={32} />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 mb-2 tracking-tight">
          No Active Exam Schedule
        </h3>
        <p className="text-zinc-400 max-w-[280px] mx-auto font-medium text-[15px] leading-relaxed">
          Seating arrangements for the current semester (
          {semester?.name || "N/A"}) haven't been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-1.5 px-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-50 text-zinc-800 rounded-full border border-zinc-100 mb-2 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
            {semester?.name}
          </span>
        </div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 leading-none">
          Exam Seating Arrangement
        </h2>
        <p className="text-zinc-500 font-medium text-[15px]">
          Official venue and seat allocation for your registered subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {seating.map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={item.id}
            className="group relative bg-white border border-zinc-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <MapPin size={120} />
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-lg shadow-zinc-200 group-hover:bg-zinc-900 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 mb-0.5">
                      {item.examName} - {item.subjectCode}
                    </p>
                    <h3 className="text-lg font-bold text-zinc-900 leading-tight">
                      {item.subjectName}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[13px] font-semibold text-zinc-500">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date TBA"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>{item.time || "Time TBA"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 lg:flex-none bg-zinc-50 border border-zinc-100 p-5 rounded-3xl min-w-[140px] text-center group-hover:bg-zinc-900 group-hover:border-zinc-800 transition-all duration-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-900 group-hover:text-zinc-100 mb-2">
                    Hall / Room
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 group-hover:text-white leading-none tracking-tight">
                    {item.room}
                  </p>
                </div>
                <div className="flex-1 lg:flex-none bg-emerald-50 border border-emerald-100 p-5 rounded-3xl min-w-[140px] text-center group-hover:bg-emerald-600 group-hover:border-emerald-700 transition-all duration-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 group-hover:text-emerald-100 mb-2">
                    Seat No.
                  </p>
                  <p className="text-2xl font-semibold text-emerald-900 group-hover:text-white leading-none tracking-tight">
                    {item.seatNumber || "--"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100 text-amber-900 shadow-sm shadow-amber-100/50">
        <div className="p-2.5 bg-white rounded-xl shadow-sm">
          <AlertCircle size={20} className="text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[14px]">Important Instructions</p>
          <p className="text-[13px] font-medium leading-relaxed opacity-80">
            Please report to your assigned examination hall at least 15 minutes
            before the commencement of the exam. Carry your physical ID card and
            hall ticket at all times.
          </p>
        </div>
      </div>
    </div>
  );
}
