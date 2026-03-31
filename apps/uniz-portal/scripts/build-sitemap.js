import * as fs from "fs";
import * as path from "path";

const SITE_URL = "https://uniz.rguktong.in";

const staticRoutes = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/student-project-management", priority: 0.9, changefreq: "weekly" },
  { path: "/college-team-collaboration", priority: 0.9, changefreq: "weekly" },
  { path: "/academic-task-tracker", priority: 0.9, changefreq: "weekly" },
  { path: "/blog", priority: 0.8, changefreq: "daily" },
  {
    path: "/blog/best-tools-for-student-collaboration-in-india",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/blog/how-to-manage-college-team-projects-online",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/blog/notion-alternative-for-engineering-students",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/blog/academic-productivity-system-guide",
    priority: 0.7,
    changefreq: "monthly",
  },
];

const generateSitemap = () => {
  const urls = staticRoutes
    .map((route) => {
      const lastmod = new Date().toISOString().split("T")[0];
      return `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const outputPath = path.join(process.cwd(), "dist", "sitemap.xml");
  const pubPath = path.join(process.cwd(), "public", "sitemap.xml");

  if (fs.existsSync(path.dirname(outputPath))) {
    fs.writeFileSync(outputPath, sitemapXml.trim());
    console.log("✅ Generated dynamic sitemap.xml in dist!");
  }

  // Always update public just in case we are in dev
  fs.writeFileSync(pubPath, sitemapXml.trim());
  console.log("✅ Updated public/sitemap.xml");
};

generateSitemap();
