---
title: "Login"
description: "How to access the UniZ portal, manage your password, and install the app on your device."
---

The UniZ portal is your central hub for academics, leave requests, and your student profile. Your login credentials are your RGUKT roll number and a password set by the administration.

## Sign in

  ### Open the portal

Navigate to the UniZ student portal URL provided by your institution.

  ### Enter your credentials

- **Username** — your roll number (e.g., `O210008`) - **Password** — your
    current password

  ### Tap Sign In

On success, you are redirected to your profile dashboard. The portal stores
    your session securely in the browser — you do not need to enter your
    credentials again until you log out or your session expires.

::: info
Your username is always your roll number in uppercase (e.g., `O210008`). It
  never changes.
:::

### How authentication works

When you sign in, the server issues a JWT (JSON Web Token) that the portal stores in your browser. Every subsequent request automatically includes this token — you don't need to do anything extra in the portal.

If you are building on top of the API directly, include the token in every request:

```bash
Authorization: Bearer <your-token>
```

**Login endpoint (for API use):**

```bash
POST https://api-uniz.rguktong.in/api/v1/auth/login/student
```

```json
{
  "username": "O210008",
  "password": "password123"
}
```

**Success response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUz...",
  "role": "student",
  "username": "O210008"
}
```

---

## Reset your password

Use this flow if you've forgotten your password. You'll need access to the email address registered with your account.

  ### Go to the login page

Tap **Forgot Password** on the sign-in screen.

  ### Enter your roll number

Submit your username (`O210008`). The system sends a 6-digit OTP to your registered email address.

    ```json
    POST /auth/otp/request
    { "username": "O210008" }
    ```

  ### Enter the OTP

Check your inbox and enter the 6-digit code in the verification field.

    ```json
    POST /auth/otp/verify
    {
      "username": "O210008",
      "otp": "123456"
    }
    ```

  ### Set a new password

Enter and confirm your new password. The reset requires a valid OTP and the same username.

    ```json
    POST /auth/password/reset
    {
      "username": "O210008",
      "resetToken": "123456",
      "newPassword": "newSecurePassword123"
    }
    ```

::: warning
OTP requests are rate-limited. If you request too many OTPs in a short period,
  you'll be temporarily blocked. Wait a few minutes before trying again.
:::

---

## Change your password

Once logged in, you can change your password from the **Reset Password** page in the portal. You'll need your current password.

A strong password must meet all three criteria:

- At least 8 characters
- Contains at least one number
- Contains at least one special character (e.g., `!@#$%`)

::: warning
After a successful password change, all active sessions are immediately logged
  out for security. You'll need to sign in again with your new password.
:::

The portal evaluates your new password in real time and shows a strength indicator (Weak / Moderate / Strong). Weak and Moderate passwords are rejected.

---

## Install as a PWA

UniZ is a Progressive Web App (PWA). You can install it on your phone or desktop so it opens like a native app — no app store required.

  #### Android

### Open the portal in Chrome

Navigate to the UniZ portal URL.

      ### Tap the install prompt

Chrome shows an **Add to Home Screen** banner at the bottom, or you can
        tap the three-dot menu and select **Install app** / **Add to Home
        Screen**.

      ### Confirm

Tap **Install**. The app icon appears on your home screen and opens in
        standalone mode.

  #### iOS (Safari)

### Open the portal in Safari

PWA installation on iOS only works in Safari.

      ### Tap the Share button

Tap the share icon at the bottom of the screen (the box with an arrow
        pointing up).

      ### Select Add to Home Screen

Scroll down in the share sheet and tap **Add to Home Screen**, then tap
        **Add**.

  #### Desktop (Chrome/Edge)

### Open the portal

Navigate to the UniZ portal URL in Chrome or Edge.

      ### Click the install icon

Look for an install icon in the address bar (a monitor with a download
        arrow), or open the browser menu and select **Install UniZ**.

      ### Confirm

Click **Install**. The app opens in its own window.

::: tip
Installing the PWA gives you a faster experience and keeps your session active
  between visits without navigating to the URL each time.
:::

---

## Common errors

- **[Invalid credentials](#)**

  - **[Account suspended](#)**

  - **[OTP not received](#)**

  - **[Session expired](#)**
