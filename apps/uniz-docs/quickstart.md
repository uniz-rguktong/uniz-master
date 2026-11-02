---
title: "Quick Start"
description: "Install UniZ as a PWA and sign in — student and admin portals."
---

## Open the portal

Production portal: [https://uniz.rguktong.in](https://uniz.rguktong.in)

Public college site: [https://rguktong.in](https://rguktong.in)

API (integrators): [https://api-uniz.rguktong.in/api/v1](https://api-uniz.rguktong.in/api/v1)

  ### Install as a PWA

Open the portal in Chrome/Safari/Edge. Use **Install app** / **Add to Home Screen**. UniZ works as a Progressive Web App — no Play Store required.

  ### Choose the right sign-in

Students: **Student Portal** sign-in. Faculty and staff: **Admin Portal** sign-in.

  ### Use your campus credentials

Use your university ID and password. OTP flows are available for password reset where enabled.

## API in one minute

```bash
curl -s https://api-uniz.rguktong.in/api/v1/health
curl -s -X POST https://api-uniz.rguktong.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"O210008","password":"..."}'
```

Send the returned token as `Authorization: Bearer <token>`. Every endpoint, with auth, rate limits and error codes: [Endpoint reference](/api/reference).

## Operators

Deploying or changing the system? Start at [Search index](/search-index) and [System overview](/system/overview).

::: info
Outpass/outing may be hidden in your portal build — that is intentional in current production.
:::
