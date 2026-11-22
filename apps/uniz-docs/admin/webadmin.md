---
title: "Webadmin workspace"
description: "The canonical webadmin account, current sidebar, and the shared admin tables used across campus tools."
---

The webadmin workspace is the campus administration shell in the portal. It is not a second product. Students still use `uniz.rguktong.in`. The public college site is `rguktong.in`, edited from **Website editor** inside this workspace.

Code: `apps/uniz-portal/src/pages/admin/Webadmin/WebadminDashboard.tsx`.

## One webadmin account

The `webadmin` role may be held only by the canonical account:

- Username `webadmin` (not the mailbox string)
- Mailbox `webadmin@rguktong.ac.in` (trimmed, case-insensitive)

A username that is literally `webadmin@rguktong.ac.in` is **not** that account. `isWebadmin()` and `accessRole()` in `packages/uniz-shared/src/admin-role.ts` treat any other account that still carries the role string `webadmin` as `faculty`, the least-privileged staff role, so webadmin-only routes miss.

The [Roles screen](/admin/roles-directory) cannot edit or remove the webadmin role. Saving webadmin permissions returns 403 with "The webadmin role cannot be edited". Assigning `webadmin` to anyone else is rejected with "The webadmin role can only be assigned to webadmin@rguktong.ac.in".

[Database](/admin/database) access follows this account. There is no permission key to toggle it.

## Current navigation

Groups come from `WebadminDashboard`. Items appear when the signed-in role is allowed. Outpass Logs and Outing Protocol are **not** current tools. They render only for the SWO shell when `VITE_ENABLE_OUTPASS_OUTING` is on, and that flag is off in production.

| Group | Items |
|-------|--------|
| Overview | Overview |
| Students | Student Details, Student Bulk Ops |
| Academic | Attendance Upload, Grades Upload, Manage Subjects, Semester Registration |
| Campus | Home Banners, Campus Updates, Website Updates, Website editor, Push Alerts |
| Management | Faculty Management, System & Logs, Roles, Database, Security |
| Help | Help |

**Website editor**, **Roles**, and **Database** are limited to the canonical webadmin account (`portalRole === "webadmin"`). Academic uploads, faculty management, bulk student ops, and system logs also show for `coe`.

Related guides:

- [Roles screen](/admin/roles-directory)
- [Database browser](/admin/database)
- [Website editor](/admin/website-editor)
- [Academics](/admin/academics) and [Semester registration](/admin/semester-registration)

## Shared tables

Admin tables use `apps/uniz-portal/src/components/ui/table.tsx` and `row-actions.tsx`.

- The table fills its container.
- Row actions stay on one line (one menu control).
- Below 900px the wide layout stacks each row into a card (`stack="wide"`).

That pattern is used on Student Details, Faculty Management, banners, updates, uploads, registration, curriculum, logs, and the database grid.
