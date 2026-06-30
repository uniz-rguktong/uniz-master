/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  Upload,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "@/utils/toast-ref";
import { LiveEditorChrome } from "@/components/admin/LiveEditorChrome";
import {
  adminCardClass,
  adminChipClass,
  adminGhostButtonClass,
  adminInputClass,
  adminLabelClass,
  adminTextareaClass,
} from "@/components/admin/admin-ui";

type EditorHelpers = {
  updateNestedData: (path: string[], value: any) => void;
  addArrayItem: (path: string[], template: any) => void;
  deleteArrayItem: (path: string[], index: number) => void;
  onUpload: (file: File) => Promise<string | null>;
};

type WebsiteLiveEditorProps = EditorHelpers & {
  sectionId: string;
  sectionLabel: string;
  pageKey: string | null;
  pageLabel: string;
  sectionDescription: string;
  data: any;
  loading?: boolean;
  onRefresh: () => void;
};

function LiveField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={cn(adminTextareaClass, "mt-1 text-sm")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            adminInputClass,
            "mt-1 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-zinc-300 px-2 -mx-2",
            mono && "font-mono text-xs",
          )}
        />
      )}
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const url = await onUpload(file);
    if (url) {
      onChange(url);
      toast.success("Image updated");
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <label
        className={cn(
          "mt-2 block rounded-xl border border-dashed border-slate-200 hover:border-[#800000]/30 bg-slate-50/50 cursor-pointer overflow-hidden transition-colors",
          uploading && "opacity-60 pointer-events-none",
        )}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {value ? (
          <div className="relative h-32">
            <img src={value} alt="" className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold bg-white/90 px-2 py-1 rounded-lg shadow">
                Change image
              </span>
            </div>
          </div>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center gap-1 text-slate-400">
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                <span className="text-[10px] font-semibold">Upload image</span>
              </>
            )}
          </div>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL"
        className={cn(adminInputClass, "mt-2 h-8 text-xs font-mono")}
      />
    </div>
  );
}

function SectionBlock({
  title,
  count,
  icon: Icon,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count: number;
  icon: typeof Bell;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(adminCardClass, "overflow-hidden")}>
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#800000]/5 text-[#800000] flex items-center justify-center">
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            <p className="text-[11px] text-zinc-400">{count} items</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#800000] hover:bg-[#6b0000] text-white text-[12px] font-semibold transition-colors"
        >
          <Plus size={14} />
          {addLabel}
        </button>
      </div>
      <div className="p-4 space-y-3 bg-slate-50/30">{children}</div>
    </section>
  );
}

function AnnouncementsEditor({
  items,
  helpers,
}: {
  items: { text: string; link: string | null }[];
  helpers: EditorHelpers;
}) {
  return (
    <SectionBlock
      title="Announcement ticker"
      count={items.length}
      icon={Megaphone}
      addLabel="Add announcement"
      onAdd={() => helpers.addArrayItem(["announcements"], { text: "", link: "" })}
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          layout
          className="rounded-xl border border-slate-200 bg-white p-4 group hover:border-[#800000]/20 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-[#800000]">
              <Megaphone size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Ticker #{idx + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["announcements"], idx)}
              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <LiveField
              label="Announcement text"
              value={item.text ?? ""}
              onChange={(v) =>
                helpers.updateNestedData(["announcements", idx.toString(), "text"], v)
              }
              placeholder="Text shown on the home page ticker"
            />
            <LiveField
              label="Link URL"
              value={item.link ?? ""}
              onChange={(v) =>
                helpers.updateNestedData(
                  ["announcements", idx.toString(), "link"],
                  v || null,
                )
              }
              placeholder="https://…"
              mono
            />
          </div>
        </motion.div>
      ))}
      <AddPlaceholder
        label="Add another announcement"
        onClick={() => helpers.addArrayItem(["announcements"], { text: "", link: "" })}
      />
    </SectionBlock>
  );
}

