import { useState, useEffect, useRef } from "react";
import {
  rememberAdminProfile,
  useAdminProfile,
  type AdminProfile,
} from "../../../api/adminProfile";
import {
  Camera,
  Loader2,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OverviewTextButton, overviewSectionTitleClass } from "@/components/ui/overview";
import { BASE_URL } from "../../../api/endpoints";
import {
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminInputClass,
} from "../../../components/admin/admin-ui";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Avatar } from "@/components/ui/avatar";
import { formatDisplayText } from "@/utils/displayText";
import SystemUserAnalytics from "./SystemUserAnalytics";
import { uploadImage } from "../../../api/uploadImage";
import { changedProfileFields } from "@/utils/changedFields";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function sameText(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Role once, then designation and department when they add something new. */
function identityMeta(profile: AdminProfile | null, email: string) {
  const role = (profile?.role || "").trim();
  const designation = (profile?.designation || "").trim();
  const department = (profile?.department || "").trim();
  const parts: string[] = [];
  if (role) parts.push(formatDisplayText(role));
  if (designation && !sameText(designation, role)) {
    parts.push(formatDisplayText(designation));
  }
  if (department && !parts.some((part) => sameText(part, department))) {
    parts.push(formatDisplayText(department));
  }
  return parts.length ? parts.join(" · ") : email;
}

export default function WebadminOverview({ username }: { username: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, loading, error: profileError, refresh } = useAdminProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileRetrying, setProfileRetrying] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    designation: "",
    department: "",
  });

  const token = () =>
    (localStorage.getItem("admin_token") || "").replace(/"/g, "");

  useEffect(() => {
    if (!profile || isEditing) return;
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      contact: profile.contact || "",
      designation: profile.designation || "",
      department: profile.department || "",
    });
  }, [profile, isEditing]);

  const retryProfile = async () => {
    setProfileRetrying(true);
    try {
      await refresh();
    } finally {
      setProfileRetrying(false);
    }
  };

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
        if (uploadedUrl) rememberAdminProfile({ profile_url: uploadedUrl });
        refresh();
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const patch = changedProfileFields(
      {
        name: profile?.name || "",
        email: profile?.email || "",
        contact: profile?.contact || "",
        designation: profile?.designation || "",
        department: profile?.department || "",
      },
      formData,
      ["name", "email", "contact", "designation", "department"],
    );
    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile saved!");
        setIsEditing(false);
        rememberAdminProfile(formData);
        refresh();
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
  const email = (profile?.email || `${username}@rguktong.ac.in`).toLowerCase();
  const metaLine = loading ? "" : identityMeta(profileError ? null : profile, email);
  const showDash = Boolean(profileError) && !isEditing;

  const detailFields: {
    key: "contact" | "designation" | "department";
    label: string;
  }[] = [
    { key: "contact", label: "Contact" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      contact: profile?.contact || "",
      designation: profile?.designation || "",
      department: profile?.department || "",
    });
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1120px] space-y-6 min-[640px]:px-2 min-[640px]:py-2 min-[821px]:space-y-8 min-[821px]:px-0 min-[821px]:py-0">
      {/* Greeting + identity */}
      <PageHeader
        className="mb-0"
        title={`${greeting()}, ${displayName}`}
        meta={
          loading ? (
            <span className="inline-block h-[18px] w-2/5 animate-pulse rounded-md bg-tint align-middle motion-reduce:animate-none" />
          ) : (
            metaLine
          )
        }
      />

      {/* Analytics — independent of the profile request */}
      <SystemUserAnalytics />

      <Panel className="min-[640px]:p-6">
        <h2 className={overviewSectionTitleClass}>Your profile</h2>
        {loading ? (
          <div className="mt-4" aria-busy="true">
            <span className="sr-only">Loading overview</span>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 min-[821px]:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-4">
              {/* Identity card */}
              <div className="relative h-20 w-20 shrink-0">
                <Avatar
                  size={80}
                  src={profile?.profile_url}
                  alt={displayName ? `${displayName} profile photo` : "Profile photo"}
                  name={displayName}
                  className="border border-border"
                />
                {isUploading ? (
                  <span className="absolute inset-0 animate-pulse rounded-full bg-tint" />
                ) : null}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Update photo"
                  aria-label="Update photo"
                  className="absolute -bottom-1.5 -right-1.5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-2 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-[0.45]"
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
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={adminInputClass}
                    placeholder="Enter name"
                    aria-label="Name"
                  />
                ) : (
                  <p className="font-semibold text-head [overflow-wrap:anywhere]">{displayName}</p>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${adminInputClass} mt-2`}
                    placeholder="Enter email"
                    aria-label="Email"
                  />
                ) : (
                  <p className="text-small text-text-3 [overflow-wrap:anywhere]">{email}</p>
                )}
              </div>
            </div>

            {/* Edit panel */}
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 min-[821px]:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-small text-text-2">Role</dt>
                <dd className="mt-1 text-body text-head [overflow-wrap:anywhere]">
                  {showDash ? "—" : profile?.role ? formatDisplayText(profile.role) : "—"}
                </dd>
              </div>
              {detailFields.map(({ key, label }) => (
                <div key={key} className="min-w-0">
                  <dt className="text-small text-text-2">{label}</dt>
                  <dd className="mt-1 min-w-0 text-body text-head [overflow-wrap:anywhere]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className={adminInputClass}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        aria-label={label}
                      />
                    ) : showDash ? (
                      "—"
                    ) : key === "designation" ? (
                      formData.designation ? formatDisplayText(formData.designation) : "—"
                    ) : (
                      formData[key] || "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {profileError ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-1 text-dense text-text-2">
                <span>Some details didn&apos;t load.</span>
                <OverviewTextButton onClick={retryProfile} busy={profileRetrying} chevron={false}>
                  {profileRetrying ? "Trying again…" : "Try again"}
                </OverviewTextButton>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
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
                  <button type="button" onClick={resetForm} className={adminGhostButtonClass}>
                    <X size={16} /> Cancel
                  </button>
                </>
              ) : (
                <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil size={16} strokeWidth={1.75} aria-hidden />
                  Edit profile
                </Button>
              )}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
