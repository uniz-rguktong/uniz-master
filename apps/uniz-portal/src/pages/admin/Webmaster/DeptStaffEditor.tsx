/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Upload,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "@/utils/toast-ref";
import { Button } from "@/components/ui/button";
import {
  adminInputClass,
  adminLabelClass,
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
      <div className="mb-8 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-surface px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
                {deptTitle}
              </h2>
              <p className="mt-2 max-w-lg text-body leading-6 text-text-2">
                Edit cards below — changes match the live department page students see.
              </p>
            </div>
            <Button type="button" variant="ghost" size="compact" onClick={onRefresh}>
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="px-6 py-5 md:px-10 flex items-center justify-between gap-3 bg-surface-2/80 border-b border-border">
          <p className="text-sm font-medium text-text-2">
            <span className="font-semibold text-text">{data.faculties.length}</span>{" "}
            faculty {data.faculties.length === 1 ? "member" : "members"}
          </p>
          <Button type="button" size="compact" onClick={addFaculty}>
            Add faculty
          </Button>
        </div>
      </div>

      {/* Faculty grid — WYSIWYG cards */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {data.faculties.map((faculty, idx) => {
            const bio = faculty.bio ?? {};
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
                  "group rounded-xl border bg-surface overflow-hidden transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-200",
                  isExpanded
                    ? "border-border-strong"
                    : "border-border hover:border-border-strong",
                )}
              >
                <div className="flex gap-0 flex-col sm:flex-row">
                  {/* Photo — click to upload */}
                  <label
                    className={cn(
                      "sm:w-40 flex-shrink-0 relative cursor-pointer border-b sm:border-b-0 sm:border-r border-border bg-surface-2 flex items-center justify-center overflow-hidden",
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
                      <div className="flex flex-col items-center gap-2 text-text-3 p-4">
                        <div className="w-16 h-16 rounded-full bg-tint flex items-center justify-center text-text-2 text-2xl font-semibold">
                          {faculty.name.charAt(0) || "?"}
                        </div>
                        <span className="text-caption font-semibold flex items-center gap-1">
                          <Upload size={12} /> Add photo
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-lg border border-border bg-surface px-2 py-1 text-caption font-semibold text-text">
                        Change photo
                      </span>
                    </div>
                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
                        <Loader2 className="animate-spin text-head" size={24} />
                      </div>
                    )}
                  </label>

                  {/* Editable info */}
                  <div className="flex-1 p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div>
                          <label className={adminLabelClass}>
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
                              "mt-1 font-semibold text-text border-transparent bg-transparent hover:bg-surface-2 focus:bg-surface focus:border-border-strong px-2 -mx-2",
                            )}
                            placeholder="Faculty name"
                          />
                        </div>
                        <div>
                          <label className={adminLabelClass}>
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
                              "mt-1 text-sm text-text-2 border-transparent bg-transparent hover:bg-surface-2 focus:bg-surface focus:border-border-strong px-2 -mx-2",
                            )}
                            placeholder="e.g. Assistant Professor, HOD"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isDeleting ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="compact"
                            onClick={() => setDeleteConfirm(idx)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="compact"
                              onClick={() => removeFaculty(idx)}
                            >
                              Delete
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="compact"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Keep
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className={cn(adminLabelClass, "flex items-center gap-1")}>
                          <Mail size={10} className="text-head" /> Email
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
                        <label className={cn(adminLabelClass, "flex items-center gap-1")}>
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
                      <label className={adminLabelClass}>
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
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-head hover:text-head transition-colors"
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
                      className="overflow-hidden border-t border-border bg-surface-2/50"
                    >
                      <div className="p-5 md:p-6 space-y-4">
                        <p className="text-caption font-semibold text-text-2">
                          Extended bio sections
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          {bioKeys(idx).map((key) => (
                            <div key={key}>
                              <label className="text-caption font-semibold text-text-3 capitalize">
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
                          <label className="text-caption font-semibold text-text-3">
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
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong py-10 text-text-3 hover:bg-tint hover:text-head"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-text-2">
            <Plus size={22} />
          </div>
          <span className="text-sm font-semibold">Add another faculty member</span>
        </button>
      </div>

      <p className="text-center text-caption text-text-3 mt-8 flex items-center justify-center gap-1.5">
        <ExternalLink size={12} />
        Matches public page at rguktong.in/departments/{deptCode}
      </p>
    </div>
  );
}
