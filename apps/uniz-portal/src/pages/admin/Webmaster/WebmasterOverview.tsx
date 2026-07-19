import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Loader2,
  BadgeCheck,
  Mail,
  Phone,
  Briefcase,
  Building,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/lib/utils";
import { BASE_URL } from "../../../api/endpoints";
import {
  adminCardClass,
  adminEyebrowClass,
  adminTitleClass,
  adminSubtitleClass,
} from "../../../components/admin/admin-ui";
import SystemUserAnalytics from "./SystemUserAnalytics";
import { uploadImage } from "../../../api/uploadImage";

interface Profile {
  name?: string;
  email?: string;
  contact?: string;
  designation?: string;
  department?: string;
  role?: string;
  profile_url?: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function WebmasterOverview({ username }: { username: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    designation: "",
    department: "",
  });

  const token = () =>
    (localStorage.getItem("admin_token") || "").replace(/"/g, "");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/profile/admin/me`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || "",
          email: data.data.email || "",
          contact: data.data.contact || "",
          designation: data.data.designation || "",
          department: data.data.department || "",
        });
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const uploadedUrl = await uploadImage(file, "admin-profile");
      if (!uploadedUrl) throw new Error();
      const upd = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ profileUrl: uploadedUrl }),
      });
      const updData = await upd.json();
      if (updData.success) {
        toast.success("Photo updated!");
        fetchProfile();
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile saved!");
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.name || username || "Webadmin";
  const initials = displayName[0].toUpperCase();
  const email = (profile?.email || `${username}@rguktong.ac.in`).toLowerCase();

  const metaTags = [profile?.role, profile?.designation, profile?.department]
    .map((t) => (t || "").trim())
    .filter(Boolean);

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      {/* Greeting + identity */}
      <header className="flex flex-col xl:flex-row xl:items-stretch gap-5">
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className={adminEyebrowClass}>
            {greeting()} · Control Center
          </span>
          <h1 className={cn(adminTitleClass, "mt-2")}>
            {loading ? (
              <span className="inline-block w-48 h-7 rounded-md bg-zinc-100 animate-pulse align-middle" />
            ) : (
              displayName
            )}
          </h1>
          <p className={cn(adminSubtitleClass, "mt-2 max-w-xl")}>
            Monitor identities, academics, and campus operations across the
            institution from a single command surface.
          </p>
        </div>

        {/* Identity card */}
        <div
          className={cn(
            adminCardClass,
            "p-4 flex items-center gap-4 w-full xl:w-[420px] shrink-0",
          )}
        >
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-900 ring-1 ring-zinc-200 flex items-center justify-center text-white text-xl font-semibold">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              ) : profile?.profile_url ? (
                <img
                  src={profile.profile_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
                  >
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Update photo"
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 shadow-[0_1px_2px_rgba(10,10,10,0.08)] transition-all active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-3 h-3" strokeWidth={2.2} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-semibold text-zinc-900 tracking-[-0.01em] truncate">
                {displayName}
              </p>
              <BadgeCheck
                className="w-4 h-4 text-emerald-500 shrink-0"
                strokeWidth={2.2}
              />
            </div>
            <p className="text-[12.5px] text-zinc-500 truncate mt-0.5">
              {email}
            </p>
            {metaTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {metaTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing((v) => !v)}
            title="Edit profile"
            className={cn(
              "shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95",
              isEditing
                ? "bg-zinc-900 border-zinc-900 text-white"
                : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300",
            )}
          >
            <Pencil size={15} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Edit panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(adminCardClass, "p-5")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "email", label: "Email", icon: Mail },
                  { key: "contact", label: "Contact", icon: Phone },
                  { key: "designation", label: "Designation", icon: Briefcase },
                  { key: "department", label: "Department", icon: Building },
                ].map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50/70 rounded-xl border border-zinc-200/70 focus-within:border-zinc-300 focus-within:bg-white transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.12em]">
                        {label}
                      </p>
                      <input
                        type="text"
                        value={(formData as Record<string, string>)[key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        className="text-[13px] font-medium text-zinc-900 bg-transparent focus:outline-none w-full mt-0.5"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t border-zinc-200/60">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 transition-all disabled:opacity-60 active:scale-[0.98]"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile?.name || "",
                      email: profile?.email || "",
                      contact: profile?.contact || "",
                      designation: profile?.designation || "",
                      department: profile?.department || "",
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-[13px] font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics */}
      {!loading && <SystemUserAnalytics />}
    </div>
  );
}
