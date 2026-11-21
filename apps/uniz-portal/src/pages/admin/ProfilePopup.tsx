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
  User,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../api/endpoints";
import { uploadImage } from "../../api/uploadImage";
import { Button } from "@/components/ui/button";
import { adminInputClass, adminLabelClass } from "@/components/admin/admin-ui";

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
  anchorRef: React.RefObject<HTMLElement | null>;
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
            style={{ top: position.top, right: Math.max(12, position.right) }}
            className="fixed z-[9999] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface"
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
            {/* ── Top bar: email (centered) + close ── */}
            <div className="relative flex items-center justify-center border-b border-border px-5 py-3">
              <p className="truncate text-small text-text-2">
                {profile?.email || `${username}@rguktong.ac.in`}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 rounded-full p-1.5 text-text-3 hover:bg-tint hover:text-text"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Avatar + Name + Edit button ── */}
            <div className="flex flex-col items-center px-6 pb-5 pt-6">
              <div className="relative mb-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface-2">
                  {loading && !initialPhoto ? (
                    <Loader2 size={20} className="animate-spin text-text-2" />
                  ) : profile?.profile_url || initialPhoto ? (
                    <img
                      src={profile?.profile_url || initialPhoto!}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-dense font-medium text-text">{initial}</span>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg/70">
                      <Loader2 size={18} className="animate-spin text-text" />
                    </div>
                  )}
                </div>
                {/* Camera button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  aria-label="Change photo"
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
              <h2 className="text-[22px] font-medium leading-[30px] tracking-[-0.01em] text-head">
                Hi, {firstName}!
              </h2>
              {profile?.role && (
                <p className="mb-4 mt-1 text-caption text-text-3">{profile.role}</p>
              )}

              {/* Edit Profile / Save / Cancel button */}
              {isEditing ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
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
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="compact"
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                  >
                    Save changes
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={14} />
                  Edit profile
                </Button>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border mx-0" />

            {/* ── Profile Details ── */}
            <div className="px-4 py-3 space-y-1">
              {loading ? (
                <div className="flex justify-center py-5">
                  <Loader2 size={20} className="animate-spin text-text-2" />
                </div>
              ) : (
                <>
                  <DetailRow
                    icon={<User size={14} className="text-text-2" />}
                    label="Full Name"
                    value={formData.name || username}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                  />
                  <DetailRow
                    icon={<Mail size={14} className="text-text-2" />}
                    label="Email"
                    value={formData.email || `${username}@rguktong.ac.in`}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                  />
                  <DetailRow
                    icon={<Phone size={14} className="text-text-2" />}
                    label="Contact"
                    value={formData.contact || "-"}
                    editable={isEditing}
                    onChange={(v) => setFormData({ ...formData, contact: v })}
                  />
                  <DetailRow
                    icon={<Briefcase size={14} className="text-text-2" />}
                    label="Designation"
                    value={formData.designation || "Webadmin"}
                    editable={isEditing}
                    onChange={(v) =>
                      setFormData({ ...formData, designation: v })
                    }
                  />
                  <DetailRow
                    icon={<Building size={14} className="text-text-2" />}
                    label="Department"
                    value={formData.department || "Administration"}
                    editable={isEditing}
                    onChange={(v) =>
                      setFormData({ ...formData, department: v })
                    }
                  />
                  <DetailRow
                    icon={<Shield size={14} className="text-text-2" />}
                    label="Username"
                    value={username}
                    editable={false}
                  />
                </>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border" />

            {/* ── Sign out ── */}
            <div className="px-4 py-3">
              <Button
                type="button"
                variant="destructive"
                size="compact"
                className="w-full"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                <LogOut size={15} />
                Sign out
              </Button>
            </div>
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
    <div className="px-1 py-2">
      <p className={adminLabelClass}>{label}</p>
      {editable && onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={adminInputClass}
        />
      ) : (
        <p className="flex items-center gap-2 text-dense text-text">
          <span className="text-text-3">{icon}</span>
          <span className="min-w-0 truncate">{value}</span>
        </p>
      )}
    </div>
  );
}
