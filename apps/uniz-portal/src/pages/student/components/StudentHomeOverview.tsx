import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, AlertTriangle } from "lucide-react";
import { STUDENT_HOME_SUMMARY } from "../../../api/endpoints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
import { Panel } from "@/components/ui/panel";
import {
  InlineRetry,
  ListSkeleton,
  OverviewBusy,
  OverviewLink,
  OverviewStat,
  OverviewTextButton,
  SectionHead,
  StatGrid,
  StatSkeleton,
  overviewCardClass,
} from "@/components/ui/overview";

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

function formatWhen(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function StudentHomeOverview() {
  const [data, setData] = useState<HomeSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const dataRef = useRef<HomeSummary | null>(null);
  const statusRef = useRef(status);
  dataRef.current = data;
  statusRef.current = status;

  useEffect(() => {
    const token = (localStorage.getItem("student_token") || "").replace(/"/g, "");
    if (!token) {
      setStatus("error");
      setRetrying(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let live = true;
    const keepVisible = dataRef.current != null || statusRef.current === "error";
    if (!keepVisible) setStatus("loading");
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
        setRetrying(false);
      })
      .catch(() => {
        if (!live) return;
        if (!dataRef.current) setStatus("error");
        setRetrying(false);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [attempt]);

  const retry = () => {
    setRetrying(true);
    setAttempt((n) => n + 1);
  };

  if (status === "loading") {
    return (
      <OverviewBusy>
        <StatGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </StatGrid>
        <div className="grid grid-cols-1 gap-6 min-[821px]:hidden">
          <ListSkeleton rows={1} panel />
          <ListSkeleton rows={5} />
          <ListSkeleton rows={3} />
        </div>
        <div className="hidden min-[821px]:grid min-[821px]:grid-cols-12 min-[821px]:items-start min-[821px]:gap-6">
          <div className="col-span-7">
            <ListSkeleton rows={5} />
          </div>
          <div className="col-span-5 space-y-6">
            <ListSkeleton rows={1} panel />
            <ListSkeleton rows={3} />
          </div>
        </div>
      </OverviewBusy>
    );
  }

  if (status === "error" || !data) {
    return (
      <InlineRetry
        title="Overview didn't load"
        body="Attendance, results and registration are unavailable right now. Your profile is below."
        onRetry={retry}
        busy={retrying}
      />
    );
  }

  const attendancePartial = data.partial.attendance;
  const attendanceLow = !attendancePartial && data.attendancePct !== null && data.attendancePct < 75;
  const attendanceValue = attendancePartial || data.attendancePct === null
    ? "—"
    : `${data.attendancePct.toFixed(1)}%`;
  const attendanceLine = attendancePartial
    ? "Couldn't load"
    : data.attendancePct === null
      ? "None uploaded yet"
      : attendanceLow
        ? "Below 75%"
        : "Recorded classes";

  const resultsSub = [
    data.latestSemester,
    data.latestSgpa !== null && data.latestSgpa !== undefined
      ? `SGPA ${Number(data.latestSgpa).toFixed(2)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const registration = () => (
    <Panel className="min-[640px]:p-6">
      <SectionHead title="Registration" />
      {data.partial.registration ? (
        <InlineRetry bare title="Registration didn't load" onRetry={retry} busy={retrying} />
      ) : data.registration.empty ? (
        <p className="text-body text-text-2">{data.registration.detail}</p>
      ) : (
        <div>
          <Badge
            tone={data.registration.registered ? "success" : "warning"}
            icon={data.registration.registered ? Check : AlertTriangle}
            className="h-7"
          >
            {data.registration.registered ? "Registered" : "Not registered"}
          </Badge>
          <p className="mt-2 text-body text-text-2">{data.registration.detail}</p>
          <Button variant="outline" asChild className="mt-4 w-full min-[640px]:w-auto">
            <Link to="/student/registration">View registration</Link>
          </Button>
        </div>
      )}
    </Panel>
  );

  const results = () => (
    <section className={overviewCardClass}>
      <SectionHead
        title="Latest results"
        sub={resultsSub || undefined}
        action={
          data.latestResults.length > 0 ? (
            <OverviewLink to="/student/gradehub">All results</OverviewLink>
          ) : null
        }
      />
      {data.partial.results ? (
        <div className="flex flex-wrap items-center gap-x-1 text-body text-text-2">
          <span>Results didn&apos;t load.</span>
          <OverviewTextButton onClick={retry} busy={retrying} chevron={false}>
            {retrying ? "Trying again…" : "Try again"}
          </OverviewTextButton>
        </div>
      ) : data.latestResults.length === 0 ? (
        <p className="text-body text-text-2">
          No results published yet. They appear here once the exam cell publishes them.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {data.latestResults.map((row, index) => (
            <li key={`${row.subject}-${index}`} className="flex items-start justify-between gap-3 py-3 first:pt-1">
              <span className="min-w-0 break-words text-body text-head">{row.subject}</span>
              <span className="shrink-0 font-semibold tabular-nums text-head">
                {Number(row.grade).toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const notices = () => (
    <section className={overviewCardClass}>
      <SectionHead
        title="Notices"
        action={<OverviewLink to="/student/notifications">All notices</OverviewLink>}
      />
      {data.notifications.length === 0 ? (
        <p className="text-body text-text-2">No campus notices right now.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.notifications.slice(0, 3).map((notice) => (
            <li key={notice.id} className="py-3 first:pt-1">
              <p className="text-body font-medium text-head [overflow-wrap:anywhere]">{notice.title}</p>
              {notice.content ? (
                <p className="mt-0.5 line-clamp-2 text-dense text-text-2 [overflow-wrap:anywhere]">
                  {notice.content}
                </p>
              ) : null}
              {notice.createdAt ? (
                <p className="mt-1 text-small text-text-3">{formatWhen(notice.createdAt)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="min-w-0 space-y-6 min-[821px]:space-y-8">
      <StatGrid>
        <OverviewStat
          label="Attendance"
          value={attendanceValue}
          line={attendanceLine}
          status={attendanceLow ? "warning" : undefined}
        />
        <OverviewStat
          label="CGPA"
          value={data.cgpa === null || data.cgpa === undefined ? "—" : Number(data.cgpa).toFixed(2)}
          line={data.cgpa === null || data.cgpa === undefined ? "After results" : "All semesters"}
        />
        <OverviewStat
          label="Latest SGPA"
          value={
            data.latestSgpa === null || data.latestSgpa === undefined
              ? "—"
              : Number(data.latestSgpa).toFixed(2)
          }
          line={
            data.latestSgpa === null || data.latestSgpa === undefined
              ? "After results"
              : data.latestSemester || "Latest semester"
          }
        />
        <OverviewStat
          label="Backlogs"
          value={String(data.backlogs ?? 0)}
          line={data.backlogs > 0 ? "Clear before next sem" : "None"}
          status={data.backlogs > 0 ? "warning" : "success"}
        />
      </StatGrid>
      <div className="grid grid-cols-1 gap-6 min-[821px]:hidden">
        {registration()}
        {results()}
        {notices()}
      </div>
      <div className="hidden min-[821px]:grid min-[821px]:grid-cols-12 min-[821px]:items-start min-[821px]:gap-6">
        <div className="col-span-7 min-w-0">{results()}</div>
        <div className="col-span-5 min-w-0 space-y-6">
          {registration()}
          {notices()}
        </div>
      </div>
    </div>
  );
}
