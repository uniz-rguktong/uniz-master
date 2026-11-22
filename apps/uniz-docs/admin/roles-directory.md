---
title: "Roles screen"
description: "Webadmin Roles directory, permission matrix, and account assignment. Distinct from the product role list."
---

The **Roles** screen is a webadmin tool for three directory roles. It is not the product role list on [Roles](/roles) (student, faculty, HOD, SWO, and the parked gate roles).

Screen title: **Roles**. Code: `apps/uniz-portal/src/pages/admin/RoleManagement.tsx`. Nav id: `role_mgmt`. API: `apps/uniz-user/src/controllers/admin-directory.controller.ts`.

## Three parts

1. **Directory** — webadmin, dean, director, in that order.
2. **Permission matrix** — grouped toggles for the selected role.
3. **Accounts** — people who hold the selected role. Assign or remove dean and director. The webadmin role cannot be edited or removed.

| Role | Copy on the screen |
|------|--------------------|
| webadmin | Full campus administration. This system role cannot be edited or removed. |
| dean | Academic oversight for curriculum, reports, banners, and alerts. |
| director | Campus direction for reports, curriculum, and user records. |

Only the canonical webadmin account can open this screen. See [Webadmin workspace](/admin/webadmin).

## Permission matrix

Rows come from `PERMISSION_ROWS`. Only dean and director permissions are editable. Saving the webadmin set returns **403** (`The webadmin role cannot be edited`).

| Group | Row | Key | Mode |
|-------|-----|-----|------|
| Students | Manage user records | `manage_users` | Toggle |
| Academics | Manage curriculum | `manage_curriculum` | Toggle |
| Academics | View reports | `view_reports` | Toggle |
| Campus and website | Manage home banners | `manage_banners` | Toggle |
| Campus and website | Send alerts | `send_notifications` | Toggle |
| Faculty | Faculty tools | none | Display only |
| System and database | Assign roles | `assign_roles` | Toggle |
| System and database | Database browser | none | Display only |

Display-only copy:

- **Faculty tools** — "No faculty permission is stored on this API. Faculty accounts stay on Faculty Management."
- **Database browser** — "Database access follows the webadmin account. There is no permission key to toggle."

Locked switches use a dashed control. They are not shown as a faded off switch.

## Assign and remove

Assigning `webadmin` to any account other than the canonical one is rejected: "The webadmin role can only be assigned to webadmin@rguktong.ac.in". Removing a non-directory role from this page is rejected: "Only directory roles can be removed here".

Shared accounts such as `director`, `dean`, `swo`, and `webadmin` still exist. Individual `firstname.lastname` faculty logins are **not** issued yet. Create those later, as a separate step, from Faculty Management — not by treating this directory as the faculty roster.
