import fs from "node:fs";
import path from "node:path";

const SEVERITY = {
  "document-overflow": "critical",
  "fixed-cover": "critical",
  "element-past-viewport": "high",
  overlap: "high",
  "console-error": "high",
  "text-overflow": "medium",
  "tap-target": "medium",
  "image-cls": "low",
  navigation: "high",
};

const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

const ACCEPT_REASONS = {
  "install-prompt":
    "The install-app prompt is owned by PR #352, which removes it. This audit does not restyle that surface.",
  "data-table":
    "Row layout inside webadmin tables (Faculty Management, Students, Roles, and the same grids) is owned by parallel table work. Reported here and left unchanged.",
  "inline-link":
    "Inline text links sit in a line of prose. Their line box is shorter than 40px; they are not standalone controls.",
  brand:
    "The lockup mark and the UniZ word are owned by the logo and naming change in PR #352. Hit area and artwork were left as they are.",
  "text-link":
    "The control is a text link whose height already meets 40px. The short label is narrower than 40px, which is the width of the word, not a missed hit area.",
  "field-adornment":
    "Show-password controls sit inside the input they toggle. The boxes overlap by design.",
  "auth-redirect":
    "The app sent the session to the screen that role is allowed to open, or sent an unknown path home. That is routing, not layout.",
  "cross-origin-frame":
    "The website editor loads the live campus site in an iframe. The frame refuses embedding and storage from this origin. The editor is left loading that page.",
  toast:
    "The students empty-state toast floats over that page's filter row. The notice comes from the students table, which this pass does not restyle.",
};

export function severityFor(check) {
  return SEVERITY[check] || "medium";
}

export function decorate(finding) {
  let ownedBy = finding.ownedBy;
  if (
    !ownedBy &&
    finding.app === "portal" &&
    finding.path === "/admin/subjects" &&
    finding.check === "tap-target"
  ) {
    ownedBy = "data-table";
  }
  const severity = severityFor(finding.check);
  const reason = ownedBy ? ACCEPT_REASONS[ownedBy] : null;
  return {
    ...finding,
    ownedBy,
    severity,
    status: reason ? "accepted" : "open",
    acceptReason: reason,
  };
}

function countKey(findings) {
  const byApp = {};
  for (const finding of findings) {
    const app = byApp[finding.app] || (byApp[finding.app] = {});
    const vp = app[finding.viewport] || (app[finding.viewport] = { open: 0, accepted: 0, bySeverity: {} });
    if (finding.status === "accepted") vp.accepted += 1;
    else {
      vp.open += 1;
      vp.bySeverity[finding.severity] = (vp.bySeverity[finding.severity] || 0) + 1;
    }
  }
  return byApp;
}

export function writeReports(outDir, findings, meta) {
  fs.mkdirSync(outDir, { recursive: true });
  const decorated = findings.map(decorate).sort((a, b) => {
    const rank = (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9);
    if (rank) return rank;
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return `${a.app}${a.path}`.localeCompare(`${b.app}${b.path}`);
  });
  const open = decorated.filter((f) => f.status === "open");
  const accepted = decorated.filter((f) => f.status === "accepted");
  const payload = {
    generatedAt: new Date().toISOString(),
    meta,
    counts: {
      open: open.length,
      accepted: accepted.length,
      byAppViewport: countKey(decorated),
    },
    open,
    accepted,
  };
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(outDir, "report.md"), markdown(payload));
  return payload;
}

function markdown(payload) {
  const lines = [];
  lines.push("# Responsive audit");
  lines.push("");
  lines.push(`Generated ${payload.generatedAt}.`);
  lines.push("");
  lines.push(`Open issues: **${payload.counts.open}**. Accepted: **${payload.counts.accepted}**.`);
  lines.push("");
  lines.push("## Counts by app and viewport");
  lines.push("");
  lines.push("| App | Viewport | Open | Accepted | Critical | High | Medium | Low |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const [app, viewports] of Object.entries(payload.counts.byAppViewport)) {
    for (const [viewport, row] of Object.entries(viewports)) {
      const s = row.bySeverity || {};
      lines.push(
        `| ${app} | ${viewport} | ${row.open} | ${row.accepted} | ${s.critical || 0} | ${s.high || 0} | ${s.medium || 0} | ${s.low || 0} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Open issues");
  lines.push("");
  if (!payload.open.length) lines.push("None.");
  for (const finding of payload.open) {
    lines.push(`### ${finding.severity} · ${finding.app} ${finding.path} · ${finding.viewport} · ${finding.check}`);
    lines.push("");
    lines.push(finding.detail || "");
    if (finding.screenshot) lines.push(`Screenshot: \`${finding.screenshot}\``);
    for (const example of finding.examples || []) {
      const text = example.text ? ` — ${example.text}` : "";
      lines.push(`- \`${example.selector}\`${text}`);
    }
    if (finding.console) lines.push(`- ${finding.console}`);
    lines.push("");
  }
  lines.push("## Accepted");
  lines.push("");
  const grouped = new Map();
  for (const finding of payload.accepted) {
    const key = `${finding.ownedBy}|${finding.check}`;
    const bucket = grouped.get(key) || { reason: finding.acceptReason, check: finding.check, items: [] };
    bucket.items.push(finding);
    grouped.set(key, bucket);
  }
  if (!grouped.size) lines.push("None.");
  for (const bucket of grouped.values()) {
    lines.push(`### ${bucket.check} (${bucket.items.length})`);
    lines.push("");
    lines.push(bucket.reason);
    lines.push("");
    const sample = bucket.items.slice(0, 12);
    for (const finding of sample) {
      lines.push(`- ${finding.app} \`${finding.path}\` ${finding.viewport}: ${finding.detail || ""}`);
    }
    if (bucket.items.length > sample.length) {
      lines.push(`- … ${bucket.items.length - sample.length} more in report.json`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
