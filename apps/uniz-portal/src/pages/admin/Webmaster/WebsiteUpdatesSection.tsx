/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Globe,
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Home,
  BookOpen,
  Info,
  Users,
  Bell,
  CheckCircle2,
  ChevronDown,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { Skeleton } from "@/components/ui/Skeleton";
import { LANDING_API_URL } from "../../../api/endpoints";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminCardClass,
  adminLabelClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminTextareaClass,
  adminChipClass,
  adminDangerButtonClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const SECTIONS = [
  {
    id: "home",
    label: "Home",
    description: "Manage global landing page content including hero sections, key highlights, and primary site metrics.",
    icon: Home,
    endpoint: "/api/home/",
    pages: null,
  },
  {
    id: "institute",
    label: "Institute",
    description: "Update specialized pages regarding campus life, governance, educational systems, and university history.",
    icon: Info,
    endpoint: "/api/institute/",
    pages: [
      "aboutrgukt",
      "campuslife",
      "edusys",
      "govcouncil",
      "rtiinfo",
      "scst",
    ],
  },
  {
    id: "academics",
    label: "Academics",
    description: "Maintain academic regulations, calendars, curricula, and university-wide educational programs.",
    icon: BookOpen,
    endpoint: "/api/academics/",
    pages: [
      "AcademicPrograms",
      "AcademicCalender",
      "AcademicRegulations",
      "curicula",
    ],
  },
  {
    id: "departments",
    label: "Dept Staff",
    description: "Manage departmental personnel, faculty directories, and staff technical assignments across all branches.",
    icon: Users,
    endpoint: "/api/departments/",
    pages: [
      "BIOLOGY",
      "CHEMISTRY",
      "CIVIL",
      "CSE",
      "ECE",
      "EEE",
      "ENGLISH",
      "IT",
      "LIB",
      "MANAGEMENT",
      "MATHEMATICS",
      "ME",
      "PED",
      "PHYSICS",
      "TELUGU",
      "YOGA",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Publish and manage time-sensitive news, career opportunities, and official university tenders.",
    icon: Bell,
    endpoint: "/api/notifications/",
    pages: ["careers", "newsupdates", "tenders"],
  },
];

const getAuthToken = () => {
  const rawToken = localStorage.getItem("admin_token");
  if (!rawToken) return "";
  try {
    return JSON.parse(rawToken);
  } catch (e) {
    return rawToken;
  }
};

export default function WebsiteUpdatesSection() {
  const [activeSectionId, setActiveSectionId] = useState("home");
  const [activePage, setActivePage] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const activeSection = SECTIONS.find((s) => s.id === activeSectionId)!;

  useEffect(() => {
    setData(null);
    setLoading(true);
    if (activeSection.pages && activeSection.pages.length > 0) {
      setActivePage(activeSection.pages[0]);
    } else {
      setActivePage(null);
    }
  }, [activeSectionId]);

  useEffect(() => {
    fetchData();
  }, [activeSectionId, activePage]);

  const fetchData = async () => {
    const isReady = (activeSection.pages === null && activePage === null) ||
      (activeSection.pages !== null && activePage !== null && activeSection.pages.includes(activePage));
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
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Connection refused");
    } finally {
      setLoading(false);
    }
  };

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
        { method: "POST", body: formData }
      );
      const data = await res.json();
      return data.secure_url || null;
    } catch (error) {
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
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Content synchronized successfully");
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
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current.splice(index, 1);
      return newData;
    });
  };

  const addArrayItem = (path: string[], template: any) => {
    setData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current.push(JSON.parse(JSON.stringify(template)));
      return newData;
    });
  };

  const SkeletonLoader = () => (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn(adminCardClass, "p-8 space-y-4")}>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );

  const WorkspaceActions = () => (
    editMode ? (
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => fetchData()} className={adminGhostButtonClass}>
          Discard
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className={adminPrimaryButtonClass}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Save changes
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={fetchData}
          className={cn(adminGhostButtonClass, "w-11 px-0")}
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
        <button type="button" onClick={() => setEditMode(true)} className={adminPrimaryButtonClass}>
          <Save size={15} /> Edit content
        </button>
      </div>
    )
  );

  const FieldInput = ({ label, value, onUpdate, isImage = false }: any) => {
    const [localValue, setLocalValue] = useState(value);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleFileChange = async (e: any) => {
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

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className={cn(adminLabelClass, "capitalize normal-case")}>
            {label.replace(/_/g, " ")}
          </label>
          {isImage && editMode && (
            <div className="relative">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              <button type="button" className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wide">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          )}
        </div>
        {editMode ? (
          typeof value === "boolean" ? (
            <button
              type="button"
              onClick={() => onUpdate(!value)}
              className={cn(
                "w-full h-11 px-4 rounded-xl text-[13px] font-medium flex items-center justify-between transition-all border",
                value
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-50 text-zinc-400 border-zinc-200",
              )}
            >
              <span>{value ? "Enabled" : "Disabled"}</span>
              <div className={cn("w-2.5 h-2.5 rounded-full", value ? "bg-emerald-500" : "bg-zinc-300")} />
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={String(localValue || "")}
                rows={String(localValue || "").length > 80 ? 3 : 1}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => onUpdate(localValue)}
                className={adminTextareaClass}
              />
              {isImage && localValue && (
                <div className="h-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <img src={localValue} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}
            </div>
          )
        ) : (
          <div className="w-full bg-zinc-50/50 border border-zinc-200/70 px-4 py-3 rounded-xl overflow-hidden">
            {isImage && value && (
              <div className="mb-3 h-32 overflow-hidden rounded-lg bg-white border border-zinc-200">
                <img src={value} className="w-full h-full object-contain" alt="pic" />
              </div>
            )}
            <p className="text-[13px] font-medium text-zinc-700 leading-relaxed break-words">
              {typeof value === "boolean" ? (value ? "Active" : "Disabled") : String(value || "—")}
            </p>
          </div>
        )}
      </div>
    );
  };

  const DynamicForm: any = ({ obj, path = [] }: any) => {
    if (obj === null || obj === undefined) return null;
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (Array.isArray(obj) && path.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <h4 className={adminLabelClass}>Managed directory</h4>
               <span className={adminChipClass}>{obj.length} entries</span>
             </div>
             {editMode && (
               <button type="button" onClick={() => addArrayItem([], obj[0] || {})} className={adminPrimaryButtonClass}>
                 <Plus size={14} /> Add entry
               </button>
             )}
          </div>
          <div className="grid grid-cols-1 gap-4">
             {obj.map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                const name = item.name || item.title || item.label || `Entity #${idx + 1}`;
                const image = item.pic || item.image || item.imageUrl || item.url || item.thumbnail;
                const sub = item.designation || item.dept || item.type || "";
                return (
                  <div key={idx} className={cn(adminCardClass, "overflow-hidden transition-all", isExpanded && "border-zinc-300 shadow-[0_4px_16px_-6px_rgba(10,10,10,0.10)]")}>
                     <div className={cn("p-6 flex items-center justify-between gap-6", isExpanded && "bg-zinc-50/50")}>
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                              {image ? <img src={image} className="w-full h-full object-cover" alt="" /> : <Users size={22} className="text-zinc-300" />}
                           </div>
                           <div>
                              <h5 className="font-semibold text-zinc-900 text-base tracking-tight capitalize">{name.toLowerCase()}</h5>
                              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-0.5">{sub}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                           <button
                             type="button"
                             onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                             className={isExpanded ? adminPrimaryButtonClass : adminGhostButtonClass}
                           >
                              {isExpanded ? "Close" : "Edit"} {!isExpanded && <Plus size={14} />}
                           </button>
                           {editMode && (
                             <button type="button" onClick={() => deleteArrayItem([], idx)} className={cn(adminDangerButtonClass, "w-11 px-0")}>
                               <Trash2 size={15} />
                             </button>
                           )}
                        </div>
                     </div>
                     {isExpanded && (
                       <div className="p-8 border-t border-zinc-200/70 bg-white animate-in slide-in-from-top-4 duration-300">
                         <DynamicForm obj={item} path={[idx.toString()]} />
                       </div>
                     )}
                  </div>
                );
             })}
          </div>
        </div>
      );
    }

    if (typeof obj !== "object") {
       const key = path[path.length - 1] || "Value";
       return <FieldInput label={key} value={obj} onUpdate={(v: any) => updateNestedData(path, v)} isImage={/pic|img|image|logo|icon|url/i.test(key)} />;
    }

    return (
      <div className="space-y-8">
        {Object.entries(obj).map(([key, value]) => {
          const currentPath = [...path, key];
          if (Array.isArray(value)) {
            return (
              <div key={key} className="space-y-4 pt-6 border-t border-zinc-100 first:border-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <h4 className={adminLabelClass}>
                    {key.replace(/_/g, " ")} <span className="opacity-50 ml-1">({value.length})</span>
                  </h4>
                  {editMode && (
                    <button type="button" onClick={() => addArrayItem(currentPath, value[0] || {})} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1.5">
                      <Plus size={12} /> Add item
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 ml-2 border-l-2 border-zinc-100 pl-6">
                  {value.map((item, idx) => (
                    <div key={idx} className={cn(adminCardClass, "relative p-6")}>
                      <div className="absolute top-5 right-5 flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-zinc-300 tracking-wide">#{idx + 1}</span>
                        {editMode && (
                          <button type="button" onClick={() => deleteArrayItem(currentPath, idx)} className="p-1.5 text-zinc-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <DynamicForm obj={item} path={[...currentPath, idx.toString()]} />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (typeof value === "object" && value !== null) {
            return (
              <div key={key} className="space-y-4 pt-6 border-t border-zinc-100 first:border-0 first:pt-0">
                <h4 className={adminLabelClass}>{key.replace(/_/g, " ")}</h4>
                <div className="ml-2 border-l-2 border-zinc-100 pl-6"><DynamicForm obj={value} path={currentPath} /></div>
              </div>
            );
          }
          return <FieldInput key={key} label={key} value={value} onUpdate={(v: any) => updateNestedData(currentPath, v)} isImage={/pic|img|image|logo|icon|url/i.test(key)} />;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500 bg-[#fafafa]">
      <div className="flex-1 overflow-y-auto custom-sidebar-scroll">
        <div className="px-6 md:px-8 pt-8 pb-4">
          <SectionHeader
            icon={<Globe size={18} />}
            eyebrow="Campus"
            title="Website Content"
            subtitle="Edit landing page clusters — home, institute, academics, departments, and notifications."
          />
        </div>

        <div className="bg-[#fafafa]/85 backdrop-blur-md border-b border-zinc-200/70 px-6 py-2 sticky top-0 z-50 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-3.5 rounded-xl transition-all relative",
                    isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700",
                  )}
                >
                  <Icon size={16} className={isActive ? "text-zinc-900" : "opacity-70"} />
                  <span className="text-[11px] tracking-tight font-semibold">{section.label}</span>
                  {isActive && <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-zinc-900 rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {activeSection.pages && (
          <div className="bg-white border-b border-zinc-200/70 px-6 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-2 min-w-[200px] w-full md:w-auto">
              <span className={adminLabelClass}>
                {activeSectionId === "departments" ? "Department" : "Workspace"}
              </span>
              <div className="relative">
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <select
                  value={activePage || ""}
                  onChange={(e) => setActivePage(e.target.value)}
                  className={cn(adminSelectClass, "md:w-80 capitalize")}
                >
                  {activeSection.pages.map((page) => (
                    <option key={page} value={page}>{page.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
            <WorkspaceActions />
          </div>
        )}

        {!activeSection.pages && (
          <div className="px-6 md:px-8 pt-6 flex justify-end">
            <WorkspaceActions />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 md:px-8 py-10 relative min-h-[400px]">
          {loading ? (
            <SkeletonLoader />
          ) : !data ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-100">
                <AlertTriangle size={28} />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 tracking-tight mb-2">Could not load content</h4>
              <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                The data node is empty or the landing API is unreachable. Ensure{" "}
                <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{LANDING_API_URL}</code> is running.
              </p>
              <button type="button" onClick={fetchData} className={cn(adminGhostButtonClass, "mt-6")}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <div className="space-y-10"><DynamicForm obj={data} /></div>
          )}
        </div>

        <div className="px-6 md:px-8 py-6 border-t border-zinc-200/70 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400">
          <div className="flex items-center gap-8 text-[11px] font-medium">
            <span>API: {LANDING_API_URL}</span>
            <span>Section: {activeSection.label}</span>
          </div>
          <p className="text-[10px] font-medium tracking-wide">RGUKT CMS</p>
        </div>
      </div>
    </div>
  );
}
