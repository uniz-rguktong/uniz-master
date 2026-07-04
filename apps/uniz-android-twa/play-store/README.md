# Play Store Assets

All assets needed for the Google Play Console listing, organized in one place.

## Structure

```
play-store/
├── icon/
│   └── app-icon-512.png          # App icon (512×512)
├── feature-graphic/
│   ├── feature-graphic-1024x500.png   # Rendered feature graphic
│   └── feature-graphic-template.svg   # Editable SVG source
├── screenshots/
│   ├── 00-developers-mobile-preview.png
│   ├── 01-sign-in.png
│   ├── 02-landing-android.png
│   ├── 02-landing-home.png
│   ├── 03-privacy-policy.png
│   ├── 03-student-profile.png
│   ├── 04-course-registration.png
│   ├── 05-academics-hub.png
│   ├── 06-attendance-tracking.png
│   ├── 07-grievance.png
│   └── 08-help-support.png
└── store-listing/
    ├── full-description.txt
    ├── short-description.txt
    └── support-email.txt
```

## Play Console upload guide

| Console field | Source |
|---|---|
| App icon | `icon/app-icon-512.png` |
| Feature graphic | `feature-graphic/feature-graphic-1024x500.png` |
| Phone screenshots | `screenshots/01-*` through `08-*` (min 2, recommended 6-8) |
| Short description | `store-listing/short-description.txt` |
| Full description | `store-listing/full-description.txt` |
| Support email | `store-listing/support-email.txt` |
| Privacy policy URL | `https://uniz.rguktong.in/privacy` |

Screenshots captured from production mobile views (Jul 2026).
