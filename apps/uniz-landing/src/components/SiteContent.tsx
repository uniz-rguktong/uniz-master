import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getCampusUpdates,
  getHomeData,
  getNotifications,
  getPublicBanners,
} from "@/types/api";
import {
  ADMIN_SOURCE,
  LANDING_SOURCE,
  applyPreviewPatch,
  isAllowedPortalOrigin,
  isSiteDraft,
  previewChromeEnabled,
  readPreviewMessage,
  type SiteDraft,
} from "@/lib/preview-protocol";
import { DEFAULT_CONTACT, DEFAULT_HERO } from "@/lib/site-defaults";
import { SiteContext, type SiteContextValue } from "@/components/site-context";

const previewRequested =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";

function blankDraft(): SiteDraft {
  return {
    hero: { ...DEFAULT_HERO },
    contact: { ...DEFAULT_CONTACT },
    announcements: [],
    banners: [],
    notices: [],
    updates: [],
    stats: [],
    images: [],
  };
}

function parentOrigin(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;
  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<SiteDraft>(blankDraft);
  const [overlay, setOverlay] = useState<SiteDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const publishedRef = useRef(published);
  const authorizedRef = useRef(false);
  const parentRef = useRef<string | null>(null);

  useEffect(() => {
    publishedRef.current = published;
  }, [published]);

  const postToParent = useCallback((message: Record<string, unknown>) => {
    const origin = parentRef.current;
    if (!origin || window.parent === window) return;
    window.parent.postMessage({ source: LANDING_SOURCE, ...message }, origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getHomeData(), getNotifications("news_updates"), getPublicBanners(), getCampusUpdates()])
      .then(([home, notices, banners, updates]) => {
        if (cancelled) return;
        setPublished({
          hero: home.hero,
          contact: home.contact,
          announcements: home.announcements,
          stats: home.stats,
          images: home.images,
          banners: banners.map((banner) => ({
            id: banner.id,
            title: banner.title,
            text: banner.text,
            imageUrl: banner.imageUrl,
            isVisible: banner.isVisible,
          })),
          notices: notices.map((notice) => ({
            title: notice.title,
            date: notice.date,
            links: notice.links ?? [],
          })),
          updates: updates.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            link: item.link ?? null,
            isVisible: item.isVisible,
          })),
        });
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!previewRequested) return;

    const origin = parentOrigin();
    if (origin && isAllowedPortalOrigin(origin, import.meta.env.DEV)) {
      parentRef.current = origin;
      window.parent.postMessage({ source: LANDING_SOURCE, type: "ready" }, origin);
    }

    const onMessage = (event: MessageEvent) => {
      if (!isAllowedPortalOrigin(event.origin, import.meta.env.DEV)) return;
      if (event.source !== window.parent) return;
      if (parentRef.current && event.origin !== parentRef.current) return;
      const message = readPreviewMessage(event.data, ADMIN_SOURCE);
      if (!message) return;
      parentRef.current = event.origin;
      const data = event.data as Record<string, unknown>;

      if (message.type === "auth" && typeof data.token === "string") {
        const token = data.token;
        const landingApi = (import.meta.env.VITE_LANDING_API_URL ?? "").replace(/\/$/, "");
        void fetch(`${landingApi}/api/preview/session`, {
          headers: { accept: "application/json", Authorization: `Bearer ${token}` },
        })
          .then(async (res) => {
            const body = res.ok ? await res.json().catch(() => null) : null;
            const ok = res.ok && body?.ok === true && body?.role === "webadmin";
            authorizedRef.current = ok;
            setAuthorized(ok);
            if (ok) document.documentElement.dataset.sitePreview = "1";
            else delete document.documentElement.dataset.sitePreview;
            window.parent.postMessage(
              { source: LANDING_SOURCE, type: ok ? "authorized" : "denied" },
              event.origin,
            );
          })
          .catch(() => {
            authorizedRef.current = false;
            setAuthorized(false);
            delete document.documentElement.dataset.sitePreview;
            window.parent.postMessage({ source: LANDING_SOURCE, type: "denied" }, event.origin);
          });
        return;
      }

      if (!authorizedRef.current) return;
      if (message.type === "draft" && isSiteDraft(data.draft)) {
        setOverlay(data.draft);
      } else if (message.type === "select" && typeof data.region === "string") {
        setActiveRegion(data.region);
      } else if (message.type === "patch" && typeof data.region === "string") {
        setOverlay((current) => applyPreviewPatch(current ?? publishedRef.current, data.region as string, data.value));
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      delete document.documentElement.dataset.sitePreview;
    };
  }, []);

  const chrome = previewChromeEnabled(previewRequested, authorized);
  const shown = chrome && overlay ? overlay : published;

  const select = useCallback(
    (region: string) => {
      if (!authorizedRef.current) return;
      setActiveRegion(region);
      postToParent({ type: "select", region });
    },
    [postToParent],
  );

  const patch = useCallback(
    (region: string, value: unknown) => {
      if (!authorizedRef.current) return;
      setOverlay((current) => applyPreviewPatch(current ?? publishedRef.current, region, value));
      postToParent({ type: "patch", region, value });
    },
    [postToParent],
  );

  const value = useMemo<SiteContextValue>(
    () => ({
      ...shown,
      ready,
      authorized: chrome,
      activeRegion,
      select,
      patch,
    }),
    [shown, ready, chrome, activeRegion, select, patch],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
