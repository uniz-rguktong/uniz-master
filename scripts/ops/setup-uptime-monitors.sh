#!/usr/bin/env bash
# Configure Uptime Kuma monitors (run on the VPS; UI is 127.0.0.1:3001).
# Optional vault keys: UPTIME_KUMA_USER, UPTIME_KUMA_PASSWORD, UPTIME_DISCORD_WEBHOOK
set -euo pipefail

KUMA_URL="${KUMA_URL:-http://127.0.0.1:3001}"
VAULT="${VAULT:-/root/uniz-secrets.env}"
USER_NAME="${UPTIME_KUMA_USER:-}"
PASSWORD="${UPTIME_KUMA_PASSWORD:-}"
DISCORD_WEBHOOK="${UPTIME_DISCORD_WEBHOOK:-}"

if [[ -f "$VAULT" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(UPTIME_KUMA_USER|UPTIME_KUMA_PASSWORD|UPTIME_DISCORD_WEBHOOK)=' "$VAULT" || true)
  set +a
  USER_NAME="${UPTIME_KUMA_USER:-$USER_NAME}"
  PASSWORD="${UPTIME_KUMA_PASSWORD:-$PASSWORD}"
  DISCORD_WEBHOOK="${UPTIME_DISCORD_WEBHOOK:-$DISCORD_WEBHOOK}"
fi

if [[ -z "$USER_NAME" ]]; then USER_NAME="uniz-admin"; fi
if [[ -z "$PASSWORD" ]]; then
  PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  echo "[kuma] Generated password for $USER_NAME"
fi

persist_vault() {
  local k="$1" v="$2"
  [[ -f "$VAULT" ]] || return 0
  if grep -q "^${k}=" "$VAULT"; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$VAULT"
  else
    echo "${k}=${v}" >>"$VAULT"
  fi
  chmod 600 "$VAULT"
}

persist_vault UPTIME_KUMA_USER "$USER_NAME"
persist_vault UPTIME_KUMA_PASSWORD "$PASSWORD"

python3 - <<PY
from uptime_kuma_api import UptimeKumaApi, MonitorType

url = "${KUMA_URL}"
user = "${USER_NAME}"
password = "${PASSWORD}"
discord = """${DISCORD_WEBHOOK}"""

api = UptimeKumaApi(url)
if api.need_setup():
    api.setup(user, password)
    print("[kuma] setup complete")
api.login(user, password)

monitors = [
    ("portal", "https://uniz.rguktong.in/"),
    ("landing", "https://rguktong.in/"),
    ("api-health", "https://api-uniz.rguktong.in/api/v1/system/health"),
    ("landing-api", "https://landing-api.rguktong.in/"),
]
existing = {m.get("name"): m for m in api.get_monitors()}
for name, target in monitors:
    if name in existing:
        print("[kuma] monitor exists:", name)
        continue
    api.add_monitor(
        type=MonitorType.HTTP,
        name=name,
        url=target,
        interval=60,
        maxretries=2,
        retryInterval=60,
    )
    print("[kuma] added monitor:", name, target)

if discord.strip():
    ntf = api.get_notifications()
    if not any(n.get("name") == "discord-uniz" for n in ntf):
        api.add_notification(
            name="discord-uniz",
            type="discord",
            discordWebhookUrl=discord.strip(),
            applyExisting=True,
        )
        print("[kuma] discord webhook notification added")
    else:
        print("[kuma] discord notification already present")
else:
    print("[kuma] no UPTIME_DISCORD_WEBHOOK — set in vault and re-run to attach alerts")

api.disconnect()
print("[kuma] done")
PY
