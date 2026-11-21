/**
 * Open Graph map for uniz.rguktong.in.
 * Public pages get their own titles. Every other route — student, faculty,
 * admin, notification deep links — gets one generic card. The generic card
 * has no path, id, or account data in the title, description, or URL.
 */
import { normalizePath } from "../../../scripts/og/html.mjs";

export const SITE = "https://uniz.rguktong.in";
export const SITE_NAME = "uniZ";
const THEME = "#0b1b3a";
const IMAGE = `${SITE}/og/uniz.png`;
const ALT = "uniZ — RGUKT Ongole campus portal";

const HOME = {
  title: "uniZ — Campus platform for RGUKT students",
  description:
    "Manage academics, semester registration, outpasses, and campus updates in one place. Built for RGUKT Ongole students.",
};

const pages = [];

function add(path, title, description, type = "website") {
  pages.push({ path, title, description, type });
}

add("/", HOME.title, HOME.description);
add(
  "/privacy",
  "Privacy Policy — uniZ",
  "Privacy policy for the uniZ campus platform at RGUKT Ongole.",
);
add(
  "/developers",
  "Developers — uniZ",
  "Meet the RGUKT Ongole student team behind the UniZ campus platform.",
);
add(
  "/student-project-management",
  "Student Project Management Platform | UniZ",
  "Organize your academic projects with ease. Build specific roadmaps and manage your college team projects online quickly.",
);
add(
  "/college-team-collaboration",
  "College Team Collaboration Tool | UniZ",
  "The best academic productivity system guide integrated natively for engineering students. Avoid friction.",
);
add(
  "/academic-task-tracker",
  "Academic Task Tracker for Colleges | UniZ",
  "Track assignments, grades, and projects simultaneously with the native real-time academic tracker.",
);
add(
  "/blog",
  "UniZ Academic Blog | UniZ",
  "Discover insights about academic productivity and tools.",
);

const BLOG_SLUGS = [
  "best-tools-for-student-collaboration-in-india",
  "how-to-manage-college-team-projects-online",
  "notion-alternative-for-engineering-students",
  "academic-productivity-system-guide",
];

for (const slug of BLOG_SLUGS) {
  const words = slug.replace(/-/g, " ");
  const titled = words.replace(/\b\w/g, (letter) => letter.toUpperCase());
  add(`/blog/${slug}`, `${titled} | UniZ`, `Comprehensive guide to mastering ${words}`, "article");
}

const SIGN_IN = ["Sign in — uniZ", "Sign in to the RGUKT Ongole campus portal."];
add("/student/signin", SIGN_IN[0], SIGN_IN[1]);
add("/login", SIGN_IN[0], SIGN_IN[1]);
add("/signin", SIGN_IN[0], SIGN_IN[1]);
add("/admin/signin", "Admin sign in — uniZ", "Sign in to uniZ administration for RGUKT Ongole.");

const EXACT = new Map(pages.map((page) => [page.path, page]));

const PRIVATE_ROOTS = ["/student", "/faculty", "/admin", "/notifications", "/studyspace", "/campushub"];

function isPrivate(path) {
  if (EXACT.has(path)) return false;
  return PRIVATE_ROOTS.some((root) => path === root || path.startsWith(`${root}/`));
}

function publicMeta(page) {
  const url = page.path === "/" ? `${SITE}/` : `${SITE}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    image: IMAGE,
    imageAlt: ALT,
    url,
    type: page.type,
    siteName: SITE_NAME,
    themeColor: THEME,
    robots: "index, follow",
  };
}

function privateMeta() {
  return {
    title: "uniZ",
    description: "Sign in to the RGUKT Ongole campus portal.",
    image: IMAGE,
    imageAlt: ALT,
    url: `${SITE}/`,
    type: "website",
    siteName: SITE_NAME,
    themeColor: THEME,
    robots: "noindex, nofollow",
  };
}

export function resolve(input) {
  const path = normalizePath(input);
  if (EXACT.has(path)) return publicMeta(EXACT.get(path));
  if (path.startsWith("/blog/")) return publicMeta(EXACT.get("/blog"));
  if (isPrivate(path)) return privateMeta();
  return publicMeta(EXACT.get("/"));
}

export function prerenderPaths() {
  return pages.map((page) => page.path);
}

export function redirectRules() {
  const rules = [];
  for (const page of pages) {
    if (page.path === "/") continue;
    rules.push({ from: page.path, to: `${page.path}/index.html` });
    rules.push({ from: `${page.path}/`, to: `${page.path}/index.html` });
  }
  rules.push({ from: "/blog/*", to: "/blog/index.html" });
  for (const root of PRIVATE_ROOTS) {
    rules.push({ from: root, to: "/og/private.html" });
    rules.push({ from: `${root}/`, to: "/og/private.html" });
    rules.push({ from: `${root}/*`, to: "/og/private.html" });
  }
  rules.push({ from: "/*", to: "/index.html" });
  return rules;
}

export const shells = [{ file: "og/private.html", asPath: "/student", stripJsonLd: true }];

export const checks = [
  { path: "/" },
  { path: "/privacy" },
  { path: "/developers" },
  { path: "/student-project-management" },
  { path: "/college-team-collaboration" },
  { path: "/academic-task-tracker" },
  { path: "/blog" },
  { path: "/blog/best-tools-for-student-collaboration-in-india" },
  { path: "/blog/notion-alternative-for-engineering-students" },
  { path: "/blog/academic-productivity-system-guide" },
  { path: "/blog/how-to-manage-college-team-projects-online" },
  { path: "/blog/some-future-post" },
  { path: "/student/signin" },
  { path: "/admin/signin" },
  { path: "/login" },
  { path: "/student/attendance?id=SECRET", leak: "SECRET" },
  { path: "/faculty/dashboard", leak: "/faculty/dashboard" },
  { path: "/admin/searchstudents", leak: "searchstudents" },
  { path: "/notifications/abc?token=SECRET", leak: "SECRET" },
];
