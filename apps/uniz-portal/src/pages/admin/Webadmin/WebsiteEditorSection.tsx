import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  adminInputClass,
  adminLabelClass,
  adminTextareaClass,
} from "@/components/admin/admin-ui";
import { cn } from "@/utils/cn";
import { uploadImage } from "@/api/uploadImage";
import {
  BANNERS_BASE,
  BASE_URL,
  LANDING_API_URL,
  UPDATES_BASE,
} from "@/api/endpoints";
import {
  ADMIN_SOURCE,
  LANDING_SOURCE,
  applyPreviewPatch,
  isAllowedLandingOrigin,
  isSiteDraft,
  readPreviewMessage,
  type BannerCopy,
  type NoticeCopy,
  type SiteDraft,
  type UpdateCopy,
} from "@/lib/preview-protocol";

const DEFAULT_HERO = {
  eyebrow: "Ongole Campus",
  title: "Rajiv Gandhi University of Knowledge Technologies",
  subtitle: "Catering to the Educational Needs of Gifted Rural Youth",
};

const DEFAULT_CONTACT = {
  address:
    "Rajiv Gandhi University of Knowledge Technologies, Ongole. RGUKT Ongole Campus, Kurnool Road, Santhanuthalapadu (V&M), Prakasam District, Andhra Pradesh — 523225.",
  phone: "08592-223133",
  email: "director@rguktong.ac.in",
};

function getAuthToken() {
  const raw = localStorage.getItem("admin_token");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw.replace(/^"|"$/g, "");
  } catch {
    return raw.replace(/^"|"$/g, "");
  }
}

function previewPage() {
  const base = (import.meta.env.VITE_LANDING_PREVIEW_URL || "https://rguktong.in").replace(/\/$/, "");
  return `${base}/?preview=1`;
}

function landingUrl(path: string) {
  return `${LANDING_API_URL.replace(/\/$/, "")}${path}`;
}

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