function StatsEditor({
  items,
  helpers,
}: {
  items: { label: string; value: string }[];
  helpers: EditorHelpers;
}) {
  return (
    <SectionBlock
      title="Campus statistics"
      count={items.length}
      icon={BarChart3}
      addLabel="Add stat"
      onAdd={() => helpers.addArrayItem(["stats"], { label: "", value: "" })}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white p-4 group relative hover:border-[#800000]/20 transition-colors"
          >
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["stats"], idx)}
              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
            <p className="text-2xl font-bold text-[#800000] mb-1 tabular-nums">
              <input
                type="text"
                value={item.value ?? ""}
                onChange={(e) =>
                  helpers.updateNestedData(["stats", idx.toString(), "value"], e.target.value)
                }
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0"
                placeholder="0"
              />
            </p>
            <input
              type="text"
              value={item.label ?? ""}
              onChange={(e) =>
                helpers.updateNestedData(["stats", idx.toString(), "label"], e.target.value)
              }
              className="w-full text-xs text-slate-500 bg-transparent border-none outline-none"
              placeholder="Stat label"
            />
          </div>
        ))}
      </div>
      <AddPlaceholder
        label="Add stat card"
        onClick={() => helpers.addArrayItem(["stats"], { label: "", value: "" })}
      />
    </SectionBlock>
  );
}

function ImagesEditor({
  items,
  helpers,
}: {
  items: string[];
  helpers: EditorHelpers;
}) {
  return (
    <SectionBlock
      title="Carousel & media images"
      count={items.length}
      icon={ImageIcon}
      addLabel="Add image"
      onAdd={() => helpers.addArrayItem(["images"], "")}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {items.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden"
          >
            {url ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageIcon size={20} />
              </div>
            )}
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["images"], idx)}
              className="absolute top-1 right-1 p-1 bg-white/90 rounded-md text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="pt-2 space-y-2 max-h-64 overflow-y-auto custom-sidebar-scroll">
        {items.map((url, idx) => (
          <div key={`url-${idx}`} className="flex gap-2 items-center">
            <span className="text-[10px] text-zinc-400 w-6">#{idx + 1}</span>
            <input
              type="text"
              value={url}
              onChange={(e) =>
                helpers.updateNestedData(["images", idx.toString()], e.target.value)
              }
              className={cn(adminInputClass, "h-8 text-xs font-mono flex-1")}
            />
          </div>
        ))}
      </div>
      <AddPlaceholder
        label="Add image URL"
        onClick={() => helpers.addArrayItem(["images"], "")}
      />
    </SectionBlock>
  );
}

