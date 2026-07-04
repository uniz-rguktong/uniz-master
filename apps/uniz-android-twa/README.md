# uniZ — Google Play (Trusted Web Activity)

Thin Android wrapper for [https://uniz.rguktong.in](https://uniz.rguktong.in). The Play Store app loads the **live website** — portal deploys update the app automatically. Web Push (VAPID) continues to work because TWA uses Chrome.

## Package

| Field | Value |
|---|---|
| Package ID | `in.rguktong.uniz` |
| Host | `uniz.rguktong.in` |
| Privacy policy | `https://uniz.rguktong.in/privacy` |

## Directory layout

```
uniz-android-twa/
├── play-store/               # All Play Console assets (committed)
│   ├── icon/                 #   App icon 512×512
│   ├── feature-graphic/      #   Feature graphic 1024×500
│   ├── screenshots/          #   Phone screenshots (8 ready)
│   └── store-listing/        #   Short/full description + support email
├── twa-manifest.json         # Bubblewrap source config
├── init.sh                   # First-time bubblewrap init
├── sync-assetlinks.sh        # Writes SHA-256 into portal assetlinks.json
├── verify-assetlinks.sh      # Checks Google Digital Asset Links
└── phase-a-setup.sh          # One-time tooling + asset verification
```

## Prerequisites (one-time)

1. **Google Play Developer account** — [play.google.com/console](https://play.google.com/console) (~$25) — *Phase B*
2. **JDK 17+** and **Android SDK** (via Android Studio or `sdkmanager`)
3. **Node 18+** for Bubblewrap

### Phase A — before paying (~30 min)

```bash
bash apps/uniz-android-twa/phase-a-setup.sh
# or: npm run android:twa:phase-a
```

Install Android Studio if missing: [developer.android.com/studio](https://developer.android.com/studio) or `brew install --cask android-studio`.

## First-time setup

From repo root:

```bash
# 1. Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Generate Android project + upload keystore (interactive)
bash apps/uniz-android-twa/init.sh

# 3. Put upload-key SHA-256 into asset links (after keystore exists)
bash apps/uniz-android-twa/sync-assetlinks.sh

# 4. Deploy portal so assetlinks.json is live
npm run deploy   # or your normal push → GHA deploy

# 5. Verify Digital Asset Links
bash apps/uniz-android-twa/verify-assetlinks.sh
```

## Build release AAB

```bash
cd apps/uniz-android-twa
bubblewrap build
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to Play Console → **Internal testing** first.

## After Play App Signing is enabled

Google may re-sign with their key. Add **both** fingerprints to `public/.well-known/assetlinks.json`:

- Upload key SHA-256 (from your keystore)
- App signing key SHA-256 (Play Console → Setup → App signing → App signing key certificate)

Run `sync-assetlinks.sh` again and redeploy the portal.

## Play Console checklist (to go fully live)

- [ ] Create app → default language English (India)
- [ ] App name: **uniZ**
- [ ] Short + full description (`play-store/store-listing/`)
- [ ] App icon 512×512 (`play-store/icon/app-icon-512.png`)
- [ ] Feature graphic 1024×500 (`play-store/feature-graphic/`)
- [ ] Phone screenshots (`play-store/screenshots/` — 8 ready)
- [ ] Privacy policy URL: `https://uniz.rguktong.in/privacy`
- [ ] Content rating questionnaire (IARC)
- [ ] Data safety form (account info, academic info, push tokens — no sale)
- [ ] Target audience / student app declaration
- [ ] Upload AAB → internal test → closed test → production
- [ ] Support email + developer contact

## What updates without a new Play release

- UI, features, API, push logic, splash screen — any portal deploy

## What requires a new AAB upload

- Package ID change
- Launcher name/icon in Android shell
- `minSdkVersion`, permissions, or TWA manifest version bump
- Domain change away from `uniz.rguktong.in`

## Files

| File | Purpose |
|---|---|
| `twa-manifest.json` | Bubblewrap source config |
| `init.sh` | First-time `bubblewrap init` |
| `sync-assetlinks.sh` | Writes SHA-256 into portal `assetlinks.json` |
| `verify-assetlinks.sh` | Checks Google asset link statement |
| `.gitignore` | Keystore + generated `android/` |

**Never commit** `*.jks`, `*.keystore`, or Play service-account JSON. Store in password manager / CI secrets.
