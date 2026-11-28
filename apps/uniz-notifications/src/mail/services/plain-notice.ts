import { buildPlainNoticeEmail } from "@uniz/shared";
import { z } from "zod";

const SINGLE_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const FALLBACK_FROM = "no-reply@rguktong.in";
const RECIPIENT_MESSAGE = "plain_notice requires exactly one email recipient";
const SUBJECT_MESSAGE =
  "plain_notice subject must be 1..200 characters and a single line";
const TEXT_MESSAGE = "plain_notice text must be 1..20000 characters";

export type PlainNoticeData = {
  subject: string;
  text: string;
};

export type PreparedPlainNotice = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/** One bare address. Commas, semicolons, and whitespace mean more than one. */
export function isSingleEmailAddress(value: string): boolean {
  if (value.length === 0 || value.length > 320) return false;
  if (/[,;\s]/.test(value)) return false;
  return SINGLE_EMAIL.test(value);
}

const singleRecipientSchema = z.any().superRefine((value, ctx) => {
  if (typeof value !== "string" || !isSingleEmailAddress(value)) {
    ctx.addIssue({
      code: "custom",
      message: RECIPIENT_MESSAGE,
    });
  }
});

const plainNoticeDataSchema = z.object(
  {
    subject: z
      .string({ error: SUBJECT_MESSAGE })
      .max(200, SUBJECT_MESSAGE)
      .refine((value) => value.length > 0 && !/[\r\n]/.test(value), {
        message: SUBJECT_MESSAGE,
      }),
    text: z
      .string({ error: TEXT_MESSAGE })
      .max(20000, TEXT_MESSAGE)
      .refine((value) => value.trim().length > 0, {
        message: TEXT_MESSAGE,
      }),
  },
  { error: TEXT_MESSAGE },
);

export const plainNoticeSchema = z.object({
  to: singleRecipientSchema,
  data: plainNoticeDataSchema,
});

export function plainNoticeFromAddress(sesFrom?: string): string {
  const configured =
    sesFrom !== undefined
      ? sesFrom.trim()
      : (process.env.SES_FROM_EMAIL ?? "").trim();
  const wrapped = configured.match(/<([^<>\s]+)>/);
  const bare = (wrapped?.[1] || configured).trim();
  const email = isSingleEmailAddress(bare) ? bare : FALLBACK_FROM;
  return `"uniZ" <${email}>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function countChar(value: string, char: string): number {
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === char) count += 1;
  }
  return count;
}

function splitTrailingPunctuation(raw: string): { url: string; rest: string } {
  let url = raw;
  let rest = "";
  while (url && /[.,;:!?]/.test(url[url.length - 1] || "")) {
    rest = url[url.length - 1] + rest;
    url = url.slice(0, -1);
  }
  const peel = (open: string, close: string) => {
    while (
      url.endsWith(close) &&
      countChar(url, close) > countChar(url, open)
    ) {
      rest = close + rest;
      url = url.slice(0, -1);
    }
  };
  peel("(", ")");
  peel("[", "]");
  return { url, rest };
}

function safeHref(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname) return null;
  if (/[\u0000-\u001F\u007F]/.test(url.href)) return null;
  return url.href;
}

/** Escape plain text, keep line breaks, and link only safe http(s) URLs. */
export function renderPlainNoticeBody(text: string): string {
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  let html = "";
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(text.slice(last, index));
    const raw = match[0];
    const { url, rest } = splitTrailingPunctuation(raw);
    const href = safeHref(url);
    if (href) {
      html += `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
      html += escapeHtml(rest);
    } else {
      html += escapeHtml(raw);
    }
    last = index + raw.length;
  }
  html += escapeHtml(text.slice(last));
  return html.replace(/\r\n|\r|\n/g, "<br>\n");
}

export function renderPlainNoticeHtml(text: string): string {
  const body = renderPlainNoticeBody(text);
  return buildPlainNoticeEmail({
    subject: "Campus notice",
    bodyHtml: `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#0a0a0b;">${body}</p>`,
    text,
  }).html;
}

export function renderPlainNoticeText(text: string): string {
  return buildPlainNoticeEmail({
    subject: "Campus notice",
    bodyHtml: "",
    text,
  }).text;
}

export function preparePlainNotice(
  to: unknown,
  data: unknown,
): PreparedPlainNotice {
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;
  const normalized = {
    to: typeof to === "string" ? to.trim() : to,
    data: record
      ? {
          ...record,
          subject:
            typeof record.subject === "string"
              ? record.subject.trim()
              : record.subject,
        }
      : data,
  };
  const parsed = plainNoticeSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid plain notice");
  }
  const subject = String(parsed.data.data.subject);
  const text = String(parsed.data.data.text);
  const recipient = String(parsed.data.to);
  return {
    to: recipient,
    subject,
    text,
    html: renderPlainNoticeHtml(text),
  };
}
