---
title: "Endpoint reference"
description: "Every public UniZ API endpoint on https://api-uniz.rguktong.in, generated from the gateway and service route files."
---

# Endpoint reference

Base URL: `https://api-uniz.rguktong.in`. All paths below are full paths on that host.

Send `Authorization: Bearer <token>` where the Auth column says JWT. Get a token from `POST /api/v1/auth/login`. Role checks happen in the controllers, so a valid token with the wrong role gets `403`.

## Conventions

- JSON in, JSON out, unless noted (templates and exports return files).
- Success responses carry `success: true` plus data. Errors return `{ success: false, code, message }` or `{ error }`.
- Path params are shown as `:name`.

## Rate limits

`RATE_LIMIT_MODE=enforce` is on in production, so limits return `429`.

| Limiter | Limit | 429 code |
|---------|-------|----------|
| Gateway, every request | 6000 / min per IP | `GATEWAY_RATE_LIMIT` |
| Login | 20 failed / 15 min per user+IP, 5000 / 15 min per IP | `LOGIN_RATE_LIMIT`, `LOGIN_IP_RATE_LIMIT` |
| OTP push | 2 / min per user | `OTP_PUSH_LIMIT` |
| OTP email | 4 / 2 min per user | `OTP_EMAIL_LIMIT` |
| OTP hourly (all channels) | 15 / hour per user | `OTP_LIMIT_HOUR` |
| Auth general (OTP verify, reset) | 50 / 15 min per user | `RATE_LIMIT_EXCEEDED` |
| Account actions | 60 / 15 min per user+IP | `ACCOUNT_RATE_LIMIT` |
| Grievance, outpass, outing submit | 20 / 15 min per IP | `RATE_LIMIT_EXCEEDED` |

Responses include standard `RateLimit-*` headers.

## Error codes

| HTTP | Code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Body failed schema validation |
| 401 | `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED` | Missing, invalid, expired or revoked token |
| 401 | `AUTH_INVALID_CREDENTIALS` | Wrong username or password |
| 403 | `AUTH_FORBIDDEN` | Role not allowed |
| 403 | `PASSWORD_CHANGE_REQUIRED` | Account must change password first (when enforced) |
| 404 | `RESOURCE_NOT_FOUND` | Unknown record. Unknown `/api/v1/<service>` returns `{ "error": "Service Not Found" }` |
| 409 | `RESOURCE_ALREADY_EXISTS` | Duplicate record |
| 429 | see rate limits | Limit hit |
| 500 | `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR` | Server side failure |
| 503 | `OUTPASS_OUTING_DISABLED` | `/api/v1/requests/*` while outpass and outing are off |

