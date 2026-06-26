/** Maps AdminShell tab ids ↔ URL paths under `/admin`. */
const SECTION_TO_PATH: Record<string, string> = {
  dashboard: "",
  student: "students",
  student_bulk: "students/bulk",
  attendance: "attendance",
  grades: "grades",
  subjects: "subjects",
  semester_registration: "semester-registration",
  semester_review: "semester-approvals",
  academic_mgmt: "academic",
  banners: "campus/banners",
  updates: "campus/updates",
  website_updates: "campus/website",
  push_alerts: "campus/push-alerts",
  faculty_mgmt: "faculty",
  faculty: "faculty",
  system_logs: "system-logs",
  security: "access-control",
  grievances: "grievances",
  grievance: "grievances",
  outpass: "outpass-logs",
  outings: "outing-logs",
  outing: "outing-logs",
  approve_outing: "approve-outings",
  approve_outpass: "approve-outpasses",
  status_update: "student-status",
  exam_seating: "exam-seating",
  roles: "roles",
};

const PATH_TO_SECTIONS: Record<string, string[]> = {};
for (const [tab, path] of Object.entries(SECTION_TO_PATH)) {
  if (!PATH_TO_SECTIONS[path]) PATH_TO_SECTIONS[path] = [];
  if (!PATH_TO_SECTIONS[path].includes(tab)) PATH_TO_SECTIONS[path].push(tab);
}

const PATHS_BY_LENGTH = Object.keys(PATH_TO_SECTIONS).sort(
  (a, b) => b.length - a.length,
);

export function getAdminSectionPath(tabId: string): string {
  const segment = SECTION_TO_PATH[tabId];
  if (segment === undefined || segment === "") return "/admin";
  return `/admin/${segment}`;
}

export function resolveAdminSectionTab(
  pathname: string,
  allowedTabs?: readonly string[],
): string | null {
  const rest = pathname
    .replace(/^\/admin\/?/, "")
    .replace(/\/$/, "")
    .toLowerCase();
  if (!rest) return "dashboard";

  for (const path of PATHS_BY_LENGTH) {
    if (rest !== path) continue;
    const candidates = PATH_TO_SECTIONS[path];
    if (allowedTabs?.length) {
      const match = candidates.find((tab) => allowedTabs.includes(tab));
      if (match) return match;
    }
    return candidates[0] ?? null;
  }
  return null;
}
