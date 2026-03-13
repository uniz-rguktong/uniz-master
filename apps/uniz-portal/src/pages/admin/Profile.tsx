import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Loader2,
  CheckCircle,
  Shield,
  ArrowLeft,
  FileText,
  Building,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BASE_URL } from "../../api/endpoints";

const VITE_CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const VITE_CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function AdminProfile() {
  const username = (localStorage.getItem("username") || "Webmaster").replace(/"/g, "");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", VITE_CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();

      if (data.secure_url) {
        const token = localStorage.getItem("admin_token");
        const updateRes = await fetch(`${BASE_URL}/profile/admin/me/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          },
          body: JSON.stringify({ profileUrl: data.secure_url }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          toast.success("Profile photo updated!");
          fetchProfile();
        }
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/profile/admin/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify(formData),
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-navy-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/admin")}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative" />

          <div className="px-8 pb-12">
            <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-[24px] bg-white p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-[18px] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    {profile?.profile_url ? (
                      <img
                        src={profile.profile_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-black text-slate-300 uppercase">
                        {(profile?.name || username)?.[0] || "?"}
                      </span>
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-navy-900" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-navy-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-navy-800 transition-all active:scale-90 border-4 border-white"
                >
                  <Camera size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="text-3xl font-bold text-slate-900 tracking-tight bg-slate-50 border-b-2 border-navy-100 focus:outline-none px-2 py-1 rounded-t-lg"
                        placeholder="Your Name"
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {profile?.name || username}
                      </h1>
                    )}
                    <div className="px-3 py-1 bg-navy-50 text-navy-900 rounded-full text-[9px] font-black uppercase tracking-widest border border-navy-100 flex items-center gap-1.5 shrink-0">
                      <Shield size={10} /> {profile?.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditing) handleUpdateProfile();
                      else setIsEditing(true);
                    }}
                    className={`px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest border transition-all ${isEditing
                      ? "bg-navy-900 text-white border-navy-100 shadow-lg shadow-navy-100 hover:bg-navy-800"
                      : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {isEditing ? "Save Changes" : "Edit Details"}
                  </button>
                </div>
                <p className="text-slate-500 font-medium mt-1">
                  {profile?.designation ? `${profile.designation} • ` : ""}
                  {profile?.department ? `${profile.department} • ` : ""}
                  RGUKT Ongole
                </p>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <ProfileItem
                icon={<Mail className="text-navy-900" />}
                label="Email Address"
                value={formData.email || `${username}@rguktong.ac.in`}
                editable={false}
              />
              <ProfileItem
                icon={<User className="text-navy-900" />}
                label="Username"
                value={username ?? ""}
              />
              <ProfileItem
                icon={<Phone className="text-emerald-500" />}
                label="Contact Number"
                value={formData.contact || "Not provided"}
                editable={isEditing}
                onChange={(val) => setFormData({ ...formData, contact: val })}
              />
              <ProfileItem
                icon={<Building className="text-navy-900" />}
                label="Department"
                value={formData.department || "Administration"}
                editable={isEditing}
                onChange={(val) =>
                  setFormData({ ...formData, department: val })
                }
              />
              <ProfileItem
                icon={<Briefcase className="text-navy-900" />}
                label="Designation"
                value={formData.designation || "Webmaster"}
                editable={isEditing}
                onChange={(val) =>
                  setFormData({ ...formData, designation: val })
                }
              />
              <ProfileItem
                icon={<CheckCircle className="text-amber-500" />}
                label="Account Status"
                value="Verified & Active"
              />
            </div>

            {/* Bio Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-slate-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  Professional Biography
                </h4>
              </div>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-navy-100"
                  placeholder="Tell us about your professional background and interests..."
                />
              ) : (
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {formData.bio || "No biography provided yet."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Quick Link */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex-1 bg-white border border-slate-200 p-6 rounded-2xl hover:border-navy-100 transition-all group"
          >
            <h4 className="font-bold text-slate-900 group-hover:text-navy-900 transition-colors mb-1">
              Security Settings
            </h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Reset or update your password
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        {editable && onChange ? (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm font-semibold text-slate-900 tracking-tight bg-white border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-navy-100"
          />
        ) : (
          <p className="text-sm font-semibold text-slate-900 tracking-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
