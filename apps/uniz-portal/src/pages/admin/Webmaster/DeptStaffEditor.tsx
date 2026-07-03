/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserPlus,
  X,
  ChevronDown,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "@/utils/toast-ref";
import {
  adminGhostButtonClass,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-ui";

const DEPT_NAMES: Record<string, string> = {
  CSE: "Computer Science & Engineering",
  CIVIL: "Civil Engineering",
  ECE: "Electronics & Communication Engineering",
  EEE: "Electrical & Electronics Engineering",
  ME: "Mechanical Engineering",
  MATHEMATICS: "Mathematics",
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  IT: "Information Technology",
  BIOLOGY: "Biology",
  ENGLISH: "English",
  LIB: "Central Library",
  MANAGEMENT: "Management Studies",
  PED: "Physical Education",
  TELUGU: "Telugu",
  YOGA: "Yoga",
};

const EMPTY_FACULTY = {
  name: "New faculty member",
  email: "",
  photo: null as string | null,
  bio: {
    "Additional Responsibilities": ["Faculty"],
    Specialization: [] as string[],
  },
};

type Faculty = {
  name: string;
  email: string;
  photo: string | null;
  bio: Record<string, unknown>;
};

type DeptData = {
  dept: string;
  faculties: Faculty[];
};

function bioStr(bio: Record<string, unknown>, key: string): string {
  const v = bio?.[key];
  if (!v) return "";
  const s = Array.isArray(v) ? (v as unknown[]).filter(Boolean).join(", ") : String(v);
  return s.toLowerCase() === "null" ? "" : s.trim();
}

function bioLines(bio: Record<string, unknown>, key: string): string {
  const v = bio?.[key];
  if (!v) return "";
  if (Array.isArray(v)) return (v as unknown[]).filter(Boolean).join("\n");
  return String(v);
}

function setBioLines(bio: Record<string, unknown>, key: string, text: string): Record<string, unknown> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return { ...bio, [key]: lines.length ? lines : [] };
}

type DeptStaffEditorProps = {
  data: DeptData;
  deptCode: string;
  onChange: (data: DeptData) => void;
  onRefresh: () => void;
  onUpload: (file: File) => Promise<string | null>;
};

