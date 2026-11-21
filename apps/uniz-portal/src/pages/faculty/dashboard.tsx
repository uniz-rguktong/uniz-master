/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { formatRoleLabel } from "@/utils/displayText";
import {
  User,
  LayoutDashboard,
  Users,
  Lock,
  Pencil,
  Save,
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Panel } from "@/components/ui/panel";
import { Tile } from "@/components/ui/tile";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const color = ["", "bg-error", "bg-warning", "bg-success"][score];
  return { score, label, color };
};

/* ────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────── */
export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { logout } = useLogout();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
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
    <AdminShell
      navGroups={[{ group: null, items: navItems }]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as ActiveTab)}
      onLogout={handleLogout}
      username={profile?.Name || username}
      roleLabel={isHOD ? "Head of department" : "Faculty"}
      headerSubtitle={profile?.Department}
    >
      <Tabs
        label="Faculty sections"
        tabs={navItems.map((item) => ({ id: item.id, label: item.label }))}
        value={activeTab}
        onChange={(id) => setActiveTab(id as ActiveTab)}
        className="mb-6"
      />
      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderContent()}
      </div>
    </AdminShell>
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
  const summary = [
    { label: "Email", value: profile?.Email },
    { label: "Department", value: profile?.Department },
    { label: "Designation", value: profile?.Designation || "Faculty" },
    { label: "Contact", value: profile?.Contact || "Not provided" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile?.Name?.split(" ")[0] || "Overview"}
        meta={
          loading
            ? "Loading your profile"
            : `${profile?.Designation || "Faculty"} · ${profile?.Department || "Department"}${isHOD ? " · Head of department" : ""}`
        }
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Tile icon={User} label="My profile" line="View and update your details" onClick={() => setActiveTab("profile")} />
        <Tile icon={Users} label="Branch students" line={`Students in ${profile?.Department || "your department"}`} onClick={() => setActiveTab("students")} />
        <Tile icon={Lock} label="Change password" line="Secure your account" onClick={() => setActiveTab("password")} />
      </div>
      {!loading && profile ? (
        <Panel title="Profile">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {summary.map((field) => (
              <div key={field.label}>
                <dt className="text-small text-text-2">{field.label}</dt>
                <dd className="mt-1 text-body text-text">{field.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ) : null}
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
      const patch: Record<string, unknown> = {};
      if ((form.name || "") !== (profile.Name || "")) patch.name = form.name;
      if ((form.contact || "") !== (profile.Contact || "")) patch.contact = form.contact;
      if ((form.designation || "") !== (profile.Designation || "")) {
        patch.designation = form.designation;
      }
      if ((form.profileUrl || "") !== (profile.ProfileUrl || "")) {
        patch.profileUrl = form.profileUrl;
      }
      if (JSON.stringify(form.bio || {}) !== JSON.stringify(profile.Bio || {})) {
        patch.bio = form.bio;
      }
      if (Object.keys(patch).length === 0) {
        toast.info("No changes to save");
        setIsEditing(false);
        setSaving(false);
        return;
      }
      const res = await fetch(`${BASE_URL}/profile/faculty/me/update`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated");
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
          <div className="h-8 w-48 bg-surface-2 rounded-lg" />
          <div className="h-64 bg-surface-2 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-text-3">Profile not found</div>
    );
  }

  return (
    <div className="max-w-[640px] space-y-6">
      <PageHeader
        title="My profile"
        meta="View and manage your faculty profile"
        action={
          !isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          )
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-panel">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-100 text-lg font-semibold text-navy-900 dark:bg-surface-2 dark:text-text">
            {profile.ProfileUrl ? (
              <img src={profile.ProfileUrl} alt={profile.Name} className="h-full w-full object-cover" />
            ) : (
              profile.Name[0]
            )}
          </div>
          <div>
            <h3 className="text-h3 text-head">{profile.Name}</h3>
            <p className="mt-1 text-body text-text-2">
              {profile.Designation || "Faculty"} · {profile.Department}
            </p>
            {profile.Role?.toLowerCase() === "hod" ? <Badge tone="neutral">Head of department</Badge> : null}
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
              value: profile.Role ? formatRoleLabel(profile.Role) : "Teacher",
              editable: false,
            },
          ].map((f) => (
            <div key={f.label} className="space-y-2">
              <label className="text-caption font-medium text-text-2">
                {f.label}
              </label>
              <p className="font-semibold text-text text-base">
                {f.value}
              </p>
            </div>
          ))}

          {/* Editable: Full Name */}
          <div className="space-y-2">
            <label className="text-caption font-medium text-text-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
              />
            ) : (
              <p className="font-semibold text-text text-base">
                {profile.Name || "Not set"}
              </p>
            )}
          </div>

          {/* Editable: Designation */}
          <div className="space-y-2">
            <label className="text-caption font-medium text-text-2">
              Designation
            </label>
            {isEditing ? (
              <input
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
              />
            ) : (
              <p className="font-semibold text-text text-base">
                {profile.Designation || "Not set"}
              </p>
            )}
          </div>

          {/* Editable: Contact */}
          <div className="space-y-2">
            <label className="text-caption font-medium text-text-2">
              Contact Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Your phone number"
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
              />
            ) : (
              <p className="font-semibold text-text text-base">
                {profile.Contact || "Not provided"}
              </p>
            )}
          </div>

          {/* Editable: Profile URL */}
          <div className="space-y-2">
            <label className="text-caption font-medium text-text-2">
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
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
              />
            ) : (
              <p className="font-semibold text-text text-base truncate">
                {profile.ProfileUrl || "No photo set"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bio / Professional Details */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden p-8 space-y-8">
        <h2 className="font-serif text-[22px] font-normal leading-[30px] text-head">
          Professional information
        </h2>

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
                <label className="text-caption font-medium text-text-2 block">
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
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl font-medium text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150 text-sm leading-relaxed"
                  />
                ) : values.length > 0 ? (
                  <ul className="space-y-2">
                    {values.map((v: string, i: number) => (
                      <li
                        key={i}
                        className="text-text-2 text-sm flex items-start gap-2 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-border mt-2 shrink-0" />
                        {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body text-text-3">
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
    <div className="space-y-6">
      <PageHeader
        title="Branch students"
        meta={isHOD ? "All departments" : `Students in ${department}`}
      />
      <Tabs
        label="Search mode"
        tabs={[
          { id: "filter", label: "By filter" },
          { id: "id", label: "By ID" },
        ]}
        value={searchMode}
        onChange={(id) => {
          setSearchMode(id as "id" | "filter");
          setSearchResults([]);
          setSelectedStudent(null);
        }}
      />
      {searchMode === "id" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchById();
          }}
          className="flex max-w-[640px] flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            placeholder="Student ID, for example O210329"
            aria-label="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.toUpperCase())}
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-text placeholder:text-text-3 focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring max-[639px]:h-12"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
            Find
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={branch}
            aria-label="Department"
            onChange={(e) => setBranch(e.target.value)}
            className="h-11 rounded-md border border-border-strong bg-surface px-4 text-body text-text focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring max-[639px]:h-12"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={year}
            aria-label="Batch"
            onChange={(e) => setYear(e.target.value)}
            className="h-11 rounded-md border border-border-strong bg-surface px-4 text-body text-text focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring max-[639px]:h-12"
          >
            <option value="">All batches</option>
            {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button type="button" onClick={fetchByFilter} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Fetch students
          </Button>
        </div>
      )}

      <Table
        rows={searchResults}
        getRowId={(row) => row.username}
        onRowClick={(row) => fetchFullDetails(row.username)}
        empty={
          <EmptyState
            title="No students yet"
            body="Use a filter above to load students."
          />
        }
        columns={[
          { id: "id", header: "ID", primary: true, cell: (row) => row.username },
          { id: "name", header: "Name", meta: true, cell: (row) => row.name },
          { id: "section", header: "Branch", meta: true, cell: (row) => row.branch || "—" },
          { id: "year", header: "Batch", cell: (row) => row.year || "—" },
          {
            id: "status",
            header: "Status",
            cell: (row) =>
              row.is_suspended ? (
                <Badge tone="error">Suspended</Badge>
              ) : (
                <Badge tone="success">Active</Badge>
              ),
          },
        ]}
      />

      <AlertDialog open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
        <AlertDialogContent className="max-w-[640px]">
          <AlertDialogHeader className="items-start text-left">
            <AlertDialogTitle className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              {detailLoading ? "Loading" : selectedStudent?.name || "Student"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body text-text-2">
              {selectedStudent?.username}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-tint" />
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-tint" />
            </div>
          ) : selectedStudent ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Branch", selectedStudent.branch],
                ["Year", selectedStudent.year],
                ["Section", selectedStudent.section || "—"],
                ["Gender", selectedStudent.gender === "M" ? "Male" : selectedStudent.gender === "F" ? "Female" : selectedStudent.gender || "—"],
                ["Email", selectedStudent.email || "—"],
                ["Phone", selectedStudent.phone_number || "—"],
                ["Room", selectedStudent.roomno || "—"],
                ["Blood group", selectedStudent.blood_group || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-small text-text-2">{label}</dt>
                  <dd className="mt-1 text-body text-text">{value}</dd>
                </div>
              ))}
              {selectedStudent.cgpa !== undefined ? (
                <div className="sm:col-span-2">
                  <dt className="text-small text-text-2">CGPA</dt>
                  <dd className="mt-1 font-sans text-[28px] font-semibold leading-9 text-head tabular-nums">
                    {String(selectedStudent.cgpa)}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)}>
              Close
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
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
  const [otpEmail, setOtpEmail] = useState("");
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
        const masked =
          typeof data.email === "string" ? data.email.trim() : "";
        if (masked) setOtpEmail(masked);
        toast.success(
          masked
            ? `We sent a 6-digit code to ${masked}.`
            : data.message || "We sent a 6-digit code to your email.",
        );
        setStep("otp");
      } else {
        toast.error(data.message || "Could not send the code to your email");
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
        toast.success("OTP verified");
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
        toast.success("Password changed. Please sign in again.");
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
        toast.success("Password changed. Please sign in again.");
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
    <div className="mx-auto max-w-[480px] space-y-6">
      <PageHeader title="Change password" meta="Secure your account with a new password" />

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {(["current", "otp", "new"] as PwdStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-[color,background-color] duration-150 ${step === s ? "bg-primary text-primary-foreground" : i < ["current", "otp", "new"].indexOf(step) ? "bg-tint text-text-2" : "border-2 border-border text-text-3"}`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${step === s ? "text-text" : "text-text-3"}`}
            >
              {stepLabels[s]}
            </span>
            {i < 2 && (
              <div className="w-8 h-0.5 bg-tint hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-sm p-8 space-y-6">
        
          {step === "current" && (
            <div
              key="current"
              className="space-y-6"
            >
              <div className="p-4 bg-surface-2 rounded-xl border border-border">
                <p className="text-sm text-text-2 font-medium">
                  We&apos;ll email a one-time password to the address on your
                  account.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-caption font-medium text-text-2">
                  Your Username
                </label>
                <div className="px-4 py-3 bg-tint border border-border rounded-lg font-medium text-navy-900">
                  {username || "Not found"}
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={requestOtp}
                  disabled={loading || !username}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-[0.45]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Email me a code
                </button>
                <p className="text-center text-text-3 text-xs font-medium">
                  - or change with current password -
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
                  />
                  {newPassword && (
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-[color,background-color,border-color,box-shadow] duration-150 duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-caption font-medium ${strength.score === 3 ? "text-success" : strength.score === 2 ? "text-warning" : "text-error"}`}
                      >
                        {strength.score === 3 ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        ) : strength.score === 2 ? (
                          <AlertTriangle className="h-4 w-4" aria-hidden />
                        ) : (
                          <AlertCircle className="h-4 w-4" aria-hidden />
                        )}
                        {strength.label}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={changeDirectly}
                    disabled={loading || !currentPassword || !newPassword}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-[0.45]"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div
              key="otp"
              className="space-y-6"
            >
              <div className="p-4 bg-surface-2 rounded-xl border border-border">
                <p className="text-sm text-text-2 font-medium">
                  {otpEmail
                    ? `Enter the 6-digit code sent to ${otpEmail}.`
                    : "Enter the 6-digit code sent to your email."}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-caption font-medium text-text-2">
                  One-Time Password
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 bg-surface-2 border border-border rounded-lg font-semibold text-2xl text-center text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("current")}
                  className="flex h-11 flex-1 items-center justify-center rounded-full border border-head px-6 text-[15px] font-semibold text-head hover:bg-tint"
                >
                  Back
                </button>
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-[0.45]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify OTP
                </button>
              </div>
              <button
                onClick={requestOtp}
                disabled={loading}
                className="w-full text-center text-xs text-text-3 hover:text-text font-medium transition-colors"
              >
                Resend code
              </button>
            </div>
          )}

          {step === "new" && (
            <div
              key="new"
              className="space-y-6"
            >
              <div className="p-4 bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))] rounded-xl border border-success">
                <p className="text-sm text-success font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Identity verified. Set
                  your new password.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-caption font-medium text-text-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
                  />
                  {newPassword && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="h-1.5 flex-1 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-[color,background-color,border-color,box-shadow] duration-150 duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-caption font-medium ${strength.score === 3 ? "text-success" : strength.score === 2 ? "text-warning" : "text-error"}`}
                      >
                        {strength.score === 3 ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        ) : strength.score === 2 ? (
                          <AlertTriangle className="h-4 w-4" aria-hidden />
                        ) : (
                          <AlertCircle className="h-4 w-4" aria-hidden />
                        )}
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-caption font-medium text-text-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-navy-700 transition-[border-color,box-shadow] duration-150"
                  />
                  {confirmPassword && (
                    <p
                      className={`text-xs font-medium flex items-center gap-1.5 mt-1 ${newPassword === confirmPassword ? "text-success" : "text-error"}`}
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-[0.45]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </div>
          )}
        
      </div>
    </div>
  );
}
