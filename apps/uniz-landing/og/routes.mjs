/**
 * Public route map for rguktong.in.
 * The college site has no UniZ branding in titles, descriptions, or images.
 * /uniz/student-cell, /information/placements, and /information/alumni
 * have their own shells. Former /nexus/* URLs are 301 redirects, so this
 * map does not prerender Nexus paths or put UniZ branding in the cards.
 */
import { normalizePath } from "../scripts/og/html.mjs";

export const SITE = "https://rguktong.in";
export const SITE_NAME = "RGUKT Ongole";
const THEME = "#1b262c";

const IMG = {
  home: `${SITE}/og/home.png`,
  about: `${SITE}/og/about.png`,
  academics: `${SITE}/og/academics.png`,
  admissions: `${SITE}/og/admissions.png`,
  departments: `${SITE}/og/departments.png`,
  placements: `${SITE}/og/placements.png`,
  alumni: `${SITE}/og/alumni.png`,
  contact: `${SITE}/og/contact.png`,
  "student-cell": `${SITE}/og/student-cell.png`,
  notices: `${SITE}/og/notices.png`,
};

const pages = [];

function add(path, title, description, image) {
  pages.push({ path, title, description, image });
}

const HOME_DESC =
  "Rajiv Gandhi University of Knowledge Technologies, Ongole Campus. Catering to the Educational Needs of Gifted Rural Youth.";

add("/", "RGUKT Ongole", HOME_DESC, "home");

add(
  "/about",
  "About — RGUKT Ongole",
  "About Rajiv Gandhi University of Knowledge Technologies, Ongole Campus — the institute, its campus, and how it is governed.",
  "about",
);
add(
  "/institute/aboutrgukt",
  "About RGUKT — RGUKT Ongole",
  "About the Ongole campus of Rajiv Gandhi University of Knowledge Technologies.",
  "about",
);
add(
  "/about/vision-mission",
  "Vision and Mission — RGUKT Ongole",
  "Vision and mission of RGUKT Ongole.",
  "about",
);
add("/institute/campuslife", "Campus Life — RGUKT Ongole", "Campus life at RGUKT Ongole.", "about");
add(
  "/institute/edusys",
  "Education System — RGUKT Ongole",
  "The education system at RGUKT Ongole.",
  "about",
);
add(
  "/institute/govcouncil",
  "Governing Council — RGUKT Ongole",
  "Governing council of RGUKT Ongole.",
  "about",
);
add(
  "/about/organization",
  "Organizational Structure — RGUKT Ongole",
  "Organizational structure of RGUKT Ongole.",
  "about",
);
add(
  "/about/executive-committee",
  "Executive Committee — RGUKT Ongole",
  "Executive committee of RGUKT Ongole.",
  "about",
);
add("/about/gallery", "Photo Gallery — RGUKT Ongole", "Photographs from RGUKT Ongole.", "about");
add(
  "/about/rti-act",
  "Right to Information — RGUKT Ongole",
  "Right to Information Act details for RGUKT Ongole.",
  "home",
);
add("/institute/rtiinfo", "RTI — RGUKT Ongole", "Right to Information at RGUKT Ongole.", "home");
add(
  "/institute/scst",
  "SC-ST Cell — RGUKT Ongole",
  "SC-ST cell at RGUKT Ongole.",
  "home",
);

add(
  "/administration",
  "Administration — RGUKT Ongole",
  "Administration of RGUKT Ongole.",
  "home",
);
for (const [path, label] of [
  ["/administration/chancellor", "Chancellor"],
  ["/administration/vice-chancellor", "Vice Chancellor"],
  ["/administration/director", "Director"],
  ["/administration/administrative-officer", "Administrative Officer"],
  ["/administration/dean-student-welfare", "Dean of Student Welfare"],
  ["/administration/finance-officer", "Finance Officer"],
  ["/administration/controller-of-examinations", "Controller of Examinations"],
  ["/administration/coordinators", "Coordinators"],
]) {
  add(path, `${label} — RGUKT Ongole`, `${label} at RGUKT Ongole.`, "home");
}

