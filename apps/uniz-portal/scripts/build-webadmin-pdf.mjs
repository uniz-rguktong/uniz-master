/**
 * Rebuild the printable webadmin guide.
 * Run from the portal package: npm run guides:pdf
 *
 * Reads src/content/webadmin-guides.json (the same file the Help page uses)
 * and prints it with the system Chrome.
 */
import { copyFileSync, existsSync, readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const portalRoot = resolve(here, "..");
const sourcePath = resolve(portalRoot, "src/content/webadmin-guides.json");
const pdfPath = resolve(portalRoot, "public/guides/uniz-webadmin-guide.pdf");
// Older links used this filename. Keep serving the same PDF there.
const legacyPdfPath = resolve(portalRoot, "public/guides/uniz-webmaster-guide.pdf");
const htmlPath = resolve(tmpdir(), "uniz-webadmin-guide.print.html");

const book = JSON.parse(readFileSync(sourcePath, "utf8"));

const screenIds = [
  "dashboard",
  "student",
  "student_bulk",
  "attendance",
  "grades",
  "subjects",
  "semester_registration",
  "banners",
  "updates",
  "website_updates",
  "push_alerts",
  "faculty_mgmt",
  "role_mgmt",
  "system_logs",
  "database",
  "security",
  "help",
];

const problems = [];
const ids = new Set();
const groupIds = new Set(book.groups.map((group) => group.id));
for (const guide of book.guides) {
  if (ids.has(guide.id)) problems.push(`Duplicate guide id ${guide.id}`);
  ids.add(guide.id);
  if (!groupIds.has(guide.group)) problems.push(`${guide.id} has unknown group`);
  if (!guide.steps?.length) problems.push(`${guide.id} has no steps`);
}
for (const screen of screenIds) {
  if (!book.guides.some((guide) => guide.screens.includes(screen))) {
    problems.push(`No guide for screen ${screen}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rich(value) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function groupGuides(groupId) {
  return book.guides.filter((guide) => guide.group === groupId);
}

const sections = book.groups
  .map((group) => {
    const items = groupGuides(group.id);
    if (!items.length) return "";
    const articles = items
      .map((guide) => {
        const steps = guide.steps.map((step) => `<li>${rich(step)}</li>`).join("");
        const wrong = guide.wrong.map((tip) => `<li>${rich(tip)}</li>`).join("");
        return `<article>
          <p class="eyebrow">${escapeHtml(group.title)}</p>
          <h3>${escapeHtml(guide.title)}</h3>
          <p class="summary">${escapeHtml(guide.summary)}</p>
          <ol>${steps}</ol>
          <h4>If something goes wrong</h4>
          <ul>${wrong}</ul>
          <h4>Who to call</h4>
          <p>${rich(guide.call)}</p>
        </article>`;
      })
      .join("");
    return `<section class="group"><h2>${escapeHtml(group.title)}</h2>${articles}</section>`;
  })
  .join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>UniZ webadmin guide</title>
  <style>
    @page { size: A4; margin: 16mm 16mm 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #142033;
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      font-size: 12.5pt;
      line-height: 1.45;
    }
    h1, h2, h3, h4 { font-weight: 400; color: #0B2A47; }
    h1 { font-size: 28pt; line-height: 1.15; margin: 0 0 8px; }
    h2 { font-size: 20pt; margin: 0 0 12px; break-after: avoid; }
    h3 { font-size: 16pt; margin: 0 0 6px; break-after: avoid; }
    h4 { font-size: 13pt; margin: 14px 0 4px; break-after: avoid; }
    p { margin: 0 0 8px; }
    ol, ul { margin: 0 0 8px; padding-left: 1.2em; }
    li { margin: 0 0 4px; }
    strong { font-weight: 700; }
    .kicker { font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10pt; letter-spacing: 0.02em; color: #3d4d63; margin: 0 0 6px; }
    .lede, .summary, .meta { font-family: "Segoe UI", Helvetica, Arial, sans-serif; }
    .meta { font-size: 11pt; margin-bottom: 18px; }
    .eyebrow { font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10pt; color: #3d4d63; margin: 0; }
    article { break-inside: avoid; margin: 0 0 18px; padding-bottom: 8px; border-bottom: 1px solid #d5dde6; }
    section.group { break-before: page; }
    section.group:first-of-type { break-before: auto; }
  </style>
</head>
<body>
  <p class="kicker">RGUKT Ongole · UniZ</p>
  <h1>Webadmin guide</h1>
  <p class="lede">These steps are for the webadmin. One action per step. The bold words are the words on the button.</p>
  <p class="meta">
    Staff sign-in: ${escapeHtml(book.support.portalSignIn)}<br />
    Public website: ${escapeHtml(book.support.publicSite)}<br />
    Emergency database page: ${escapeHtml(book.support.adminer)}<br />
    Director's office: ${escapeHtml(book.support.directorPhone)}<br />
    Administrative Officer: ${escapeHtml(book.support.officerPhone)}
  </p>
  ${sections}
</body>
</html>`;

mkdirSync(dirname(pdfPath), { recursive: true });
writeFileSync(htmlPath, html);

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/usr/bin/google-chrome-stable",
  "google-chrome",
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => !candidate.includes("/") || existsSync(candidate));
if (!chrome) {
  console.error("Chrome was not found. Set CHROME_PATH.");
  process.exit(1);
}

const userDataDir = mkdtempSync(join(tmpdir(), "uniz-guide-chrome-"));
const printed = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--disable-extensions",
    "--no-pdf-header-footer",
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { encoding: "utf8", timeout: 60000 },
);
rmSync(htmlPath, { force: true });
rmSync(userDataDir, { recursive: true, force: true });

if (printed.status !== 0) {
  console.error(printed.stdout);
  console.error(printed.stderr);
  process.exit(printed.status || 1);
}

const pdf = readFileSync(pdfPath);
const pages = pdf.toString("latin1").match(/\/Type\s*\/Page(?![s])/g);
const pageCount = pages ? pages.length : 0;
copyFileSync(pdfPath, legacyPdfPath);
console.log(`Wrote ${pdfPath}`);
console.log(`Wrote ${legacyPdfPath}`);
console.log(`Pages: ${pageCount}`);
console.log(`Guides: ${book.guides.length}`);
