/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/endpoints";
import {
  UserPlus,
  Search,
  Trash2,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Input } from "../../components/Input";
import { Button } from "@/components/ui/button";
import { cn } from "../../utils/cn";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { adminPageWrapClass, adminSelectClass, adminLabelClass, adminCardClass } from "../../components/admin/admin-ui";
import { ChevronDown } from "lucide-react";

type Role = "webadmin" | "dean" | "director";
type Permission =
  | "manage_banners"
  | "send_notifications"
  | "assign_roles"
  | "manage_users"
  | "manage_curriculum"
  | "view_reports";

type AdminUser = {
  id: string;
  username: string;
  role: Role;
};

type RolePermissions = Record<Role, Permission[]>;

export default function RoleManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermissions>({} as any);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "add" | "permissions">(
    "overview",
  );
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    role: "dean" as Role,
  });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [customPerms, setCustomPerms] = useState<Permission[]>([]);

  const assignableRoles = roles.filter((role) => role !== "webadmin");

  const token = localStorage.getItem("admin_token");
  const headers = {
    Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
    "Content-Type": "application/json",
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roleRes, adminRes] = await Promise.all([
        fetch(`${BASE_URL}/profile/admin/roles`, { headers }),
        fetch(`${BASE_URL}/profile/admin/getadmins`, { headers }),
      ]);
      const roleData = await roleRes.json();
      const adminData = await adminRes.json();

      if (roleData.success) {
        setPermissions(roleData.roles);
        setRoles(Object.keys(roleData.roles) as Role[]);
      }
      if (adminData.success) {
        const arr = adminData.admins.map((a: any) => ({
          id: a.id,
          username: a.Username,
          role: a.role,
        }));
        setAdmins(arr);
        setFiltered(arr);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching admins or roles");
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password)
      return alert("All fields required");
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/addadmin`, {
        method: "POST",
        headers,
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      alert(data.msg);
      if (data.success) {
        fetchAll();
        setNewAdmin({ username: "", password: "", role: "dean" });
        setTab("overview");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding admin");
    }
  };

  const deleteAdmin = async (username: string) => {
    if (!window.confirm(`Delete admin ${username}?`)) return;
    try {
      const res = await fetch(
        `${BASE_URL}/profile/admin/deleteadmin/${encodeURIComponent(username)}`,
        {
          method: "DELETE",
          headers,
        },
      );
      const data = await res.json();
      alert(data.msg);
      if (data.success) fetchAll();
    } catch (err) {
      console.error(err);
      alert("Error deleting admin");
    }
  };

  const assignRole = async (username: string, role: Role) => {
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/assign-role`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ username, role }),
      });
      const data = await res.json();
      alert(data.msg);
      if (data.success) fetchAll();
    } catch (err) {
      console.error(err);
      alert("Error assigning role");
    }
  };

  const updateRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(
        `${BASE_URL}/profile/admin/roles/${selectedRole}/permissions`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ permissions: customPerms }),
        },
      );
      const data = await res.json();
      alert(data.msg);
      if (data.success) fetchAll();
    } catch (err) {
      console.error(err);
      alert("Error updating permissions");
    }
  };

  const searchAdmin = async (query: string) => {
    setSearch(query);
    if (!query.trim()) return setFiltered(admins);
    try {
      const res = await fetch(
        `${BASE_URL}/profile/admin/searchadmin?q=${encodeURIComponent(query)}`,
        { headers },
      );
      const data = await res.json();
      if (data.success) {
        const arr = data.admins.map((a: any) => ({
          id: a.id,
          username: a.Username,
          role: a.role,
        }));
        setFiltered(arr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns: TableColumn<AdminUser>[] = [
    {
      id: "username",
      header: "Admin User",
      primary: true,
      cell: (admin) => (
        <span className="flex items-center justify-between gap-3">
          <span>{admin.username}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Delete Admin"
            className="text-text-3 hover:text-error sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              deleteAdmin(admin.username);
            }}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </span>
      ),
    },
    {
      id: "role",
      header: "Assigned Role",
      meta: true,
      cell: (admin) =>
        admin.role === "webadmin" ? (
          <span className="capitalize">webadmin</span>
        ) : (
        <div className="relative inline-block w-full max-w-[220px]" onClick={(e) => e.stopPropagation()}>
          <select
            value={admin.role}
            onChange={(e) => assignRole(admin.username, e.target.value as Role)}
            onClick={(e) => e.stopPropagation()}
            className={adminSelectClass}
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3"
          />
        </div>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (admin) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete Admin"
          onClick={(e) => {
            e.stopPropagation();
            deleteAdmin(admin.username);
          }}
          className="text-text-3 hover:text-error"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      <Button variant="ghost" size="compact" onClick={() => navigate("/admin")}>
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Button>

      <PageHeader
        title="Role Management"
        meta="Configure admin access and role-based permissions."
      />

      <Tabs
        label="Role management"
        value={tab}
        onChange={(id) => setTab(id as any)}
        tabs={[
          { id: "overview", label: "Admins Overview" },
          { id: "add", label: "Add New Admin" },
          { id: "permissions", label: "Permission Sets" },
        ]}
      />

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full md:w-96">
                <Input
                  value={search}
                  onchangeFunction={(e: any) => searchAdmin(e.target.value)}
                  placeholder="Find admin by username..."
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <span className="text-small text-text-2">
                {filtered.length} admins
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-2" />
                ))}
              </div>
            ) : (
              <Table
                columns={columns}
                rows={filtered}
                getRowId={(admin) => admin.id}
                empty={<EmptyState title="No admins found matching your search." />}
              />
            )}
          </div>
        )}

        {/* Add Admin Tab */}
        {tab === "add" && (
          <div className="max-w-xl mx-auto animate-in fade-in duration-300 pt-8">
            <div className={cn(adminCardClass, "p-8")}>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-surface-2 text-text">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-h3 text-head">Create New Admin</h2>
                <p className="text-text-2 mt-1">
                  Grant administrative access to a new user.
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  label="Username"
                  value={newAdmin.username}
                  onchangeFunction={(e: any) =>
                    setNewAdmin({ ...newAdmin, username: e.target.value })
                  }
                  placeholder="Choose a username"
                />
                <Input
                  label="Password"
                  type="password"
                  value={newAdmin.password}
                  onchangeFunction={(e: any) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  placeholder="Set a strong password"
                />

                <div>
                  <label className={adminLabelClass}>Initial Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, role: e.target.value as Role })
                    }
                    className={adminSelectClass}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <Button onClick={addAdmin} className="w-full">
                    Create Admin Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {tab === "permissions" && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Role Selector Sidebar */}
              <div className="bg-surface border border-border rounded-xl p-4 h-fit">
                <h3 className="font-semibold text-text px-2 mb-3 text-sm tracking-wide">
                  Select Role
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedRole(null);
                      setCustomPerms([]);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      !selectedRole
                        ? "bg-surface-2 text-text"
                        : "text-text-2 hover:bg-surface-2",
                    )}
                  >
                    Select a role...
                  </button>
                  {assignableRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRole(r);
                        setCustomPerms(permissions[r] || []);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                        selectedRole === r
                          ? "bg-surface-2 text-text"
                          : "text-text-2 hover:bg-surface-2",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Editor */}
              <div className="md:col-span-2">
                {selectedRole ? (
                  <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                      <div className="h-10 w-10 rounded-lg bg-surface-2 flex items-center justify-center text-text font-semibold text-lg">
                        {selectedRole[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-text capitalize">
                          {selectedRole} Permissions
                        </h3>
                        <p className="text-sm text-text-2">
                          Configure what this role can access.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(
                        [
                          "manage_banners",
                          "send_notifications",
                          "assign_roles",
                          "manage_users",
                          "manage_curriculum",
                          "view_reports",
                        ] as Permission[]
                      ).map((perm) => {
                        const isChecked = customPerms.includes(perm);
                        return (
                          <div
                            key={perm}
                            onClick={() => {
                              setCustomPerms((prev) =>
                                isChecked
                                  ? prev.filter((x) => x !== perm)
                                  : [...prev, perm],
                              );
                            }}
                            className={cn(
                              "flex items-center p-4 border rounded-xl cursor-pointer transition-[color,background-color,border-color,opacity,transform,box-shadow]",
                              isChecked
                                ? "border-border bg-surface-2/50"
                                : "border-border hover:border-border-strong",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors",
                                isChecked
                                  ? "bg-primary border-head text-primary-foreground"
                                  : "border-border-strong bg-surface",
                              )}
                            >
                              {isChecked && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="font-medium text-text capitalize select-none">
                              {perm.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-8 mt-4 border-t border-border flex justify-end">
                      <Button onClick={updateRolePermissions}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No Role Selected"
                    body="Select a role from the sidebar to configure permissions."
                    icon={ShieldCheck}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
