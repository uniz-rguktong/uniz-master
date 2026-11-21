import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { STUDENT_HOME_SUMMARY } from "../../../api/endpoints";
import { StatTile } from "@/components/ui/tile";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";

type HomeSummary = {
  cgpa: number | null;
  backlogs: number;
  attendancePct: number | null;
  latestSemester: string | null;
  latestSgpa: number | null;
  latestResults: { subject: string; grade: number }[];
  registration: {
    label: string;
    detail: string;
    registered: boolean;
    empty: boolean;
  };
  notifications: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }[];
  partial: {
    attendance: boolean;
    results: boolean;
    registration: boolean;
  };
};

const actions = [
  { href: "/student/gradehub", label: "Results", icon: BookOpen },
  { href: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/student/registration", label: "Registration", icon: ClipboardList },
  { href: "/student/notifications", label: "Notices", icon: Bell },
];

function formatWhen(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function StudentHomeOverview({
  onEdit,
}: {
  onEdit?: () => void;
}) {
  const [data, setData] = useState<HomeSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const token = (localStorage.getItem("student_token") || "").replace(/"/g, "");
    if (!token) {
      setStatus("error");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let live = true;
    setStatus("loading");
    fetch(STUDENT_HOME_SUMMARY, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || "failed");
        }
        if (!live) return;
        setData(json.data);
        setStatus("ready");
      })
      .catch(() => {
        if (!live) return;
        setStatus("error");
      })
      .finally(() => clearTimeout(timer));
    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [attempt]);

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <EmptyState
        tone="error"
        title="Overview unavailable"
        body="Attendance, results and registration couldn't be loaded."
        action={
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="text-dense font-medium text-link"
          >
            Try again
          </button>
        }
      />
    );
  }

  const attendanceLow = data.attendancePct !== null && data.attendancePct < 75;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2">
        <StatTile
          label="Attendance"
          value={
            data.partial.attendance || data.attendancePct === null
              ? "—"
              : `${data.attendancePct.toFixed(1)}%`
          }
          line={
            data.partial.attendance
              ? "Couldn't load attendance"
              : data.attendancePct === null
                ? "No attendance uploaded yet"
                : attendanceLow
                  ? "Below 75%"
                  : "Recorded classes"
          }
          status={attendanceLow ? "warning" : undefined}
        />
        <StatTile
          label="CGPA"
          value={data.cgpa === null ? "—" : data.cgpa.toFixed(2)}
          line={
            data.latestSgpa !== null
              ? `Latest ${data.latestSgpa.toFixed(2)}${data.latestSemester ? ` · ${data.latestSemester}` : ""}`
              : data.cgpa === null
                ? "Appears after results are published"
                : data.backlogs
                  ? `${data.backlogs} backlog${data.backlogs === 1 ? "" : "s"}`
                  : "No backlogs"
          }
          status={data.backlogs > 0 ? "warning" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[821px]:grid-cols-2">
        <Panel title="Latest results">
          {data.partial.results ? (
            <p className="text-body text-text-2">Couldn&apos;t load results.</p>
          ) : data.latestResults.length === 0 ? (
            <p className="text-body text-text-2">No results published yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.latestResults.map((row) => (
                <li
                  key={`${row.subject}-${row.grade}`}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0 text-body text-head">{row.subject}</span>
                  <span className="font-sans text-body font-semibold tabular-nums text-head">
                    {row.grade.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Semester registration">
          {data.partial.registration || data.registration.empty ? (
            <p className="text-body text-text-2">
              {data.partial.registration
                ? "Couldn't load registration."
                : data.registration.detail}
            </p>
          ) : (
            <div>
              <p className="font-sans text-[28px] font-semibold leading-9 text-head">
                {data.registration.label}
              </p>
              <p className="mt-2 text-body text-text-2">{data.registration.detail}</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Notices">
        {data.notifications.length === 0 ? (
          <p className="text-body text-text-2">No campus notices right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.notifications.slice(0, 3).map((notice) => (
              <li key={notice.id} className="py-3">
                <p className="text-body font-medium text-head">{notice.title}</p>
                {notice.content ? (
                  <p className="mt-1 line-clamp-2 text-dense text-text-2">{notice.content}</p>
                ) : null}
                {notice.createdAt ? (
                  <p className="mt-1 font-sans text-small tabular-nums text-text-3">
                    {formatWhen(notice.createdAt)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div>
        <h2 className="font-serif text-[24px] font-normal leading-8 text-head">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                to={action.href}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-body font-medium text-head hover:bg-tint"
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-text-2" />
                {action.label}
              </Link>
            );
          })}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left text-body font-medium text-head hover:bg-tint"
            >
              <Pencil size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-text-2" />
              Edit profile
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
