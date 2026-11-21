/**
 * In-page layout checks. Kept free of closures so Playwright can serialize it.
 * Returns grouped issues; the runner assigns severity and acceptance.
 */
export function detectLayout(opts) {
  const tapMin = opts.tapMin || 40;
  const mobile = Boolean(opts.mobile);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const issues = [];

  const selectorOf = (el) => {
    if (!el || el.nodeType !== 1) return "";
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string"
        ? el.className
            .trim()
            .split(/\s+/)
            .slice(0, 3)
            .filter(Boolean)
            .map((c) => `.${c}`)
            .join("")
        : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 160);
  };

  const textOf = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140);

  const visible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    return true;
  };

  const intersectsViewport = (rect) => rect.right > 1 && rect.left < vw - 1 && rect.bottom > 1 && rect.top < vh - 1;

  const isBrand = (el) => {
    const label = `${el.getAttribute("aria-label") || ""} ${textOf(el)}`;
    return /uniZ/i.test(label) && Boolean(el.querySelector("svg"));
  };

  const ownedBy = (el) => {
    if (isBrand(el)) return "brand";
    if (el.matches?.("a.title") && /uniZ/i.test(textOf(el))) return "brand";
    if (el.closest("[data-sonner-toaster], [data-sonner-toast], [role='status']")) return "toast";
    if (el.getAttribute("aria-label") === "Dismiss") {
      let host = el.parentElement;
      while (host && host !== document.body) {
        const pos = getComputedStyle(host).position;
        if (pos === "fixed" || pos === "absolute") return "toast";
        host = host.parentElement;
      }
    }
    let node = el;
    while (node && node !== document.body) {
      if (isBrand(node)) return "brand";
      if (node.matches?.("a.title") && /uniZ/i.test(textOf(node))) return "brand";
      const text = (node.innerText || "").slice(0, 240);
      if (/Install app to enjoy full services/i.test(text) && getComputedStyle(node).position === "fixed") {
        return "install-prompt";
      }
      if (node.matches?.("table, [role='grid'], .MuiDataGrid-root, .MuiDataGrid-virtualScroller")) {
        return "data-table";
      }
      node = node.parentElement;
    }
    return null;
  };

  const visuallyHidden = (el) => {
    if (el.closest(".sr-only, .visually-hidden, .VPSkipLink, .skip-link")) return true;
    let node = el;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return true;
      node = node.parentElement;
    }
    const style = getComputedStyle(el);
    if (style.clip !== "auto" && style.position === "absolute" && (el.clientWidth <= 1 || el.clientHeight <= 1)) return true;
    return el.clientWidth <= 1 || el.clientHeight <= 1;
  };

  const scrollportThatContains = (el, rect) => {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const style = getComputedStyle(p);
      const ox = style.overflowX;
      if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") {
        const pr = p.getBoundingClientRect();
        const past = rect.right > pr.right + 2 || rect.left < pr.left - 2;
        if (past) {
          const fits = pr.left >= -2 && pr.right <= vw + 2;
          const root = p === document.body || p === document.documentElement;
          return { fits, root, mode: ox, selector: selectorOf(p) };
        }
      }
      p = p.parentElement;
    }
    return null;
  };

  const docOverflow = doc.scrollWidth > doc.clientWidth + 1 || document.body.scrollWidth > document.body.clientWidth + 1;
  if (docOverflow) {
    issues.push({
      check: "document-overflow",
      ownedBy: null,
      detail: `scrollWidth ${Math.max(doc.scrollWidth, document.body.scrollWidth)} > clientWidth ${doc.clientWidth}`,
      examples: [
        {
          selector: "documentElement",
          text: "",
          box: { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth },
        },
      ],
    });
  }

  const past = [];
  const textIssues = [];
  const images = [];
  const controls = [];
  const bars = [];

  const nodes = document.querySelectorAll("body *");
  for (const el of nodes) {
    if (!visible(el)) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const owner = ownedBy(el);
    const tag = el.tagName;

    if (tag === "IMG") {
      const wAttr = el.getAttribute("width");
      const hAttr = el.getAttribute("height");
      const ratio = style.aspectRatio;
      const widthAuto = style.width === "auto";
      const heightAuto = style.height === "auto";
      const definite = !widthAuto && !heightAuto;
      const hasRatio = ratio && ratio !== "auto";
      if (!wAttr && !hAttr && !definite && !hasRatio) {
        images.push({
          selector: selectorOf(el),
          text: el.getAttribute("alt") || el.getAttribute("src") || "",
          ownedBy: owner,
          box: { w: Math.round(rect.width), h: Math.round(rect.height) },
        });
      }
    }

    const extendsX = rect.right > vw + 2 || rect.left < -2;
    if (extendsX && intersectsViewport(rect) && tag !== "HTML" && tag !== "BODY" && !visuallyHidden(el)) {
      const clip = scrollportThatContains(el, rect);
      const tolerated = clip && clip.fits && !clip.root && (clip.mode === "auto" || clip.mode === "scroll");
      if (!tolerated && !el.classList.contains("skip-link")) {
        past.push({
          selector: selectorOf(el),
          text: textOf(el),
          ownedBy: owner,
          box: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            w: Math.round(rect.width),
          },
        });
      }
    }

    const isTextTag = /^(P|SPAN|A|BUTTON|LABEL|H1|H2|H3|H4|H5|H6|LI|TD|TH|DT|DD|SMALL|STRONG|EM)$/.test(tag);
    if (isTextTag && el.clientWidth > 0 && !visuallyHidden(el)) {
      const overflowX = style.overflowX;
      const ellipsis = style.textOverflow === "ellipsis" && (overflowX === "hidden" || overflowX === "clip");
      const overflows = el.scrollWidth > el.clientWidth + 4;
      const directText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (overflows && directText && !ellipsis && overflowX !== "scroll" && overflowX !== "auto") {
        const clip = scrollportThatContains(el, rect);
        const inScrollport = clip && clip.fits && (clip.mode === "auto" || clip.mode === "scroll");
        if (!inScrollport) {
          textIssues.push({
            selector: selectorOf(el),
            text: textOf(el),
            ownedBy: owner,
            box: { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth },
          });
        }
      }
    }

    const interactive =
      tag === "BUTTON" ||
      tag === "A" ||
      tag === "SELECT" ||
      tag === "SUMMARY" ||
      (tag === "INPUT" && !/hidden|checkbox|radio/i.test(el.type || "")) ||
      el.getAttribute("role") === "button";
    if (interactive && !visuallyHidden(el)) {
      controls.push({ el, rect, style, owner, tag });
    }

    const pos = style.position;
    if ((pos === "fixed" || pos === "sticky") && rect.height >= 24 && rect.height <= vh * 0.45 && rect.width > vw * 0.4) {
      bars.push({ el, rect, pos, owner });
    }
  }

  const dedupe = (list, limit) => {
    const seen = new Set();
    const out = [];
    for (const item of list) {
      const key = `${item.ownedBy || ""}|${item.selector}|${item.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  };

  if (past.length) {
    const examples = dedupe(past, 8);
    issues.push({
      check: "element-past-viewport",
      ownedBy: examples.every((e) => e.ownedBy) ? examples[0].ownedBy : null,
      detail: `${past.length} element(s) extend past the ${vw}px viewport`,
      examples,
    });
  }
  if (textIssues.length) {
    const examples = dedupe(textIssues, 8);
    issues.push({
      check: "text-overflow",
      ownedBy: examples.every((e) => e.ownedBy) ? examples[0].ownedBy : null,
      detail: `${textIssues.length} text node(s) overflow their box without ellipsis`,
      examples,
    });
  }
  if (images.length) {
    const examples = dedupe(images, 8);
    issues.push({
      check: "image-cls",
      ownedBy: examples.every((e) => e.ownedBy) ? examples[0].ownedBy : null,
      detail: `${images.length} image(s) lack a reserved width and height`,
      examples,
    });
  }

  if (mobile) {
    const small = [];
    for (const control of controls) {
      const { rect, style, owner, tag, el } = control;
      if (!intersectsViewport(rect)) continue;
      if (rect.width >= tapMin && rect.height >= tapMin) continue;
      const display = style.display;
      const inlineLink =
        tag === "A" &&
        (rect.height < 28 ||
          ((display === "inline" || display === "inline-block") && !el.closest("nav, header, footer")));
      const textLink = tag === "A" && rect.height >= tapMin && rect.width < tapMin;
      small.push({
        selector: selectorOf(el),
        text: textOf(el) || el.getAttribute("aria-label") || "",
        ownedBy: inlineLink ? "inline-link" : textLink ? "text-link" : owner,
        box: { w: Math.round(rect.width), h: Math.round(rect.height) },
      });
    }
    if (small.length) {
      const examples = dedupe(small, 8);
      issues.push({
        check: "tap-target",
        ownedBy: examples.every((e) => e.ownedBy) ? examples[0].ownedBy : null,
        detail: `${small.length} control(s) under ${tapMin}px`,
        examples,
      });
    }
  }

  const overlap = [];
  const candidates = controls.filter((c) => intersectsViewport(c.rect) && c.rect.width < vw * 0.85 && c.rect.height < 160);
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (visuallyHidden(a.el) || visuallyHidden(b.el)) continue;
      const adornment = (a.style.position === "absolute" || b.style.position === "absolute") &&
        (a.tag === "INPUT" || b.tag === "INPUT" || a.tag === "TEXTAREA" || b.tag === "TEXTAREA");
      const left = Math.max(a.rect.left, b.rect.left);
      const right = Math.min(a.rect.right, b.rect.right);
      const top = Math.max(a.rect.top, b.rect.top);
      const bottom = Math.min(a.rect.bottom, b.rect.bottom);
      const iw = right - left;
      const ih = bottom - top;
      if (iw < 6 || ih < 6) continue;
      const area = iw * ih;
      const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
      if (smaller <= 0 || area < 80 || area / smaller < 0.3) continue;
      const toast = a.owner === "toast" || b.owner === "toast";
      overlap.push({
        selector: `${selectorOf(a.el)} ∩ ${selectorOf(b.el)}`,
        text: `${textOf(a.el) || a.el.getAttribute("aria-label") || a.tag} / ${textOf(b.el) || b.el.getAttribute("aria-label") || b.tag}`,
        ownedBy: adornment
          ? "field-adornment"
          : a.owner === "install-prompt" || b.owner === "install-prompt"
            ? "install-prompt"
            : toast
              ? "toast"
              : a.owner && a.owner === b.owner
                ? a.owner
                : null,
        box: { w: Math.round(iw), h: Math.round(ih) },
      });
      if (overlap.length >= 8) break;
    }
    if (overlap.length >= 8) break;
  }
  if (overlap.length) {
    issues.push({
      check: "overlap",
      ownedBy: overlap.every((e) => e.ownedBy) ? overlap[0].ownedBy : null,
      detail: `${overlap.length} overlapping interactive pair(s)`,
      examples: overlap,
    });
  }

  const covered = [];
  for (const bar of bars) {
    if (bar.el.querySelector("main")) continue;
    const sample = [];
    const walker = document.querySelectorAll("h1, h2, p, a, button, td");
    for (const el of walker) {
      if (bar.el.contains(el) || el.contains(bar.el)) continue;
      if (!visible(el) || visuallyHidden(el)) continue;
      if (!el.closest("main, .vp-doc, [role='main']")) continue;
      const rect = el.getBoundingClientRect();
      const left = Math.max(bar.rect.left, rect.left);
      const right = Math.min(bar.rect.right, rect.right);
      const top = Math.max(bar.rect.top, rect.top);
      const bottom = Math.min(bar.rect.bottom, rect.bottom);
      const coverH = bottom - top;
      const coverRatio = rect.height > 0 ? coverH / rect.height : 0;
      const centerY = rect.top + rect.height / 2;
      const centerInside = centerY >= bar.rect.top && centerY <= bar.rect.bottom;
      if (right - left < 12 || coverH < 12) continue;
      if (!centerInside && coverRatio < 0.45) continue;
      if (!intersectsViewport(rect)) continue;
      const style = getComputedStyle(el);
      if (style.position === "fixed") continue;
      sample.push(el);
      if (sample.length >= 3) break;
    }
    if (sample.length) {
      covered.push({
        selector: selectorOf(bar.el),
        text: textOf(bar.el).slice(0, 80),
        ownedBy: bar.owner,
        box: {
          top: Math.round(bar.rect.top),
          height: Math.round(bar.rect.height),
          covers: sample.map((el) => textOf(el).slice(0, 60)).filter(Boolean),
        },
      });
    }
  }
  if (covered.length) {
    issues.push({
      check: "fixed-cover",
      ownedBy: covered.every((e) => e.ownedBy) ? covered[0].ownedBy : null,
      detail: `${covered.length} fixed or sticky bar(s) cover in-flow content`,
      examples: covered.slice(0, 4),
    });
  }

  return {
    href: location.href,
    title: document.title,
    viewport: { w: vw, h: vh },
    issues,
  };
}
