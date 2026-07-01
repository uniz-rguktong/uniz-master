#!/usr/bin/env bash
# Phase A — Play Store prep (run before paying for Play Console)
set -euo pipefail

TWA_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$TWA_DIR/../.." && pwd)"
ASSETS_DIR="${UNIZ_PLAY_ASSETS:-$HOME/Documents/uniZ-PlayStore}"

echo "=== uniZ Play Store — Phase A setup ==="
echo ""

# ── 1. Bubblewrap CLI ─────────────────────────────────────────────
if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "[1/4] Installing @bubblewrap/cli..."
  npm install -g @bubblewrap/cli
else
  echo "[1/4] Bubblewrap CLI: $(command -v bubblewrap)"
fi

# ── 2. JDK 17+ (Bubblewrap + Android build) ───────────────────────
export_java() {
  if [[ -d "/opt/homebrew/opt/openjdk@17" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  elif [[ -d "/usr/local/opt/openjdk@17" ]]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17"
  elif [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    :
  elif [[ -d "$HOME/Library/Java/JavaVirtualMachines" ]]; then
    local j
    j="$(find "$HOME/Library/Java/JavaVirtualMachines" -name Home -type d 2>/dev/null | head -1)"
    [[ -n "$j" ]] && export JAVA_HOME="$j"
  fi
  if [[ -n "${JAVA_HOME:-}" ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
}

export_java

if ! java -version 2>&1 | grep -qE 'version "1[7-9]|version "[2-9][0-9]'; then
  echo "[2/4] JDK 17+ not found."
  if command -v brew >/dev/null 2>&1; then
    echo "      Install with: brew install openjdk@17"
    echo "      Then add to ~/.zshrc:"
    echo '        export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || echo /opt/homebrew/opt/openjdk@17)"'
    echo '        export PATH="$JAVA_HOME/bin:$PATH"'
  else
    echo "      Install Android Studio from https://developer.android.com/studio (includes JDK)."
  fi
else
  echo "[2/4] Java: $(java -version 2>&1 | head -1)"
fi

# ── 3. Android SDK ────────────────────────────────────────────────
if [[ -d "${ANDROID_HOME:-}" ]] || [[ -d "$HOME/Library/Android/sdk" ]]; then
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  echo "[3/4] Android SDK: $ANDROID_HOME"
elif [[ -d "/Applications/Android Studio.app" ]]; then
  echo "[3/4] Android Studio installed — open once to finish SDK setup."
  echo "      Then set ANDROID_HOME=$HOME/Library/Android/sdk in ~/.zshrc"
else
  echo "[3/4] Android Studio / SDK not found."
  echo "      Download: https://developer.android.com/studio"
  echo "      Or: brew install --cask android-studio"
  echo "      After install: open Android Studio → SDK Manager → accept licenses"
fi

# ── 4. Play Console asset folder (local, not committed) ───────────
echo "[4/4] Preparing Play Console assets at: $ASSETS_DIR"
mkdir -p "$ASSETS_DIR"/{store-listing,screenshots,feature-graphic,icon}

cp "$ROOT/apps/uniz-portal/public/icons/icon-512.png" "$ASSETS_DIR/icon/app-icon-512.png"
cp "$TWA_DIR/play-console-templates/short-description.txt" "$ASSETS_DIR/store-listing/"
cp "$TWA_DIR/play-console-templates/full-description.txt" "$ASSETS_DIR/store-listing/"
cp "$TWA_DIR/play-console-templates/support-email.txt" "$ASSETS_DIR/store-listing/"
cp "$TWA_DIR/play-console-templates/feature-graphic-template.svg" "$ASSETS_DIR/feature-graphic/"
if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 1024 -h 500 \
    "$TWA_DIR/play-console-templates/feature-graphic-template.svg" \
    -o "$ASSETS_DIR/feature-graphic/feature-graphic-1024x500.png"
  echo "      Exported feature-graphic-1024x500.png"
fi
cp "$TWA_DIR/play-console-templates/SCREENSHOTS.md" "$ASSETS_DIR/screenshots/README.md"

if [[ -f "$ROOT/apps/uniz-portal/public/developers-mobile-preview.png" ]]; then
  cp "$ROOT/apps/uniz-portal/public/developers-mobile-preview.png" \
    "$ASSETS_DIR/screenshots/00-developers-mobile-preview.png" 2>/dev/null || true
fi

echo ""
echo "=== Phase A checklist ==="
echo "  [ ] Android Studio installed + SDK licenses accepted"
echo "  [ ] JDK 17+ in PATH (java -version)"
echo "  [ ] Bubblewrap: bubblewrap --version"
echo "  [ ] Review $ASSETS_DIR/store-listing/*.txt"
echo "  [ ] Export feature graphic 1024×500 (auto if rsvg-convert installed)"
echo "  [ ] Add 2–8 phone screenshots to $ASSETS_DIR/screenshots/ (see README)"
echo ""
echo "Live URLs (already on production):"
echo "  Privacy:    https://uniz.rguktong.in/privacy"
echo "  Manifest:   https://uniz.rguktong.in/manifest.json"
echo "  Asset links: https://uniz.rguktong.in/.well-known/assetlinks.json"
echo ""
echo "Phase B: When college pays → play.google.com/console → then run:"
echo "  npm run android:twa:init"
