# Android APK download

Students install UniZ from:

`https://uniz.rguktong.in/download/uniz.apk`

## How the APK is generated

The Play/sideload binary is a **Trusted Web Activity (TWA)** shell around the live portal — not a separate Flutter app. Source of truth lives in the monorepo:

| Path | Role |
|------|------|
| [`apps/uniz-android-twa/`](../../uniz-android-twa/) | Bubblewrap config, store listing, scripts |
| `npm run android:twa:init` | First-time `android/` project + upload keystore |
| `npm run android:apk` | `bubblewrap build` → writes `uniz.apk` here |

```bash
# From repo root (JDK 17+, Android SDK, Bubblewrap)
npm run android:twa:init   # once
npm run android:apk        # rebuild + copy into this folder
```

Commit `uniz.apk` after a release build so Cloudflare Pages serves the file. Never commit `*.keystore` or `keystore.properties`.

Full Play Console checklist: [docs/ops/PLAY_STORE_DEPLOY.md](../../../docs/ops/PLAY_STORE_DEPLOY.md).
