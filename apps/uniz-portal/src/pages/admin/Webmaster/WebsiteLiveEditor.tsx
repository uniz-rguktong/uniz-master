/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/utils/toast-ref";
import { LiveEditorChrome } from "@/components/admin/LiveEditorChrome";
import {
  adminCardClass,
  adminChipClass,
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
      <label className={adminLabelClass}>
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
            "mt-1 border-transparent bg-transparent hover:bg-surface-2 focus:bg-surface focus:border-border-strong px-2 -mx-2",
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
      <label className={adminLabelClass}>
        {label}
      </label>
      <label
        className={cn(
          "mt-2 block cursor-pointer overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface",
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
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 opacity-0 transition-opacity hover:opacity-100">
              <span className="rounded-lg border border-border bg-surface px-2 py-1 text-caption font-semibold text-text">
                Change image
              </span>
            </div>
          </div>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center gap-1 text-text-3">
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                <span className="text-caption font-semibold">Upload image</span>
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
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint text-head">
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            <p className="text-caption text-text-3">{count} items</p>
          </div>
        </div>
        <Button type="button" size="compact" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <div className="p-4 space-y-3 bg-surface-2/30">{children}</div>
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
          className="rounded-xl border border-border bg-surface p-4 group hover:border-border-strong hover:shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow]"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-head">
              <Megaphone size={14} />
              <span className="text-caption font-semibold">
                Ticker #{idx + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["announcements"], idx)}
              className="p-1.5 text-text-3 hover:text-error hover:bg-tint rounded-lg opacity-0 group-hover:opacity-100 transition-[color,background-color,border-color,opacity,transform,box-shadow]"
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
            className="rounded-xl border border-border bg-surface p-4 group relative hover:border-border-strong transition-colors"
          >
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["stats"], idx)}
              className="absolute top-2 right-2 p-1 text-text-3 hover:text-error opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
            <p className="text-2xl font-semibold text-head mb-1 tabular-nums">
              <input
                type="text"
                value={item.value ?? ""}
                onChange={(e) =>
                  helpers.updateNestedData(["stats", idx.toString(), "value"], e.target.value)
                }
                className="w-full bg-transparent border-none p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                placeholder="0"
              />
            </p>
            <input
              type="text"
              value={item.label ?? ""}
              onChange={(e) =>
                helpers.updateNestedData(["stats", idx.toString(), "label"], e.target.value)
              }
              className="w-full text-caption text-text-2 bg-transparent border-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
            className="group relative aspect-square rounded-lg border border-border bg-surface overflow-hidden"
          >
            {url ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-3">
                <ImageIcon size={20} />
              </div>
            )}
            <button
              type="button"
              onClick={() => helpers.deleteArrayItem(["images"], idx)}
              className="absolute top-1 right-1 rounded-md bg-surface p-1 text-text-3 opacity-0 hover:text-error group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="pt-2 space-y-2 max-h-64 overflow-y-auto custom-sidebar-scroll">
        {items.map((url, idx) => (
          <div key={`url-${idx}`} className="flex gap-2 items-center">
            <span className="text-caption text-text-3 w-6">#{idx + 1}</span>
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
            className="rounded-xl border border-border bg-surface overflow-hidden group hover:border-border-strong hover:shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow]"
          >
            <div className="px-4 py-3 border-b border-border bg-surface-2/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bell size={14} className="text-head shrink-0" />
                <span className="text-caption font-semibold text-text-2 truncate">
                  {item.title || `Entry ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => helpers.deleteArrayItem(pathPrefix, idx)}
                className="p-1.5 text-text-3 hover:text-error rounded-lg opacity-0 group-hover:opacity-100"
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
                  <label className="text-caption font-semibold text-text-3 flex items-center gap-1">
                    <Link2 size={10} /> Links
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...links, { label: "", url: "" }];
                      helpers.updateNestedData([...path, "links"], next);
                    }}
                    className="text-caption font-semibold text-head hover:underline"
                  >
                    + Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {links.map((link, linkIdx) => (
                    <div
                      key={linkIdx}
                      className="flex gap-2 items-start p-2 rounded-lg bg-surface-2 border border-border"
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
                        className="p-1 text-text-3 hover:text-error mt-1"
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
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong py-6 text-dense font-medium text-text-3 hover:bg-tint hover:text-head"
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
                "rounded-xl border bg-surface overflow-hidden transition-[color,background-color,border-color,opacity,transform,box-shadow] group",
                isExpanded
                  ? "border-border-strong"
                  : "border-border hover:border-border-strong",
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 text-left",
                  isExpanded ? "bg-surface-2/80" : "hover:bg-surface-2/50",
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border overflow-hidden flex items-center justify-center shrink-0">
                  {image ? (
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={16} className="text-text-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm truncate">{String(name)}</p>
                  <p className="text-caption text-text-3 mt-0.5">Click to edit</p>
                </div>
                <ChevronRight
                  size={16}
                  className={cn(
                    "text-text-3 shrink-0 transition-transform",
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
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-4 relative">
                      <button
                        type="button"
                        onClick={() => helpers.deleteArrayItem(pathPrefix, idx)}
                        className="absolute top-3 right-3 p-1.5 text-text-3 hover:text-error hover:bg-tint rounded-lg"
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
              className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left bg-surface border-b border-border"
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  size={14}
                  className={cn("text-text-3 transition-transform", !isCollapsed && "rotate-90")}
                />
                <h4 className={cn(adminLabelClass, "normal-case capitalize mb-0")}>
                  {key.replace(/_/g, " ")}
                </h4>
                {Array.isArray(value) && (
                  <span className={adminChipClass}>{value.length}</span>
                )}
              </div>
              {Array.isArray(value) && !isCollapsed && (
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={(e) => {
                    e.stopPropagation();
                    helpers.addArrayItem(currentPath, value[0] ?? {});
                  }}
                >
                  Add
                </Button>
              )}
            </button>
            {!isCollapsed && (
              <div className="p-4 bg-surface-2/30">
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

    if (sectionId === "home") {
      return (
        <div className="grid grid-cols-1 gap-6 min-[821px]:grid-cols-2">
          <AnnouncementsEditor
            items={Array.isArray(data.announcements) ? data.announcements : []}
            helpers={helpers}
          />
          <StatsEditor items={Array.isArray(data.stats) ? data.stats : []} helpers={helpers} />
          <ImagesEditor items={Array.isArray(data.images) ? data.images : []} helpers={helpers} />
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
      <p className="text-center text-caption text-text-3 mt-8 flex items-center justify-center gap-1.5">
        <ExternalLink size={12} />
        Edits auto-publish to the live RGUKT landing site
      </p>
    </div>
  );
}
