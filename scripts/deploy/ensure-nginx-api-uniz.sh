#!/usr/bin/env bash
# Idempotent: host nginx vhost for api-uniz.rguktong.in → Traefik websecure NodePort.
# Prevents HTTP 308 loops when legacy uniz-api site is absent.
set -euo pipefail

K8S_CERT="/etc/nginx/uniz-k8s-tls/fullchain.pem"
K8S_KEY="/etc/nginx/uniz-k8s-tls/privkey.pem"
TRAEFIK_HTTPS="${TRAEFIK_HTTPS_UPSTREAM:-https://127.0.0.1:30620}"
SITE="uniz-api-uniz"

if [[ ! -f "$K8S_CERT" || ! -f "$K8S_KEY" ]]; then
  echo "[nginx-api-uniz] Missing k8s TLS at $K8S_CERT — run sync-nginx-k8s-tls.sh first" >&2
  exit 1
fi

cat >"/etc/nginx/sites-available/$SITE" <<NGINX
server {
    listen 443 ssl;
    server_name api-uniz.rguktong.in;

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
        proxy_request_buffering off;
        proxy_buffering off;
    }
}

server {
    listen 80;
    server_name api-uniz.rguktong.in;

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
# Legacy nested hostname site must not steal or confuse api-uniz routing
rm -f /etc/nginx/sites-enabled/uniz-api 2>/dev/null || true

nginx -t
systemctl reload nginx
echo "[nginx-api-uniz] Ensured $SITE → $TRAEFIK_HTTPS"
