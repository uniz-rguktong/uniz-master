export type NavLink = {
  label: string;
  to: string;
};

export type NavGroup = {
  label: string;
  to?: string;
  children?: NavLink[];
};

/** Visible top menu on https://rguktong.ac.in/ (commented items omitted). */
export const PRIMARY_NAV: NavGroup[] = [
  { label: "Home", to: "/" },
  {
    label: "About Institute",
    children: [
      { label: "About RGUKT", to: "/institute/aboutrgukt" },
      { label: "Vision and Mission", to: "/about/vision-mission" },
      { label: "Campus Life", to: "/institute/campuslife" },
      { label: "Education System", to: "/institute/edusys" },
      { label: "Governing Council", to: "/institute/govcouncil" },
      { label: "Organizational Structure", to: "/about/organization" },
      { label: "Right to information act", to: "/about/rti-act" },
      { label: "Photo gallery", to: "/about/gallery" },
    ],
  },
  {
    label: "Administration",
    children: [
      { label: "Chancellor", to: "/administration/chancellor" },
      { label: "Vice Chancellor", to: "/administration/vice-chancellor" },
      { label: "Director", to: "/administration/director" },
      { label: "Administrative officer", to: "/administration/administrative-officer" },
      { label: "Dean student welfare", to: "/administration/dean-student-welfare" },
      { label: "Finance officer", to: "/administration/finance-officer" },
      { label: "Controller of Examinations", to: "/administration/controller-of-examinations" },
      { label: "Coordinators", to: "/administration/coordinators" },
    ],
  },
  {
    label: "Academics",
    children: [
      { label: "Dean academics", to: "/academics/dean" },
      { label: "Academic programs", to: "/academics/AcademicPrograms" },
      { label: "Academic calendar", to: "/academics/AcademicCalender" },
      { label: "Academic regulations", to: "/academics/AcademicRegulations" },
      { label: "Curricula", to: "/academics/curicula" },
      { label: "Departments", to: "/academics/departments" },
      { label: "Time table", to: "/academics/timetable" },
      { label: "Examination Cell", to: "/academics/examination-cell" },
    ],
  },
  { label: "UniZ", to: "/uniz/student-cell" },
  { label: "Careers", to: "/notifications/careers" },
  {
    label: "Notifications",
    children: [
      { label: "Tenders", to: "/notifications/tenders" },
      { label: "News & Updates", to: "/notifications/news" },
    ],
  },
  {
    label: "Grievance",
    children: [
      { label: "Women Cell", to: "/grievance/women-cell" },
      { label: "SC-ST cell", to: "/institute/scst" },
      { label: "Anti Ragging Cell", to: "/grievance/anti-ragging" },
      { label: "HOD", to: "/grievance/hod" },
      { label: "Dean Academics", to: "/grievance/dean-academics" },
      { label: "Student Welfare Office", to: "/grievance/student-welfare" },
      { label: "Examination", to: "/grievance/examination" },
      { label: "IT Infrastructure", to: "/grievance/it-infrastructure" },
      { label: "Director", to: "/grievance/director" },
      { label: "Vice Chancellor", to: "/grievance/vice-chancellor" },
      { label: "Chancellor", to: "/grievance/chancellor" },
    ],
  },
  { label: "RTI", to: "/institute/rtiinfo" },
  { label: "Consultancy", to: "/consultancy" },
  {
    label: "Information",
    children: [
      { label: "Contact Us", to: "/information/contact" },
      { label: "Placements", to: "/information/placements" },
      { label: "Alumni", to: "/information/alumni" },
      { label: "Info-Center", to: "/information/info-center" },
    ],
  },
];

export const QUICK_LINKS: NavLink[] = [
  { label: "About us", to: "/institute/aboutrgukt" },
  { label: "Vision and mission", to: "/about/vision-mission" },
  { label: "Organizational structure", to: "/about/organization" },
  { label: "Administration", to: "/administration" },
  { label: "Executive committee", to: "/about/executive-committee" },
  { label: "Governing council", to: "/institute/govcouncil" },
  { label: "Departments", to: "/academics/departments" },
  { label: "Central library", to: "/departments/LIB" },
  { label: "Student corner", to: "/uniz/student-cell" },
  { label: "Placement cell", to: "/information/placements" },
  { label: "Alumni cell", to: "/information/alumni" },
  { label: "Admissions", to: "/admissions" },
];

export const DEPARTMENTS: NavLink[] = [
  { label: "Computer Science Engineering", to: "/departments/CSE" },
  { label: "Civil Engineering", to: "/departments/CIVIL" },
  { label: "Electronics and Communication Engineering", to: "/departments/ECE" },
  { label: "Electrical and Electronics Engineering", to: "/departments/EEE" },
  { label: "Mechanical Engineering", to: "/departments/ME" },
  { label: "Mathematics", to: "/departments/MATHEMATICS" },
  { label: "Physics", to: "/departments/PHYSICS" },
  { label: "Chemistry", to: "/departments/CHEMISTRY" },
  { label: "Information Technology", to: "/departments/IT" },
  { label: "Biology", to: "/departments/BIOLOGY" },
  { label: "English", to: "/departments/ENGLISH" },
  { label: "Central Library", to: "/departments/LIB" },
  { label: "Management", to: "/departments/MANAGEMENT" },
  { label: "Physical Education", to: "/departments/PED" },
  { label: "Telugu", to: "/departments/TELUGU" },
  { label: "Yoga", to: "/departments/YOGA" },
];

export type SearchEntry = { title: string; path: string; category: string };

export function searchDirectory(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const group of PRIMARY_NAV) {
    if (group.to) entries.push({ title: group.label, path: group.to, category: "Menu" });
    for (const child of group.children ?? []) {
      entries.push({ title: child.label, path: child.to, category: group.label });
    }
  }
  for (const link of QUICK_LINKS) {
    entries.push({ title: link.label, path: link.to, category: "Quick links" });
  }
  for (const link of DEPARTMENTS) {
    entries.push({ title: link.label, path: link.to, category: "Departments" });
  }
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.path}|${entry.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function siblingsOf(path: string): { group: string; links: NavLink[] } | null {
  for (const group of PRIMARY_NAV) {
    const links = group.children ?? [];
    if (links.some((link) => link.to === path)) {
      return { group: group.label, links };
    }
  }
  return null;
}
