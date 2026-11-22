---
title: "Admin Overview"
description: "How staff sign in to the uniZ admin portal, including Turnstile, the password gate, and the webadmin workspace."
---

The admin portal is the staff interface on `uniz.rguktong.in`. HOD, dean, director, SWO, faculty who already have a login, and the canonical webadmin account each see a role-appropriate shell. Caretaker, warden, and security gate tools exist in the codebase but outpass is **not enabled**, so those queues are not a current job.

## Logging in

Use the admin sign-in, not a generic password pasted into `POST /auth/login` from a browser.

**Endpoint:** `POST /auth/login/admin`

```bash
POST https://api-uniz.rguktong.in/api/v1/auth/login/admin
Content-Type: application/json
```

```json
{
  "username": "director",
  "password": "<password>",
  "captchaToken": "<turnstile-token>"
}
```

Production checks Turnstile first. A missing token returns `400 AUTH_CAPTCHA_FAILED` even if the password is wrong. A curl without a valid token fails in production.

**Response:**

```json
{
  "success": true,
  "token": "eyJ...",
  "role": "director",
  "username": "DIRECTOR",
  "mustChangePassword": false,
  "admin_token": "eyJ..."
}
```

Store `admin_token` and send it as `Authorization: Bearer`. If `mustChangePassword` is true, the portal opens **Set a new password** and other APIs return `403 PASSWORD_CHANGE_REQUIRED` until the email code and new password succeed. See [Password](/api/auth/password).

::: info
Shared accounts that still exist include `director`, `dean`, `swo`, and `webadmin`. Individual `firstname.lastname` faculty logins are not issued yet. Usernames are not limited to a `dean_cse` / `security_admin` pattern. The webadmin role is only the account `webadmin` / `webadmin@rguktong.ac.in`. See [Webadmin workspace](/admin/webadmin).
:::

## Role-based access

| Role | What they use today |
|------|---------------------|
| Director | Reports, curriculum, user records. Shared username `director`. |
| Dean | Curriculum, reports, banners, alerts, as the [Roles screen](/admin/roles-directory) allows. |
| HOD | Department students and registration tracking. |
| SWO | Grievance queue. Outpass escalation is parked. |
| Faculty | Grades and attendance, if a login already exists. |
| Webadmin | The [workspace](/admin/webadmin): Roles, Database, Website editor, faculty management, academics, banners, tables. |
| Caretaker, warden, security | Parked outpass / gate tools. Not current production work. |

The portal hides items the role cannot open. A stray `webadmin` role on any other account is treated as `faculty`.

## What the dashboard shows

- **Webadmin** sees Overview plus Students, Academic, Campus (including Website editor), and Management (Faculty Management, System & Logs, Roles, Database, Security), then Help. See [Webadmin workspace](/admin/webadmin).
- **Dean and director** see academic oversight and the tools their permission rows allow.
- **HOD** sees department-scoped students and registration tracking.
- **SWO** sees grievances. Outpass is not in the live menu.
- **Caretaker, warden, and security** shells are for the parked outpass design. Do not brief staff as if those queues are open. References: [Approvals](/admin/approvals), [Security portal](/admin/security).

## System health

`GET /system/health` needs no authentication.

```bash
GET https://api-uniz.rguktong.in/api/v1/system/health
```

```json
{
  "success": true,
  "services": [
    { "name": "Auth Service", "status": "UP", "latency": "120ms" },
    { "name": "Mail Service", "status": "UP", "latency": "45ms" }
  ]
}
```

Use it before bulk grade uploads or result publishing. Shape and caveats: [Health](/api/platform/health).

## Key admin sections

- [Webadmin workspace](/admin/webadmin)
- [Roles screen](/admin/roles-directory)
- [Database browser](/admin/database)
- [Website editor](/admin/website-editor)
- [Academic management](/admin/academics)
- [Semester registration](/admin/semester-registration)
- [Approvals (parked)](/admin/approvals)
- [Security portal (parked)](/admin/security)
