import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { BASE_URL } from "../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "../../utils/cn";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RowActions, type RowActionItem } from "@/components/ui/row-actions";
import {
  adminPageWrapClass,
  adminSelectClass,
  adminLabelClass,
  adminCardClass,
  adminInputClass,
  adminModalDescClass,
  adminModalShellClass,
  adminModalTitleClass,
} from "../../components/admin/admin-ui";

type DirectoryRole = "webadmin" | "dean" | "director";

type AdminUser = {
  id: string;
  username: string;
  role: string;
};

type PermissionId =
  | "manage_users"
  | "manage_curriculum"
  | "view_reports"
  | "manage_banners"
  | "send_notifications"
  | "assign_roles";

type PermRow = {
  id: string;
  group: string;
  label: string;
  detail: string;
  mode: "toggle" | "missing";
};

const EDITABLE_ROLES: DirectoryRole[] = ["dean", "director"];

const ROLE_ORDER: DirectoryRole[] = ["webadmin", "dean", "director"];

const ROLE_COPY: Record<DirectoryRole, string> = {
  webadmin: "Full campus administration. This system role cannot be edited or removed.",
  dean: "Academic oversight for curriculum, reports, banners, and alerts.",
  director: "Campus direction for reports, curriculum, and user records.",
};

const PERMISSION_ROWS: PermRow[] = [
  {
    id: "manage_users",
    group: "Students",
    label: "Manage user records",
    detail: "Directory accounts and the student records this role is allowed to open.",
    mode: "toggle",
  },
  {
    id: "manage_curriculum",
    group: "Academics",
    label: "Manage curriculum",
    detail: "Subjects, semester setup, and registration tools.",
    mode: "toggle",
  },
  {
    id: "view_reports",
    group: "Academics",
    label: "View reports",
    detail: "Academic reports and registration progress.",
    mode: "toggle",
  },
  {
    id: "manage_banners",
    group: "Campus and website",
    label: "Manage home banners",
    detail: "Featured banners on the student home.",
    mode: "toggle",
  },
  {
    id: "send_notifications",
    group: "Campus and website",
    label: "Send alerts",
    detail: "Campus updates and push broadcasts.",
    mode: "toggle",
  },
  {
    id: "faculty-gap",
    group: "Faculty",
    label: "Faculty tools",
    detail: "No faculty permission is stored on this API. Faculty accounts stay on Faculty Management.",
    mode: "missing",
  },
  {
    id: "assign_roles",
    group: "System and database",
    label: "Assign roles",
    detail: "Move people between dean and director.",
    mode: "toggle",
  },
  {
    id: "database-gap",
    group: "System and database",
    label: "Database browser",
    detail: "Database access follows the webadmin account. There is no permission key to toggle.",
    mode: "missing",
  },
];

function roleLabel(role: string) {
  if (role === "webadmin") return "Webadmin";
  if (role === "dean") return "Dean";
  if (role === "director") return "Director";
  return role;
}

function isProtectedRole(role: string) {
  return role === "webadmin" || !EDITABLE_ROLES.includes(role as DirectoryRole);
}

function samePermissions(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((item) => set.has(item));
}

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  run: () => void;
};