add(
  "/academics",
  "Academics — RGUKT Ongole",
  "Academic programmes, calendar, regulations, and examinations at RGUKT Ongole.",
  "academics",
);
add("/academics/dean", "Dean Academics — RGUKT Ongole", "Dean of Academics at RGUKT Ongole.", "academics");
add(
  "/academics/AcademicPrograms",
  "Academic Programmes — RGUKT Ongole",
  "Programmes offered at RGUKT Ongole.",
  "academics",
);
add(
  "/academics/AcademicCalender",
  "Academic Calendar — RGUKT Ongole",
  "Academic calendar for RGUKT Ongole.",
  "academics",
);
add(
  "/academics/AcademicRegulations",
  "Academic Regulations — RGUKT Ongole",
  "Academic regulations of RGUKT Ongole.",
  "academics",
);
add("/academics/curicula", "Curricula — RGUKT Ongole", "Curricula for programmes at RGUKT Ongole.", "academics");
add("/academics/timetable", "Time Table — RGUKT Ongole", "Class time tables at RGUKT Ongole.", "academics");
add(
  "/academics/examination-cell",
  "Examination Cell — RGUKT Ongole",
  "Examination cell of RGUKT Ongole.",
  "academics",
);

add(
  "/admissions",
  "Admissions — RGUKT Ongole",
  "Admissions to RGUKT Ongole, including the six-year integrated B.Tech programme.",
  "admissions",
);

add(
  "/departments",
  "Departments — RGUKT Ongole",
  "Engineering, sciences, and humanities departments at RGUKT Ongole.",
  "departments",
);
add(
  "/academics/departments",
  "Departments — RGUKT Ongole",
  "Engineering, sciences, and humanities departments at RGUKT Ongole.",
  "departments",
);
for (const [code, name] of [
  ["CSE", "Computer Science and Engineering"],
  ["CIVIL", "Civil Engineering"],
  ["ECE", "Electronics and Communication Engineering"],
  ["EEE", "Electrical and Electronics Engineering"],
  ["ME", "Mechanical Engineering"],
  ["MATHEMATICS", "Mathematics"],
  ["PHYSICS", "Physics"],
  ["CHEMISTRY", "Chemistry"],
  ["IT", "Information Technology"],
  ["BIOLOGY", "Biology"],
  ["ENGLISH", "English"],
  ["LIB", "Central Library"],
  ["MANAGEMENT", "Management"],
  ["PED", "Physical Education"],
  ["TELUGU", "Telugu"],
  ["YOGA", "Yoga"],
]) {
  add(
    `/departments/${code}`,
    `${name} — RGUKT Ongole`,
    `Department of ${name} at RGUKT Ongole.`,
    "departments",
  );
}

const PLACEMENTS = [
  "Placements — RGUKT Ongole",
  "Placement cell and campus recruitment at RGUKT Ongole.",
];
add("/information/placements", PLACEMENTS[0], PLACEMENTS[1], "placements");

const ALUMNI = ["Alumni — RGUKT Ongole", "Alumni of RGUKT Ongole."];
add("/information/alumni", ALUMNI[0], ALUMNI[1], "alumni");

const CONTACT = [
  "Contact — RGUKT Ongole",
  "Phone, email, and campus address for RGUKT Ongole.",
];
add("/contact", CONTACT[0], CONTACT[1], "contact");
add("/information/contact", CONTACT[0], CONTACT[1], "contact");
add(
  "/information/info-center",
  "Info Center — RGUKT Ongole",
  "Campus information center at RGUKT Ongole.",
  "home",
);
add(
  "/information",
  "Information — RGUKT Ongole",
  "Contact details and campus information for RGUKT Ongole.",
  "home",
);

const STUDENT_CELL = [
  "Student Cell — RGUKT Ongole",
  "Student cell at RGUKT Ongole — support and campus student services.",
];
add("/uniz/student-cell", STUDENT_CELL[0], STUDENT_CELL[1], "student-cell");

add(
  "/notices",
  "Notices — RGUKT Ongole",
  "Notices, tenders, careers, and news from RGUKT Ongole.",
  "notices",
);
add(
  "/notifications/news",
  "News and Updates — RGUKT Ongole",
  "News and updates from RGUKT Ongole.",
  "notices",
);
add("/notifications/tenders", "Tenders — RGUKT Ongole", "Tenders published by RGUKT Ongole.", "notices");
add("/notifications/careers", "Careers — RGUKT Ongole", "Careers at RGUKT Ongole.", "notices");

