#!/bin/bash

# --- UI COLORS ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:3000/api/v1"

echo -e "${CYAN}${BOLD}"
echo "---------------------------------------------------"
echo "        SYSTEM FLOW & SUSPENSION VERIFICATION      "
echo "---------------------------------------------------"
echo -e "${NC}"

# Interactive User Input
read -p "Enter Student ID to test (e.g. O210008): " STUDENT_USER
if [ -z "$STUDENT_USER" ]; then
  echo -e "${RED}[ERROR] Student ID cannot be empty.${NC}"
  exit 1
fi

STUDENT_PASS="password123" 
ADMIN_USER="webmaster"
ADMIN_PASS="webmaster@uniz"

# 1. Login as Webmaster
echo -e "\n${BOLD}PHASE 1: Administrator Authentication${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login/admin" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}")

if echo "$ADMIN_LOGIN" | grep -q "token"; then
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}[SUCCESS] Webmaster authenticated.${NC}"
else
  echo -e "${YELLOW}[WARN] Primary authentication failed, attempting fallback...${NC}"
  ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login/admin" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$ADMIN_USER\", \"password\": \"password\"}")
    
  if echo "$ADMIN_LOGIN" | grep -q "token"; then
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}[SUCCESS] Webmaster authenticated (fallback).${NC}"
  else
    echo -e "${RED}[FATAL] Administrative login failed: $ADMIN_LOGIN${NC}"
    exit 1
  fi
fi

# 1.1 Verify Student Existence
echo -e "\n${BOLD}PHASE 1.1: Identity Verification${NC}"
echo "Status: Searching for account '$STUDENT_USER'..."
VERIFY_USER=$(curl -s -X GET "$API_URL/profile/admin/student/$STUDENT_USER" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if ! echo "$VERIFY_USER" | grep -q "id"; then
  echo -e "${RED}[ERROR] Invalid username '$STUDENT_USER'. Account not found in database.${NC}"
  exit 1
else
  echo -e "${GREEN}[SUCCESS] Identity '$STUDENT_USER' verified.${NC}"
fi

# 2. Ensure Student is Active (Cleanup)
echo -e "\n${BOLD}PHASE 2: Environment Normalization${NC}"
echo "Status: Ensuring student account is active..."
curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": false}" > /dev/null
sleep 1
echo -e "${GREEN}[SUCCESS] System state normalized.${NC}"

# 3. Login as Student
echo -e "\n${BOLD}PHASE 3: Student Authentication${NC}"
STUDENT_LOGIN=$(curl -s -X POST "$API_URL/auth/login/student" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$STUDENT_USER\", \"password\": \"$STUDENT_PASS\"}")

if echo "$STUDENT_LOGIN" | grep -q "token"; then
  STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}[SUCCESS] Student authenticated.${NC}"
else
  echo -e "${RED}[FATAL] Student login failed: $STUDENT_LOGIN${NC}"
  exit 1
fi

# 4. Access Profile (Before Suspension)
echo -e "\n${BOLD}PHASE 4: Initial Access Check${NC}"
PROFILE_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_RESP" | grep -q "student"; then
  echo -e "${GREEN}[SUCCESS] Resource access verified.${NC}"
else
  echo -e "${RED}[FATAL] Initial resource access failed: $PROFILE_RESP${NC}"
  exit 1
fi

# 5. Suspend Student
echo -e "\n${BOLD}PHASE 5: Suspension Enforcement${NC}"
echo "Status: Terminating student access rights..."
SUSPEND_RESP=$(curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": true}")

sleep 2
echo -e "${GREEN}[SUCCESS] Access rights retracted.${NC}"

# 6. Access Profile (Expect Failure)
echo -e "\n${BOLD}PHASE 6: Enforcement Verification${NC}"
PROFILE_FAIL_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_FAIL_RESP" | grep -q "AUTH_SUSPENDED"; then
  echo -e "${GREEN}[SUCCESS] Suspension actively enforced (403 AUTH_SUSPENDED).${NC}"
else
  echo -e "${RED}[FAILURE] Access was NOT restricted! Response: $PROFILE_FAIL_RESP${NC}"
  exit 1
fi

# 7. Unsuspend Student
echo -e "\n${BOLD}PHASE 7: Resource Restoration${NC}"
echo "Status: Restoring student access rights..."
UNSUSPEND_RESP=$(curl -s -X POST "$API_URL/auth/admin/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\": \"$STUDENT_USER\", \"suspended\": false}")

sleep 2
echo -e "${GREEN}[SUCCESS] Access rights restored.${NC}"

# 8. Access Profile (Expect Success)
echo -e "\n${BOLD}PHASE 8: Final Restoration Check${NC}"
PROFILE_RESTORED_RESP=$(curl -s -X GET "$API_URL/profile/student/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$PROFILE_RESTORED_RESP" | grep -q "student"; then
  echo -e "${GREEN}[SUCCESS] Student resource access fully restored.${NC}"
else
  echo -e "${RED}[FAILURE] Restore failed! Response: $PROFILE_RESTORED_RESP${NC}"
  exit 1
fi

echo -e "\n${CYAN}${BOLD}---------------------------------------------------"
echo "    SYSTEM FLOW & SUSPENSION VERIFICATION COMPLETE  "
echo "---------------------------------------------------${NC}"
