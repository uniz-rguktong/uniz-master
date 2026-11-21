import raw from "./webadmin-guides.json";

export type Guide = {
  id: string;
  title: string;
  group: string;
  screens: string[];
  summary: string;
  steps: string[];
  wrong: string[];
  call: string;
};

export type GuideGroup = {
  id: string;
  title: string;
};

export type GuideSupport = {
  directorPhone: string;
  officerPhone: string;
  pinEmail: string;
  portalSignIn: string;
  publicSite: string;
  adminer: string;
  pdfPath: string;
  printPath: string;
};

export type GuideBook = {
  support: GuideSupport;
  groups: GuideGroup[];
  guides: Guide[];
};

export const guideBook = raw as GuideBook;

export const WEBADMIN_SCREEN_LABELS: Record<string, string> = {
  dashboard: "Overview",
  student: "Student Details",
  student_bulk: "Student Bulk Ops",
  attendance: "Attendance Upload",
  grades: "Grades Upload",
  subjects: "Manage Subjects",
  semester_registration: "Semester Registration",
  banners: "Home Banners",
  updates: "Campus Updates",
  website_updates: "Website Updates",
  website_editor: "Website editor",
  push_alerts: "Push Alerts",
  faculty_mgmt: "Faculty Management",
  role_mgmt: "Roles",
  system_logs: "System & Logs",
  database: "Database",
  security: "Security",
  help: "Help",
};

export const WEBADMIN_GUIDE_SCREENS = Object.keys(WEBADMIN_SCREEN_LABELS);

export function guidesForScreen(screen: string): Guide[] {
  return guideBook.guides.filter((guide) => guide.screens.includes(screen));
}

export function guideById(id: string): Guide | undefined {
  return guideBook.guides.find((guide) => guide.id === id);
}

export function groupTitle(groupId: string): string {
  return guideBook.groups.find((group) => group.id === groupId)?.title ?? groupId;
}

export function guidesInGroup(groupId: string): Guide[] {
  return guideBook.guides.filter((guide) => guide.group === groupId);
}

export function searchGuides(query: string): Guide[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return guideBook.guides;
  return guideBook.guides.filter((guide) => {
    const haystack = [
      guide.title,
      guide.summary,
      groupTitle(guide.group),
      ...guide.steps,
      ...guide.wrong,
      guide.call,
    ]
      .join("\n")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function validateGuideBook(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const groupIds = new Set(guideBook.groups.map((group) => group.id));
  for (const guide of guideBook.guides) {
    if (ids.has(guide.id)) problems.push(`Duplicate guide id ${guide.id}`);
    ids.add(guide.id);
    if (!groupIds.has(guide.group)) problems.push(`${guide.id} has unknown group ${guide.group}`);
    if (guide.steps.length === 0) problems.push(`${guide.id} has no steps`);
    if (guide.wrong.length === 0) problems.push(`${guide.id} has no wrong tips`);
    if (!guide.call.trim()) problems.push(`${guide.id} has no call line`);
  }
  for (const screen of WEBADMIN_GUIDE_SCREENS) {
    if (!guideBook.guides.some((guide) => guide.screens.includes(screen))) {
      problems.push(`No guide for screen ${screen}`);
    }
  }
  return problems;
}
