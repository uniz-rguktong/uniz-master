/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Home,
  BookOpen,
  Info,
  Users,
  Bell,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Search,
  Pencil,
  X,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { Skeleton } from "@/components/ui/Skeleton";
import { LANDING_API_URL } from "../../../api/endpoints";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminCardClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminTextareaClass,
  adminChipClass,
  adminDangerButtonClass,
  adminInputClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const PAGE_LABELS: Record<string, string> = {
  aboutrgukt: "About RGUKT",
  campuslife: "Campus Life",
  edusys: "Education System",
  govcouncil: "Governing Council",
  rtiinfo: "RTI Information",
  scst: "SC/ST Cell",
  AcademicPrograms: "Academic Programs",
  AcademicCalender: "Academic Calendar",
  AcademicRegulations: "Academic Regulations",
  curicula: "Curricula",
  careers: "Careers",
  newsupdates: "News Updates",
  tenders: "Tenders",
};

const formatPageLabel = (page: string) =>
  PAGE_LABELS[page] ||
  page.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

const SECTIONS = [
  {
    id: "home",
    label: "Home",
    description: "Hero, highlights, and primary landing metrics.",
    icon: Home,
    endpoint: "/api/home/",
    pages: null,
  },
  {
    id: "institute",
    label: "Institute",
    description: "Campus life, governance, and university history.",
    icon: Info,
    endpoint: "/api/institute/",
    pages: ["aboutrgukt", "campuslife", "edusys", "govcouncil", "rtiinfo", "scst"],
  },
  {
    id: "academics",
    label: "Academics",
    description: "Regulations, calendars, curricula, and programs.",
    icon: BookOpen,
    endpoint: "/api/academics/",
    pages: ["AcademicPrograms", "AcademicCalender", "AcademicRegulations", "curicula"],
  },
  {
    id: "departments",
    label: "Dept Staff",
    description: "Faculty directories across all branches.",
    icon: Users,
    endpoint: "/api/departments/",
    pages: [
      "BIOLOGY", "CHEMISTRY", "CIVIL", "CSE", "ECE", "EEE", "ENGLISH", "IT",
      "LIB", "MANAGEMENT", "MATHEMATICS", "ME", "PED", "PHYSICS", "TELUGU", "YOGA",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "News, careers, and official tenders.",
    icon: Bell,
    endpoint: "/api/notifications/",
    pages: ["careers", "newsupdates", "tenders"],
  },
];

const contentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const getAuthToken = () => {
  const rawToken = localStorage.getItem("admin_token");
  if (!rawToken) return "";
  try {
    return JSON.parse(rawToken);
  } catch {
    return rawToken;
  }
};

export default function WebsiteUpdatesSection() {
  const [activeSectionId, setActiveSectionId] = useState("home");
  const [activePage, setActivePage] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeSection = SECTIONS.find((s) => s.id === activeSectionId)!;

  const filteredPages = useMemo(() => {
    if (!activeSection.pages) return [];
    const q = pageSearch.trim().toLowerCase();
    if (!q) return activeSection.pages;
    return activeSection.pages.filter(
      (p) =>
        p.toLowerCase().includes(q) ||
        formatPageLabel(p).toLowerCase().includes(q),
    );
  }, [activeSection.pages, pageSearch]);

  useEffect(() => {
    setData(null);
    setEditMode(false);
    setPageSearch("");
    if (activeSection.pages?.length) {
      setActivePage(activeSection.pages[0]);
    } else {
      setActivePage(null);
    }
  }, [activeSectionId]);

  const fetchData = useCallback(async () => {
    const isReady =
      (activeSection.pages === null && activePage === null) ||
      (activeSection.pages !== null &&
        activePage !== null &&
        activeSection.pages.includes(activePage));

    if (!isReady) return;

    setLoading(true);
    setEditMode(false);
    try {
      const base = activeSection.endpoint;
      let url = `${LANDING_API_URL}${base.endsWith("/") ? base : base + "/"}`;
      if (activeSectionId === "notifications" && activePage) {
        url += `?type=${activePage}`;
      } else if (activePage) {
        url += activePage;
      }
      url += (url.includes("?") ? "&" : "?") + "v=" + Date.now();
      const res = await fetch(url.replace(/([^:]\/)\/+/g, "$1"));
      if (!res.ok) throw new Error("Failed to fetch data");
      setData(await res.json());
    } catch (err: any) {
      toast.error(err.message || "Connection refused");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeSection, activeSectionId, activePage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCloudinaryUpload = async (file: File): Promise<string | null> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary configuration missing");
      return null;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      const json = await res.json();
      return json.secure_url || null;
    } catch {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const base = activeSection.endpoint;
      let url = `${LANDING_API_URL}${base.endsWith("/") ? base : base + "/"}`;
      if (activeSectionId === "notifications" && activePage) {
        url += `?type=${activePage}`;
      } else if (activePage) {
        url += activePage;
      }
      url += (url.includes("?") ? "&" : "?") + "v=" + Date.now();

      const res = await fetch(url.replace(/([^:]\/)\/+/g, "$1"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Content saved");
      setEditMode(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Server error occurred");
    } finally {
      setSaving(false);
    }
  };

  const updateNestedData = (path: string[], value: any) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const root = Array.isArray(prev) ? [...prev] : { ...prev };
      let current = root;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
        current = current[key];
      }
      current[path[path.length - 1]] = value;
      return root;
    });
  };

  const deleteArrayItem = (path: string[], index: number) => {
    setData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < path.length; i++) current = current[path[i]];
      current.splice(index, 1);
      return newData;
    });
  };

  const addArrayItem = (path: string[], template: any) => {
    setData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < path.length; i++) current = current[path[i]];
      current.push(JSON.parse(JSON.stringify(template)));
      return newData;
    });
  };

  const breadcrumb = activePage
    ? `${activeSection.label} / ${formatPageLabel(activePage)}`
    : activeSection.label;

  const SkeletonLoader = () => (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn(adminCardClass, "p-6 space-y-3")}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );

  const WorkspaceActions = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn("flex items-center gap-2", compact && "flex-wrap")}>
      {editMode ? (
        <>
          <button
            type="button"
            onClick={() => fetchData()}
            className={adminGhostButtonClass}
          >
            <X size={14} /> Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={adminPrimaryButtonClass}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Save
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={fetchData}
            className={cn(adminGhostButtonClass, "w-10 px-0")}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={adminPrimaryButtonClass}
          >
            <Pencil size={14} /> Edit
          </button>
        </>
      )}
    </div>
  );

  const FieldInput = ({ label, value, onUpdate, isImage = false }: any) => {
    const [localValue, setLocalValue] = useState(value);
    const [uploading, setUploading] = useState(false);
    const strVal = String(localValue ?? "");
    const isLong = strVal.length > 80 || strVal.includes("\n");

    useEffect(() => setLocalValue(value), [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const url = await handleCloudinaryUpload(file);
      if (url) {
        setLocalValue(url);
        onUpdate(url);
        toast.success("Image updated");
      }
      setUploading(false);
    };

    const displayLabel = label.replace(/_/g, " ");

    return (
      <div className="group flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className={cn(adminLabelClass, "normal-case capitalize")}>
            {displayLabel}
          </label>
          {isImage && editMode && (
            <label className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-zinc-800 cursor-pointer transition-colors">
              <input
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Upload size={12} />
              )}
              {uploading ? "Uploading…" : "Upload"}
            </label>
          )}
        </div>

        {editMode ? (
          typeof value === "boolean" ? (
            <button
              type="button"
              onClick={() => onUpdate(!value)}
              className={cn(
                "h-10 px-3 rounded-xl text-[13px] font-medium flex items-center justify-between border transition-all duration-200",
                value
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300",
              )}
            >
              <span>{value ? "Enabled" : "Disabled"}</span>
              <span
                className={cn(
                  "w-9 h-5 rounded-full relative transition-colors",
                  value ? "bg-emerald-500" : "bg-zinc-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                    value ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              {isLong ? (
                <textarea
                  value={strVal}
                  rows={3}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onBlur={() => onUpdate(localValue)}
                  className={adminTextareaClass}
                />
              ) : (
                <input
                  type="text"
                  value={strVal}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onBlur={() => onUpdate(localValue)}
                  className={adminInputClass}
                />
              )}
              {isImage && localValue && (
                <div className="h-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80">
                  <img
                    src={localValue}
                    className="w-full h-full object-contain"
                    alt="Preview"
                  />
                </div>
              )}
            </div>
          )
        ) : (
          <div className="rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 transition-colors group-hover:border-zinc-300/80">
            {isImage && value && (
              <div className="mb-2.5 h-28 overflow-hidden rounded-lg bg-zinc-50 border border-zinc-100">
                <img
                  src={value}
                  className="w-full h-full object-contain"
                  alt=""
                />
              </div>
            )}
            <p className="text-[13px] text-zinc-700 leading-relaxed break-words">
              {typeof value === "boolean"
                ? value
                  ? "Active"
                  : "Disabled"
                : strVal || "—"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const DynamicForm: any = ({ obj, path = [], depth = 0 }: any) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

    const toggleKey = (key: string) =>
      setCollapsedKeys((prev) => ({ ...prev, [key]: !prev[key] }));

    if (obj === null || obj === undefined) return null;

    if (Array.isArray(obj) && path.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className={adminLabelClass}>Entries</h4>
              <span className={adminChipClass}>{obj.length}</span>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={() => addArrayItem([], obj[0] || {})}
                className={cn(adminGhostButtonClass, "h-9")}
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>

          <div className="space-y-2">
            {obj.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              const name =
                item.name || item.title || item.label || `Entry ${idx + 1}`;
              const image =
                item.pic ||
                item.image ||
                item.imageUrl ||
                item.url ||
                item.thumbnail;
              const sub = item.designation || item.dept || item.type || "";

              return (
                <motion.div
                  key={idx}
                  layout
                  className={cn(
                    adminCardClass,
                    "overflow-hidden transition-shadow duration-200",
                    isExpanded && "shadow-[0_8px_24px_-12px_rgba(10,10,10,0.12)] border-zinc-300",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className={cn(
                      "w-full p-4 flex items-center gap-4 text-left transition-colors",
                      isExpanded ? "bg-zinc-50/80" : "hover:bg-zinc-50/50",
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                      {image ? (
                        <img
                          src={image}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <Users size={18} className="text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm truncate capitalize">
                        {String(name).toLowerCase()}
                      </p>
                      {sub && (
                        <p className="text-[10px] font-medium text-zinc-400 tracking-wide mt-0.5 truncate">
                          {sub}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className={cn(
                        "text-zinc-400 shrink-0 transition-transform duration-200",
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
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-zinc-100">
                          <div className="flex justify-end mb-3">
                            {editMode && (
                              <button
                                type="button"
                                onClick={() => deleteArrayItem([], idx)}
                                className={cn(adminDangerButtonClass, "h-8 text-xs")}
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>
                          <DynamicForm
                            obj={item}
                            path={[idx.toString()]}
                            depth={depth + 1}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }

    if (typeof obj !== "object") {
      const key = path[path.length - 1] || "Value";
      return (
        <FieldInput
          label={key}
          value={obj}
          onUpdate={(v: any) => updateNestedData(path, v)}
          isImage={/pic|img|image|logo|icon|url/i.test(key)}
        />
      );
    }

    const scalarEntries: [string, unknown][] = [];
    const complexEntries: [string, unknown][] = [];

    Object.entries(obj).forEach(([key, value]) => {
      if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        complexEntries.push([key, value]);
      } else {
        scalarEntries.push([key, value]);
      }
    });

    return (
      <div className="space-y-6">
        {scalarEntries.length > 0 && (
          <div
            className={cn(
              "grid gap-4",
              depth === 0 ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {scalarEntries.map(([key, value]) => {
              const currentPath = [...path, key];
              return (
                <FieldInput
                  key={key}
                  label={key}
                  value={value}
                  onUpdate={(v: any) => updateNestedData(currentPath, v)}
                  isImage={/pic|img|image|logo|icon|url/i.test(key)}
                />
              );
            })}
          </div>
        )}

        {complexEntries.map(([key, value]) => {
          const currentPath = [...path, key];
          const sectionKey = currentPath.join(".");
          const isCollapsed = collapsedKeys[sectionKey];

          if (Array.isArray(value)) {
            return (
              <div
                key={key}
                className={cn(adminCardClass, "p-5 space-y-4")}
              >
                <button
                  type="button"
                  onClick={() => toggleKey(sectionKey)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      size={14}
                      className={cn(
                        "text-zinc-400 transition-transform",
                        !isCollapsed && "rotate-90",
                      )}
                    />
                    <h4 className={cn(adminLabelClass, "normal-case capitalize")}>
                      {key.replace(/_/g, " ")}
                    </h4>
                    <span className={adminChipClass}>{value.length}</span>
                  </div>
                  {editMode && !isCollapsed && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        addArrayItem(currentPath, value[0] || {});
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          addArrayItem(currentPath, value[0] || {});
                        }
                      }}
                      className={cn(adminGhostButtonClass, "h-8 text-xs shrink-0")}
                    >
                      <Plus size={12} /> Add
                    </span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 pt-1">
                        {value.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 relative"
                          >
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <span className="text-[9px] font-semibold text-zinc-300">
                                #{idx + 1}
                              </span>
                              {editMode && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteArrayItem(currentPath, idx)
                                  }
                                  className="p-1 text-zinc-300 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <DynamicForm
                              obj={item}
                              path={[...currentPath, idx.toString()]}
                              depth={depth + 1}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <div key={key} className={cn(adminCardClass, "p-5")}>
              <button
                type="button"
                onClick={() => toggleKey(sectionKey)}
                className="w-full flex items-center gap-2 text-left mb-1"
              >
                <ChevronRight
                  size={14}
                  className={cn(
                    "text-zinc-400 transition-transform",
                    !isCollapsed && "rotate-90",
                  )}
                />
                <h4 className={cn(adminLabelClass, "normal-case capitalize")}>
                  {key.replace(/_/g, " ")}
                </h4>
              </button>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pt-3 pl-5 border-l-2 border-zinc-100"
                  >
                    <DynamicForm
                      obj={value}
                      path={currentPath}
                      depth={depth + 1}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#fafafa] overflow-hidden">
      <div className="px-6 md:px-8 pt-6 pb-4 shrink-0">
        <SectionHeader
          icon={<Globe size={18} />}
          eyebrow="Campus"
          title="Website Content"
          subtitle="Manage landing pages — home, institute, academics, departments, and notifications."
        />
      </div>

      <div className="flex flex-1 min-h-0 border-t border-zinc-200/70">
        {/* Sidebar */}
        <aside
          className={cn(
            "shrink-0 flex flex-col border-r border-zinc-200/70 bg-white transition-all duration-300 ease-out",
            sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden border-r-0",
          )}
        >
          <div className="p-4 space-y-1 overflow-y-auto custom-sidebar-scroll flex-1">
            <p className={cn(adminLabelClass, "px-2 mb-2")}>Sections</p>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200",
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  )}
                >
                  <Icon
                    size={16}
                    className={cn("mt-0.5 shrink-0", isActive ? "text-white" : "text-zinc-400")}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold tracking-tight">
                      {section.label}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] mt-0.5 leading-snug",
                        isActive ? "text-zinc-300" : "text-zinc-400",
                      )}
                    >
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeSection.pages && (
            <div className="border-t border-zinc-100 p-4 space-y-3 max-h-[45%] flex flex-col">
              <p className={cn(adminLabelClass, "px-1")}>
                {activeSectionId === "departments" ? "Department" : "Page"}
              </p>
              {activeSection.pages.length > 6 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Filter…"
                    className={cn(adminInputClass, "pl-9 h-9 text-[12px]")}
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto custom-sidebar-scroll space-y-1 pr-0.5">
                {filteredPages.map((page) => {
                  const isPageActive = activePage === page;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setActivePage(page)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150",
                        isPageActive
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
                      )}
                    >
                      {formatPageLabel(page)}
                    </button>
                  );
                })}
                {filteredPages.length === 0 && (
                  <p className="text-[11px] text-zinc-400 px-2 py-4 text-center">
                    No matches
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
          <header className="shrink-0 sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-zinc-200/70">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className={cn(adminGhostButtonClass, "w-9 px-0 shrink-0 lg:hidden")}
                title="Toggle sidebar"
              >
                <LayoutGrid size={16} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-zinc-400 tracking-wide">
                  Workspace
                </p>
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {breadcrumb}
                </p>
              </div>
              {editMode && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold tracking-wide">
                  <Pencil size={10} /> Editing
                </span>
              )}
            </div>
            <WorkspaceActions />
          </header>

          <div className="flex-1 overflow-y-auto custom-sidebar-scroll">
            <div className="max-w-4xl mx-auto px-5 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSectionId}-${activePage ?? "root"}`}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {loading ? (
                    <SkeletonLoader />
                  ) : !data ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                        <AlertTriangle size={24} />
                      </div>
                      <h4 className="text-lg font-semibold text-zinc-900 mb-1.5">
                        Could not load content
                      </h4>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Ensure the gateway and landing CMS are running. API:{" "}
                        <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">
                          {LANDING_API_URL}
                        </code>
                      </p>
                      <button
                        type="button"
                        onClick={fetchData}
                        className={cn(adminGhostButtonClass, "mt-5")}
                      >
                        <RefreshCw size={14} /> Retry
                      </button>
                    </div>
                  ) : (
                    <DynamicForm obj={data} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {editMode && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 sticky bottom-0 z-30 px-5 py-3 bg-white/95 backdrop-blur-md border-t border-zinc-200/70 flex items-center justify-between gap-4 md:hidden"
              >
                <p className="text-[12px] font-medium text-zinc-500">
                  Unsaved edits
                </p>
                <WorkspaceActions compact />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
