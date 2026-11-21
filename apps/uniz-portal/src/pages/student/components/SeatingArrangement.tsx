/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { GET_STUDENT_SEATING } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { InlineError } from "../../../components/feedback/InlineError";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/Skeleton";

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

function formatExamDate(value?: string) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
      <Panel title="Exam seating">
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Panel>
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
      <Panel title="Exam seating">
        <EmptyState
          title="No active exam schedule"
          body={`Seating arrangements for the current semester (${semester?.name || "N/A"}) have not been published yet.`}
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Exam seating"
      lede="Official venue and seat allocation for your registered subjects."
    >
      {semester?.name ? (
        <div className="mb-4">
          <Badge tone="neutral">{semester.name}</Badge>
        </div>
      ) : null}
      <div className="divide-y divide-border border-b border-border">
        {seating.map((item) => (
          <article key={item.id} className="py-4">
            <h3 className="text-body font-medium text-head">{item.subjectName}</h3>
            <p className="mt-1 text-small text-text-2">
              {item.examName}
              {item.subjectCode ? ` · ${item.subjectCode}` : ""}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 min-[821px]:grid-cols-4">
              <div>
                <dt className="text-dense font-medium text-text-2">Date</dt>
                <dd className="mt-1 text-body text-head">
                  <span className="font-sans tabular-nums">{formatExamDate(item.date)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-dense font-medium text-text-2">Time</dt>
                <dd className="mt-1 text-body text-head">{item.time || "Time TBA"}</dd>
              </div>
              <div>
                <dt className="text-dense font-medium text-text-2">Hall</dt>
                <dd className="mt-1 font-sans text-body tabular-nums text-head">{item.room}</dd>
              </div>
              <div>
                <dt className="text-dense font-medium text-text-2">Seat</dt>
                <dd className="mt-1 font-sans text-body tabular-nums text-head">
                  {item.seatNumber || "—"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <Alert tone="warning" title="Important instructions">
          Please report to your assigned examination hall at least 15 minutes
          before the commencement of the exam. Carry your physical ID card and
          hall ticket at all times.
        </Alert>
      </div>
    </Panel>
  );
}
