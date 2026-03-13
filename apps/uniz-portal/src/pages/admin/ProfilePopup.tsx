import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Camera,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  Building,
  LogOut,
  Pencil,
  Check,
  Ban,
  User,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { BASE_URL } from "../../api/endpoints";
import { BackgroundIconCloud } from "../../components/illustrations/FloatingIllustrations";

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

interface Props {
  username: string;
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: Profile) => void;
  onLogout: () => void;
  initialPhoto?: string | null;
}

export default function ProfilePopup({
  username,
  anchorRef,
  open,
  onClose,
  onProfileUpdate,
  onLogout,
  initialPhoto,
}: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    designation: "",
    department: "",
  });

  // Compute position from anchor
  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, anchorRef]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

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
        onProfileUpdate?.(data.data);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

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
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.name || username;
  const initial = displayName[0]?.toUpperCase() ?? "U";
  const firstName = displayName.split(" ")[0];

  const popupContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          <motion.div
            ref={popupRef}
            style={{ top: position.top, right: position.right }}
            className="fixed z-[9999] w-[380px] bg-white rounded-xl border border-slate-100 overflow-hidden shadow-none"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              mass: 0.8,
            }}
          >
            {/* Background Decorative Illustrations */}
            <BackgroundIconCloud className="scale-[1.5]" />

            {/* ── Top bar: email (centered) + close ── */}
            <div className="relative flex items-center justify-center px-5 py-3 border-b border-slate-100">
              <p className="text-[12.5px] font-semibold text-slate-600 truncate lowercase">
                {(profile?.email || `${username}@rguktong.ac.in`).toLowerCase()}
              </p>
              <button
                onClick={onClose}
                className="absolute right-3 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shadow-none"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Avatar + Name + Edit button ── */}
            <div className="flex flex-col items-center px-6 pt-6 pb-5">
              {/* Avatar with gradient ring */}
              <div className="relative mb-4">
                <div
                  className="w-[88px] h-[88px] rounded-full p-[3px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #4285F4 0%, #34A853 33%, #FBBC04 66%, #EA4335 100%)",
                  }}
                >
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shadow-none">
                      {loading && !initialPhoto ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-blue-300"
                        />
                      ) : profile?.profile_url || initialPhoto ? (
                        <img
                          src={profile?.profile_url || initialPhoto!}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <span className="text-xl font-black text-white">
                          {initial}
                        </span>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                          <Loader2
                            size={20}
                            className="animate-spin text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-slate-700 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-slate-900 transition-all active:scale-90 shadow-none"
                >
                  <Camera size={12} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Hi, Name */}
              <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight mb-0.5">
                Hi, {firstName}!
              </h2>
              {profile?.role && (
                <p className="text-[11px] text-slate-400 font-medium mb-4">
                  {profile.role}
                </p>
              )}

              {/* Edit Profile / Save / Cancel button */}
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl border-2 border-navy-100 text-navy-900 text-[12px] font-semibold hover:bg-navy-50 transition-all disabled:opacity-60 shadow-none"
                  >
                    {isSaving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Save Changes
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 transition-all shadow-none"
                  >
                    <Ban size={12} />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-none"
                >
                  <Pencil size={13} className="text-slate-500" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100 mx-0" />

            {/* ── Profile Details ── */}
            <div className="px-4 py-3 space-y-1">
              {loading ? (
                <div className="flex justify-center py-5">
                  <Loader2 size={20} className="animate-spin text-blue-400" />
                </div>
              ) : (
                <>
                  <DetailRow
                    icon={<User size={14} className="text-slate-500" />}
                    label="Full Name"
                    value={formData.name || username}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                  />
                  <DetailRow
                    icon={<Mail size={14} className="text-slate-500" />}
                    label="Email"
                    value={formData.email || `${username}@rguktong.ac.in`}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                  />
                  <DetailRow
                    icon={<Phone size={14} className="text-slate-500" />}
                    label="Contact"
                    value={formData.contact || "—"}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, contact: v })}
                  />
                  <DetailRow
                    icon={<Briefcase size={14} className="text-slate-500" />}
                    label="Designation"
                    value={formData.designation || "Webmaster"}
                    editable={isEditing}
                    onChange={(v) =>
                      setFormData({ ...formData, designation: v })
                    }
                  />
                  <DetailRow
                    icon={<Building size={14} className="text-slate-500" />}
                    label="Department"
                    value={formData.department || "Administration"}
                    editable={isEditing}
                    onChange={(v) =>
                      setFormData({ ...formData, department: v })
                    }
                  />
                  <DetailRow
                    icon={<Shield size={14} className="text-slate-500" />}
                    label="Username"
                    value={username}
                    editable={false}
                  />
                </>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100" />

            {/* ── Sign out ── */}
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-red-50 transition-colors shadow-none">
                <LogOut
                  size={15}
                  className="text-slate-500 group-hover:text-red-500 transition-colors"
                />
              </div>
              <span className="group-hover:text-red-500 transition-colors">
                Sign out
              </span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(popupContent, document.body);
}

function DetailRow({
  icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-none">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
          {label}
        </p>
        {editable && onChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-[13px] font-medium text-slate-900 bg-transparent border-b border-navy-100 focus:outline-none w-full"
          />
        ) : (
          <p className="text-[13px] font-medium text-slate-900 truncate">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
