/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  Building,
  Mail,
  Phone,
  GraduationCap,
  LayoutDashboard,
  Users,
  Lock,
  Pencil,
  Save,
  X,
  ChevronRight,
  Search,
  Hash,
  Filter,
  Loader2,
  ShieldCheck,
  BookOpen,
  Menu,
} from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import {
  BASE_URL,
  FACULTY_INFO,
  SEARCH_STUDENTS,
  FORGOT_PASS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  SET_NEW_PASS_ENDPOINT,
  ADMIN_VIEW_STUDENT,
} from "../../api/endpoints";

/* ────────────────────────────────────────────────
   Types
────────────────────────────────────────────────── */
type ActiveTab = "dashboard" | "profile" | "students" | "password";

interface FacultyProfile {
  id: string;
  Username: string;
  Name: string;
  Email: string;
  Department: string;
  Designation: string;
  Role: string;
  Contact?: string;
  ProfileUrl?: string;
  Bio?: Record<string, string[]>;
}

interface Student {
  username: string;
  name: string;
  branch: string;
  year: string;
  gender?: string;
  email?: string;
  phone_number?: string;
  is_suspended?: boolean;
  profile_url?: string;
}

/* ────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────── */
const getToken = () =>
  (
    localStorage.getItem("faculty_token") ||
    localStorage.getItem("admin_token") ||
    ""
  ).replace(/"/g, "");

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/* ────────────────────────────────────────────────
   Password strength meter
────────────────────────────────────────────────── */
const calcStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const label = ["", "Weak", "Moderate", "Strong"][score];
  const color = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"][score];
  return { score, label, color };
};

