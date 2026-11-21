/**
 * Shared Open Graph head block.
 * Crawlers read this HTML; they do not run the SPA.
 */

export const MARK_START = "<!-- og:meta -->";
export const MARK_END = "<!-- /og:meta -->";

export function normalizePath(input) {
  let pathname = String(input || "/");
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    pathname = new URL(pathname).pathname;
  }
  pathname = pathname.split("?")[0].split("#")[0];
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  return pathname || "/";
}

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function renderMetaBlock(meta) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const image = escapeAttr(meta.image);
  const alt = escapeAttr(meta.imageAlt);
  const url = escapeAttr(meta.url);
  const type = escapeAttr(meta.type || "website");
  const site = escapeAttr(meta.siteName);
  const theme = escapeAttr(meta.themeColor);
  const robots = escapeAttr(meta.robots || "index, follow");
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="theme-color" content="${theme}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${site}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n    ");
}

export function applyMeta(html, meta) {
  const start = html.indexOf(MARK_START);
  const end = html.indexOf(MARK_END);
  if (start < 0 || end < start) {
    throw new Error("HTML is missing <!-- og:meta --> markers");
  }
  const block = `${MARK_START}\n    ${renderMetaBlock(meta)}\n    `;
  return html.slice(0, start) + block + html.slice(end);
}

export function decodeAttr(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

export function parseTags(html) {
  const tags = {};
  const meta = /<meta\s+([^>]+)>/gi;
  let match;
  while ((match = meta.exec(html))) {
    const attrs = match[1];
    const key = /(?:property|name)="([^"]+)"/.exec(attrs)?.[1];
    const content = /content="([^"]*)"/.exec(attrs)?.[1];
    if (key && content != null) tags[key] = decodeAttr(content);
  }
  const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html);
  tags.canonical = canonical ? decodeAttr(canonical[1]) : "";
  const title = /<title>([^<]*)<\/title>/i.exec(html);
  tags.title = title ? decodeAttr(title[1]) : "";
  return tags;
}

export function pngSize(buffer) {
  const sig = buffer.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") {
    throw new Error("Not a PNG");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

/** First matching _redirects rule. Patterns use a single * splat. */
export function matchRule(pattern, pathname) {
  const body = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`).test(pathname);
}
