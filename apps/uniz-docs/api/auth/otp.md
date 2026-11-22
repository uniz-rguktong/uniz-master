---
title: "OTP Verification"
description: "Request and verify a forgot-password email code. Not the first-login code."
---

OTP verification is the first step of the **forgot-password** flow. Codes are sent by email only. Push notifications are not an OTP channel.

This is not the first-login code. Signed-in users who must set a new password call `POST /auth/password/change/otp` instead. That route uses only the stored mailbox and is documented on [Password](/api/auth/password).

  ### Request an OTP

Call `POST /auth/otp/request` with the account username. The service emails a
    6-digit code to the address on file and returns that address masked.

  ### Receive the code

The user reads the code from their email. It expires after 10 minutes.

  ### Verify the OTP

Call `POST /auth/otp/verify` with the username and the 6-digit code. Only an
    unconsumed, unexpired email-issued code is accepted. On success you receive
    a `resetToken`.

  ### Reset the password

Pass the `resetToken` to `POST /auth/password/reset` along with the new
    password. See the [Password](/api/auth/password) page for details.

::: warning
OTP endpoints are rate-limited. Each account may request 2 new codes per
  minute and 15 codes per hour. Resending the active code allows 4 requests
  per 2 minutes and counts toward the same hourly limit. Verification uses the
  standard auth limit of 50 requests per 15 minutes. Exceeding a limit returns
  `429 Too Many Requests`. A code can be verified once.
:::

---

## Request an email OTP

`POST /auth/otp/request`

Sends a 6-digit OTP. Address selection, in order: stored `realEmail`, then the profile email, then the campus mailbox `<id>@rguktong.ac.in`. If none are deliverable the response is `400 OTP_EMAIL_MISSING` and nothing is sent. The campus mailbox is an inbox, not a password.

Production requires a Turnstile `captchaToken`, same as login. A curl without a valid token fails with `400 AUTH_CAPTCHA_FAILED`.

**Auth required:** No

**Rate limits:** 2 per minute and 15 per hour

### Request body

  The student roll number or staff username that needs to reset their password, plus `captchaToken` in production.

### Response

- `success` — `true` when the OTP email was queued.

- `deliveryMethod` — always `email`.

- `email` — the destination address, masked.

- `message` — confirmation that includes the masked address.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/otp/request \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "captchaToken": "<turnstile-token>"
  }'
```

**200 OK**

```json
{
  "success": true,
  "deliveryMethod": "email",
  "email": "o2*****@rguktong.ac.in",
  "message": "Security code sent to o2*****@rguktong.ac.in."
}
```

The masked address is an example of the response shape.

### Error responses

| Status                  | Meaning                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `400 Bad Request`       | `AUTH_CAPTCHA_FAILED`, or no deliverable address (`OTP_EMAIL_MISSING`). |
| `404 Not Found`         | No account found for the given username.                       |
| `429 Too Many Requests` | Per-minute or hourly limit exceeded.                           |
| `502 Bad Gateway`       | The email could not be queued.                                 |

---

## Resend the active email OTP

`POST /auth/otp/request-email`

Emails the same unexpired code again. It does not create a new code and does
not send a push notification. Call `POST /auth/otp/request` first.

**Auth required:** No

**Captcha:** not required. The active code means Turnstile already passed on `/otp/request`.

**Rate limits:** 4 per 2 minutes and the shared hourly limit of 15

### Request body

  The student roll number or staff username that already requested a code.

### Response

- `success` — `true` when the OTP email was queued.

- `email` — the destination address, masked.

- `message` — confirmation that includes the masked address.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/otp/request-email \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008"
  }'
```

**200 OK**

```json
{
  "success": true,
  "deliveryMethod": "email",
  "email": "o2*****@rguktong.ac.in",
  "message": "Security code sent to o2*****@rguktong.ac.in."
}
```

### Error responses

| Status                  | Meaning                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `400 Bad Request`       | No active email code, or no email address is on file.          |
| `404 Not Found`         | No account found for the given username.                       |
| `429 Too Many Requests` | Resend or hourly limit exceeded.                               |
| `502 Bad Gateway`       | The email could not be queued.                                 |

---

## Verify OTP

`POST /auth/otp/verify`

Validates the 6-digit email code and, if correct, returns a short-lived `resetToken`. You must pass this token to `POST /auth/password/reset` to complete the password reset. Codes issued for any other channel are rejected.

**Auth required:** No

### Request body

  The username that the OTP was issued for.

  The 6-digit one-time password from the email. Must be exactly 6 characters.

### Response

- `success` — `true` when the OTP was accepted.

- `resetToken` — A short-lived token authorising a single password reset. Pass this to `POST
  /auth/password/reset`.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/auth/otp/verify \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "otp": "482910"
  }'
```

**200 OK**

```json
{
  "success": true,
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error responses

| Status                  | Meaning                                  |
| ----------------------- | ---------------------------------------- |
| `400 Bad Request`       | OTP is invalid, expired, already used, or was not issued by email. |
| `429 Too Many Requests` | Rate limit exceeded.                     |
