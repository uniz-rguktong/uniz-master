#!/bin/bash
echo " Checking System Health via Curl..."
echo "------------------------------------------------"

URLS=(
    "Auth:https://uniz-auth.vercel.app/health"
    "User:https://uniz-user-service-five.vercel.app/health"
    "Academics:https://uniz-academics-service-beryl.vercel.app/health"
    "Outpass:https://uniz-outpass-service-snowy.vercel.app/health"
    "Files:https://uniz-files-service-blush.vercel.app/health"
    "Mail:https://uniz-mail.vercel.app/health"
    "Notifications:https://uniz-notification-service-sandy.vercel.app/health"
    "Cron:https://uniz-cron-service-theta.vercel.app/health"
    "Gateway:https://uniz-gateway.vercel.app/api/v1/system/health"
)

for entry in "${URLS[@]}"; do
    name=$(echo $entry | cut -d':' -f1)
    url=$(echo $entry | cut -d':' -f2-)
    
    echo -n " Checking $name ($url)... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq 200 ]; then
        echo " 200 OK"
    elif [ "$status" -eq 404 ]; then
        echo "❌ 404 Not Found"
    elif [ "$status" -eq 500 ]; then
        echo "❌ 500 Server Error"
    elif [ "$status" -eq 503 ]; then
        echo "❌ 503 Service Unavailable"
    else
        echo "❌ Status: $status"
    fi
done
echo "------------------------------------------------"
