import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Loader2,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../../api/endpoints";
import {
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminInputClass,
} from "../../../components/admin/admin-ui";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatDisplayText } from "@/utils/displayText";
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

export default function WebadminOverview({ username }: { username: string }) {
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

  const fields: { key: "email" | "contact" | "designation" | "department"; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "contact", label: "Contact" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  return (
    <div className="space-y-6 py-8">
      {/* Greeting + identity */}
      <PageHeader
        title={
          loading ? (
            <span className="inline-block h-9 w-64 animate-pulse rounded-md bg-tint align-middle" />
          ) : (
            `${greeting()}, ${displayName}`
          )
        }
        meta={
          loading
            ? undefined
            : metaTags.length
              ? metaTags.map((tag) => formatDisplayText(tag)).join(" · ")
              : email
        }
      />

      <Panel title="Profile">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Identity card */}
          <div className="relative h-24 w-24 shrink-0">
            {loading ? (
              <div className="h-24 w-24 animate-pulse rounded-md bg-tint" />
            ) : (
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-tint text-head">
                {profile?.profile_url ? (
                  <img
                    src={profile.profile_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-h2">{initials}</span>
                )}
                {isUploading && (
                  <span className="absolute inset-0 animate-pulse rounded-full bg-tint" />
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || loading}
              title="Update photo"
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-2 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-[0.45]"
            >
              <Camera className="h-4 w-4" strokeWidth={1.75} />
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
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-5 w-24 animate-pulse rounded-md bg-tint" />
                    <div className="h-6 w-40 animate-pulse rounded-md bg-tint" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Edit panel */}
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-dense leading-5 text-text-2">Name</dt>
                    <dd className="mt-1 text-body text-head">{displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-dense leading-5 text-text-2">Role</dt>
                    <dd className="mt-1 text-body text-head">
                      {profile?.role ? formatDisplayText(profile.role) : "—"}
                    </dd>
                  </div>
                  {fields.map(({ key, label }) => (
                    <div key={key}>
                      <dt className="text-dense leading-5 text-text-2">{label}</dt>
                      <dd className="mt-1 text-body text-head">
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData[key]}
                            onChange={(e) =>
                              setFormData({ ...formData, [key]: e.target.value })
                            }
                            className={adminInputClass}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            aria-label={label}
                          />
                        ) : key === "email" ? (
                          email
                        ) : (
                          formData[key] || "—"
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={adminPrimaryButtonClass}
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                        Save changes
                      </button>
                      <button
                        type="button"
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
                        className={adminGhostButtonClass}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className={adminGhostButtonClass}
                    >
                      <Pencil size={16} /> Edit profile
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Panel>

      {/* Analytics */}
      {!loading && <SystemUserAnalytics />}
    </div>
  );
}