function NotificationItemsEditor({
  items,
  pathPrefix,
  helpers,
  emptyTemplate,
}: {
  items: any[];
  pathPrefix: string[];
  helpers: EditorHelpers;
  emptyTemplate: any;
}) {
  return (
    <>
      {items.map((item, idx) => {
        const path = [...pathPrefix, idx.toString()];
        const links: { label: string; url: string | null }[] = item.links ?? [];

        return (
          <motion.div
            key={idx}
            layout
            className="rounded-xl border border-slate-200 bg-white overflow-hidden group hover:border-[#800000]/25 hover:shadow-sm transition-all"
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bell size={14} className="text-[#800000] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {item.title || `Entry ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => helpers.deleteArrayItem(pathPrefix, idx)}
                className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <LiveField
                label="Title"
                value={item.title ?? ""}
                onChange={(v) => helpers.updateNestedData([...path, "title"], v)}
              />
              <LiveField
                label="Date"
                value={item.date ?? ""}
                onChange={(v) => helpers.updateNestedData([...path, "date"], v)}
                placeholder="DD-MM-YYYY"
              />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Link2 size={10} /> Links
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...links, { label: "", url: "" }];
                      helpers.updateNestedData([...path, "links"], next);
                    }}
                    className="text-[10px] font-semibold text-[#800000] hover:underline"
                  >
                    + Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {links.map((link, linkIdx) => (
                    <div
                      key={linkIdx}
                      className="flex gap-2 items-start p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-1 space-y-2 min-w-0">
                        <input
                          type="text"
                          value={link.label ?? ""}
                          onChange={(e) => {
                            const next = [...links];
                            next[linkIdx] = { ...next[linkIdx], label: e.target.value };
                            helpers.updateNestedData([...path, "links"], next);
                          }}
                          placeholder="Link label"
                          className={cn(adminInputClass, "h-8 text-xs")}
                        />
                        <input
                          type="text"
                          value={link.url ?? ""}
                          onChange={(e) => {
                            const next = [...links];
                            next[linkIdx] = {
                              ...next[linkIdx],
                              url: e.target.value || null,
                            };
                            helpers.updateNestedData([...path, "links"], next);
                          }}
                          placeholder="PDF or page URL"
                          className={cn(adminInputClass, "h-8 text-xs font-mono")}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = links.filter((_, i) => i !== linkIdx);
                          helpers.updateNestedData([...path, "links"], next);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 mt-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      <AddPlaceholder
        label="Add notification entry"
        onClick={() => helpers.addArrayItem(pathPrefix, emptyTemplate)}
      />
    </>
  );
}

function AddPlaceholder({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-[#800000]/35 py-6 flex items-center justify-center gap-2 text-slate-400 hover:text-[#800000] text-sm font-semibold transition-colors"
    >
      <Plus size={18} />
      {label}
    </button>
  );
}

function GenericLiveForm({
  obj,
  path,
  depth,
  helpers,
}: {
  obj: any;
  path: string[];
  depth: number;
  helpers: EditorHelpers;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(depth === 0 ? 0 : null);
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

  if (obj === null || obj === undefined) return null;

  if (Array.isArray(obj)) {
    const pathPrefix = path;
    return (
      <div className="space-y-3">
        {obj.map((item, idx) => {
          const name =
            item?.name || item?.title || item?.label || item?.text || `Entry ${idx + 1}`;
          const isExpanded = expandedIndex === idx;
          const image =
            item?.pic || item?.photo || item?.image || item?.imageUrl || item?.thumbnail;

          return (
            <motion.div
              key={idx}
              layout
              className={cn(
                "rounded-xl border bg-white overflow-hidden transition-all group",
                isExpanded
                  ? "border-[#800000]/25 shadow-md ring-1 ring-[#800000]/10"
                  : "border-slate-200 hover:border-[#800000]/20",
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 text-left",
                  isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50/50",
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {image ? (
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={16} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm truncate">{String(name)}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Click to edit</p>
                </div>
                <ChevronRight
                  size={16}
                  className={cn(
                    "text-zinc-400 shrink-0 transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-4 relative">
                      <button
                        type="button"
                        onClick={() => helpers.deleteArrayItem(pathPrefix, idx)}
                        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                      <GenericLiveForm
                        obj={item}
                        path={[...pathPrefix, idx.toString()]}
                        depth={depth + 1}
                        helpers={helpers}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        <AddPlaceholder
          label="Add entry"
          onClick={() => helpers.addArrayItem(pathPrefix, obj[0] ?? {})}
        />
      </div>
    );
  }

  if (typeof obj !== "object") {
    const key = path[path.length - 1] || "value";
    const isImage = /pic|photo|img|image|logo|icon|thumbnail|url/i.test(key);
    const str = String(obj ?? "");
    const isLong = str.length > 80 || str.includes("\n");

    if (isImage) {
      return (
        <ImageUploadField
          label={key.replace(/_/g, " ")}
          value={str}
          onChange={(v) => helpers.updateNestedData(path, v)}
          onUpload={helpers.onUpload}
        />
      );
    }

    return (
      <LiveField
        label={key.replace(/_/g, " ")}
        value={str}
        onChange={(v) => helpers.updateNestedData(path, v)}
        multiline={isLong}
      />
    );
  }

  const scalarEntries: [string, unknown][] = [];
  const complexEntries: [string, unknown][] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      complexEntries.push([key, value]);
    } else {
      scalarEntries.push([key, value]);
    }
  });

  return (
    <div className="space-y-5">
      {scalarEntries.length > 0 && (
        <div className={cn("grid gap-4", depth === 0 ? "sm:grid-cols-2" : "grid-cols-1")}>
          {scalarEntries.map(([key, value]) => {
            const currentPath = [...path, key];
            const isImage = /pic|photo|img|image|logo|icon|thumbnail|url/i.test(key);
            const str = String(value ?? "");

            if (isImage) {
              return (
                <ImageUploadField
                  key={key}
                  label={key}
                  value={str}
                  onChange={(v) => helpers.updateNestedData(currentPath, v)}
                  onUpload={helpers.onUpload}
                />
              );
            }

            return (
              <LiveField
                key={key}
                label={key.replace(/_/g, " ")}
                value={str}
                onChange={(v) => helpers.updateNestedData(currentPath, v)}
                multiline={str.length > 80 || str.includes("\n")}
              />
            );
          })}
        </div>
      )}

      {complexEntries.map(([key, value]) => {
        const currentPath = [...path, key];
        const sectionKey = currentPath.join(".");
        const isCollapsed = collapsedKeys[sectionKey];

        return (
          <div key={key} className={cn(adminCardClass, "overflow-hidden")}>
            <button
              type="button"
              onClick={() =>
                setCollapsedKeys((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
              }
              className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left bg-white border-b border-zinc-100"
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  size={14}
                  className={cn("text-zinc-400 transition-transform", !isCollapsed && "rotate-90")}
                />
                <h4 className={cn(adminLabelClass, "normal-case capitalize mb-0")}>
                  {key.replace(/_/g, " ")}
                </h4>
                {Array.isArray(value) && (
                  <span className={adminChipClass}>{value.length}</span>
                )}
              </div>
              {Array.isArray(value) && !isCollapsed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    helpers.addArrayItem(currentPath, value[0] ?? {});
                  }}
                  className={cn(adminGhostButtonClass, "h-8 text-xs shrink-0")}
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </button>
            {!isCollapsed && (
              <div className="p-4 bg-slate-50/30">
                <GenericLiveForm
                  obj={value}
                  path={currentPath}
                  depth={depth + 1}
                  helpers={helpers}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WebsiteLiveEditor({
  sectionId,
  sectionLabel,
  pageKey,
  pageLabel,
  sectionDescription,
  data,
  loading,
  onRefresh,
  updateNestedData,
  addArrayItem,
  deleteArrayItem,
  onUpload,
}: WebsiteLiveEditorProps) {
  const helpers: EditorHelpers = {
    updateNestedData,
    addArrayItem,
    deleteArrayItem,
    onUpload,
  };

  const emptyNotification = {
    title: "",
    date: "",
    links: [{ label: "", url: "" }],
  };

  const renderBody = () => {
    if (!data) return null;

    if (sectionId === "home" && data.announcements) {
      return (
        <div className="space-y-6">
          <AnnouncementsEditor items={data.announcements} helpers={helpers} />
          {data.stats && <StatsEditor items={data.stats} helpers={helpers} />}
          {data.images && <ImagesEditor items={data.images} helpers={helpers} />}
        </div>
      );
    }

    if (sectionId === "notifications") {
      if (Array.isArray(data)) {
        return (
          <SectionBlock
            title={pageLabel}
            count={data.length}
            icon={Bell}
            addLabel="Add entry"
            onAdd={() => addArrayItem([], data[0] ?? emptyNotification)}
          >
            <NotificationItemsEditor
              items={data}
              pathPrefix={[]}
              helpers={helpers}
              emptyTemplate={emptyNotification}
            />
          </SectionBlock>
        );
      }
    }

    if (Array.isArray(data)) {
      return (
        <SectionBlock
          title={pageLabel}
          count={data.length}
          icon={Bell}
          addLabel="Add entry"
          onAdd={() => addArrayItem([], data[0] ?? {})}
        >
          <NotificationItemsEditor
            items={data}
            pathPrefix={[]}
            helpers={helpers}
            emptyTemplate={emptyNotification}
          />
        </SectionBlock>
      );
    }

    return (
      <GenericLiveForm obj={data} path={[]} depth={0} helpers={helpers} />
    );
  };

  return (
    <div className="pb-24">
      <LiveEditorChrome
        sectionId={sectionId}
        pageKey={pageKey}
        sectionLabel={sectionLabel}
        pageLabel={pageLabel}
        description={sectionDescription}
        onRefresh={onRefresh}
        loading={loading}
      />
      {renderBody()}
      <p className="text-center text-[11px] text-slate-400 mt-8 flex items-center justify-center gap-1.5">
        <ExternalLink size={12} />
        Changes publish to the live RGUKT landing site
      </p>
    </div>
  );
}
