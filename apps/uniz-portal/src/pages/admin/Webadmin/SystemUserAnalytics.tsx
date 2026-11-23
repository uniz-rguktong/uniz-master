import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_OVERVIEW_SUMMARY } from "../../../api/endpoints";
import { formatDisplayText } from "@/utils/displayText";
import { Panel } from "@/components/ui/panel";
import {
  InlineRetry,
  ListSkeleton,
  OverviewBusy,
  OverviewStat,
  OverviewTextButton,
  SectionHead,
  StatGrid,
  StatSkeleton,
  overviewCardClass,
} from "@/components/ui/overview";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  systemUserAnalyticsAtom,
  webadminInstitutionAnalyticsAtom,
} from "../../../store/atoms";
import { getAdminSectionPath } from "@/utils/adminSectionRoutes";

const STAFF_ROLES = [
  "webadmin",
  "dean",
  "hod",
  "admin",
  "staff",
  "swo",
  "director",
  "coe",
];

type AccountRow = { role: string; active: number; disabled: number };
type OverviewData = {
  campus: {
    totalStudents: number;
    activeStudents: number;
    onCampus: number;
    offCampus: number;
    withBacklogs: number;
    avgCgpa: number | null;
  };
  branches: { branch: string; count: number }[];
  grievances: { category: string; status: string; count: number }[];
  academics: {
    totalStudents: number;
    avgGPA: number | null;
    backlogCount: number;
    activeSemesters: number;
    currentSemester: string | null;
  } | null;
  accounts: AccountRow[] | null;
  partial: { academics: boolean; accounts: boolean };
};

function formatCount(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatGpa(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-dense text-text-2">{label}</p>
      <p className="font-sans text-[24px] font-semibold leading-8 text-head tabular-nums">{value}</p>
    </div>
  );
}

