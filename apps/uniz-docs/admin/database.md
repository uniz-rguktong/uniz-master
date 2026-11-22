---
title: "Database browser"
description: "Webadmin-only table browser for Postgres. Schema sidebar, grid, SQL, and history. Not a public API."
---

**Database** is a privileged tool for the canonical webadmin account. It is a point-and-click browser over Postgres, not a public API and not a connection string you hand to another client.

UI: `apps/uniz-portal/src/pages/admin/Webadmin/database/*`.

Service: `apps/uniz-dbadmin` (`uniz-dbadmin-service:3010`). The gateway prefix is `/api/v1/dbadmin`. Only `isWebadmin()` is accepted (`apps/uniz-dbadmin/src/auth.ts`: "Only the webadmin can open the database editor."). There is no Roles permission that turns this on for dean or director. See [Roles screen](/admin/roles-directory).

::: warning
Do not paste database URLs, role passwords, or vault values into tickets or docs. Operators reach the data through this signed-in screen.
:::

## What the screen does

- Schema sidebar and table list (`TableSidebar`, schema preference in `schemaPreference.ts`).
- Data grid with sort, filter, search, and pagination (`DataGrid`).
- Cell and row editing, insert, and delete. Delete asks for confirmation. The dialog states that saved rows are removed and that each removal is kept in History and can be undone.
- SQL panel for a command against the selected database (`SqlPanel`).
- History drawer (`HistoryDrawer`). Saved changes can be reviewed. Row edits can be undone from the drawer. A SQL command cannot be undone with one click.

The grid uses the same shared admin table that stacks into cards below 900px. See [Webadmin workspace](/admin/webadmin).

## Gateway

`/api/v1/dbadmin` is in `serviceMap` as `dbadmin` and is proxied to `uniz-dbadmin-service:3010`. Gateway session checks still apply. Responses are not cached (`service === "dbadmin"` is treated as sensitive in `apps/uniz-gateway/src/index.ts`).

This prefix is webadmin-only. It is live. It is not a student or faculty route.
