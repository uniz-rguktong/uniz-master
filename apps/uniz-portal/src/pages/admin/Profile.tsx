import { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import {
  User,
  Mail,
  Phone,
  Camera,
  Loader2,
  CheckCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { adminUsername } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BASE_URL, UPLOAD_IMAGE } from "../../api/endpoints";

export default function AdminProfile() {
  const username = useRecoilValue(adminUsername);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
      if (data.success) {
        setProfile(data.data);
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
      formData.append("image", file);

      const res = await fetch(UPLOAD_IMAGE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(localStorage.getItem("admin_token") || "").replace(/"/g, "")}`,
        },
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        const token = localStorage.getItem("admin_token");
        const updateRes = await fetch(`${BASE_URL}/profile/admin/me/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          },
          body: JSON.stringify({ profileUrl: data.url }),
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
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
                      <User size={48} className="text-slate-300" />
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-90 border-4 border-white"
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
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {profile?.name || username}
                  </h1>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5">
                    <Shield size={10} /> {profile?.role}
                  </div>
                </div>
                <p className="text-slate-500 font-medium mt-1">
                  System Administrator • RGUKT Ongole
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <ProfileItem
                icon={<Mail className="text-blue-500" />}
                label="Email Address"
                value={
                  profile?.email ||
                  `${(username ?? "").toLowerCase()}@rguktong.ac.in`
                }
              />
              <ProfileItem
                icon={<User className="text-indigo-500" />}
                label="Username"
                value={username ?? ""}
              />
              <ProfileItem
                icon={<Phone className="text-emerald-500" />}
                label="Contact Number"
                value={profile?.contact || "Not provided"}
              />
              <ProfileItem
                icon={<CheckCircle className="text-amber-500" />}
                label="Account Status"
                value="Verified & Active"
              />
            </div>
          </div>
        </div>

        {/* Security Quick Link */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex-1 bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-600 transition-all group"
          >
            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
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
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
