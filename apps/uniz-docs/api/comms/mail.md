---
title: "Mail API"
description: "POST /api/v1/mail/send — email via notifications service (folded from uniz-mail)."
---

Upstream: **notifications** (not a separate mail Deployment).

```bash
curl -s -X POST https://api-uniz.rguktong.in/api/v1/mail/send \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: $INTERNAL_SECRET" \
  -d '{"to":"...","subject":"...","html":"..."}'
```

Without internal auth, expect **401/403**. Smoke tests treat 400/401/403 as “route live”.

Messages use the shared light layout in `packages/uniz-shared/src/email-layout.ts` (navy bar, uniZ wordmark, one optional code, one optional button). **Live sends** are the on-demand OTP email, operational `plain_notice`, and the grievance resolved/closed notice when SWO closes a ticket. Login alerts, outpass and outing mail, checkpoint, results, attendance, admin alerts, the grievance submission ack, admin confirmation, and the password-change and profile-update alerts stay suppressed unless a flag such as `ENABLE_RESULT_EMAILS` is on. Outpass templates exist in code. Outpass is not live. Details: [Notifications](/services/notifications).

Implementation: `apps/uniz-notifications/src/mail/*`.
