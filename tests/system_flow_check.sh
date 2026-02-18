#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/v1"
STUDENT_USER="O210008"
STUDENT_PASS="password123" # Adjust if needed based on previous successful login
ADMIN_USER="WEBMASTER"
# Try known passwords, if fail we might need to reset or fallback
ADMIN_PASS="password" 

echo "---------------------------------------------------"
echo "🚀 Starting System Flow Verification"
echo "---------------------------------------------------"

# 1. Login as Webmaster
echo "\n🔹 1. Logging in as Webmaster..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login/admin" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"webmaster\", \"password\": \"webmaster@uniz\"}")

if echo "$ADMIN_LOGIN" | grep -q "token"; then
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "✅ Webmaster Login Successful"
else
  echo "⚠️ Webmaster Login Failed with seed creds, trying 'password'..."
  ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login/admin" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"webmaster\", \"password\": \"password\"}")
    
  if echo "$ADMIN_LOGIN" | grep -q "token"; then
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "✅ Webmaster Login Successful (fallback)"
  else
    echo "❌ Webmaster Login Failed: $ADMIN_LOGIN"
    exit 1
  fi
fi

# 2. Ensure Student is Active (Cleanup)
echo "\n🔹 2. ensuring Student $STUDENT_USER is active..."
curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": false}" > /dev/null
sleep 1

# 3. Login as Student
echo "\n🔹 3. Logging in as Student ($STUDENT_USER)..."
STUDENT_LOGIN=$(curl -s -X POST "$API_URL/auth/login/student" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$STUDENT_USER\", \"password\": \"$STUDENT_PASS\"}")

if echo "$STUDENT_LOGIN" | grep -q "token"; then
  STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "✅ Student Login Successful"
else
  echo "❌ Student Login Failed: $STUDENT_LOGIN"
  exit 1
fi

# 4. Access Profile (Before Suspension)
echo "\n🔹 4. Accessing Student Profile..."
PROFILE_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_RESP" | grep -q "student"; then
  echo "✅ Profile Access Successful"
else
  echo "❌ Profile Access Failed: $PROFILE_RESP"
  exit 1
fi

# 5. Suspend Student
echo "\n🔹 5. Suspending Student $STUDENT_USER..."
SUSPEND_RESP=$(curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": true}")

echo "Response: $SUSPEND_RESP"
sleep 2

# 6. Access Profile (Expect Failure)
echo "\n🔹 6. Verifying Suspension (Accessing Profile)..."
PROFILE_FAIL_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_FAIL_RESP" | grep -q "AUTH_SUSPENDED"; then
  echo "✅ SUCCESS: User is correctly blocked (403 AUTH_SUSPENDED)"
else
  echo "❌ FAILURE: User was NOT blocked! Response: $PROFILE_FAIL_RESP"
  exit 1
fi

# 7. Unsuspend Student
echo "\n🔹 7. Unsuspending Student $STUDENT_USER..."
UNSUSPEND_RESP=$(curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": false}")

echo "Response: $UNSUSPEND_RESP"
sleep 2

# 8. Access Profile (Expect Success)
echo "\n🔹 8. Verifying Restoration (Accessing Profile)..."
PROFILE_RESTORED_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_RESTORED_RESP" | grep -q "student"; then
  echo "✅ SUCCESS: User access restored"
else
  echo "❌ FAILURE: User access NOT restored! Response: $PROFILE_RESTORED_RESP"
  exit 1
fi

echo "\n---------------------------------------------------"
echo "🎉 System Flow & Suspension Check Complete!"
echo "---------------------------------------------------"