export default function RoleManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", role: "dean" });

  const sessionUser = (localStorage.getItem("username") || "").replace(/"/g, "").trim().toLowerCase();

  const token = localStorage.getItem("admin_token");
  const headers = {
    Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
    "Content-Type": "application/json",
  };

  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [roleRes, adminRes] = await Promise.all([
        fetch(`${BASE_URL}/profile/admin/roles`, { headers }),
        fetch(`${BASE_URL}/profile/admin/getadmins`, { headers }),
      ]);
      const roleData = await roleRes.json();
      const adminData = await adminRes.json();
      if (!roleData.success || !adminData.success) {
        setLoadError(roleData.msg || adminData.msg || "Could not load roles.");
        return;
      }
      const nextPermissions = roleData.roles as Record<string, string[]>;
      setPermissions(nextPermissions);
      const nextRoles = Object.keys(nextPermissions);
      setRoles(nextRoles);
      const arr: AdminUser[] = (adminData.admins as { id: string; Username: string; role?: string }[]).map((admin) => ({
        id: String(admin.id),
        username: admin.Username,
        role: String(admin.role || ""),
      }));
      setAdmins(arr);
      setSelected((current) => {
        if (current && nextPermissions[current]) {
          setDraft([...(nextPermissions[current] || [])]);
          return current;
        }
        return current;
      });
    } catch (err) {
      console.error(err);
      setLoadError("Could not load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // headers are rebuilt from localStorage; the directory is loaded once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedRoles = useMemo(() => {
    const known = ROLE_ORDER.filter((role) => roles.includes(role) || permissions[role]);
    const extra = roles.filter((role) => !ROLE_ORDER.includes(role as DirectoryRole));
    return [...known, ...extra];
  }, [roles, permissions]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const admin of admins) map[admin.role] = (map[admin.role] || 0) + 1;
    return map;
  }, [admins]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return admins.filter((admin) => {
      if (roleFilter !== "ALL" && admin.role !== roleFilter) return false;
      if (!query) return true;
      return admin.username.toLowerCase().includes(query) || roleLabel(admin.role).toLowerCase().includes(query);
    });
  }, [admins, roleFilter, search]);

  const selectedProtected = selected ? isProtectedRole(selected) : false;
  const dirty = Boolean(selected && !selectedProtected && !samePermissions(draft, permissions[selected] || []));

  function chooseRole(role: string) {
    setSelected(role);
    setRoleFilter(role);
    setDraft([...(permissions[role] || [])]);
  }

  function togglePermission(id: PermissionId) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function assignRole(username: string, role: string) {
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/assign-role`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ username, role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.msg || "Role updated");
        fetchAll();
      } else toast.error(data.msg || "Could not update role");
    } catch (err) {
      console.error(err);
      toast.error("Could not update role");
    }
  }

  async function deleteAdmin(username: string) {
    try {
      const res = await fetch(
        `${BASE_URL}/profile/admin/deleteadmin/${encodeURIComponent(username)}`,
        { method: "DELETE", headers },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.msg || "Admin removed");
        fetchAll();
      } else toast.error(data.msg || "Could not remove admin");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove admin");
    }
  }

  async function savePermissions() {
    if (!selected || selectedProtected) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/roles/${selected}/permissions`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ permissions: draft }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.msg || "Permissions updated");
        fetchAll();
      } else toast.error(data.msg || "Could not save permissions");
    } catch (err) {
      console.error(err);
      toast.error("Could not save permissions");
    } finally {
      setSaving(false);
    }
  }

  async function addAdmin() {
    if (!newAdmin.username.trim() || !newAdmin.password) {
      toast.error("Username and password are required");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/addadmin`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: newAdmin.username.trim().toLowerCase(),
          password: newAdmin.password,
          role: newAdmin.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.msg || "Admin added");
        setNewAdmin({ username: "", password: "", role: "dean" });
        setShowAdd(false);
        fetchAll();
      } else toast.error(data.msg || "Could not add admin");
    } catch (err) {
      console.error(err);
      toast.error("Could not add admin");
    }
  }

  const roleColumns: TableColumn<string>[] = [
    {
      id: "role",
      header: "Role",
      primary: true,
      grow: true,
      width: 180,
      title: (role) => roleLabel(role),
      cell: (role) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-head">{roleLabel(role)}</span>
          {isProtectedRole(role) ? <Badge tone="neutral">Protected</Badge> : null}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      width: 360,
      title: (role) => ROLE_COPY[role as DirectoryRole] || "Directory role",
      cell: (role) => ROLE_COPY[role as DirectoryRole] || "Directory role returned by the API.",
    },
    {
      id: "members",
      header: "Members",
      numeric: true,
      width: 110,
      fixed: true,
      title: (role) => String(counts[role] || 0),
      cell: (role) => counts[role] || 0,
    },
    {
      id: "access",
      header: "Permissions",
      width: 140,
      fixed: true,
      title: (role) =>
        isProtectedRole(role) ? "Protected" : `${(permissions[role] || []).length} enabled`,
      cell: (role) =>
        isProtectedRole(role) ? "Locked" : `${(permissions[role] || []).length} enabled`,
    },
  ];

  const permissionColumns: TableColumn<PermRow>[] = [
    {
      id: "label",
      header: "Permission",
      primary: true,
      grow: true,
      width: 280,
      clip: false,
      title: (row) => `${row.label}. ${row.detail}`,
      cell: (row) => (
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-head" title={row.label}>
            {row.label}
          </span>
          <span className="mt-0.5 block truncate text-small text-text-2" title={row.detail}>
            {row.detail}
          </span>
        </span>
      ),
    },
    {
      id: "group",
      header: "Area",
      meta: true,
      width: 180,
      fixed: true,
      title: (row) => row.group,
      cell: (row) => row.group,
    },
    {
      id: "access",
      header: "Access",
      actions: true,
      width: 120,
      cell: (row) => {
        if (row.mode === "missing") {
          return <span className="text-small text-text-3">Not stored</span>;
        }
        const checked = draft.includes(row.id);
        return (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={row.label}
            disabled={selectedProtected || saving}
            onClick={(event) => {
              event.stopPropagation();
              togglePermission(row.id as PermissionId);
            }}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-[0.45]",
              checked ? "bg-primary" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-transform",
                checked ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        );
      },
    },
  ];

  const memberColumns: TableColumn<AdminUser>[] = [
    {
      id: "username",
      header: "Account",
      primary: true,
      grow: true,
      width: 220,
      title: (admin) => admin.username,
      cell: (admin) => (
        <span className="block truncate font-semibold text-head" title={admin.username}>
          {admin.username}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      meta: true,
      width: 140,
      fixed: true,
      title: (admin) => roleLabel(admin.role),
      cell: (admin) => roleLabel(admin.role),
    },
    {
      id: "actions",
      header: "Actions",
      actions: true,
      width: 132,
      cell: (admin) => {
        const locked = isProtectedRole(admin.role);
        const self = admin.username.toLowerCase() === sessionUser;
        if (locked) {
          return (
            <span className="inline-flex items-center gap-1 text-small text-text-3" title="Protected system role">
              <Lock size={14} aria-hidden /> Protected
            </span>
          );
        }
        const items: RowActionItem[] = EDITABLE_ROLES.filter((role) => role !== admin.role).map((role) => ({
          id: `assign-${role}`,
          label: `Assign ${roleLabel(role)}`,
          confirm: {
            title: `Assign ${roleLabel(role)}?`,
            body: `${admin.username} will use the ${roleLabel(role)} permission set.`,
            confirmLabel: "Assign",
          },
          onSelect: () => assignRole(admin.username, role),
        }));
        if (!self) {
          items.push({
            id: "remove",
            label: "Remove",
            icon: Trash2,
            destructive: true,
            confirm: {
              title: `Remove ${admin.username}?`,
              body: "This deletes the admin account. It cannot be undone.",
              confirmLabel: "Remove",
            },
            onSelect: () => deleteAdmin(admin.username),
          });
        }
        return <RowActions label={`Actions for ${admin.username}`} items={items} />;
      },
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      <Button variant="ghost" size="compact" onClick={() => navigate("/admin")}>
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <PageHeader
        title="Roles"
        meta="Directory roles, who holds them, and the permission set stored for each role."
        action={
          <Button type="button" onClick={() => setShowAdd((open) => !open)}>
            <UserPlus size={16} /> Add account
          </Button>
        }
      />

      {showAdd ? (
        <div className={cn(adminCardClass, "p-5")}>
          <h2 className="text-dense font-medium text-head">New directory account</h2>
          <p className="mt-1 text-small text-text-2">
            Webadmin cannot be assigned here. New accounts are dean or director.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
            <div>
              <label className={adminLabelClass} htmlFor="new-admin-username">Username</label>
              <input
                id="new-admin-username"
                value={newAdmin.username}
                onChange={(event) => setNewAdmin({ ...newAdmin, username: event.target.value })}
                className={adminInputClass}
                placeholder="registrar"
                autoComplete="off"
              />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="new-admin-password">Password</label>
              <input
                id="new-admin-password"
                type="password"
                value={newAdmin.password}
                onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })}
                className={adminInputClass}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="new-admin-role">Role</label>
              <select
                id="new-admin-role"
                value={newAdmin.role}
                onChange={(event) => setNewAdmin({ ...newAdmin, role: event.target.value })}
                className={adminSelectClass}
              >
                {EDITABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="compact" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="button" size="compact" onClick={addAdmin}>
              Create account
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search accounts"
            aria-label="Search accounts"
            className={cn(adminInputClass, "pl-10")}
          />
        </div>
        <div className="w-full min-[900px]:w-48">
          <label className="sr-only" htmlFor="role-filter">Filter by role</label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(event) => {
              const value = event.target.value;
              setRoleFilter(value);
              if (value === "ALL") setSelected(null);
              else chooseRole(value);
            }}
            className={adminSelectClass}
          >
            <option value="ALL">All roles</option>
            {orderedRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadError && !loading ? (
        <EmptyState
          title="Roles could not be loaded"
          body={loadError}
          tone="error"
          action={
            <Button type="button" variant="outline" onClick={fetchAll}>
              Try again
            </Button>
          }
        />
      ) : (
        <Table
          loading={loading}
          sticky
          stack="wide"
          columns={roleColumns}
          rows={orderedRoles}
          getRowId={(role) => role}
          selectedId={selected || undefined}
          onRowClick={chooseRole}
          empty={<EmptyState title="No roles returned" icon={ShieldCheck} />}
        />
      )}

      {selected ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
            <div className="min-w-0">
              <h2 className="font-serif text-[24px] font-normal leading-8 text-head">
                {roleLabel(selected)}
              </h2>
              <p className="mt-1 text-body text-text-2">
                {ROLE_COPY[selected as DirectoryRole] || "Directory role."}{" "}
                {counts[selected] || 0} {counts[selected] === 1 ? "member" : "members"}.
              </p>
            </div>
            {dirty ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => setDraft([...(permissions[selected] || [])])}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  size="compact"
                  disabled={saving}
                  onClick={() =>
                    setConfirm({
                      title: `Save ${roleLabel(selected)} permissions?`,
                      body: "People with this role pick up the new set the next time the directory is read.",
                      confirmLabel: "Save",
                      run: () => {
                        setConfirm(null);
                        void savePermissions();
                      },
                    })
                  }
                >
                  Save changes
                </Button>
              </div>
            ) : null}
          </div>
          {selectedProtected ? (
            <p className="text-small text-text-2">
              Webadmin is a protected system role. The switches show the stored set and cannot be changed or removed.
            </p>
          ) : (
            <p className="text-small text-text-2">
              Toggles write the directory permission set. Faculty tools and the database browser are not keys in this API, so those rows stay display-only.
            </p>
          )}
          <Table
            sticky
            stack="wide"
            columns={permissionColumns}
            rows={PERMISSION_ROWS}
            getRowId={(row) => row.id}
            empty={<EmptyState title="No permissions" />}
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-[24px] font-normal leading-8 text-head">
          {roleFilter === "ALL" ? "Accounts" : `${roleLabel(roleFilter)} accounts`}
        </h2>
        <Table
          loading={loading}
          sticky
          stack="wide"
          columns={memberColumns}
          rows={visibleMembers}
          getRowId={(admin) => admin.id}
          empty={
            <EmptyState
              title={search.trim() ? "No accounts match" : "No one holds this role"}
              body={search.trim() ? "Try another username." : "Add an account or assign someone from another role."}
              icon={ShieldCheck}
            />
          }
        />
      </section>

      {confirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-overlay" aria-label="Cancel" onClick={() => setConfirm(null)} />
          <div role="alertdialog" aria-modal="true" className={cn(adminModalShellClass, "relative z-10 w-full max-w-md p-6")}>
            <h2 className={adminModalTitleClass}>{confirm.title}</h2>
            <p className={cn("mt-3", adminModalDescClass)}>{confirm.body}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" size="compact" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="compact"
                variant={confirm.destructive ? "destructive" : "primary"}
                onClick={confirm.run}
              >
                {confirm.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
