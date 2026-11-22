---
title: "Login"
description: "Authenticate students and staff. Production requires Turnstile. The response includes mustChangePassword."
---

Login endpoints are **unauthenticated**. On success you receive a `token` for `Authorization: Bearer <token>`. Students also receive `student_token`. Every other role receives `admin_token`. Both copies are the same JWT.

The JWT carries `tokenVersion`. If that number does not match `AuthCredential.tokenVersion`, later calls return `401 AUTH_TOKEN_REVOKED` ("Your session has ended. Please sign in again.").

If `mustChangePassword` is true, the portal opens **Set a new password**. Other APIs return `403 PASSWORD_CHANGE_REQUIRED` ("Set a new password before continuing.") until `POST /auth/password/change` succeeds. Exempt POSTs: `/password/change`, `/password/change/otp`, and `/logout`. See [Password](/api/auth/password).

::: warning
Production login checks Cloudflare Turnstile **before** the password. Send `"captchaToken": "<turnstile-token>"`. A curl without a valid token fails with `400 AUTH_CAPTCHA_FAILED`, even when the password is also wrong. Login is rate-limited: 50 attempts per 15 minutes per account (`429 RATE_LIMIT_EXCEEDED`).
:::

---

## General login

`POST /auth/login`

Accepts a student or a staff account. Prefer `/auth/login/student` or `/auth/login/admin` when the client must reject the other kind. Those two routes also accept the campus mailbox and a stored `realEmail` as the identifier (`allowEmailLogin`).

**Auth required:** No

### Request body

- `username` — roll number (for example `O210008`) or staff username (for example `director` or `webadmin`).
- `password` — the account password. Write `"<password>"` in examples.
- `captchaToken` — Turnstile token. Required in production.

### Response

- `success` — `true` on success.
- `token` — Signed JWT (7 days). Includes `tokenVersion`.
- `role` — Effective role from `accessRole()`. A non-canonical `webadmin` role is returned as `faculty`.
- `username` — Authenticated username, uppercased.
- `mustChangePassword` — `true` when the user must set a new password before continuing.
- `student_token` — Present when the stored role is `student`. Same value as `token`.
- `admin_token` — Present for every non-student role. Same value as `token`.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "password": "<password>",
    "captchaToken": "<turnstile-token>"
  }'
```

**200 OK — student**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "student",
  "username": "O210008",
  "mustChangePassword": true,
  "student_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**200 OK — staff**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "director",
  "username": "DIRECTOR",
  "mustChangePassword": false,
  "admin_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error responses

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `AUTH_CAPTCHA_FAILED` | Turnstile missing or failed. Checked first. |
| `401` | `AUTH_INVALID_CREDENTIALS` | Unknown account or wrong password. |
| `403` | `AUTH_SUSPENDED` | Account is disabled. |
| `429` | `RATE_LIMIT_EXCEEDED` | 50 attempts in 15 minutes. |

---

## Student login

`POST /auth/login/student`

Same handler as general login, with email identifiers allowed. Use it from the student portal.

**Auth required:** No

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/login/student \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "password": "<password>",
    "captchaToken": "<turnstile-token>"
  }'
```

The success body matches the student example above (`student_token`, `mustChangePassword`).

| Status | Meaning |
|--------|---------|
| `400 AUTH_CAPTCHA_FAILED` | Captcha failed. |
| `401` | Incorrect password or unknown account. |
| `403 AUTH_SUSPENDED` | Account disabled. |
| `429` | Rate limit exceeded. |

A non-student password can still authenticate on this route; the client decides where to send the role. The portal student sign-in is the supported caller.

---

## Admin login

`POST /auth/login/admin`

Staff and faculty sign-in. Same captcha and `mustChangePassword` behaviour. Non-students receive `admin_token`.

Shared usernames that still exist include `director`, `dean`, `swo`, and `webadmin`. Individual `firstname.lastname` faculty logins are **not issued yet**. Do not assume every staff username looks like `dean_cse` or `security_admin`.

**Auth required:** No

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/login/admin \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "director",
    "password": "<password>",
    "captchaToken": "<turnstile-token>"
  }'
```

### Error responses

| Status | Meaning |
|--------|---------|
| `400 AUTH_CAPTCHA_FAILED` | Captcha failed before the password check. |
| `401` | Incorrect password or unknown account. |
| `403 AUTH_SUSPENDED` | Account disabled. |
| `429` | Rate limit exceeded. |

---

## Logout

`POST /auth/logout`

Returns `{ "success": true }`. The client should drop the JWT. Logout stays allowed while `mustChangePassword` is set.

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/logout \
  --header 'Authorization: Bearer <token>'
```
