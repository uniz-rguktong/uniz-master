import { useEffect, useState } from "react";
import { BASE_URL, GET_NOTIFICATIONS } from "@/api/endpoints";

export type CampusUpdate = {
  _id?: string;
  id?: string;
  title: string;
  content?: string;
  description?: string;
  link?: string;
  isVisible?: boolean;
  createdAt?: string;
};

const CMS_API_KEY =
  (import.meta.env.VITE_CMS_PUBLIC_API_KEY as string | undefined)?.trim() ||
  "uniz-landing-v1-key";
const EMPTY_UPDATES: CampusUpdate[] = [];

function extractUpdates(payload: unknown): CampusUpdate[] {
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;

  if (data.success === false) return [];

  const nested = data.notifications as Record<string, unknown> | undefined;
  if (Array.isArray(nested?.updates)) {
    return nested.updates as CampusUpdate[];
  }

  if (Array.isArray(data.updates)) return data.updates as CampusUpdate[];
  if (Array.isArray(data.notifications)) {
    return data.notifications as CampusUpdate[];
  }

  const inner = data.data as Record<string, unknown> | undefined;
  if (Array.isArray(inner?.updates)) return inner.updates as CampusUpdate[];
  if (Array.isArray(inner?.notifications)) {
    return inner.notifications as CampusUpdate[];
  }

  return [];
}

function visibleUpdates(items: CampusUpdate[]) {
  return items.filter((item) => item.isVisible !== false);
}

async function fetchCampusUpdates(signal?: AbortSignal): Promise<CampusUpdate[]> {
  // GET only — avoid Content-Type so browsers skip an unnecessary preflight.
  const headers = new Headers({
    "x-cms-api-key": CMS_API_KEY,
    Accept: "application/json",
  });
  const opts: RequestInit = {
    method: "GET",
    headers,
    signal,
    cache: "no-store",
    mode: "cors",
    credentials: "omit",
  };

  const urls = Array.from(
    new Set([GET_NOTIFICATIONS, `${BASE_URL}/cms/notifications`]),
  );

  for (const url of urls) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) continue;
      const json = await res.json();
      const items = visibleUpdates(extractUpdates(json));
      if (items.length > 0) return items;
      // Successful empty payload — stop; do not fall through as error.
      return items;
    } catch {
      // try next endpoint
    }
  }

  return [];
}

export function useCampusUpdates(fallback: CampusUpdate[] = EMPTY_UPDATES) {
  const [updates, setUpdates] = useState<CampusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchCampusUpdates(controller.signal)
      .then((items) => {
        if (cancelled) return;
        if (items.length > 0) {
          setUpdates(items);
          setFromApi(true);
        } else {
          setUpdates(fallback);
          setFromApi(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUpdates(fallback);
          setFromApi(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // fallback is a stable module constant for NoticeBoard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { updates, loading, fromApi };
}

export function getTimeAgo(date: string | undefined) {
  if (!date) return "Just now";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
