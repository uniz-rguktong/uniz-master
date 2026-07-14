#!/usr/bin/env bash
# Host nginx: www.* → apex redirects using k8s TLS (for grey-cloud nested www DNS).
set -euo pipefail

K8S_CERT="/etc/nginx/uniz-k8s-tls/fullchain.pem"
K8S_KEY="/etc/nginx/uniz-k8s-tls/privkey.pem"

if [[ ! -f "$K8S_CERT" ]]; then
  echo "[nginx-www] Missing $K8S_CERT — run sync-nginx-k8s-tls.sh first" >&2
  exit 1
fi

write_redirect() {
  local file="$1"
  local www_host="$2"
  local apex="$3"
  cat >"/etc/nginx/sites-available/$file" <<NGINX
server {
    listen 443 ssl;
    server_name $www_host;

    ssl_certificate $K8S_CERT;
    ssl_certificate_key $K8S_KEY;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 308 https://$apex\$request_uri;
}
NGINX
  ln -sf "/etc/nginx/sites-available/$file" "/etc/nginx/sites-enabled/$file"
}

write_redirect "uniz-portal-www" "www.uniz.rguktong.in" "uniz.rguktong.in"
write_redirect "uniz-landing-api-www" "www.landing-api.rguktong.in" "landing-api.rguktong.in"
write_redirect "uniz-api-www" "www.api.uniz.rguktong.in" "api-uniz.rguktong.in"

# HTTP → HTTPS for grey-cloud www hits (direct to VPS)
write_http_redirect() {
  local file="$1"
  local www_host="$2"
  local apex="$3"
  cat >"/etc/nginx/sites-available/$file" <<NGINX
server {
    listen 80;
    server_name $www_host;
    return 308 https://$apex\$request_uri;
}
NGINX
  ln -sf "/etc/nginx/sites-available/$file" "/etc/nginx/sites-enabled/$file"
}

write_http_redirect "uniz-portal-www-http" "www.uniz.rguktong.in" "uniz.rguktong.in"
write_http_redirect "uniz-api-www-http" "www.api.uniz.rguktong.in" "api-uniz.rguktong.in"
write_http_redirect "uniz-landing-api-www-http" "www.landing-api.rguktong.in" "landing-api.rguktong.in"

# Remove www from apex vhosts when a dedicated *-www redirect site exists
sed -i 's/server_name uniz.rguktong.in www.uniz.rguktong.in;/server_name uniz.rguktong.in;/' /etc/nginx/sites-available/uniz-portal 2>/dev/null || true
sed -i 's/server_name api-uniz.rguktong.in www.api-uniz.rguktong.in;/server_name api-uniz.rguktong.in;/' /etc/nginx/sites-available/uniz-api 2>/dev/null || true
sed -i 's/server_name api-uniz.rguktong.in;/server_name api-uniz.rguktong.in;/' /etc/nginx/sites-available/uniz-api 2>/dev/null || true
sed -i 's/server_name landing-api.rguktong.in www.landing-api.rguktong.in;/server_name landing-api.rguktong.in;/' /etc/nginx/sites-available/uniz-landing-api 2>/dev/null || true
# Drop inline www redirect block from landing-api (handled by uniz-landing-api-www)
python3 - <<'PY'
from pathlib import Path
path = Path("/etc/nginx/sites-available/uniz-landing-api")
if not path.exists():
    raise SystemExit(0)
text = path.read_text()
marker = 'server_name www.landing-api.rguktong.in;'
while marker in text:
    start = text.rfind("\nserver {", 0, text.index(marker))
    if start == -1:
        break
    depth = 0
    end = start
    for i in range(start + 1, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    text = text[:start] + text[end:]
path.write_text(text.lstrip("\n"))
PY

nginx -t
systemctl reload nginx
echo "[nginx-www] Installed www redirect vhosts"
