---
title: "Password"
description: "Forgot-password reset, first-login email code, and ordinary password change."
---

Three calls change a password. They are not interchangeable.

| Flow | Endpoint | Session | Email code | Minimum length |
|------|----------|---------|------------|----------------|
| Forgot password | `POST /auth/password/reset` | No | Verified earlier; pass `resetToken` | 6 |
| First login | `POST /auth/password/change` | Yes, `mustChangePassword` | 6-digit `otp` in the **same** request | 8 |
| Ordinary change | `POST /auth/password/change` | Yes | Not used | 8 |

The first-login code is requested separately: `POST /auth/password/change/otp`. That is not [OTP verification](/api/auth/otp) for forgot-password.

Change and reset both reject the issued campus password with `400 VALIDATION_ERROR` ("Choose a password that is not the issued campus password."). This page does not record that password.

Change attempts use the standard auth limiter: **50 per 15 minutes** per account (`apps/uniz-auth/src/middlewares/ratelimit.middleware.ts`).

---

## Request the first-login code

`POST /auth/password/change/otp`

Sends a 6-digit email code only when `mustChangePassword` is true. The address is the **stored mailbox** (`realEmail`, otherwise the profile email) via `resolveStoredMailbox`. It does not invent `<id>@rguktong.ac.in`. Faculty usernames are `firstname.lastname`, which is not a mailbox.

**Auth required:** Yes — `Authorization: Bearer <token>`

The route also sits behind the OTP limiters: 2 per minute and 15 per hour. A second send inside 60 seconds returns `429 OTP_REQUEST_LIMIT` with `maskedEmail` and `retryAfterSeconds`.

### Response

```json
{
  "success": true,
  "maskedEmail": "o2*****@rguktong.ac.in",
  "retryAfterSeconds": 60,
  "expiresInMinutes": 10,
  "message": "Security code sent to o2*****@rguktong.ac.in."
}
```

The masked string above is an illustration of the response shape. The service masks whatever mailbox it actually used.

### Errors

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `VALIDATION_ERROR` | "A code is only sent when a new password is required." |
| `400` | `OTP_EMAIL_MISSING` | No stored mailbox. The portal tells the user to contact webadmin. |
| `401` | `AUTH_UNAUTHORIZED` | Missing session. |
| `429` | `OTP_REQUEST_LIMIT` | 60 second cooldown, or the 2/minute cap. |
| `429` | `OTP_LIMIT_HOUR` | 15 codes in an hour. |

---

## Change password

`POST /auth/password/change`

**Auth required:** Yes — `Authorization: Bearer <token>`

### Body

| Field | Required | Notes |
|-------|----------|--------|
| `newPassword` | Yes | Minimum **8** characters. |
| `confirmPassword` | No | If sent, it must equal `newPassword`. |
| `otp` | Only when `mustChangePassword` | 6 digits, same request as the new password. |
| `currentPassword` | Only when the flag is **not** set | The forced screen has no current-password field. The login just proved it. |

### First-login example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/password/change \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "otp": "482910",
    "newPassword": "<new-password>",
    "confirmPassword": "<new-password>"
  }'
```

### Ordinary change example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/password/change \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "currentPassword": "<password>",
    "newPassword": "<new-password>"
  }'
```

### Success

```json
{
  "success": true,
  "message": "Password updated successfully",
  "mustChangePassword": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The update clears `mustChangePassword`, increments `tokenVersion` (older sessions return `401 AUTH_TOKEN_REVOKED`), and consumes the first-login OTP when one was used.

The **Set a new password** screen stores `token` and continues into the app. The user does not sign in again. The voluntary student Reset Password page ignores that token, clears local storage, and sends the student back to sign-in. Callers that keep the returned token stay signed in. Other devices do not.

### Errors

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `OTP_REQUIRED` | Forced change without a 6-digit code. |
| `400` | `OTP_INVALID` | Code does not match the latest email OTP. |
| `400` | `OTP_EXPIRED` | Code is past 10 minutes. |
| `400` | `VALIDATION_ERROR` | Confirmation mismatch, issued campus password, or schema (min 8). |
| `401` | `AUTH_INVALID_CREDENTIALS` | Ordinary change with a missing or wrong `currentPassword`. |
| `401` | `AUTH_UNAUTHORIZED` | Missing session. |
| `401` | `AUTH_TOKEN_REVOKED` | JWT `tokenVersion` does not match the credential. |
| `429` | `RATE_LIMIT_EXCEEDED` | 50 attempts in 15 minutes. |

---

## Reset a forgotten password

`POST /auth/password/reset`

Sets a new password with the `resetToken` from `POST /auth/otp/verify`. No session. Minimum length is **6** (stricter rules apply only to `/password/change`). The new password must not be the issued campus password.

**Auth required:** No

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/password/reset \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "resetToken": "<reset-token>",
    "newPassword": "<new-password>"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Password updated"
}
```

Reset also clears `mustChangePassword` and increments `tokenVersion`. It does not return a new login token. The user signs in afterwards. Address selection and captcha for the code live on [OTP](/api/auth/otp).

### Errors

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `VALIDATION_ERROR` | Missing token or username, or the password failed the schema / issued-password check. |
| `403` | `AUTH_FORBIDDEN` | Reset token invalid, expired, for a different account, or already used. |
| `429` | `RATE_LIMIT_EXCEEDED` | 50 attempts in 15 minutes. |
