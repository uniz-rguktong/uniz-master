# Admissions

There is no admissions workflow in the portal.

`FEATURE_ADMISSIONS` is a flag in `packages/uniz-shared/src/flags.ts`. It defaults on. No portal page and no API route reads it. There is no admissions table.

What the running demo actually shows:

- The student profile notice board includes “Admission Cycle 2026 / 2026 UG Admissions open.” That is a `PublicNotification` row from the local seed.
- The information centre repeats that notice. See [Information centre](information-centre.md).
- The public landing news page (`/notifications/news`) says “No active news & updates available at this time.” The landing app’s own API was not running, so that page is empty. It is not an admissions form.

## Captured screens

No screen exists for this module, so there is no screenshot.