export function DeptStaffEditor({
  data,
  deptCode,
  onChange,
  onRefresh,
  onUpload,
}: DeptStaffEditorProps) {
  const [expandedBio, setExpandedBio] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    setExpandedBio(null);
    setDeleteConfirm(null);
  }, [deptCode]);

  const updateFaculty = (index: number, patch: Partial<Faculty>) => {
    const faculties = [...data.faculties];
    faculties[index] = { ...faculties[index], ...patch };
    onChange({ ...data, dept: deptCode, faculties });
  };

  const updateBio = (index: number, bio: Record<string, unknown>) => {
    updateFaculty(index, { bio });
  };

  const addFaculty = () => {
    const faculties = [
      ...data.faculties,
      JSON.parse(JSON.stringify(EMPTY_FACULTY)) as Faculty,
    ];
    onChange({ ...data, faculties });
    setExpandedBio(faculties.length - 1);
    toast.success("New faculty card added — edit details below");
  };

  const removeFaculty = (index: number) => {
    onChange({
      ...data,
      faculties: data.faculties.filter((_, i) => i !== index),
    });
    setDeleteConfirm(null);
    setExpandedBio(null);
    toast.success("Faculty removed");
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    setUploadingIdx(index);
    const url = await onUpload(file);
    if (url) updateFaculty(index, { photo: url });
    setUploadingIdx(null);
  };

  const deptTitle = DEPT_NAMES[deptCode] || deptCode;
  const bioKeys = (idx: number) => {
    const bio = data.faculties[idx]?.bio ?? {};
    const keys = new Set([
      "Additional Responsibilities",
      "Specialization",
      "Research Areas",
      "Experience",
      "Subjects Taught",
      ...Object.keys(bio),
    ]);
    return [...keys];
  };

  return (
    <div className="relative pb-24">
      {/* Live page chrome — mirrors public department page */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8">
        <div className="px-6 py-8 md:px-10 md:py-10 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#0B2A47]/70 mb-2">
                RGUKT Ongole · {deptCode}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {deptTitle}
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg">
                Edit cards below — changes match the live department page students see.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2A47]/5 text-[#0B2A47] border border-[#0B2A47]/10 text-[11px] font-semibold">
                <Sparkles size={12} />
                Live editor
              </span>
              <button
                type="button"
                onClick={onRefresh}
                className={cn(adminGhostButtonClass, "h-9")}
                title="Refresh from server"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 md:px-10 flex items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-600">
            <span className="font-bold text-slate-900">{data.faculties.length}</span>{" "}
            faculty {data.faculties.length === 1 ? "member" : "members"}
          </p>
          <button
            type="button"
            onClick={addFaculty}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0B2A47] hover:bg-[#081E33] text-white text-[13px] font-semibold shadow-sm transition-colors active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Add faculty
          </button>
        </div>
      </div>

      {/* Faculty grid — WYSIWYG cards */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {data.faculties.map((faculty, idx) => {
            const bio = faculty.bio ?? {};
            const designation =
              bioStr(bio, "Additional Responsibilities") || "Faculty";
            const specialization = bioStr(bio, "Specialization");
            const phone =
              bioStr(bio, "Phone") ||
              bioStr(bio, "Mobile") ||
              bioStr(bio, "Contact");
            const isExpanded = expandedBio === idx;
            const isDeleting = deleteConfirm === idx;

            return (
              <motion.div
                key={`${deptCode}-${idx}-${faculty.email || faculty.name}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "group rounded-xl border bg-white overflow-hidden transition-all duration-200",
                  isExpanded
                    ? "border-[#0B2A47]/30 shadow-lg ring-2 ring-[#0B2A47]/10"
                    : "border-slate-200 hover:border-[#0B2A47]/25 hover:shadow-md",
                )}
              >
                <div className="flex gap-0 flex-col sm:flex-row">
                  {/* Photo — click to upload */}
                  <label
                    className={cn(
                      "sm:w-40 flex-shrink-0 relative cursor-pointer border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden",
                      uploadingIdx === idx && "pointer-events-none opacity-70",
                    )}
                    style={{ minHeight: "160px" }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(idx, f);
                        e.target.value = "";
                      }}
                    />
                    {faculty.photo ? (
                      <img
                        src={faculty.photo}
                        alt=""
                        className="w-full h-full object-contain max-h-[180px]"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 p-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-bold">
                          {faculty.name.charAt(0) || "?"}
                        </div>
                        <span className="text-[10px] font-semibold flex items-center gap-1">
                          <Upload size={12} /> Add photo
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#0B2A47]/0 group-hover:bg-[#0B2A47]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-[#0B2A47] bg-white/90 px-2 py-1 rounded-lg shadow-sm">
                        Change photo
                      </span>
                    </div>
                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#0B2A47]" size={24} />
                      </div>
                    )}
                  </label>

                  {/* Editable info */}
                  <div className="flex-1 p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            Name
                          </label>
                          <input
                            type="text"
                            value={faculty.name}
                            onChange={(e) =>
                              updateFaculty(idx, { name: e.target.value })
                            }
                            className={cn(
                              adminInputClass,
                              "mt-1 font-bold text-slate-900 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-zinc-300 px-2 -mx-2",
                            )}
                            placeholder="Faculty name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            Designation
                          </label>
                          <input
                            type="text"
                            value={bioLines(bio, "Additional Responsibilities")}
                            onChange={(e) =>
                              updateBio(
                                idx,
                                setBioLines(
                                  bio,
                                  "Additional Responsibilities",
                                  e.target.value,
                                ),
                              )
                            }
                            className={cn(
                              adminInputClass,
                              "mt-1 text-sm text-slate-600 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-zinc-300 px-2 -mx-2",
                            )}
                            placeholder="e.g. Assistant Professor, HOD"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isDeleting ? (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(idx)}
                            className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove faculty"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-rose-50 rounded-lg p-1 border border-rose-100">
                            <button
                              type="button"
                              onClick={() => removeFaculty(idx)}
                              className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 rounded-md"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1 text-rose-400 hover:text-rose-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Mail size={10} className="text-[#0B2A47]" /> Email
                        </label>
                        <input
                          type="email"
                          value={faculty.email}
                          onChange={(e) =>
                            updateFaculty(idx, { email: e.target.value })
                          }
                          className={cn(adminInputClass, "mt-1 h-9 text-xs")}
                          placeholder="name@rguktong.ac.in"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Phone size={10} /> Phone (optional)
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) =>
                            updateBio(
                              idx,
                              setBioLines(bio, "Phone", e.target.value),
                            )
                          }
                          className={cn(adminInputClass, "mt-1 h-9 text-xs")}
                          placeholder="+91 …"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) =>
                          updateBio(
                            idx,
                            setBioLines(bio, "Specialization", e.target.value),
                          )
                        }
                        className={cn(adminInputClass, "mt-1 h-9 text-xs italic")}
                        placeholder="Research / teaching focus"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedBio(isExpanded ? null : idx)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B2A47] hover:text-[#081E33] transition-colors"
                    >
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                      {isExpanded ? "Hide full profile" : "Edit full profile & bio"}
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5 md:p-6 space-y-4">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Extended bio sections
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          {bioKeys(idx).map((key) => (
                            <div key={key}>
                              <label className="text-[10px] font-semibold text-slate-400 capitalize">
                                {key}
                              </label>
                              <textarea
                                value={bioLines(bio, key)}
                                onChange={(e) =>
                                  updateBio(
                                    idx,
                                    setBioLines(bio, key, e.target.value),
                                  )
                                }
                                rows={3}
                                className={cn(adminTextareaClass, "mt-1 text-xs")}
                                placeholder="One item per line"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">
                            Photo URL (or upload above)
                          </label>
                          <input
                            type="text"
                            value={faculty.photo ?? ""}
                            onChange={(e) =>
                              updateFaculty(idx, {
                                photo: e.target.value || null,
                              })
                            }
                            className={cn(adminInputClass, "mt-1 h-9 text-xs font-mono")}
                            placeholder="https://…"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add card placeholder */}
        <button
          type="button"
          onClick={addFaculty}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0B2A47]/40 hover:bg-[#0B2A47]/[0.02] py-10 flex flex-col items-center gap-2 text-slate-400 hover:text-[#0B2A47] transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-[#0B2A47]/10 flex items-center justify-center transition-colors">
            <Plus size={22} />
          </div>
          <span className="text-sm font-semibold">Add another faculty member</span>
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-8 flex items-center justify-center gap-1.5">
        <ExternalLink size={12} />
        Matches public page at rguktong.in/departments/{deptCode}
      </p>
    </div>
  );
}
