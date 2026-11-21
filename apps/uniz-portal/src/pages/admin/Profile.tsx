import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Loader2,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../api/endpoints";
import { uploadImage } from "../../api/uploadImage";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminInputClass,
  adminLabelClass,
  adminTextareaClass,
} from "@/components/admin/admin-ui";
import { changedProfileFields } from "@/utils/changedFields";

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

export default function AdminProfile() {
  const username = (localStorage.getItem("username") || "Webadmin").replace(
    /"/g,
    "",
  );
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    bio: "",
    designation: "",
    department: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/me`, {
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || "",
          email: data.data.email || "",
          contact: data.data.contact || "",
          bio: data.data.bio || "",
          designation: data.data.designation || "",
          department: data.data.department || "",
        });
      }
    } catch (e) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadImage(file, "admin-profile");

      if (uploadedUrl) {
        const token = localStorage.getItem("admin_token");
        const updateRes = await fetch(`${BASE_URL}/profile/admin/me/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          },
          body: JSON.stringify({ profileUrl: uploadedUrl }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          toast.success("Profile photo updated!");
          fetchProfile();
        }
      } else {
        toast.error("Failed to upload image");
      }
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("admin_token");
    const patch: Record<string, unknown> = changedProfileFields(
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
    const bioBefore =
      typeof profile?.bio === "string" ? profile.bio : JSON.stringify(profile?.bio ?? "");
    const bioAfter =
      typeof formData.bio === "string" ? formData.bio : JSON.stringify(formData.bio ?? "");
    if (bioBefore !== bioAfter) patch.bio = formData.bio;
    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (e) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-text" />
      </div>
    );
  }

  const displayName = profile?.name || username;

  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-[640px]">
        <PageHeader
          title={displayName}
          meta={[profile?.designation, profile?.department, UNIZ_CAMPUS_LABEL]
            .filter(Boolean)
            .join(" · ")}
          action={
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Back
            </Button>
          }
        />

        <div className="mb-8 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-2">
              {profile?.profile_url ? (
                <img
                  src={profile.profile_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[24px] font-medium text-text-3">
                  {displayName?.[0] || "?"}
                </span>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg/70">
                  <Loader2 className="animate-spin text-text" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              aria-label="Change photo"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profile?.role ? (
              <Badge icon={Shield}>{profile.role}</Badge>
            ) : null}
            <Badge tone="success">Verified</Badge>
          </div>
        </div>

        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (isEditing) handleUpdateProfile();
            else setIsEditing(true);
          }}
        >
          <section className="space-y-4">
            <h2 className={sectionTitleClass}>Contact</h2>
            <Field
              label="Full name"
              value={isEditing ? formData.name : displayName}
              editable={isEditing}
              onChange={(val) => setFormData({ ...formData, name: val })}
            />
            <Field
              label="Email address"
              value={formData.email || `${username}@rguktong.ac.in`}
            />
            <Field label="Username" value={username} />
            <Field
              label="Contact number"
              value={formData.contact || ""}
              placeholder="Not provided"
              editable={isEditing}
              onChange={(val) => setFormData({ ...formData, contact: val })}
            />
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className={sectionTitleClass}>Role</h2>
            <Field
              label="Department"
              value={formData.department || ""}
              placeholder="Administration"
              editable={isEditing}
              onChange={(val) => setFormData({ ...formData, department: val })}
            />
            <Field
              label="Designation"
              value={formData.designation || ""}
              placeholder="Webadmin"
              editable={isEditing}
              onChange={(val) => setFormData({ ...formData, designation: val })}
            />
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className={sectionTitleClass}>Biography</h2>
            {isEditing ? (
              <div>
                <label className={adminLabelClass}>Professional biography</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className={adminTextareaClass}
                  placeholder="Tell us about your professional background and interests..."
                />
              </div>
            ) : (
              <p className="text-body leading-6 text-text-2">
                {formData.bio || "No biography provided yet."}
              </p>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/settings")}
            >
              Security settings
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" isLoading={loading && isEditing}>
              {isEditing ? "Save changes" : "Edit details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  editable,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      {editable && onChange ? (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={adminInputClass}
        />
      ) : (
        <p className="text-body text-text">{value || placeholder || "—"}</p>
      )}
    </div>
  );
}
