#!/bin/bash

# Configuration - Using Gateway for everything!
BASE_URL="http://localhost:3000/api/v1"

echo "========================================"
echo "UniZ API Flow Test (Gateway Proxy CURLs)"
echo "========================================"

# 1. Admin Login
echo -ne "\n1. Admin Login (Webmaster)... "
WEBMASTER_RES=$(curl -s -X POST "$BASE_URL/auth/login/admin" \
  -H "Content-Type: application/json" \
  -d '{"username":"webmaster","password":"webmaster@uniz"}')
WEBMASTER_TOKEN=$(echo $WEBMASTER_RES | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -n "$WEBMASTER_TOKEN" ]; then
  echo "SUCCESS"
else
  echo "FAILED: $WEBMASTER_RES"
  exit 1
fi

# 2. Student Login
echo -ne "2. Student Login (O210008)... "
STUDENT_RES=$(curl -s -X POST "$BASE_URL/auth/login/student" \
  -H "Content-Type: application/json" \
  -d '{"username":"O210008","password":"123456"}')
STUDENT_TOKEN=$(echo $STUDENT_RES | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -n "$STUDENT_TOKEN" ]; then
  echo "SUCCESS"
else
  echo "FAILED: $STUDENT_RES"
  exit 1
fi

# 3. Fetch Student Profile
echo -ne "3. Fetch Student Profile... "
PROFILE_RES=$(curl -s -X GET "$BASE_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "Done"

# 4. Update Profile
echo -ne "4. Update Student Profile (SABER Desu)... "
UPDATE_RES=$(curl -s -X PUT "$BASE_URL/profile/student/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"name":"SABER Desu","phone_number":"6300625861","gender":"M"}')
echo "Done"

# 5. Fetch Academics
echo -ne "5. Fetch Academic Grades... "
GRADES_RES=$(curl -s -X GET "$BASE_URL/academics/grades?studentId=O210008&semester=SEM-1&year=E2" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "Done"

# 6. Fetch Attendance
echo -ne "6. Fetch Attendance... "
ATT_RES=$(curl -s -X GET "$BASE_URL/academics/attendance?studentId=O210008&year=E2&semester=SEM-1" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "Done"

# 7. Create Outpass
echo -ne "7. Create Outpass Request... "
OUTPASS_RES=$(curl -s -X POST "$BASE_URL/requests/outpass" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"reason":"Gateway Flow Test","destination":"Guntur","contact":"6300625861","fromDay":"2026-02-15T10:00:00Z","toDay":"2026-02-16T18:00:00Z"}')
REQUEST_ID=$(echo $OUTPASS_RES | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [ -n "$REQUEST_ID" ]; then
  echo "SUCCESS (ID: $REQUEST_ID)"
else
  echo "FAILED: $OUTPASS_RES"
  exit 1
fi

# 8. Admin View Pending
echo -ne "8. Admin Viewing Pending Outpasses... "
PENDING_RES=$(curl -s -X GET "$BASE_URL/requests/outpass/all?search=O210008" \
  -H "Authorization: Bearer $WEBMASTER_TOKEN")
echo "Done"

# 9. Admin Approving Outpass
echo -ne "9. Admin Approving Outpass... "
APPROVE_RES=$(curl -s -X POST "$BASE_URL/requests/$REQUEST_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBMASTER_TOKEN" \
  -d '{"action":"approve","comments":"Gateway flow test approved"}')
echo "Done"

# 10. Security Check-out
echo -ne "10. Security Check-out... "
CHECKOUT_RES=$(curl -s -X POST "$BASE_URL/requests/$REQUEST_ID/checkout" \
  -H "Authorization: Bearer $WEBMASTER_TOKEN")
echo "Done"

# 11. Security Check-in
echo -ne "11. Security Check-in... "
CHECKIN_RES=$(curl -s -X POST "$BASE_URL/requests/$REQUEST_ID/checkin" \
  -H "Authorization: Bearer $WEBMASTER_TOKEN")
echo "Done"

echo -e "\n========================================"
echo "Gateway Flow Test Complete"
echo "========================================"
