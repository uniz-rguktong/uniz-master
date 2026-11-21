#!/usr/bin/env bash
# Host nginx vhost for dbadmin.rguktong.in → Traefik, same hop as api-uniz.
#
# Cloudflare terminates the public TLS in front of the tunnel. cloudflared
# connects to https://127.0.0.1:443 with noTLSVerify, so this vhost reuses the
# origin certificate already synced for api-uniz (secret uniz-tls-cert).
# A separate uniz-adminer-tls certificate is not required.
# Missing files or a rejected config warn and return success so deploy continues.
set -euo pipefail

K8S_CERT="/etc/nginx/uniz-k8s-tls/fullchain.pem"
K8S_KEY="/etc/nginx/uniz-k8s-tls/privkey.pem"
TRAEFIK_HTTPS="${TRAEFIK_HTTPS_UPSTREAM:-https://127.0.0.1:30620}"
SITE="uniz-dbadmin"

if [[ ! -f "$K8S_CERT" || ! -f "$K8S_KEY" ]]; then
  echo "[nginx-dbadmin] Shared origin cert is not on disk yet ($K8S_CERT). Cloudflare still terminates public TLS. Not blocking deploy." >&2
  exit 0
fi

cat >"/etc/nginx/sites-available/$SITE" <<NGINX
server {
    listen 443 ssl;
    server_name dbadmin.rguktong.in;

    ssl_certificate $K8S_CERT;
    ssl_certificate_key $K8S_KEY;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass $TRAEFIK_HTTPS;
        proxy_ssl_server_name on;
        proxy_ssl_name \$host;
        proxy_ssl_verify off;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cf-Access-Jwt-Assertion \$http_cf_access_jwt_assertion;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}

server {
    listen 80;
    server_name dbadmin.rguktong.in;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        allow all;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
NGINX

ln -sfn "/etc/nginx/sites-available/$SITE" "/etc/nginx/sites-enabled/$SITE"

if ! nginx -t; then
  echo "[nginx-dbadmin] WARN: nginx rejected the dbadmin vhost; not reloading" >&2
  rm -f "/etc/nginx/sites-enabled/$SITE"
  exit 0
fi

if ! systemctl reload nginx; then
  echo "[nginx-dbadmin] WARN: nginx reload failed" >&2
  exit 0
fi

echo "[nginx-dbadmin] Ensured $SITE → $TRAEFIK_HTTPS (origin cert, Access header forwarded)"
