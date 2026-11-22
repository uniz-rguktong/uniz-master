---
title: "Quick Start"
description: "Open the uniZ portal, finish first-login email verification, and install from the browser menu."
---

## Open the portal

Production portal: [https://uniz.rguktong.in](https://uniz.rguktong.in)

Public college site: [https://rguktong.in](https://rguktong.in)

API (integrators): [https://api-uniz.rguktong.in/api/v1](https://api-uniz.rguktong.in/api/v1)

### Choose the right sign-in

Students: **Student Portal** sign-in. Faculty and staff: **Admin Portal** sign-in (`/admin/signin` → `POST /auth/login/admin`).

### Use your campus credentials

Use your university ID and password. Production sign-in asks for a Cloudflare Turnstile token before the password is checked.

### First login, when a new password is required

If the account must change its password, the portal opens **Set a new password** immediately after sign-in. Other APIs return `403 PASSWORD_CHANGE_REQUIRED` until this finishes.

1. The page requests an email code (`POST /auth/password/change/otp`) and shows the masked address.
2. Enter the 6-digit code. It expires in 10 minutes. **Resend** waits 60 seconds.
3. Choose a new password of at least 8 characters. It must not be the campus password you were issued. Confirm it and save.
4. The portal stores the new token and continues into the app. You do not sign in again after a successful first-login change.

Students receive that code at the campus mailbox `<id>@rguktong.ac.in` when that address is the stored mailbox. If no mailbox is on file, the screen shows `OTP_EMAIL_MISSING` and tells you to contact webadmin. The first-login code does not invent an address from the username. Faculty usernames are not mailboxes.

Forgot-password stays a separate email OTP. See [Login](/students/login).

### Install from the browser menu

uniZ is still a Progressive Web App. The manifest and service worker remain, so Chrome, Safari, and Edge can install it from the **browser menu** (Install app / Add to Home Screen / Share sheet). The portal does not show an in-app install banner.

## Operators

Deploying or changing the system? Start at [Search index](/search-index) and [System overview](/system/overview). Webadmin tools: [Workspace](/admin/webadmin).

::: info
Outpass and outing are hidden in the production portal. That is intentional.
:::
