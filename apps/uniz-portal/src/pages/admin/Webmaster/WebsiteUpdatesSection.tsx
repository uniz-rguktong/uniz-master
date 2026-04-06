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

const BASE_URL = "https://landing-api.rguktong.in";
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
      let url = `${BASE_URL}${base.endsWith("/") ? base : base + "/"}`;
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
      let url = `${BASE_URL}${base.endsWith("/") ? base : base + "/"}`;
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
    <div className="space-y-12 w-full animate-in fade-in duration-500">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 space-y-4">
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
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
        <div className="flex items-center justify-between ml-1">
          <label className="text-[11px] font-bold text-slate-400 capitalize">{label.replace(/_/g, " ")}</label>
          {isImage && editMode && (
            <div className="relative">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              <button className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} {uploading ? "Uploading..." : "Upload Pic"}
              </button>
            </div>
          )}
        </div>
        {editMode ? (
          typeof value === "boolean" ? (
            <button onClick={() => onUpdate(!value)} className={`w-full h-11 px-5 rounded-xl font-bold text-[13px] flex items-center justify-between transition-all border ${value ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50/50 text-slate-400 border-slate-100"}`}>
              <span className="font-semibold">{value ? "Enabled" : "Disabled"}</span>
              <div className={`w-3 h-3 rounded-full transition-all ${value ? "bg-emerald-500" : "bg-slate-300"}`} />
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={String(localValue || "")}
                rows={String(localValue || "").length > 80 ? 3 : 1}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => onUpdate(localValue)}
                className="w-full bg-slate-50/50 border border-slate-100 focus:border-slate-300 focus:bg-white rounded-xl px-5 py-3 font-semibold text-slate-900 outline-none transition-all text-[13px] leading-relaxed"
              />
              {isImage && localValue && (
                <div className="h-24 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <img src={localValue} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}
            </div>
          )
        ) : (
          <div className="w-full bg-slate-50/30 border border-slate-100 px-5 py-3 rounded-xl overflow-hidden">
            {isImage && value && (
              <div className="mb-3 h-32 overflow-hidden rounded-lg bg-white border border-slate-50 shadow-sm">
                <img src={value} className="w-full h-full object-contain" alt="pic" />
              </div>
            )}
            <p className="text-[13px] font-semibold text-slate-700 leading-relaxed break-words">
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
          <div className="flex items-center justify-between px-2 mb-4">
             <div className="flex items-center gap-3">
               <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Managed Directory</h4>
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold uppercase tracking-widest">{obj.length} Entries</span>
             </div>
             {editMode && (
               <button onClick={() => addArrayItem([], obj[0] || {})} className="h-9 px-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-black transition-all flex items-center gap-2 active:scale-95">
                 <Plus size={14} /> Add New Entry
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
                  <div key={idx} className={`bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${isExpanded ? "border-slate-300 shadow-xl" : "border-slate-100 hover:border-slate-200 shadow-sm"}`}>
                     <div className={`p-6 flex items-center justify-between gap-6 ${isExpanded ? "bg-slate-50/50" : "bg-transparent"}`}>
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                              {image ? <img src={image} className="w-full h-full object-cover" /> : <Users size={24} className="text-slate-200" />}
                           </div>
                           <div>
                              <h5 className="font-bold text-slate-900 text-lg tracking-tight leading-none mb-1 font-sans capitalize">{name.toLowerCase()}</h5>
                              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">{sub}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => setExpandedIndex(isExpanded ? null : idx)} className={`h-11 px-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:text-slate-900"}`}>
                              {isExpanded ? "Close Details" : "Edit Details"} {!isExpanded && <Plus size={14} />}
                           </button>
                           {editMode && <button onClick={() => deleteArrayItem([], idx)} className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"><Trash2 size={16} /></button>}
                        </div>
                     </div>
                     {isExpanded && <div className="p-8 border-t border-slate-100 bg-white animate-in slide-in-from-top-4 duration-500"><DynamicForm obj={item} path={[idx.toString()]} /></div>}
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
              <div key={key} className="space-y-4 pt-6 border-t border-slate-50 first:border-0 first:pt-0">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/_/g, " ")} <span className="opacity-40 ml-1">({value.length})</span></h4>
                  {editMode && <button onClick={() => addArrayItem(currentPath, value[0] || {})} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-1.5"><Plus size={12} /> Add Item</button>}
                </div>
                <div className="grid grid-cols-1 gap-4 ml-2 border-l-2 border-slate-50 pl-6">
                  {value.map((item, idx) => (
                    <div key={idx} className="relative group bg-white p-6 rounded-3xl border border-slate-100 transition-all hover:border-slate-300 shadow-sm">
                      <div className="absolute top-6 right-6 flex items-center gap-3">
                        <span className="text-[9px] font-bold text-slate-200 tracking-widest">SUB-NODE #{idx + 1}</span>
                        {editMode && <button onClick={() => deleteArrayItem(currentPath, idx)} className="p-1.5 text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>}
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
              <div key={key} className="space-y-4 pt-6 border-t border-slate-50 first:border-0 first:pt-0">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{key.replace(/_/g, " ")}</h4>
                <div className="ml-2 border-l-2 border-slate-50 pl-6"><DynamicForm obj={value} path={currentPath} /></div>
              </div>
            );
          }
          return <FieldInput key={key} label={key} value={value} onUpdate={(v: any) => updateNestedData(currentPath, v)} isImage={/pic|img|image|logo|icon|url/i.test(key)} />;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700 font-sans bg-[#fcfcfd]">
      <div className="flex-1 overflow-y-auto custom-sidebar-scroll">
        <div className="bg-white px-10 pt-10 pb-6 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-100"><Globe size={24} /></div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none mb-1">Website Content Management</h2>
              <p className="text-[13px] font-medium text-slate-500">Primary control node for institute landing page clusters</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-8 py-2 sticky top-0 z-50 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSectionId === section.id;
              return (
                <button key={section.id} onClick={() => setActiveSectionId(section.id)} className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all relative group ${isActive ? "text-slate-900 bg-slate-50/50" : "text-slate-400 hover:text-slate-700"}`}>
                  <Icon size={17} className={isActive ? "text-slate-900" : "opacity-60"} />
                  <span className="text-[10px] tracking-widest uppercase font-bold">{section.label}</span>
                  {isActive && <div className="absolute bottom-0 left-6 right-6 h-1 bg-slate-900 rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {activeSection.pages && (
          <div className="bg-white border-b border-slate-200 px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex flex-col gap-2 min-w-[200px]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{activeSectionId === "departments" ? "Dept" : "Current Workspace"}</span>
                <div className="relative group">
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select value={activePage || ""} onChange={(e) => setActivePage(e.target.value)} className="w-full md:w-80 h-11 pl-5 pr-10 bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 appearance-none outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer capitalize">
                    {activeSection.pages.map((page) => <option key={page} value={page}>{page.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {editMode ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => fetchData()} className="h-11 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">Discard Changes</button>
                  <button onClick={handleSave} disabled={saving} className="h-11 px-8 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-3">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Push To Production
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={fetchData} className="w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
                  <button onClick={() => setEditMode(true)} className="h-11 px-8 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-3"><Save size={16} /> Update Data</button>
                </div>
              )}
            </div>
          </div>
        )}

        {!activeSection.pages && (
           <div className="bg-transparent px-10 pt-8 flex justify-end">
             {editMode ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => fetchData()} className="h-11 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">Discard Changes</button>
                  <button onClick={handleSave} disabled={saving} className="h-11 px-8 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Push To Production
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={fetchData} className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
                  <button onClick={() => setEditMode(true)} className="h-11 px-8 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3"><Save size={16} /> Update Data</button>
                </div>
              )}
           </div>
        )}

        <div className="max-w-5xl mx-auto px-10 py-12 relative min-h-[400px]">
          {loading ? <SkeletonLoader /> : !data ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><AlertTriangle size={32} /></div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-3">Resource Access Failure</h4>
              <p className="text-slate-400 font-bold text-sm max-w-sm mx-auto leading-relaxed uppercase tracking-widest opacity-60">The requested data node is either empty or the connection was refused by the landing-page cluster.</p>
            </div>
          ) : <div className="space-y-12"><DynamicForm obj={data} /></div>}
        </div>

        <div className="px-10 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-12">
            <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Tier</span><span className="text-[11px] font-black text-slate-900 uppercase italic">Enterprise Production</span></div>
            <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Protocol</span><span className="text-[11px] font-black text-slate-900 uppercase italic">TLS 1.3 / AUTH:2</span></div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">RGUKT CMS NODE v2.8.4</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">© 2026 UNIVERSITY GLOBAL INFRASTRUCTURE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
