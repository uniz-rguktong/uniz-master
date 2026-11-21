#!/usr/bin/env bash
# Host nginx vhost for dbadmin.rguktong.in → Traefik, same hop as api-uniz.
# The certificate is the dedicated cert-manager secret, not the shared API cert.
set -euo pipefail

K8S_CERT_DIR="/etc/nginx/uniz-dbadmin-tls"
K8S_CERT="$K8S_CERT_DIR/fullchain.pem"
K8S_KEY="$K8S_CERT_DIR/privkey.pem"
TRAEFIK_HTTPS="${TRAEFIK_HTTPS_UPSTREAM:-https://127.0.0.1:30620}"
SITE="uniz-dbadmin"
SECRET_NAME="${DBADMIN_TLS_SECRET_NAME:-uniz-adminer-tls}"

if ! kubectl get secret "$SECRET_NAME" >/dev/null 2>&1; then
  echo "[nginx-dbadmin] Secret/$SECRET_NAME is not ready yet. Create the DNS record, then rerun this script."
  exit 0
fi

mkdir -p "$K8S_CERT_DIR"
kubectl get secret "$SECRET_NAME" -o jsonpath='{.data.tls\.crt}' | base64 -d >"$K8S_CERT"
kubectl get secret "$SECRET_NAME" -o jsonpath='{.data.tls\.key}' | base64 -d >"$K8S_KEY"
chmod 600 "$K8S_KEY"

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
nginx -t
systemctl reload nginx
echo "[nginx-dbadmin] Ensured $SITE → $TRAEFIK_HTTPS"