## Gateway

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/v1/health` | No | `{ "status": "ok" }` |
| GET | `/api/v1/system/health/live` | No | `{ "status": "ok" }` |
| GET | `/api/v1/system/health` | No | `{ status: ok\|degraded\|down, services: [{ name, status, latency }], cached }`, 503 when a critical service is down |
| GET | `/api/v1/files/img/*` | No | Stored image, immutable cache headers |


## Auth

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| POST | `/api/v1/auth/login` | No | 20 failed / 15 min per user+IP, 5000 / 15 min per IP | `{ username, password }` |
| POST | `/api/v1/auth/login/student` | No | 20 failed / 15 min per user+IP, 5000 / 15 min per IP | `{ username, password }` |
| POST | `/api/v1/auth/login/admin` | No | 20 failed / 15 min per user+IP, 5000 / 15 min per IP | `{ username, password }` |
| POST | `/api/v1/auth/signup` | No |  | `{ username, password (min 6), role?, email? }` |
| POST | `/api/v1/auth/otp/request` | No | 2 / min and 15 / hour per user | `{ username }` |
| POST | `/api/v1/auth/otp/request-email` | No | 4 / 2 min and 15 / hour per user | `{ username }` |
| POST | `/api/v1/auth/otp/verify` | No | 50 / 15 min per user | `{ username, otp (6 chars) }` |
| POST | `/api/v1/auth/password/reset` | No | 50 / 15 min per user | `{ username, resetToken, newPassword (min 6) }` |
| POST | `/api/v1/auth/password/change` | JWT | 60 / 15 min per user+IP | `{ currentPassword, newPassword (min 6) }` |
| POST | `/api/v1/auth/admin/reset-password` | No | 50 / 15 min per user | `{ username, password, new_password (min 6) }` |
| POST | `/api/v1/auth/admin/global-reset-password` | JWT | 60 / 15 min per user+IP | `{ targetUsername, newPassword (min 6) }` |
| POST | `/api/v1/auth/admin/suspend` | JWT | 60 / 15 min per user+IP | `{ username, suspended }` |
| POST | `/api/v1/auth/logout` | No |  |  |
| GET | `/api/v1/auth/health` | No |  |  |

## Profiles

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| GET | `/api/v1/profile/student/me` | JWT |  |  |
| GET | `/api/v1/profile/student/bootstrap` | JWT |  |  |
| GET | `/api/v1/profile/admin/student/template` | JWT |  |  |
| POST | `/api/v1/profile/admin/student/upload` | JWT |  |  |
| GET | `/api/v1/profile/admin/student/upload/progress` | JWT |  |  |
| GET | `/api/v1/profile/admin/student/export` | JWT |  |  |
| GET | `/api/v1/profile/admin/upload-history` | JWT |  |  |
| GET | `/api/v1/profile/admin/student/:username` | JWT |  |  |
| PUT | `/api/v1/profile/student/update` | JWT |  |  |
| PUT | `/api/v1/profile/admin/student/:username` | JWT |  |  |
| DELETE | `/api/v1/profile/admin/student/bulk-delete` | JWT |  |  |
| DELETE | `/api/v1/profile/admin/student/:username` | JWT |  |  |
| POST | `/api/v1/profile/student/search` | JWT |  |  |
| PUT | `/api/v1/profile/admin/student/:username/suspend` | JWT |  |  |
| POST | `/api/v1/profile/admin/student/create` | JWT |  |  |
| POST | `/api/v1/profile/admin/student/promote` | JWT |  |  |
| POST | `/api/v1/profile/admin/student/reset-campus-presence` | JWT |  |  |
| GET | `/api/v1/profile/admin/analytics/campus-presence` | JWT |  |  |
| POST | `/api/v1/profile/admin/student/cohort-action` | JWT |  |  |
| GET | `/api/v1/profile/faculty/me` | JWT |  |  |
| POST | `/api/v1/profile/faculty/create` | JWT |  |  |
| POST | `/api/v1/profile/faculty/search` | JWT |  |  |
| POST | `/api/v1/profile/admin/faculty/bulk-create` | JWT |  |  |
| PUT | `/api/v1/profile/admin/faculty/bulk-update` | JWT |  |  |
| DELETE | `/api/v1/profile/admin/faculty/bulk-delete` | JWT |  |  |
| GET | `/api/v1/profile/admin/faculty/:username` | JWT |  |  |
| PUT | `/api/v1/profile/admin/faculty/:username` | JWT |  |  |
| DELETE | `/api/v1/profile/admin/faculty/:username` | JWT |  |  |
| GET | `/api/v1/profile/admin/admin/:username` | JWT |  |  |
| PUT | `/api/v1/profile/faculty/me/update` | JWT |  |  |
| PUT | `/api/v1/profile/admin/me/update` | JWT |  |  |
| PUT | `/api/v1/profile/admin/faculty/:username/suspend` | JWT |  |  |
| PUT | `/api/v1/profile/student/status` | JWT |  |  |
| POST | `/api/v1/profile/student/status` | JWT |  |  |
| GET | `/api/v1/profile/admin/me` | JWT |  |  |
| GET | `/api/v1/profile/admin/batches` | JWT |  |  |
| GET | `/api/v1/profile/health` | No |  |  |

## CMS (portal banners and notices)

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| GET | `/api/v1/cms/banners/public` | Public (CMS key where configured) |  |  |
| GET | `/api/v1/cms/notifications` | Public (CMS key where configured) |  |  |
| GET | `/api/v1/cms/admin/banners` | JWT |  |  |
| POST | `/api/v1/cms/admin/banners` | JWT |  |  |
| PUT | `/api/v1/cms/admin/banners/:id` | JWT |  |  |
| DELETE | `/api/v1/cms/admin/banners/:id` | JWT |  |  |
| POST | `/api/v1/cms/admin/updates` | JWT |  |  |
| PUT | `/api/v1/cms/admin/updates/:id` | JWT |  |  |
| DELETE | `/api/v1/cms/admin/updates/:id` | JWT |  |  |
| POST | `/api/v1/cms/admin/tenders` | JWT |  |  |
| POST | `/api/v1/cms/admin/visibility/:type/:id` | JWT |  | `{ isVisible }`, type is banner, update or tender |

## Files

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| POST | `/api/v1/files/image/upload` | JWT |  | multipart `image`, optional `purpose` |

## Grievances

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| POST | `/api/v1/grievance/submit` | JWT | 20 / 15 min per IP |  |
| GET | `/api/v1/grievance/list` | JWT |  |  |
| PATCH | `/api/v1/grievance/:id/resolve` | JWT |  |  |
| DELETE | `/api/v1/grievance/all` | JWT |  |  |
| DELETE | `/api/v1/grievance/:id` | JWT |  |  |

## Academics

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| GET | `/api/v1/academics/grades` | JWT |  |  |
| GET | `/api/v1/academics/grades/batch` | JWT |  |  |
| POST | `/api/v1/academics/grades/add` | JWT |  |  |
| PUT | `/api/v1/academics/grades/bulk-update` | JWT |  |  |
| GET | `/api/v1/academics/grades/template` | JWT |  |  |
| GET | `/api/v1/academics/grades/download/:semesterId` | JWT |  |  |
| POST | `/api/v1/academics/grades/upload` | JWT |  |  |
| POST | `/api/v1/academics/grades/publish-email` | JWT |  |  |
| GET | `/api/v1/academics/upload/progress` | JWT |  |  |
| GET | `/api/v1/academics/grades/upload/progress` | JWT |  |  |
| GET | `/api/v1/academics/attendance/upload/progress` | JWT |  |  |
| GET | `/api/v1/academics/grades/publish/progress` | JWT |  |  |
| GET | `/api/v1/academics/attendance/publish/progress` | JWT |  |  |
| GET | `/api/v1/academics/attendance` | JWT |  |  |
| POST | `/api/v1/academics/attendance/add` | JWT |  |  |
| GET | `/api/v1/academics/attendance/template` | JWT |  |  |
| GET | `/api/v1/academics/attendance/download/:semesterId` | JWT |  |  |
| POST | `/api/v1/academics/attendance/upload` | JWT |  |  |
| POST | `/api/v1/academics/attendance/publish-email` | JWT |  |  |
| GET | `/api/v1/academics/subjects` | JWT |  |  |
| POST | `/api/v1/academics/subjects/add` | JWT |  |  |
| PUT | `/api/v1/academics/subjects/:id` | JWT |  |  |
| DELETE | `/api/v1/academics/subjects/:id` | JWT |  |  |
| GET | `/api/v1/academics/semester` | JWT |  |  |
| POST | `/api/v1/academics/semester/init` | JWT |  |  |
| POST | `/api/v1/academics/semester/create` | JWT |  |  |
| PATCH | `/api/v1/academics/semester/status/:id` | JWT |  |  |
| PUT | `/api/v1/academics/semester/status/:id` | JWT |  |  |
| GET | `/api/v1/academics/semester/overview` | JWT |  |  |
| PUT | `/api/v1/academics/semester/:id/config` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/subjects` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/advance` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/publish/request-code` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/publish/resend-code` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/publish` | JWT |  |  |
| GET | `/api/v1/academics/semester/:id/elective-groups` | JWT |  |  |
| POST | `/api/v1/academics/semester/:id/elective-groups` | JWT |  |  |
| DELETE | `/api/v1/academics/semester/elective-groups/:groupId` | JWT |  |  |
| DELETE | `/api/v1/academics/semester/:id` | JWT |  |  |
| GET | `/api/v1/academics/dean/review/:branch` | JWT |  |  |
| POST | `/api/v1/academics/dean/allocation` | JWT |  |  |
| PUT | `/api/v1/academics/dean/allocation/:id` | JWT |  |  |
| PUT | `/api/v1/academics/allocation/:id` | JWT |  |  |
| POST | `/api/v1/academics/dean/approve` | JWT |  |  |
| DELETE | `/api/v1/academics/dean/allocation/:id` | JWT |  |  |
| GET | `/api/v1/academics/student/available` | JWT |  |  |
| POST | `/api/v1/academics/student/register` | JWT |  |  |
| GET | `/api/v1/academics/student/current/:studentId` | JWT |  |  |
| GET | `/api/v1/academics/student/registration/pdf` | JWT |  |  |
| GET | `/api/v1/academics/registrations/pdf/bulk` | JWT |  |  |
| GET | `/api/v1/academics/registrations/pdf/jobs/:jobId` | JWT |  |  |
| GET | `/api/v1/academics/registrations/pdf/jobs/:jobId/download` | JWT |  |  |
| GET | `/api/v1/academics/registration/subjects/template` | JWT |  |  |
| POST | `/api/v1/academics/registration/subjects/upload` | JWT |  |  |
| POST | `/api/v1/academics/registration/upload` | JWT |  |  |
| GET | `/api/v1/academics/export` | JWT |  |  |
| GET | `/api/v1/academics/registrations/tracking` | JWT |  |  |
| GET | `/api/v1/academics/registrations` | JWT |  |  |
| GET | `/api/v1/academics/faculty` | JWT |  |  |
| GET | `/api/v1/academics/faculty/:id` | JWT |  |  |
| POST | `/api/v1/academics/faculty` | JWT |  |  |
| PUT | `/api/v1/academics/faculty/:id` | JWT |  |  |
| DELETE | `/api/v1/academics/faculty/:id` | JWT |  |  |
| GET | `/api/v1/academics/seating/student` | JWT |  |  |
| GET | `/api/v1/academics/seating/template` | JWT |  |  |
| POST | `/api/v1/academics/seating/upload` | JWT |  | multipart `file` |
| GET | `/api/v1/academics/analytics/admin-summary` | JWT |  |  |
| GET | `/api/v1/academics/health` | No |  |  |

## Notifications

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| POST | `/api/v1/notifications/subscribe` | JWT |  | Web Push subscription JSON |
| POST | `/api/v1/notifications/push/send` | JWT (admin roles) |  |  |
| GET | `/api/v1/notifications/push/subscribers` | JWT (admin roles) |  |  |
| GET | `/api/v1/notifications/inbox` | JWT |  |  |
| PATCH | `/api/v1/notifications/inbox/read-all` | JWT |  |  |
| PATCH | `/api/v1/notifications/inbox/:id/read` | JWT |  |  |
| DELETE | `/api/v1/notifications/inbox/clear` | JWT |  |  |
| DELETE | `/api/v1/notifications/inbox/:id` | JWT |  |  |
| GET | `/api/v1/notifications/health` | No |  |  |

## Requests (outpass and outing, gated)

| Method | Path | Auth | Rate limit | Body |
|--------|------|------|------------|------|
| POST | `/api/v1/requests/outpass` | JWT | 20 / 15 min per IP |  |
| POST | `/api/v1/requests/outing` | JWT | 20 / 15 min per IP |  |
| GET | `/api/v1/requests/history` | JWT |  |  |
| GET | `/api/v1/requests/history/:id` | JWT |  |  |
| GET | `/api/v1/requests/outside` | JWT |  |  |
| GET | `/api/v1/requests/outing/all` | JWT |  |  |
| GET | `/api/v1/requests/outpass/all` | JWT |  |  |
| POST | `/api/v1/requests/:id/approve` | JWT |  |  |
| POST | `/api/v1/requests/:id/forward` | JWT |  |  |
| POST | `/api/v1/requests/:id/reject` | JWT |  |  |
| GET | `/api/v1/requests/security/summary` | JWT |  |  |
| POST | `/api/v1/requests/:id/checkout` | JWT |  |  |
| POST | `/api/v1/requests/:id/checkin` | JWT |  |  |

Grievance routes are also reachable under `/api/v1/requests/grievance/*` for older admin clients; that alias is not gated.


## Website CMS (landing-backend)

Serves the public college site content. GETs are public. PUTs replace the page and need a JWT with role webadmin, webmaster, admin, dean, director or coe.

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/cms/api/home/` | No |
| PUT | `/api/v1/cms/api/home/` | JWT (admin roles) |
| GET | `/api/v1/cms/api/institute/list/pages` | No |
| GET | `/api/v1/cms/api/institute/:page_name` | No |
| PUT | `/api/v1/cms/api/institute/:page_name` | JWT (admin roles) |
| GET | `/api/v1/cms/api/academics/list/pages` | No |
| GET | `/api/v1/cms/api/academics/:page_name` | No |
| PUT | `/api/v1/cms/api/academics/:page_name` | JWT (admin roles) |
| GET | `/api/v1/cms/api/departments/list/all` | No |
| GET | `/api/v1/cms/api/departments/:dept_code` | No |
| PUT | `/api/v1/cms/api/departments/:dept_code` | JWT (admin roles) |
| GET | `/api/v1/cms/api/notifications/` | No |
| GET | `/api/v1/cms/api/notifications/list/categories` | No |
| PUT | `/api/v1/cms/api/notifications/` | JWT (admin roles) |

## Analytics (landing-backend)

All need a valid JWT. Invalid tokens get `401`.

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/analytics/student/:student_id/attendance` | JWT |
| GET | `/api/v1/analytics/student/:student_id/grades-trend` | JWT |
| GET | `/api/v1/analytics/faculty/:faculty_id/course-stats` | JWT |
| GET | `/api/v1/analytics/dean/campus-occupancy` | JWT |
| GET | `/api/v1/analytics/dean/academic-heatmap` | JWT |
| GET | `/api/v1/analytics/dean/grievance-trends` | JWT |
| GET | `/api/v1/analytics/webmaster/institution-snapshot` | JWT |
| GET | `/api/v1/analytics/webmaster/branch-distribution` | JWT |
| GET | `/api/v1/analytics/webmaster/grievance-summary` | JWT |
| GET | `/api/v1/analytics/webmaster/upload-health` | JWT |
| GET | `/api/v1/analytics/webmaster/system-users` | JWT |

## Internal routes

Paths with `/internal/`, `POST /api/v1/mail/send`, `/api/queue/*` and the cron and storage cleanup jobs are service to service only. They need an internal credential that is never issued to clients, so they are not documented here. Public callers get `401` or `403`.
