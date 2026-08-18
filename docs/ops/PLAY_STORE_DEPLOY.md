# Google Play Store deploy (uniZ TWA)

This is **not a native Android app**. Play Store shipping is a **Trusted Web Activity (TWA)** wrapper around `https://uniz.rguktong.in` (`in.rguktong.uniz`). Portal deploys update the “app”; you only re-upload an AAB for shell/package changes.

Store listing assets are already in `apps/uniz-android-twa/play-store/` (icon, feature graphic, screenshots, descriptions, support email).

Technical reference: [`apps/uniz-android-twa/README.md`](../../apps/uniz-android-twa/README.md).

---

## What you need (no Dev account yet)

| Need | Why |
|------|-----|
| **Google Play Developer account (~$25 one-time)** | Required to publish. Pay at [play.google.com/console](https://play.google.com/console) |
| Google account (personal or org) | Used to create the Play Console account |
| Identity verification (ID / org docs) | Google may take hours–days to approve |
| **JDK 17+**, **Android Studio/SDK**, **Node 18+** | Build the AAB with Bubblewrap |
| Password manager | Store the upload keystore — **never commit** `*.jks` / `*.keystore` |

Optional before paying: run Phase A tooling check

```bash
npm run android:twa:phase-a
```

---

## Do this in order

### 1. Create Play Developer account

Pay $25 → complete identity → wait until Console is unlocked.

### 2. One-time machine + Android project

```bash
npm install -g @bubblewrap/cli
npm run android:twa:init          # creates android/ + upload keystore
npm run android:twa:assetlinks    # writes SHA-256 into portal assetlinks
# deploy portal so /.well-known/assetlinks.json is live
npm run android:twa:verify
```

### 3. Build the release file

```bash
cd apps/uniz-android-twa && bubblewrap build
# → android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Create app in Play Console

- Name: **uniZ**
- Package: `in.rguktong.uniz`
- Default language: English (India)
- Upload listing from `play-store/` (icon, graphic, screenshots, short/full text)
- Privacy: `https://uniz.rguktong.in/privacy`
- Support: `webadmin@rguktong.ac.in`
- Fill **Content rating**, **Data safety**, audience/student declarations

### 5. Upload AAB → Internal testing first

Then closed test → production.

### 6. After Play App Signing is on

Add Google’s **app signing** SHA-256 to `assetlinks.json` (plus your upload key), redeploy portal, re-run `npm run android:twa:verify`. Without this, Chrome may show the URL bar instead of full app mode.

---

## Already done vs still on you

| Ready in repo | You still must do |
|---------------|-------------------|
| TWA config, scripts, store assets, privacy URL | Pay for Dev account |
| Listing copy + screenshots | Install JDK/SDK, run `init` + build AAB |
| Assetlinks file exists in portal | Sync real keystore fingerprints + deploy |
| | Console forms + first AAB upload |

**Bottom line:** Pay for the Play Developer account → build AAB with Bubblewrap → fill Console forms with existing `play-store/` assets → internal test → production. No separate native Android rewrite needed.
