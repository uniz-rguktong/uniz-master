/**
 * Messages between the webadmin preview and the public landing.
 * Edit chrome is on only when the page was opened as a preview AND the
 * landing backend accepted a webadmin token. Public visitors never qualify.
 */

export const LANDING_SOURCE = "uniz-landing-preview";
export const ADMIN_SOURCE = "uniz-webadmin-preview";

export const PORTAL_ORIGIN = "https://uniz.rguktong.in";
export const LANDING_ORIGINS = ["https://rguktong.in", "https://www.rguktong.in"] as const;

export type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type ContactCopy = {
  address: string;
  phone: string;
  email: string;
};

export type AnnouncementCopy = {
  text: string;
  link: string | null;
};

export type BannerCopy = {
  id?: string;
  title: string;
  text: string;
  imageUrl: string;
  isVisible?: boolean;
};

export type NoticeCopy = {
  title: string;
  date: string;
  links: { label: string; url: string | null }[];
};

export type UpdateCopy = {
  id?: string;
  title: string;
  content: string;
  link: string | null;
  isVisible?: boolean;
};

export type StatCopy = { label: string; value: string };

export type SiteDraft = {
  hero: HeroCopy;
  contact: ContactCopy;
  announcements: AnnouncementCopy[];
  banners: BannerCopy[];
  notices: NoticeCopy[];
  updates: UpdateCopy[];
  stats: StatCopy[];
  images: string[];
};

export function isLoopbackDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:") return false;
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function isAllowedPortalOrigin(origin: string, dev: boolean): boolean {
  if (origin === PORTAL_ORIGIN) return true;
  return dev && isLoopbackDevOrigin(origin);
}

export function isAllowedLandingOrigin(origin: string, dev: boolean): boolean {
  if ((LANDING_ORIGINS as readonly string[]).includes(origin)) return true;
  return dev && isLoopbackDevOrigin(origin);
}

export function previewChromeEnabled(previewRequested: boolean, authorized: boolean): boolean {
  return previewRequested && authorized;
}

export function readPreviewMessage(
  data: unknown,
  expectedSource: string,
): { type: string } | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record.source !== expectedSource) return null;
  if (typeof record.type !== "string" || record.type.length === 0) return null;
  return record as { type: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function isSiteDraft(value: unknown): value is SiteDraft {
  if (!isRecord(value) || !isRecord(value.hero) || !isRecord(value.contact)) return false;
  return (
    Array.isArray(value.announcements) &&
    Array.isArray(value.banners) &&
    Array.isArray(value.notices) &&
    Array.isArray(value.updates) &&
    Array.isArray(value.stats) &&
    Array.isArray(value.images)
  );
}

export function applyPreviewPatch(draft: SiteDraft, region: string, value: unknown): SiteDraft {
  if (region === "hero-title" && typeof value === "string") {
    return { ...draft, hero: { ...draft.hero, title: value } };
  }
  if (region === "hero-subtitle" && typeof value === "string") {
    return { ...draft, hero: { ...draft.hero, subtitle: value } };
  }
  if (region === "hero-eyebrow" && typeof value === "string") {
    return { ...draft, hero: { ...draft.hero, eyebrow: value } };
  }
  if (region === "contact-address" && typeof value === "string") {
    return { ...draft, contact: { ...draft.contact, address: value } };
  }
  if (region === "contact-phone" && typeof value === "string") {
    return { ...draft, contact: { ...draft.contact, phone: value } };
  }
  if (region === "contact-email" && typeof value === "string") {
    return { ...draft, contact: { ...draft.contact, email: value } };
  }
  if (region === "ticker-item" && isRecord(value) && typeof value.index === "number" && typeof value.text === "string") {
    const announcements = draft.announcements.map((item, index) =>
      index === value.index ? { ...item, text: value.text as string } : item,
    );
    return { ...draft, announcements };
  }
  if (region === "ticker" && Array.isArray(value)) {
    return { ...draft, announcements: value as AnnouncementCopy[] };
  }
  if (region === "banners" && Array.isArray(value)) {
    return { ...draft, banners: value as BannerCopy[] };
  }
  if (region === "notices" && Array.isArray(value)) {
    return { ...draft, notices: value as NoticeCopy[] };
  }
  if (region === "updates" && Array.isArray(value)) {
    return { ...draft, updates: value as UpdateCopy[] };
  }
  if (region === "hero" && isRecord(value)) {
    return {
      ...draft,
      hero: {
        eyebrow: asString(value.eyebrow, draft.hero.eyebrow),
        title: asString(value.title, draft.hero.title),
        subtitle: asString(value.subtitle, draft.hero.subtitle),
      },
    };
  }
  if (region === "contact" && isRecord(value)) {
    return {
      ...draft,
      contact: {
        address: asString(value.address, draft.contact.address),
        phone: asString(value.phone, draft.contact.phone),
        email: asString(value.email, draft.contact.email),
      },
    };
  }
  return draft;
}
