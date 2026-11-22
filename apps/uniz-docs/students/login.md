---
title: "Login"
description: "Student sign-in, the first-login email code, forgot-password OTP, and browser-menu install."
---

The uniZ portal is the hub for academics and your student profile. Sign in with your RGUKT roll number and password. Leave requests are not a current feature.

## Sign in

### Open the portal

Go to [https://uniz.rguktong.in](https://uniz.rguktong.in) and choose **Student Portal**.

### Enter your credentials

- **Username** — your roll number (for example `O210008`)
- **Password** — your current password

### Complete Turnstile

Production sign-in shows Cloudflare Turnstile before **Continue** enables. The portal warms the script on boot (`apps/uniz-portal/src/utils/prefetchTurnstile.ts`). A missing or failed check returns `400 AUTH_CAPTCHA_FAILED` before the password is judged.

### Continue

On success the API returns a JWT, `role`, `mustChangePassword`, and `student_token` (the same token). The portal stores the session in the browser.

If `mustChangePassword` is true, you are not taken to the dashboard. You go to **Set a new password**.

::: info
Your roll number is the username (for example `O210008`). The campus mailbox for mail is `<id>@rguktong.ac.in`. That address is an inbox, not a password.
:::

**Login endpoint:**

```bash
POST https://api-uniz.rguktong.in/api/v1/auth/login/student
```

```json
{
  "username": "O210008",
  "password": "<password>",
  "captchaToken": "<turnstile-token>"
}
```

A curl without a valid `captchaToken` fails in production.

## Set a new password (first login)

Students were issued a campus password. That reset is already applied: previous student sessions no longer work, and each student sets a new password at the next sign-in. Admin, webadmin, and the shared role accounts were not part of that reset.

The screen is `apps/uniz-portal/src/pages/auth/SetPassword.tsx`. On open it calls `POST /api/v1/auth/password/change/otp`.

You will see:

- The masked mailbox
- A 6-digit code field
- **Resend** (60 second cooldown)
- New password and confirmation (at least 8 characters, and not the issued campus password)
- **Save password**
- **Sign out**

While the flag is set, other APIs return `403 PASSWORD_CHANGE_REQUIRED` ("Set a new password before continuing."). Logout and the two password-change calls stay available.

If no mailbox is stored, the screen shows `OTP_EMAIL_MISSING` and tells you to contact webadmin. This code goes only to `realEmail` or the profile email. It does not invent `<id>@rguktong.ac.in`.

On success the API clears the flag, invalidates older tokens, and returns a new `token`. The portal stores that token and opens the app. You do **not** sign in again after this first-login change.

Full request shapes: [Password](/api/auth/password).

## Forgot your password

This is a different email code from the first-login code. It does not require you to be signed in.

1. Tap **Forgot Password** and submit your roll number.
2. `POST /auth/otp/request` emails a 6-digit code. The address is chosen in this order: stored `realEmail`, then profile email, then the campus mailbox `<id>@rguktong.ac.in`. The response includes the address masked (`deliveryMethod: "email"`).
3. Verify with `POST /auth/otp/verify`.
4. `POST /auth/password/reset` with the `resetToken`. The new password must be at least 6 characters and must not be the issued campus password.

Codes expire in 10 minutes and are single-use. Push is not an OTP channel. Production `/otp/request` needs `captchaToken`. Resend (`/otp/request-email`) does not need a fresh captcha.

Limits: 2 new codes per minute and 15 per hour. Resend allows 4 requests per 2 minutes and shares the hourly cap. See [OTP](/api/auth/otp).

## Change a password you already know

From the signed-in **Reset Password** page you send `currentPassword` and `newPassword` (at least 8 characters on the API). That call does not use the email code.

The API returns a new `token` and ends older sessions. The student Reset Password page then clears the browser session and asks you to sign in again. That is only this voluntary page. The first-login screen keeps you signed in.

The portal strength meter (length, a number, a special character) is a client check. The API enforces length and rejects the issued campus password.

## Install from the browser

The portal does not show an install banner. Chrome, Edge, and Safari can still install the PWA from the browser menu because the manifest and service worker are still served.

- **Android (Chrome):** browser menu → **Install app** or **Add to Home Screen**.
- **iOS:** Safari share sheet → **Add to Home Screen**.
- **Desktop (Chrome/Edge):** address-bar install icon, or the browser menu → **Install uniZ**.

## Common errors

| What you see | What it means |
|--------------|----------------|
| `AUTH_CAPTCHA_FAILED` | Turnstile missing or failed. Checked before the password. |
| Invalid credentials | Username or password did not match, after captcha passed. |
| Account suspended | `403 AUTH_SUSPENDED`. Contact administration. |
| `OTP_EMAIL_MISSING` | No deliverable mailbox for that flow. First-login: contact webadmin. |
| `PASSWORD_CHANGE_REQUIRED` | Finish **Set a new password** before calling other APIs. |
| `AUTH_TOKEN_REVOKED` | This token's `tokenVersion` is stale. Sign in again. |