async function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function WebsiteEditorSection() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [draft, setDraft] = useState<SiteDraft | null>(null);
  const [baseline, setBaseline] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [phase, setPhase] = useState<"loading" | "ready" | "denied">("loading");
  const [publishing, setPublishing] = useState(false);
  const draftRef = useRef<SiteDraft | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const post = useCallback((message: Record<string, unknown>) => {
    const frame = frameRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage({ source: ADMIN_SOURCE, ...message }, new URL(previewPage()).origin);
  }, []);

  const load = useCallback(async () => {
    const token = getAuthToken();
    const next = blankDraft();
    try {
      const homeRes = await fetch(`${landingUrl("/api/home/")}?v=${Date.now()}`);
      if (homeRes.ok) {
        const home = await homeRes.json();
        next.hero = { ...DEFAULT_HERO, ...(home.hero ?? {}) };
        next.contact = { ...DEFAULT_CONTACT, ...(home.contact ?? {}) };
        next.announcements = Array.isArray(home.announcements) ? home.announcements : [];
        next.stats = Array.isArray(home.stats) ? home.stats : [];
        next.images = Array.isArray(home.images) ? home.images : [];
      }
    } catch {
      toast.error("The home page did not load");
    }
    try {
      const noticeRes = await fetch(`${landingUrl("/api/notifications/")}?type=news_updates&v=${Date.now()}`);
      if (noticeRes.ok) {
        const notices = await noticeRes.json();
        if (Array.isArray(notices)) next.notices = notices;
      }
    } catch {
      /* notices stay empty and the public page keeps its own fallback */
    }
    if (token) {
      try {
        const bannerRes = await fetch(BANNERS_BASE, { headers: { Authorization: `Bearer ${token}` } });
        if (bannerRes.ok) {
          const body = await bannerRes.json();
          const banners = Array.isArray(body.banners) ? body.banners : [];
          next.banners = banners
            .filter((banner: BannerCopy) => banner.isVisible !== false)
            .map((banner: BannerCopy & { _id?: string }) => ({
              id: banner.id || banner._id,
              title: banner.title,
              text: banner.text,
              imageUrl: banner.imageUrl,
              isVisible: banner.isVisible,
            }));
        }
      } catch {
        /* banners stay empty */
      }
      try {
        const updateRes = await fetch(`${BASE_URL}/cms/notifications`);
        if (updateRes.ok) {
          const body = await updateRes.json();
          const updates = body?.notifications?.updates;
          if (Array.isArray(updates)) {
            next.updates = updates.map((item: UpdateCopy & { _id?: string }) => ({
              id: item.id || item._id,
              title: item.title,
              content: item.content,
              link: item.link ?? null,
              isVisible: item.isVisible,
            }));
          }
        }
      } catch {
        /* campus updates stay empty */
      }
    }
    setDraft(next);
    setBaseline(JSON.stringify(next));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isAllowedLandingOrigin(event.origin, import.meta.env.DEV)) return;
      const message = readPreviewMessage(event.data, LANDING_SOURCE);
      if (!message) return;
      const data = event.data as Record<string, unknown>;
      if (message.type === "ready") {
        const token = getAuthToken();
        if (!token) {
          setPhase("denied");
          return;
        }
        post({ type: "auth", token });
        return;
      }
      if (message.type === "authorized") {
        setPhase("ready");
        if (draftRef.current) post({ type: "draft", draft: draftRef.current });
        return;
      }
      if (message.type === "denied") {
        setPhase("denied");
        return;
      }
      if (message.type === "select" && typeof data.region === "string") {
        setRegion(data.region);
      }
      if (message.type === "patch" && typeof data.region === "string" && draftRef.current) {
        const next = applyPreviewPatch(draftRef.current, data.region, data.value);
        if (isSiteDraft(next)) setDraft(next);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    post({ type: "draft", draft });
  }, [draft, phase, post]);

  const dirty = !!draft && JSON.stringify(draft) !== baseline;

  const edit = (recipe: (current: SiteDraft) => SiteDraft) => {
    setDraft((current) => (current ? recipe(current) : current));
  };

  const replaceBannerImage = async (index: number, file: File) => {
    const previous = draft?.banners[index]?.imageUrl ?? "";
    try {
      const local = await readDataUrl(file);
      edit((current) => ({
        ...current,
        banners: current.banners.map((banner, item) =>
          item === index ? { ...banner, imageUrl: local } : banner,
        ),
      }));
      const url = await uploadImage(file, "banner");
      if (!url) {
        edit((current) => ({
          ...current,
          banners: current.banners.map((banner, item) =>
            item === index ? { ...banner, imageUrl: previous } : banner,
          ),
        }));
        return;
      }
      edit((current) => ({
        ...current,
        banners: current.banners.map((banner, item) =>
          item === index ? { ...banner, imageUrl: url } : banner,
        ),
      }));
    } catch {
      toast.error("Image upload failed");
    }
  };

  const publish = async () => {
    if (!draft || publishing) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Sign in as webadmin to publish");
      return;
    }
    for (const banner of draft.banners) {
      if (!banner.title.trim() || banner.title.trim().length < 3 || banner.text.trim().length < 3) {
        toast.error("Each banner needs a title and text");
        return;
      }
      if (!banner.imageUrl || banner.imageUrl.startsWith("data:")) {
        toast.error("Upload the banner image before publishing");
        return;
      }
    }
    setPublishing(true);
    try {
      const homeRes = await fetch(landingUrl("/api/home/"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          announcements: draft.announcements,
          stats: draft.stats,
          images: draft.images,
          hero: draft.hero,
          contact: draft.contact,
        }),
      });
      if (!homeRes.ok) throw new Error("Home page save failed");

      const noticeRes = await fetch(`${landingUrl("/api/notifications/")}?type=news_updates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft.notices),
      });
      if (!noticeRes.ok) throw new Error("Notices save failed");

      await syncBanners(draft.banners, baseline, token);
      await syncUpdates(draft.updates, baseline, token);
      const saved = JSON.stringify(draft);
      setBaseline(saved);
      toast.success("Published to rguktong.in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const discard = () => {
    if (!baseline) return;
    const restored = JSON.parse(baseline) as SiteDraft;
    setDraft(restored);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[640px] flex-col bg-surface">
      <div className="border-b border-border px-5 py-4">
        <PageHeader
          title="Website editor"
          meta="Edit rguktong.in on the page. Publish writes the live site. Discard drops the draft."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={viewport === "desktop" ? "outline" : "ghost"}
                size="compact"
                onClick={() => setViewport("desktop")}
              >
                <Monitor size={16} /> Desktop
              </Button>
              <Button
                type="button"
                variant={viewport === "mobile" ? "outline" : "ghost"}
                size="compact"
                onClick={() => setViewport("mobile")}
              >
                <Smartphone size={16} /> Mobile
              </Button>
              <Button type="button" variant="ghost" size="compact" onClick={discard} disabled={!dirty || publishing}>
                Discard
              </Button>
              <Button type="button" size="compact" onClick={() => void publish()} disabled={!dirty || publishing || phase !== "ready"}>
                {publishing ? "Publishing…" : "Publish"}
              </Button>
            </div>
          }
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 bg-surface-2 p-4">
          <div
            className={cn(
              "mx-auto h-full overflow-hidden border border-border bg-surface",
              viewport === "mobile" ? "w-[390px]" : "w-full",
            )}
          >
            <iframe
              ref={frameRef}
              title="RGUKT Ongole preview"
              src={previewPage()}
              className="h-full w-full"
            />
          </div>
        </div>
        <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-surface px-4 py-4">
          {phase === "denied" && (
            <p className="text-[14px] leading-6 text-text-2">
              Preview editing needs a webadmin sign-in. Visitors never see these controls.
            </p>
          )}
          {phase === "loading" && (
            <p className="text-[14px] leading-6 text-text-2">Opening the live preview…</p>
          )}
          {phase === "ready" && draft && (
            <EditorPanel region={region} draft={draft} edit={edit} onImage={replaceBannerImage} />
          )}
        </aside>
      </div>
    </div>
  );
}

function EditorPanel({
  region,
  draft,
  edit,
  onImage,
}: {
  region: string | null;
  draft: SiteDraft;
  edit: (recipe: (current: SiteDraft) => SiteDraft) => void;
  onImage: (index: number, file: File) => void;
}) {
  const hero = !region || region.startsWith("hero");
  const contact = region?.startsWith("contact");
  const ticker = region === "ticker" || region === "ticker-item";
  const banners = region === "banners";
  const notices = region === "notices";
  const updates = region === "updates";
  if (!region) {
    return (
      <p className="text-[14px] leading-6 text-text-2">
        Click a highlighted region on the page. Text can be edited in place. Images open here.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {hero && (
        <Fields title="Hero">
          <Field label="Eyebrow" value={draft.hero.eyebrow} onChange={(eyebrow) => edit((current) => ({ ...current, hero: { ...current.hero, eyebrow } }))} />
          <Field label="Title" value={draft.hero.title} onChange={(title) => edit((current) => ({ ...current, hero: { ...current.hero, title } }))} multiline />
          <Field label="Subtitle" value={draft.hero.subtitle} onChange={(subtitle) => edit((current) => ({ ...current, hero: { ...current.hero, subtitle } }))} multiline />
        </Fields>
      )}
      {contact && (
        <Fields title="Contact">
          <Field label="Address" value={draft.contact.address} multiline onChange={(address) => edit((current) => ({ ...current, contact: { ...current.contact, address } }))} />
          <Field label="Phone" value={draft.contact.phone} onChange={(phone) => edit((current) => ({ ...current, contact: { ...current.contact, phone } }))} />
          <Field label="Email" value={draft.contact.email} onChange={(email) => edit((current) => ({ ...current, contact: { ...current.contact, email } }))} />
        </Fields>
      )}
      {ticker && (
        <Fields
          title="Announcement ticker"
          action={() =>
            edit((current) => ({
              ...current,
              announcements: [...current.announcements, { text: "New announcement", link: null }],
            }))
          }
        >
          {draft.announcements.map((item, index) => (
            <div key={index} className="space-y-2 border-b border-border pb-3">
              <Field
                label={`Announcement ${index + 1}`}
                value={item.text}
                multiline
                onChange={(text) =>
                  edit((current) => ({
                    ...current,
                    announcements: current.announcements.map((row, itemIndex) =>
                      itemIndex === index ? { ...row, text } : row,
                    ),
                  }))
                }
              />
              <Field
                label="Link"
                value={item.link ?? ""}
                onChange={(link) =>
                  edit((current) => ({
                    ...current,
                    announcements: current.announcements.map((row, itemIndex) =>
                      itemIndex === index ? { ...row, link: link || null } : row,
                    ),
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="compact"
                onClick={() =>
                  edit((current) => ({
                    ...current,
                    announcements: current.announcements.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </Fields>
      )}
      {banners && (
        <Fields
          title="Home banners"
          action={() =>
            edit((current) => ({
              ...current,
              banners: [...current.banners, { title: "New banner", text: "Campus notice", imageUrl: "", isVisible: true }],
            }))
          }
        >
          {draft.banners.map((banner, index) => (
            <div key={banner.id || index} className="space-y-2 border-b border-border pb-3">
              {banner.imageUrl ? <img src={banner.imageUrl} alt="" className="h-20 w-full rounded-md object-cover" /> : null}
              <label className={adminLabelClass}>
                Replace image
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-[13px] text-text-2"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onImage(index, file);
                    event.target.value = "";
                  }}
                />
              </label>
              <Field label="Title" value={banner.title} onChange={(title) => edit((current) => ({ ...current, banners: mapAt(current.banners, index, (row) => ({ ...row, title })) }))} />
              <Field label="Text" value={banner.text} multiline onChange={(text) => edit((current) => ({ ...current, banners: mapAt(current.banners, index, (row) => ({ ...row, text })) }))} />
              <Button type="button" variant="ghost" size="compact" onClick={() => edit((current) => ({ ...current, banners: current.banners.filter((_, item) => item !== index) }))}>
                Remove
              </Button>
            </div>
          ))}
        </Fields>
      )}
      {notices && (
        <Fields
          title="Notices and news"
          action={() =>
            edit((current) => ({
              ...current,
              notices: [{ title: "New notice", date: "", links: [] }, ...current.notices],
            }))
          }
        >
          {draft.notices.map((notice, index) => (
            <NoticeFields key={`${notice.title}-${index}`} notice={notice} onChange={(next) => edit((current) => ({ ...current, notices: mapAt(current.notices, index, () => next) }))} onRemove={() => edit((current) => ({ ...current, notices: current.notices.filter((_, item) => item !== index) }))} />
          ))}
        </Fields>
      )}
      {updates && (
        <Fields
          title="Campus updates"
          action={() =>
            edit((current) => ({
              ...current,
              updates: [...current.updates, { title: "New update", content: "", link: null, isVisible: true }],
            }))
          }
        >
          {draft.updates.map((item, index) => (
            <div key={item.id || index} className="space-y-2 border-b border-border pb-3">
              <Field label="Title" value={item.title} onChange={(title) => edit((current) => ({ ...current, updates: mapAt(current.updates, index, (row) => ({ ...row, title })) }))} />
              <Field label="Text" value={item.content} multiline onChange={(content) => edit((current) => ({ ...current, updates: mapAt(current.updates, index, (row) => ({ ...row, content })) }))} />
              <Field label="Link" value={item.link ?? ""} onChange={(link) => edit((current) => ({ ...current, updates: mapAt(current.updates, index, (row) => ({ ...row, link: link || null })) }))} />
              <Button type="button" variant="ghost" size="compact" onClick={() => edit((current) => ({ ...current, updates: current.updates.filter((_, itemIndex) => itemIndex !== index) }))}>
                Remove
              </Button>
            </div>
          ))}
        </Fields>
      )}
    </div>
  );
}

function mapAt<T>(rows: T[], index: number, recipe: (row: T) => T) {
  return rows.map((row, item) => (item === index ? recipe(row) : row));
}

function Fields({
  title,
  action,
  children,
}: {
  title: string;
  action?: () => void;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold leading-6 text-head">{title}</h2>
        {action ? (
          <Button type="button" variant="ghost" size="compact" onClick={action}>
            Add
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className={adminLabelClass}>{label}</span>
      {multiline ? (
        <textarea className={cn(adminTextareaClass, "mt-1 min-h-[72px]")} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={cn(adminInputClass, "mt-1")} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function NoticeFields({
  notice,
  onChange,
  onRemove,
}: {
  notice: NoticeCopy;
  onChange: (notice: NoticeCopy) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 border-b border-border pb-3">
      <Field label="Title" value={notice.title} onChange={(title) => onChange({ ...notice, title })} />
      <Field label="Date" value={notice.date} onChange={(date) => onChange({ ...notice, date })} />
      <Button type="button" variant="ghost" size="compact" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

async function syncBanners(banners: BannerCopy[], baseline: string, token: string) {
  const previous = JSON.parse(baseline) as SiteDraft;
  const kept = new Set(banners.map((banner) => banner.id).filter(Boolean));
  for (const banner of previous.banners) {
    if (banner.id && !kept.has(banner.id)) {
      const res = await fetch(`${BANNERS_BASE}/${banner.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not remove a banner");
    }
  }
  for (const banner of banners) {
    const body = JSON.stringify({
      title: banner.title,
      text: banner.text,
      imageUrl: banner.imageUrl,
      isVisible: banner.isVisible !== false,
    });
    const prior = previous.banners.find((item) => item.id && item.id === banner.id);
    if (!banner.id) {
      const res = await fetch(BANNERS_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error("Could not add a banner");
    } else if (!prior || JSON.stringify(prior) !== JSON.stringify(banner)) {
      const res = await fetch(`${BANNERS_BASE}/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error("Could not update a banner");
    }
  }
}

async function syncUpdates(updates: UpdateCopy[], baseline: string, token: string) {
  const previous = JSON.parse(baseline) as SiteDraft;
  const kept = new Set(updates.map((item) => item.id).filter(Boolean));
  for (const item of previous.updates) {
    if (item.id && !kept.has(item.id)) {
      const res = await fetch(`${UPDATES_BASE}/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not remove a campus update");
    }
  }
  for (const item of updates) {
    if (item.title.trim().length < 3) throw new Error("Each campus update needs a title");
    const body = JSON.stringify({
      title: item.title,
      content: item.content,
      link: item.link || null,
      isVisible: item.isVisible !== false,
    });
    const prior = previous.updates.find((row) => row.id && row.id === item.id);
    if (!item.id) {
      const res = await fetch(UPDATES_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error("Could not add a campus update");
    } else if (!prior || JSON.stringify(prior) !== JSON.stringify(item)) {
      const res = await fetch(`${UPDATES_BASE}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error("Could not update a campus update");
    }
  }
}