export default function SystemUserAnalytics() {
  const navigate = useNavigate();
  const [cached, setCached] = useRecoilState(systemUserAnalyticsAtom);
  const institution = useRecoilValue(webadminInstitutionAnalyticsAtom);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const forceFresh = useRef(false);
  const seenInstitution = useRef(institution.fetched);

  const showReview = useMemo(() => {
    const role = (localStorage.getItem("role") || "").toLowerCase().replace(/"/g, "");
    return role === "swo" || role === "dsw";
  }, []);

  useEffect(() => {
    if (seenInstitution.current && !institution.fetched) {
      forceFresh.current = true;
      setCached({ fetched: false, data: null, error: null });
      setReloadKey((n) => n + 1);
    }
    seenInstitution.current = institution.fetched;
  }, [institution.fetched, setCached]);

  useEffect(() => {
    if (cached.fetched) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let live = true;
    const fresh = forceFresh.current;
    forceFresh.current = false;

    // Analytics fetching is restricted to production host [uniz.rguktong.in]
    // Commented out for localhost (Fast Path)
    // The overview now uses the user-service summary (SQL aggregates, 60s Redis)
    // on every host, instead of the landing-api fan-out that this gate skipped.
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    const url = fresh ? `${ADMIN_OVERVIEW_SUMMARY}?fresh=1` : ADMIN_OVERVIEW_SUMMARY;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || "Overview summary failed");
        }
        if (!live) return;
        setCached({ fetched: true, data: json.data, error: null });
      })
      .catch((err) => {
        if (!live) return;
        console.error("Overview summary failed:", err);
        setCached({
          fetched: true,
          data: null,
          error: "Couldn't load the overview",
        });
      })
      .finally(() => {
        clearTimeout(timer);
        if (live) setRetrying(false);
      });

    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [reloadKey, cached.fetched, setCached]);

  const data = (cached.data || null) as OverviewData | null;
  const loading = !cached.fetched && !cached.error && !retrying;
  const failed = Boolean(cached.error) || (cached.fetched && !data);
  const retry = () => {
    setRetrying(true);
    forceFresh.current = true;
    setCached((prev) => ({
      fetched: false,
      data: prev.data,
      error: prev.error,
    }));
    setReloadKey((n) => n + 1);
  };

  if (loading || (!failed && !data)) {
    return (
      <OverviewBusy>
        <StatGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </StatGrid>
        <div className="grid grid-cols-1 gap-6 min-[821px]:hidden">
          <ListSkeleton rows={4} />
          <ListSkeleton rows={2} panel />
          <ListSkeleton rows={5} />
          <ListSkeleton rows={4} />
        </div>
        <div className="hidden min-[821px]:grid min-[821px]:grid-cols-12 min-[821px]:items-start min-[821px]:gap-6">
          <div className="col-span-5 space-y-6">
            <ListSkeleton rows={4} />
            <ListSkeleton rows={2} panel />
          </div>
          <div className="col-span-7 space-y-6">
            <ListSkeleton rows={5} />
            <ListSkeleton rows={4} />
          </div>
        </div>
      </OverviewBusy>
    );
  }

  if (failed || !data) {
    return (
      <InlineRetry
        title="Campus figures didn't load"
        body="Students, grievances and accounts are unavailable right now."
        onRetry={retry}
        busy={retrying}
      />
    );
  }

  const openByCategory = new Map<string, number>();
  let openGrievances = 0;
  let resolvedGrievances = 0;
  for (const row of data.grievances || []) {
    const count = Number(row.count) || 0;
    if (String(row.status || "").toLowerCase() === "resolved") {
      resolvedGrievances += count;
    } else {
      openGrievances += count;
      const key = row.category || "Other";
      openByCategory.set(key, (openByCategory.get(key) || 0) + count);
    }
  }
  const grievanceRows = [...openByCategory.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const branches = [...(data.branches || [])].sort(
    (a, b) => (Number(b.count) || 0) - (Number(a.count) || 0),
  );
  const branchMax = branches.reduce((max, row) => Math.max(max, Number(row.count) || 0), 0);

  const accounts = data.accounts || [];
  const totalActive = accounts.reduce((sum, row) => sum + (Number(row.active) || 0), 0);
  const totalDisabled = accounts.reduce((sum, row) => sum + (Number(row.disabled) || 0), 0);
  const totalUsers = totalActive + totalDisabled;
  const staffTotal = accounts
    .filter((row) => STAFF_ROLES.includes((row.role || "").toLowerCase()))
    .reduce((sum, row) => sum + (Number(row.active) || 0) + (Number(row.disabled) || 0), 0);

  const academicsFailed = Boolean(data.partial?.academics);
  const accountsFailed = Boolean(data.partial?.accounts) || data.accounts == null;

  const grievances = () => (
    <section className={overviewCardClass}>
      <SectionHead
        title="Open grievances"
        sub={`${formatCount(openGrievances)} open · ${formatCount(resolvedGrievances)} resolved`}
        action={
          showReview ? (
            <OverviewTextButton onClick={() => navigate(getAdminSectionPath("grievances"))}>
              Review
            </OverviewTextButton>
          ) : null
        }
      />
      {grievanceRows.length === 0 ? (
        <p className="text-body text-text-2">No open grievances.</p>
      ) : (
        <ul className="divide-y divide-border">
          {grievanceRows.map(([category, count]) => (
            <li key={category} className="flex items-start justify-between gap-3 py-3 first:pt-1">
              <span className="min-w-0 break-words text-body text-text">
                {formatDisplayText(category)}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-head">{formatCount(count)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const semester = () => (
    <Panel className="min-[640px]:p-6">
      <SectionHead title="Current semester" sub={data.academics?.currentSemester || undefined} />
      {academicsFailed ? (
        <InlineRetry bare title="Semester figures didn't load" onRetry={retry} busy={retrying} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <MiniValue label="Students" value={data.academics ? formatCount(data.academics.totalStudents) : "—"} />
          <MiniValue label="Average GPA" value={formatGpa(data.academics?.avgGPA)} />
          <MiniValue label="Backlogs" value={data.academics ? formatCount(data.academics.backlogCount) : "—"} />
          <MiniValue label="Active semesters" value={data.academics ? formatCount(data.academics.activeSemesters) : "—"} />
        </div>
      )}
    </Panel>
  );

  const branchCard = () => (
    <section className={overviewCardClass}>
      <SectionHead title="Students by branch" />
      {branches.length === 0 ? (
        <p className="text-body text-text-2">No branch data yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {branches.map((row) => {
            const count = Number(row.count) || 0;
            const width = branchMax > 0 ? (count / branchMax) * 100 : 0;
            return (
              <li key={row.branch} className="py-3 first:pt-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-body text-text">{row.branch}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-head">{formatCount(count)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-tint" aria-hidden>
                  <div className="h-full rounded-full bg-navy-600" style={{ width: `${width}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const accountCard = () => (
    <section className={overviewCardClass}>
      <SectionHead title="Platform accounts" />
      {accountsFailed ? (
        <InlineRetry bare title="Account figures didn't load" onRetry={retry} busy={retrying} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 min-[640px]:grid-cols-4">
            <MiniValue label="Total" value={formatCount(totalUsers)} />
            <MiniValue label="Active" value={formatCount(totalActive)} />
            <MiniValue label="Disabled" value={formatCount(totalDisabled)} />
            <MiniValue label="Staff" value={formatCount(staffTotal)} />
          </div>
          <table className="mt-4 w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="py-2 text-left text-small font-medium text-text-2">Role</th>
                <th className="py-2 text-right text-small font-medium text-text-2">Active</th>
                <th className="py-2 text-right text-small font-medium text-text-2">Disabled</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((row, index) => (
                <tr key={`${row.role}-${index}`}>
                  <td className="border-t border-border py-3 text-body text-text [overflow-wrap:anywhere]">
                    {formatDisplayText(row.role)}
                  </td>
                  <td className="border-t border-border py-3 text-right font-semibold tabular-nums text-head">
                    {formatCount(row.active)}
                  </td>
                  <td className="border-t border-border py-3 text-right font-semibold tabular-nums text-head">
                    {formatCount(row.disabled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );

  return (
    <div className="min-w-0 space-y-6 min-[821px]:space-y-8">
      <StatGrid>
        <OverviewStat
          label="Students"
          value={formatCount(data.campus?.activeStudents)}
          line={`of ${formatCount(data.campus?.totalStudents)} on roll`}
        />
        <OverviewStat
          label="Open grievances"
          value={formatCount(openGrievances)}
          line={openGrievances > 0 ? "Needs review" : "None open"}
          status={openGrievances > 0 ? "warning" : "success"}
        />
        <OverviewStat
          label="Average CGPA"
          value={formatGpa(data.campus?.avgCgpa)}
          line="Institution"
        />
        <OverviewStat
          label="With backlogs"
          value={formatCount(data.campus?.withBacklogs)}
          line="Students"
        />
      </StatGrid>
      <div className="grid grid-cols-1 gap-6 min-[821px]:hidden">
        {grievances()}
        {semester()}
        {branchCard()}
        {accountCard()}
      </div>
      <div className="hidden min-[821px]:grid min-[821px]:grid-cols-12 min-[821px]:items-start min-[821px]:gap-6">
        <div className="col-span-5 min-w-0 space-y-6">
          {grievances()}
          {semester()}
        </div>
        <div className="col-span-7 min-w-0 space-y-6">
          {branchCard()}
          {accountCard()}
        </div>
      </div>
    </div>
  );
}
