#!/bin/bash

BASE_URL="http://localhost:3001"

declare -a admins=(
  '{"username": "director", "password": "director@uniz", "role": "director"}'
  '{"username": "webmaster", "password": "webmaster@uniz", "role": "webmaster"}'
  '{"username": "dean", "password": "dean@uniz", "role": "dean"}'
  '{"username": "caretaker_female", "password": "caretaker@uniz", "role": "caretaker_female"}'
  '{"username": "caretaker_male", "password": "caretaker@uniz", "role": "caretaker_male"}'
  '{"username": "swo", "password": "swo@uniz", "role": "swo"}'
  '{"username": "warden_male", "password": "warden@uniz", "role": "warden_male"}'
  '{"username": "warden_female", "password": "warden@uniz", "role": "warden_female"}'
  '{"username": "security_admin", "password": "security@uniz", "role": "security"}'
  '{"username": "librarian_admin", "password": "librarian@uniz", "role": "librarian"}'
)

echo "Seeding Admins via CURL..."

for admin in "${admins[@]}"; do
  username=$(echo $admin | sed -n 's/.*"username": "\([^"]*\)".*/\1/p')
  role=$(echo $admin | sed -n 's/.*"role": "\([^"]*\)".*/\1/p')
  
  echo -n "Creating Admin: $username ($role)... "
  
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/signup" \
    -H "Content-Type: application/json" \
    -d "$admin")
    
  if [ "$STATUS" == "201" ]; then
    echo " Success"
  elif [ "$STATUS" == "409" ]; then
    echo " Already exists"
  else
    echo "Failed (Status: $STATUS)"
  fi
done
