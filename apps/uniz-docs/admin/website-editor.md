---
title: "Website editor"
description: "Webadmin live preview of rguktong.in — draft, publish, discard, and the preview protocol."
---

**Website editor** is the webmaster tool for the public college site at `rguktong.in`. It does not edit the student portal at `uniz.rguktong.in`.

Code:

- `apps/uniz-portal/src/pages/admin/Webadmin/WebsiteEditorSection.tsx`
- `apps/uniz-portal/src/pages/admin/Webadmin/WebsiteLiveEditor.tsx`
- `apps/uniz-portal/src/lib/preview-protocol.ts`
- `apps/uniz-landing/src/lib/preview-protocol.ts`
- `apps/uniz-landing/src/components/preview/EditRegion.tsx`

Only the canonical webadmin account sees this nav item. See [Webadmin workspace](/admin/webadmin) and [Landing](/services/landing).

## Preview

The editor iframe loads `VITE_LANDING_PREVIEW_URL` or `https://rguktong.in/?preview=1`.

Edit chrome is on only when the page was opened as a preview **and** the landing backend accepted a webadmin token. Public visitors never qualify. Messages use `source: "uniz-webadmin-preview"` from the portal and `source: "uniz-landing-preview"` from the landing page (`preview-protocol.ts`). Allowed landing origins are `https://rguktong.in` and `https://www.rguktong.in`.

The header reads: "Edit rguktong.in on the page. Publish writes the live site. Discard drops the draft."

## Publish and discard

**Publish** writes the live RGUKT Ongole site through the landing API, with the webadmin bearer token:

- `PUT /api/home/` — hero, contact, announcements, stats, images
- `PUT /api/notifications/?type=news_updates` — notices
- Banner and update sync against the portal CMS bases used by `syncBanners` / `syncUpdates`

**Discard** restores the last loaded baseline and drops the unsaved draft. It does not call the API.

## Auto-publish chrome

`WebsiteLiveEditor` (opened from Website Updates) tells the operator: "Edits auto-publish to the live RGUKT landing site." Treat that surface as live writes, not as a private sandbox. The iframe editor above still has an explicit Publish step for its draft.

Desktop and mobile viewport toggles only change the preview frame. They do not publish.