/* ────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────── */
export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { logout } = useLogout();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const username =
    localStorage.getItem("username")?.replace(/"/g, "") || "Professor";
  const isHOD = (profile?.Role || "").toLowerCase() === "hod";

  /* ── Fetch profile ── */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(FACULTY_INFO, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setProfile(data.faculty);
      } catch (e) {
        console.error(e);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => logout();

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: User },
    { id: "students", label: "Branch Students", icon: Users },
    { id: "password", label: "Change Password", icon: Lock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSection
            profile={profile}
            loading={profileLoading}
            onUpdated={setProfile}
          />
        );
      case "students":
        return (
          <StudentsSection
            department={profile?.Department || "CSE"}
            isHOD={isHOD}
          />
        );
      case "password":
        return <PasswordSection />;
      default:
        return (
          <OverviewSection
            profile={profile}
            loading={profileLoading}
            isHOD={isHOD}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* ── Sidebar ── */}
      <aside
        className={`bg-white border-r border-neutral-100 transition-all duration-300 z-50 ${
          isSidebarOpen ? "w-72" : "w-20"
        } hidden md:flex flex-col h-screen sticky top-0 shadow-sm`}
      >
        <div className="p-6 flex items-center gap-4 border-b border-neutral-50 shrink-0">
          <div className="w-12 h-12 bg-black rounded-[14px] flex items-center justify-center shrink-0 shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-bold text-neutral-900 text-lg tracking-tight leading-none">
                Faculty Portal
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold mt-1.5 leading-none">
                {isHOD ? "HOD Dashboard" : "Staff Dashboard"}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] transition-all duration-200 group ${
                activeTab === item.id
                  ? "bg-black text-white shadow-lg"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <item.icon
                size={20}
                className={`shrink-0 ${activeTab === item.id ? "text-white" : "text-neutral-400"}`}
              />
              {isSidebarOpen && (
                <span
                  className={`text-[14px] tracking-tight ${activeTab === item.id ? "font-semibold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              )}
              {isSidebarOpen && activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-50 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all group"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && (
              <span className="text-[14px] font-semibold">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-100 h-[72px] px-8 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 hover:bg-neutral-100 rounded-xl transition-all hidden md:flex text-neutral-400"
          >
            {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-neutral-900 leading-none tracking-tight">
                {profile?.Name || username}
              </p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1.5">
                {isHOD ? "Head of Department" : "Faculty"} ·{" "}
                {profile?.Department}
              </p>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-black flex items-center justify-center font-bold text-white shadow-sm overflow-hidden">
              {profile?.ProfileUrl ? (
                <img
                  src={profile.ProfileUrl}
                  alt={profile.Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile?.Name || username || "F")[0].toUpperCase()
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}

/* ============================================================
   OVERVIEW SECTION
   ============================================================ */
function OverviewSection({
  profile,
  loading,
  isHOD,
  setActiveTab,
}: {
  profile: FacultyProfile | null;
  loading: boolean;
  isHOD: boolean;
  setActiveTab: (t: ActiveTab) => void;
}) {
  return (
    <div className="p-8 space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[28px] py-8 px-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          {isHOD && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5" /> Head of Department
            </span>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] leading-none">
              Welcome, {profile?.Name?.split(" ")[0] || "Professor"}
            </h1>
            <p className="text-neutral-400 text-sm mt-3 max-w-lg">
              {profile?.Designation || "Faculty"} · {profile?.Department}{" "}
              Department
            </p>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-[0.04] translate-x-1/4 translate-y-1/4">
          <BookOpen size={260} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-5">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              id: "profile",
              label: "My Profile",
              sub: "View & update details",
              icon: User,
            },
            {
              id: "students",
              label: "Branch Students",
              sub: `View all ${profile?.Department || ""} students`,
              icon: Users,
            },
            {
              id: "password",
              label: "Change Password",
              sub: "Secure your account",
              icon: Lock,
            },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -3 }}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className="group relative flex flex-col items-start p-6 bg-white border border-neutral-100 rounded-2xl hover:shadow-xl hover:border-black/10 transition-all text-left"
            >
              <div className="p-3 rounded-xl bg-neutral-50 group-hover:bg-black group-hover:text-white transition-colors duration-300 mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                {item.label}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                {item.sub}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Profile Card */}
      {!loading && profile && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Email", value: profile.Email, icon: Mail },
              {
                label: "Department",
                value: profile.Department,
                icon: Building,
              },
              {
                label: "Designation",
                value: profile.Designation || "Faculty",
                icon: GraduationCap,
              },
              {
                label: "Contact",
                value: profile.Contact || "Not provided",
                icon: Phone,
              },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </p>
                <p className="font-semibold text-neutral-900 text-sm">
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PROFILE SECTION
   ============================================================ */
function ProfileSection({
  profile,
  loading,
  onUpdated,
}: {
  profile: FacultyProfile | null;
  loading: boolean;
  onUpdated: (p: FacultyProfile) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    designation: "",
    profileUrl: "",
    bio: {} as Record<string, string[]>,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.Name || "",
        contact: profile.Contact || "",
        designation: profile.Designation || "",
        profileUrl: profile.ProfileUrl || "",
        bio: profile.Bio || {},
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/faculty/me/update`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          designation: form.designation,
          profileUrl: form.profileUrl,
          bio: form.bio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated!");
        onUpdated(data.faculty);
        setIsEditing(false);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-100 rounded-lg" />
          <div className="h-64 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-neutral-400">Profile not found</div>
    );
  }

  return (
    <div className="p-8 pb-20 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            My Profile
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            View and manage your faculty profile
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all shadow-sm"
          >
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-600 rounded-xl text-sm font-bold hover:bg-neutral-200 transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Profile header */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold text-3xl border-2 border-white/20 overflow-hidden shrink-0">
            {profile.ProfileUrl ? (
              <img
                src={profile.ProfileUrl}
                alt={profile.Name}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.Name[0]
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{profile.Name}</h3>
            <p className="text-neutral-400 text-sm mt-1 uppercase tracking-widest font-bold">
              {profile.Designation || "Faculty"} · {profile.Department}
            </p>
            {profile.Role?.toLowerCase() === "hod" && (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Head of Department
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              label: "Username / ID",
              value: profile.Username,
              editable: false,
            },
            { label: "Email Address", value: profile.Email, editable: false },
            { label: "Department", value: profile.Department, editable: false },
            {
              label: "System Role",
              value: profile.Role?.toUpperCase() || "TEACHER",
              editable: false,
            },
          ].map((f) => (
            <div key={f.label} className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {f.label}
              </label>
              <p className="font-semibold text-neutral-900 text-base">
                {f.value}
              </p>
            </div>
          ))}

          {/* Editable: Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Full Name
            </label>
            {isEditing ? (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
              />
            ) : (
              <p className="font-semibold text-neutral-900 text-base">
                {profile.Name || "Not set"}
              </p>
            )}
          </div>

          {/* Editable: Designation */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Designation
            </label>
            {isEditing ? (
              <input
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
              />
            ) : (
              <p className="font-semibold text-neutral-900 text-base">
                {profile.Designation || "Not set"}
              </p>
            )}
          </div>

          {/* Editable: Contact */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Contact Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Your phone number"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
              />
            ) : (
              <p className="font-semibold text-neutral-900 text-base">
                {profile.Contact || "Not provided"}
              </p>
            )}
          </div>

          {/* Editable: Profile URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Profile Photo URL
            </label>
            {isEditing ? (
              <input
                type="url"
                value={form.profileUrl}
                onChange={(e) =>
                  setForm({ ...form, profileUrl: e.target.value })
                }
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
              />
            ) : (
              <p className="font-semibold text-neutral-900 text-base truncate">
                {profile.ProfileUrl || "No photo set"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bio / Professional Details */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-bold text-neutral-900">
            Professional Information
          </h3>
        </div>

        <div className="space-y-8">
          {[
            "Specialization",
            "Research Areas",
            "Experience",
            "Subjects Taught",
            "Additional Responsibilities",
            "Administrative Experience",
            "Publications",
            "Faculty Dev Program",
            "Seminar Conference",
            "Workshops",
            "Any Other",
          ].map((key) => {
            const values = (form.bio as any)[key] || [];
            return (
              <div key={key} className="space-y-3">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  {key}
                </label>
                {isEditing ? (
                  <textarea
                    value={values.join("\n")}
                    onChange={(e) => {
                      const newVals = e.target.value
                        .split("\n")
                        .filter((v: string) => v.trim() !== "");
                      setForm({
                        ...form,
                        bio: { ...form.bio, [key]: newVals },
                      });
                    }}
                    placeholder={`Enter ${key} (one per line)`}
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm leading-relaxed"
                  />
                ) : values.length > 0 ? (
                  <ul className="space-y-2">
                    {values.map((v: string, i: number) => (
                      <li
                        key={i}
                        className="text-neutral-600 text-sm flex items-start gap-2 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 shrink-0" />
                        {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-400 text-sm italic">
                    No information provided
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STUDENTS SECTION  (Branch view)
   ============================================================ */
function StudentsSection({
  department,
  isHOD,
}: {
  department: string;
  isHOD: boolean;
}) {
  const [searchMode, setSearchMode] = useState<"id" | "filter">("filter");
  const [studentId, setStudentId] = useState("");
  const [branch, setBranch] = useState(department);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const departments = isHOD
    ? [
        "CSE",
        "ECE",
        "EEE",
        "ME",
        "CIVIL",
        "CHEMISTRY",
        "PHYSICS",
        "MATHEMATICS",
        "IT",
        "ENGLISH",
      ]
    : [department];

  const fetchById = async () => {
    if (!studentId.trim()) {
      toast.error("Enter a student ID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        ADMIN_VIEW_STUDENT(studentId.trim().toUpperCase()),
        {
          headers: authHeader(),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults([data.student]);
        setSelectedStudent(null);
      } else {
        toast.error(data.message || "Student not found");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchByFilter = async () => {
    setLoading(true);
    try {
      const res = await fetch(SEARCH_STUDENTS, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ branch, year, page: 1, limit: 100 }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.students || []);
        if (!data.students?.length)
          toast.info("No students found for this filter");
      } else {
        toast.error(data.message || "Search failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullDetails = async (un: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(un.toUpperCase()), {
        headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) setSelectedStudent(data.student);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-8 pb-20 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Branch Students
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {isHOD
              ? "HOD - all department access"
              : `View students in ${department}`}
          </p>
        </div>
        {/* Mode Toggle */}
        <div className="flex bg-neutral-100 p-1 rounded-full">
          <button
            onClick={() => {
              setSearchMode("id");
              setSearchResults([]);
              setSelectedStudent(null);
            }}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${searchMode === "id" ? "bg-white text-black shadow" : "text-neutral-500 hover:text-black"}`}
          >
            By ID
          </button>
          <button
            onClick={() => {
              setSearchMode("filter");
              setSearchResults([]);
              setSelectedStudent(null);
            }}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${searchMode === "filter" ? "bg-white text-black shadow" : "text-neutral-500 hover:text-black"}`}
          >
            By Filter
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchMode === "id" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchById();
          }}
          className="flex items-center gap-3 max-w-2xl"
        >
          <div className="relative flex-1">
            <Hash
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Enter Student ID (e.g. O210329)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              className="w-full h-12 pl-12 pr-5 bg-white border border-neutral-200 rounded-full focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all font-semibold text-neutral-900 text-sm shadow-sm"
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="h-12 px-8 bg-black text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Find
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              size={14}
            />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-white border border-neutral-200 pl-10 pr-8 h-12 rounded-full font-bold text-[11px] uppercase tracking-widest text-neutral-600 outline-none focus:ring-4 focus:ring-black/5 focus:border-black shadow-sm min-w-[160px] appearance-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-white border border-neutral-200 pl-4 pr-8 h-12 rounded-full font-bold text-[11px] uppercase tracking-widest text-neutral-600 outline-none focus:ring-4 focus:ring-black/5 focus:border-black shadow-sm min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="">All Batches</option>
              {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchByFilter}
            disabled={loading}
            className="h-12 px-8 bg-black text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            Fetch Students
          </button>
        </div>
      )}

      {/* Results */}
      <div
        className={`grid gap-6 ${selectedStudent ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}
      >
        <div className={`space-y-3 ${selectedStudent ? "lg:col-span-5" : ""}`}>
          {searchResults.length > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2">
              {searchResults.length} Student
              {searchResults.length !== 1 ? "s" : ""} Found
            </p>
          )}
          {searchResults.map((std) => (
            <div
              key={std.username}
              onClick={() => fetchFullDetails(std.username)}
              className={`group flex items-center justify-between p-4 px-6 bg-white border rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                selectedStudent?.username === std.username
                  ? "border-black ring-4 ring-black/5 shadow-xl"
                  : "border-neutral-100 hover:border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-[16px] flex items-center justify-center transition-colors font-bold uppercase ${selectedStudent?.username === std.username ? "bg-black text-white" : "bg-neutral-50 text-neutral-400 group-hover:bg-black group-hover:text-white"}`}
                >
                  {std.name?.[0] || "S"}
                </div>
                <div>
                  <p className="font-bold text-neutral-900 leading-tight">
                    {std.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-neutral-100 px-2 py-0.5 rounded-md">
                      {std.username}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-neutral-200" />
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">
                      {std.branch}
                    </span>
                    {std.year && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-neutral-200" />
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">
                          {std.year}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`text-neutral-300 transition-transform ${selectedStudent?.username === std.username ? "rotate-90 text-black" : ""}`}
              />
            </div>
          ))}

          {searchResults.length === 0 && !loading && (
            <div className="p-20 flex flex-col items-center gap-4 bg-white rounded-2xl border border-neutral-100 text-center">
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                <Users size={36} className="text-neutral-300" />
              </div>
              <div>
                <p className="font-bold text-neutral-900">No students yet</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Use a filter above to load students
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Details panel */}
        <AnimatePresence>
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-7 sticky top-24 h-fit"
            >
              {detailLoading ? (
                <div className="p-8 bg-white rounded-2xl border border-neutral-100 animate-pulse space-y-4">
                  <div className="h-6 bg-neutral-100 w-1/2 rounded" />
                  <div className="h-4 bg-neutral-100 w-2/3 rounded" />
                  <div className="h-4 bg-neutral-100 w-1/3 rounded" />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl overflow-hidden">
                  <div className="bg-black p-8 text-white relative">
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                        {selectedStudent.profile_url ? (
                          <img
                            src={selectedStudent.profile_url}
                            className="w-full h-full object-cover rounded-2xl"
                            alt=""
                          />
                        ) : (
                          <span className="text-3xl font-black text-white uppercase opacity-40">
                            {selectedStudent.name?.[0] || "S"}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {selectedStudent.name}
                        </h3>
                        <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest mt-1">
                          {selectedStudent.username}
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedStudent.is_suspended ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}
                        >
                          {selectedStudent.is_suspended
                            ? "Suspended"
                            : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-6 text-sm">
                    {[
                      ["Branch", selectedStudent.branch],
                      ["Year", selectedStudent.year],
                      ["Section", selectedStudent.section || "-"],
                      [
                        "Gender",
                        selectedStudent.gender === "M"
                          ? "Male"
                          : selectedStudent.gender === "F"
                            ? "Female"
                            : selectedStudent.gender || "-",
                      ],
                      ["Email", selectedStudent.email || "-"],
                      ["Phone", selectedStudent.phone_number || "-"],
                      ["Room No.", selectedStudent.roomno || "-"],
                      ["Blood Group", selectedStudent.blood_group || "-"],
                    ].map(([k, v]) => (
                      <div key={k} className="space-y-1">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                          {k}
                        </p>
                        <p className="font-semibold text-neutral-900 truncate">
                          {v}
                        </p>
                      </div>
                    ))}
                    {selectedStudent.cgpa !== undefined && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                          CGPA
                        </p>
                        <p className="font-bold text-2xl text-neutral-900">
                          {String(selectedStudent.cgpa)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
   PASSWORD SECTION  (OTP-based, same as students)
   ============================================================ */
type PwdStep = "current" | "otp" | "new";

function PasswordSection() {
  const [step, setStep] = useState<PwdStep>("current");
  const [username] = useState(
    () => localStorage.getItem("username")?.replace(/"/g, "") || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = useCallback(
    () => calcStrength(newPassword),
    [newPassword],
  )();

  /* Step 1 - verify current password via OTP request */
  const requestOtp = async () => {
    if (!username) {
      toast.error("Username not found. Please re-login.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(FORGOT_PASS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "OTP sent to your devices");
        setStep("otp");
      } else {
        toast.error(data.message || "Could not send OTP");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 - verify OTP */
  const verifyOtp = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp: otp.trim() }),
      });
      const data = await res.json();
      if (data.success && data.resetToken) {
        setResetToken(data.resetToken);
        toast.success("OTP verified!");
        setStep("new");
      } else {
        toast.error(data.message || "Invalid or expired OTP");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* Step 3 - set new password */
  const setNewPass = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (strength.score < 2) {
      toast.error("Password too weak. Use numbers and special characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(SET_NEW_PASS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully! Please sign in again.");
        setTimeout(() => {
          localStorage.removeItem("faculty_token");
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/signin";
        }, 2000);
      } else {
        toast.error(data.message || "Failed to update password");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* Alternate: direct change with current password (no OTP) */
  const changeDirectly = async () => {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/password/change`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed! Please sign in again.");
        setTimeout(() => {
          localStorage.removeItem("faculty_token");
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/signin";
        }, 2000);
      } else {
        toast.error(data.message || "Incorrect current password");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Record<PwdStep, string> = {
    current: "Verify Identity",
    otp: "Enter OTP",
    new: "New Password",
  };

  return (
    <div className="p-8 pb-20 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Change Password
        </h2>
        <p className="text-neutral-500 text-sm mt-1">
          Secure your account with a new password
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {(["current", "otp", "new"] as PwdStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s ? "bg-black text-white" : i < ["current", "otp", "new"].indexOf(step) ? "bg-neutral-200 text-neutral-500" : "border-2 border-neutral-200 text-neutral-300"}`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${step === s ? "text-neutral-900" : "text-neutral-400"}`}
            >
              {stepLabels[s]}
            </span>
            {i < 2 && (
              <div className="w-8 h-0.5 bg-neutral-200 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 space-y-6">
        <AnimatePresence mode="wait">
          {step === "current" && (
            <motion.div
              key="current"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="text-sm text-neutral-600 font-medium">
                  We'll send a one-time password to your registered devices to
                  verify your identity.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Your Username
                </label>
                <div className="px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl font-bold text-neutral-900">
                  {username || "Not found"}
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={requestOtp}
                  disabled={loading || !username}
                  className="w-full h-12 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send OTP to my Device
                </button>
                <p className="text-center text-neutral-400 text-xs font-medium">
                  - or change with current password -
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  />
                  {newPassword && (
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${strength.score === 3 ? "text-emerald-600" : strength.score === 2 ? "text-amber-600" : "text-red-500"}`}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={changeDirectly}
                    disabled={loading || !currentPassword || !newPassword}
                    className="w-full h-12 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Change Password
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="text-sm text-neutral-600 font-medium">
                  Enter the 6-digit OTP sent to your registered devices.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  One-Time Password
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl font-bold text-2xl text-center text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all tracking-widest"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("current")}
                  className="flex-1 h-12 bg-neutral-100 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-[2] h-12 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify OTP
                </button>
              </div>
              <button
                onClick={requestOtp}
                disabled={loading}
                className="w-full text-center text-xs text-neutral-400 hover:text-neutral-900 font-medium transition-colors"
              >
                Resend OTP
              </button>
            </motion.div>
          )}

          {step === "new" && (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Identity verified. Set
                  your new password.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  />
                  {newPassword && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${strength.score === 3 ? "text-emerald-600" : strength.score === 2 ? "text-amber-600" : "text-red-500"}`}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  />
                  {confirmPassword && (
                    <p
                      className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {newPassword === confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={setNewPass}
                disabled={
                  loading || !newPassword || newPassword !== confirmPassword
                }
                className="w-full h-12 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
