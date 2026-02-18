#!/bin/bash
GATEWAY="https://uniz-gateway.vercel.app/api/v1"
USER="https://uniz-user-service-five.vercel.app"
MAIL="https://uniz-mail.vercel.app"

for d in uniz-*; do
    if [ -f "$d/.env" ]; then
        sed -i '' "s|GATEWAY_URL=.*|GATEWAY_URL=\"$GATEWAY\"|g" "$d/.env"
        sed -i '' "s|USER_SERVICE_URL=.*|USER_SERVICE_URL=\"$USER\"|g" "$d/.env"
        sed -i '' "s|MAIL_SERVICE_URL=.*|MAIL_SERVICE_URL=\"$MAIL\"|g" "$d/.env"
    fi
done
