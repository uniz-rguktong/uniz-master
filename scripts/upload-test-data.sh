#!/bin/bash

# Define Direct Service URLs to bypass Gateway issues initially
AUTH_SERVICE="https://uniz-auth.vercel.app"
USER_SERVICE="https://uniz-user-service-five.vercel.app"
ACADEMICS_SERVICE="https://uniz-academics-service-beryl.vercel.app"

TEST_DATA="testdata.txt"

echo "Uploading Students from $TEST_DATA..."

while IFS=$'\t' read -r idx username name s1 s2 s3 s4 s5 s6 s7 total final; do
  # Skip header or empty lines
  if [[ -z "$username" || "$username" == "username" ]]; then continue; fi

  echo "---------------------------------------------------"
  echo "Processing Student: $username ($name)"

  # 1. Signup (Auth Service)
  # Even if it exists, it returns error we can ignore, but we need to proceed to login
  curl -sS -X POST "$AUTH_SERVICE/signup" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$username\", \"password\": \"password123\", \"role\": \"student\"}" > /dev/null

  # 2. Login to get Token (Auth Service)
  LOGIN_RES=$(curl -sS -X POST "$AUTH_SERVICE/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$username\", \"password\": \"password123\"}")
  
  # Extract token using robust regex
  TOKEN=$(echo $LOGIN_RES | sed -n 's/.*"token":[[:space:]]*"\([^"]*\)".*/\1/p')

  if [[ ! -z "$TOKEN" ]]; then
    # 3. Update/Create Profile (User Service)
    # Using PUT /student/update which now supports Upsert
    PROFILE_PAYLOAD="{\"name\": \"$name\", \"branch\": \"CSE\", \"year\": \"3\"}"
    
    echo "  > Updating Profile..."
    PROF_HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "$USER_SERVICE/student/update" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$PROFILE_PAYLOAD")

    if [[ "$PROF_HTTP_CODE" == "200" || "$PROF_HTTP_CODE" == "201" ]]; then
        echo "    ✅ Profile Updated (Status: $PROF_HTTP_CODE)"
    else
        echo "    ❌ Profile Failed (Status: $PROF_HTTP_CODE)"
    fi

    # 4. Add Grades (Academics Service)
    GRADES_PAYLOAD="{\"studentId\": \"$username\", \"semesterId\": \"SEM-1\", \"grades\": [
      {\"subjectId\": \"SUB-1\", \"grade\": ${s1:-0}},
      {\"subjectId\": \"SUB-2\", \"grade\": ${s2:-0}},
      {\"subjectId\": \"SUB-3\", \"grade\": ${s3:-0}}
    ]}"
    
    # Check Endpoint: Assuming POST /grades/add based on conversation history
    # Correction: If Gateway rewrite was /academics/grades/add -> /grades/add in service
    
    echo "  > Adding Grades..."
    GRADES_HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$ACADEMICS_SERVICE/grades/add" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$GRADES_PAYLOAD")
      
    if [[ "$GRADES_HTTP_CODE" == "200" || "$GRADES_HTTP_CODE" == "201" ]]; then
        echo "    ✅ Grades Added (Status: $GRADES_HTTP_CODE)"
    else
        # We don't want to spam console if academics isn't ready
        echo "    ⚠️ Grades Failed (Status: $GRADES_HTTP_CODE)" 
    fi

    # 5. Add Attendance (Academics Service)
    ATTENDANCE_PAYLOAD="{\"subjectId\": \"SUB-ALL\", \"records\": [
      {\"studentId\": \"$username\", \"attended\": ${s4:-0}, \"total\": 30}
    ]}"
    
    ATT_HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$ACADEMICS_SERVICE/attendance/add" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$ATTENDANCE_PAYLOAD")
      
     # Just summary for Attendance
  else
    echo "❌ Failed to login $username"
    echo "   Response: $LOGIN_RES"
  fi

done < "$TEST_DATA"
