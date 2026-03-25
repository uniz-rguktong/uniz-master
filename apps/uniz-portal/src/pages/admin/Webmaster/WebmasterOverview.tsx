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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../../api/endpoints";
import { BackgroundIconCloud } from "../../../components/illustrations/FloatingIllustrations";
import SystemUserAnalytics from "./SystemUserAnalytics";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface Profile {
  name?: string;
  email?: string;
  contact?: string;
  designation?: string;
  department?: string;
  role?: string;
  profile_url?: string;
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
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error();
      const upd = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ profileUrl: data.secure_url }),
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

  const displayName = profile?.name || username || "Webmaster";
  const initials = displayName[0].toUpperCase();
  const email = (profile?.email || `${username}@rguktong.ac.in`).toLowerCase();

  return (
    <div className="font-sans text-slate-900 min-h-[60vh] flex flex-col items-center justify-center px-4 pt-10 pb-20 animate-in fade-in duration-500 relative overflow-hidden">
      {/* Absolute Decorative Icon Cloud (Expansive Backdrop) */}
      <BackgroundIconCloud />

      {/* Avatar */}
      <div className="relative mb-6">
        <div
          className="relative p-[4px] md:p-[5px] rounded-full"
          style={{
            background: "#2ebd59",
          }}
        >
          <div className="relative bg-slate-50 p-[3px] rounded-full">
            <div className="relative w-[110px] h-[110px] md:w-[130px] md:h-[130px] bg-[#004e43] rounded-full flex justify-center items-center text-white text-[54px] font-medium overflow-hidden shadow-none">
              {loading ? (
                <Loader2 className="w-9 h-9 animate-spin text-white/60" />
              ) : profile?.profile_url ? (
                <img
                  src={profile.profile_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}

              {/* Upload overlay */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(0,0,0,0.55)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <Loader2
                      className="w-9 h-9 text-white animate-spin"
                      strokeWidth={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-[-1px] right-2 w-8 h-8 bg-[#e8f0fe] border-[1.5px] border-[#4285f4] rounded-full flex items-center justify-center text-[#174ea6] hover:bg-navy-100 transition-all z-20 cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-50 shadow-none"
            title="Update Profile Photo"
          >
            <Camera className="w-[17px] h-[17px]" strokeWidth={2.5} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      {/* Name row */}
      <div className="flex items-center justify-center gap-2 mb-2 mt-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-[#1f2122] leading-none text-center uppercase">
          {loading ? (
            <span className="animate-pulse text-slate-300">---</span>
          ) : (
            displayName
          )}
        </h1>
      </div>

      {/* Email + verified */}
      <p className="text-[#3c4043] font-medium text-[13px] tracking-tight text-center mb-4 flex items-center justify-center gap-1.5">
        {loading ? (
          <span className="animate-pulse text-slate-300">--------</span>
        ) : (
          <>
            {email}
            <BadgeCheck
              className="w-[15px] h-[15px] text-[#2ebd59]"
              fill="#2ebd59"
              fillOpacity={0.15}
              strokeWidth={2.5}
            />
          </>
        )}
      </p>

      {/* Info tags */}
      {!loading && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold mb-6">
          <span className="text-navy-900 uppercase tracking-widest px-2.5 py-1 bg-navy-50 border border-navy-100 rounded-xl">
            {username}
          </span>
          {profile?.role && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="uppercase tracking-wide text-slate-600">
                {profile.role}
              </span>
            </>
          )}
          {profile?.designation && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="uppercase tracking-wide text-slate-600">
                {profile.designation}
              </span>
            </>
          )}
          {profile?.department && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="uppercase tracking-wide text-slate-600">
                {profile.department}
              </span>
            </>
          )}
        </div>
      )}

      {/* Editing fields */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-xl border border-slate-100 p-5 space-y-3"
          >
            {[
              {
                key: "email",
                label: "Email",
                icon: <Mail size={13} className="text-slate-400" />,
              },
              {
                key: "contact",
                label: "Contact",
                icon: <Phone size={13} className="text-slate-400" />,
              },
              {
                key: "designation",
                label: "Designation",
                icon: <Briefcase size={13} className="text-slate-400" />,
              },
              {
                key: "department",
                label: "Department",
                icon: <Building size={13} className="text-slate-400" />,
              },
            ].map(({ key, label, icon }) => (
              <div
                key={key}
                className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {label}
                  </p>
                  <input
                    type="text"
                    value={(formData as any)[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="text-[13px] font-medium text-slate-900 bg-transparent border-b border-navy-100 focus:outline-none w-full"
                  />
                </div>
              </div>
            ))}

            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save
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
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !isEditing && (
        <div className="w-full max-w-6xl mt-12 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-50/50 blur-3xl rounded-full -z-10" />
            <SystemUserAnalytics />
          </div>
        </div>
      )}
    </div>
  );
}