add(
  "/grievance",
  "Grievance — RGUKT Ongole",
  "Grievance redressal at RGUKT Ongole.",
  "home",
);
for (const [path, label] of [
  ["/grievance/women-cell", "Women Cell"],
  ["/grievance/anti-ragging", "Anti Ragging Cell"],
  ["/grievance/hod", "HOD"],
  ["/grievance/dean-academics", "Dean Academics"],
  ["/grievance/student-welfare", "Student Welfare Office"],
  ["/grievance/examination", "Examination"],
  ["/grievance/it-infrastructure", "IT Infrastructure"],
  ["/grievance/director", "Director"],
  ["/grievance/vice-chancellor", "Vice Chancellor"],
  ["/grievance/chancellor", "Chancellor"],
]) {
  add(path, `${label} — RGUKT Ongole`, "Grievance redressal at RGUKT Ongole.", "home");
}

add("/consultancy", "Consultancy — RGUKT Ongole", "Consultancy at RGUKT Ongole.", "home");

const EXACT = new Map(pages.map((page) => [page.path, page]));

/** Unknown paths under a prefix reuse that section's shell. Longest prefix wins. */
const FALLBACKS = [
  { prefix: "/about/", target: "/about" },
  { prefix: "/institute/", target: "/institute/aboutrgukt" },
  { prefix: "/administration/", target: "/administration" },
  { prefix: "/academics/", target: "/academics" },
  { prefix: "/departments/", target: "/departments" },
  { prefix: "/information/", target: "/information" },
  { prefix: "/notifications/", target: "/notices" },
  { prefix: "/grievance/", target: "/grievance" },
  { prefix: "/uniz/", target: "/" },
].sort((a, b) => b.prefix.length - a.prefix.length);

function toMeta(page) {
  const url = page.path === "/" ? `${SITE}/` : `${SITE}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    image: IMG[page.image],
    imageAlt: page.title,
    url,
    type: "website",
    siteName: SITE_NAME,
    themeColor: THEME,
    robots: "index, follow",
  };
}

export function resolve(input) {
  const path = normalizePath(input);
  if (EXACT.has(path)) return toMeta(EXACT.get(path));
  const fallback = FALLBACKS.find((item) => path.startsWith(item.prefix));
  if (fallback) return toMeta(EXACT.get(fallback.target));
  return toMeta(EXACT.get("/"));
}

export function prerenderPaths() {
  return pages.map((page) => page.path);
}

/** Same 301s as public/_redirects. Listed first so they win over OG 200s. */
const NEXUS_REDIRECTS = [
  { from: "/nexus/student-cell", to: "/uniz/student-cell", status: 301 },
  { from: "/nexus/placements", to: "/information/placements", status: 301 },
  { from: "/nexus/alumni", to: "/information/alumni", status: 301 },
  { from: "/nexus/hho", to: "/", status: 301 },
  { from: "/nexus/*", to: "/uniz/student-cell", status: 301 },
];

export function redirectRules() {
  const rules = NEXUS_REDIRECTS.map((rule) => ({ ...rule }));
  const reserved = new Set(rules.map((rule) => rule.from));
  for (const page of pages) {
    if (page.path === "/") continue;
    if (reserved.has(page.path)) continue;
    rules.push({ from: page.path, to: page.path, status: 200 });
    rules.push({ from: `${page.path}/`, to: page.path, status: 200 });
  }
  for (const item of FALLBACKS) {
    const from = `${item.prefix}*`;
    if (reserved.has(from)) continue;
    rules.push({ from, to: item.target, status: 200 });
  }
  return rules;
}

export const shells = [];

export const checks = [
  { path: "/" },
  { path: "/about" },
  { path: "/institute/aboutrgukt" },
  { path: "/academics" },
  { path: "/academics/AcademicPrograms" },
  { path: "/admissions" },
  { path: "/departments" },
  { path: "/academics/departments" },
  { path: "/departments/CSE" },
  { path: "/departments/CSE/faculty/4" },
  { path: "/information/placements" },
  { path: "/information/alumni" },
  { path: "/contact" },
  { path: "/information/contact" },
  { path: "/uniz/student-cell", forbid: "uniz" },
  { path: "/departments/CSE?preview=1" },
  { path: "/nexus/student-cell", redirect: "/uniz/student-cell", forbid: "uniz" },
  { path: "/nexus/placements", redirect: "/information/placements" },
  { path: "/nexus/alumni", redirect: "/information/alumni" },
  { path: "/nexus/hho", redirect: "/" },
  { path: "/notices" },
  { path: "/notifications/news" },
  { path: "/administration/director" },
];
