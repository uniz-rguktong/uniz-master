# 🎓 UniZ Student API Documentation (Production v1)

**Base URL (Production Gateway):**
`https://uniz-gateway.vercel.app/api/v1`

---

## 🔐 Authentication & Profile

### 1. Student Login

**Endpoint:** `POST /auth/login`
**Auth Required:** No

**Request Body:**

```json
{
  "username": "O210008",
  "password": "password123"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUz...",
  "role": "student",
  "username": "O210008"
}
```

---

### 2. Get My Profile

**Endpoint:** `GET /profile/student/me`
**Auth Required:** Yes (`Authorization: Bearer <TOKEN>`)

**Success Response (200 OK):**

```json
{
  "success": true,
  "student": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "O210008",
    "name": "DESU SABER",
    "year": "3",
    "branch": "CSE",
    "profile_url": "https://...",
    "has_pending_requests": false,
    "is_in_campus": true
  }
}
```

---

## 📚 Academics (Grades & Attendance)

### 3. Get My Grades (Cached)

**Endpoint:** `GET /academics/grades`
**Auth Required:** Yes
**Performance:** < 50ms (Redis Cached)

**Success Response (200 OK):**

```json
{
  "success": true,
  "grades": [
    {
      "id": "abc-123",
      "grade": "EX",
      "semesterId": "E3S1",
      "subject": {
        "code": "CS3101",
        "name": "Operating Systems",
        "credits": 4
      }
    },
    {
      "id": "abc-456",
      "grade": "A",
      "semesterId": "E3S1",
      "subject": {
        "code": "CS3102",
        "name": "Compiler Design",
        "credits": 4
      }
    }
  ],
  "source": "cache" // or "db"
}
```

### 4. Get My Attendance

**Endpoint:** `GET /academics/attendance`
**Auth Required:** Yes

**Success Response (200 OK):**

```json
{
  "success": true,
  "attendance": [
    {
      "id": "att-123",
      "attendedClasses": 45,
      "totalClasses": 50,
      "subject": {
        "code": "CS3101",
        "name": "Operating Systems"
      }
    }
  ]
}
```

### 4a. Download Grade Template (Files Service)

**Endpoint:** `GET /academics/grades/template`
**Auth Required:** Yes (Faculty/Admin)
**Query Params:** `branch` (CSE), `year` (E1), `semester` (SEM-1), `subjectCode` (E1-SEM-1-CSE-1)
**Description:** Downloads an Excel template pre-filled with student IDs for the specified batch.

### 4b. Upload Grades (Files Service)

**Endpoint:** `POST /academics/grades/upload`
**Auth Required:** Yes (Faculty/Admin)
**Response:** JSON with success count, fail count, and errors.
**Note:** Processed in batches.

### 4c. Check Upload Status (Files Service)

**Endpoint:** `GET /academics/upload/status/:jobId`
**Auth Required:** Yes (Faculty/Admin)
**Description:** Polls the status of the background upload job (Mock for now).
**Response:** `{ "status": "completed", "progress": 100 }`

### 4d. Publish Results (Email)

**Endpoint:** `POST /academics/grades/publish-email`
**Auth Required:** Yes (Webmaster/Dean/Director)
**Body:** `{ "semesterId": "SEM-1" }`
**Description:** Triggers bulk email notifications to all students for the given semester results.

---

## 🚪 Outpass & Permissions

### 5. Request Outpass

**Endpoint:** `POST /requests/outpass`
**Auth Required:** Yes

**Request Body:**

```json
{
  "reason": "Emergency visit to home due to health issues",
  "fromDay": "2026-02-10T09:00:00Z",
  "toDay": "2026-02-15T18:00:00Z",
  "studentGender": "M" // Optional, derived from profile if available
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "req-789",
    "currentLevel": "caretaker", // The current appover required
    "isApproved": false,
    "createdAt": "2026-01-31T10:00:00Z"
  }
}
```

### 6. Request Outing (Short Duration)

**Endpoint:** `POST /requests/outing`
**Auth Required:** Yes

**Request Body:**

```json
{
  "reason": "Buying groceries",
  "fromTime": "2026-02-10T17:00:00Z",
  "toTime": "2026-02-10T20:00:00Z"
}
```

---

## 🔍 Search (Admin Only)

### 7. Search Students

**Endpoint:** `POST /profile/student/search`
**Auth Required:** Yes (Director/Dean/Security)

**Request Body (Filters):**

```json
{
  "username": "O21", // Partial match search
  "branch": "CSE", // Optional
  "year": "3", // Optional
  "page": 1,
  "limit": 10
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "students": [
    {
      "username": "O210008",
      "name": "DESU SABER",
      "branch": "CSE"
    }
    // ... more students
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 50
  }
}
```

---

---

## 🔐 Password Management

### 8. Request Password Reset (OTP)

**Endpoint:** `POST /auth/otp/request`
**Auth Required:** No

**Request Body:**

```json
{
  "username": "O210008"
}
```

**Response:** `{"success": true, "message": "OTP sent to registered email"}`

### 9. Verify OTP

**Endpoint:** `POST /auth/otp/verify`
**Auth Required:** No

**Request Body:**

```json
{
  "username": "O210008",
  "otp": "123456"
}
```

### 10. Reset Password

**Endpoint:** `POST /auth/password/reset`
**Auth Required:** No

**Request Body:**

```json
{
  "username": "O210008",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

---

## 📢 Banners & Announcements (Public/Admin)

### 11. Get Banners (Student/Public)

**Endpoint:** `GET /profile/admin/banners`
**Auth Required:** Yes (Any Role)
**Performance:** < 50ms (Cached)
**Note:** Returns all banners. Frontend **MUST** filter by `isPublished: true` for student views.

**Success Response (200 OK):**

```json
{
  "success": true,
  "banners": [
    {
      "id": "ban-123",
      "title": "Result Day Announcement",
      "text": "Results will be out at 5 PM.",
      "imageUrl": "https://...",
      "isPublished": true,
      "createdAt": "2026-01-30T10:00:00Z"
    }
  ]
}
```

### 12. Create Banner (Admin Only)

**Endpoint:** `POST /profile/admin/banners`
**Auth Required:** Yes (Webmaster)

**Request Body:**

```json
{
  "title": "Holiday Notice",
  "text": "College is closed tomorrow.",
  "imageUrl": "https://imgur.com/..."
}
```

---

## 📅 Additional Student Features

### 13. Get Request History

**Endpoint:** `GET /requests/history`
**Auth Required:** Yes

**Success Response (200 OK):**

```json
{
  "success": true,
  "history": [
    {
      "_id": "req-123",
      "type": "outpass",
      "status": "pending",
      "reason": "Home visit",
      "requested_time": "2026-02-10T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "total": 5 }
}
```

### 14. Update My Details (Partial)

**Endpoint:** `PUT /profile/student/update`
**Auth Required:** Yes

**Request Body:**

```json
{
  "phone": "9876543210",
  "address": "New Address, Ongole"
}
```

---

# 🛡️ UniZ Admin API Documentation

## 🔐 Admin Authentication

All admins (Director, Dean, Wardens, Caretakers, Security) use the **same Login Endpoint** as students. The `role` in the response determines their access.

### 15. Admin Login

**Endpoint:** `POST /auth/login`
**Auth Required:** No

**Request Body:**

```json
{
  "username": "director",
  "password": "director@uniz"
}
```

_(Other usernames: `dean_cse`, `warden_male`, `caretaker_female`, `security_admin`)_

**Success Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJ...",
  "role": "director", // or "warden_male", "dean", etc.
  "username": "director"
}
```

---

## ✅ Workflow & Approvals (Wardens/Caretakers)

### 16. View Pending Outpasses

**Endpoint:** `GET /requests/outpass/all`
**Auth Required:** Yes (Warden/Caretaker/Dean)
**Note:** Returns all requests. Frontend should filter based on role (e.g., Caretaker only sees `currentLevel: caretaker`).

**Success Response (200 OK):**

```json
{
  "success": true,
  "outpasses": [
    {
      "id": "req-123",
      "studentId": "O210008",
      "studentGender": "M",
      "reason": "Home",
      "currentLevel": "caretaker", // This tells who needs to approve next
      "requested_time": "2026-02-10T..."
    }
  ]
}
```

### 17. Approve Request

**Endpoint:** `POST /requests/:id/approve`
**Auth Required:** Yes
**Logic:**

- **Caretaker**: Moves request to `warden` level.
- **Warden**: Moves request to `swo` level.
- **Dean/Director**: Final Approval (`isApproved: true`).

**Request Body (Optional):**

```json
{
  "comment": "Parent verified via call."
}
```

### 18. Reject Request

**Endpoint:** `POST /requests/:id/reject`
**Auth Required:** Yes

**Request Body:**

```json
{
  "comment": "Invalid reason."
}
```

---

## 🔍 Director & Dean Features

### 19. Search Any Student

**Endpoint:** `POST /profile/student/search`
**Auth Required:** Yes

### 20. Get All Outings (Security Gate Check)

**Endpoint:** `GET /requests/outing/all`
**Auth Required:** Yes (Security/Director)
**Use Case:** Security guard uses this to verify students leaving the campus.

---

## 📚 Academic & Examination Cell (AEC)

### 25. Get Batch Grades (Bulk View)

**Endpoint:** `GET /academics/grades/batch`
**Auth Required:** Yes (Webmaster/Dean/Director)
**Query Params:** `branch` (e.g., CSE), `year` (e.g., E2), `semesterId` (e.g., SEM-1), `failedOnly` (true/false)

**Success Response (200 OK):**

```json
{
  "success": true,
  "summary": {
    "totalStudents": 3,
    "totalRecords": 7,
    "failedRecords": 7,
    "timestamp": "2026-02-01T..."
  },
  "students": [
    {
      "studentId": "O210139",
      "name": "DAMARLA SEETHA RAM PRAVEEN",
      "branch": "CSE",
      "year": "E2",
      "records": [
        {
          "subjectCode": "E2-SEM-1-CSE-3",
          "subjectName": "Design & Analysis of Algorithms",
          "grade": 0,
          "credits": 4,
          "semesterId": "SEM-1"
        }
      ]
    }
  ]
}
```

### 26. Bulk Update Grades (JSON)

**Endpoint:** `POST /academics/grades/bulk-update`
**Auth Required:** Yes (Webmaster/Dean)
**Description:** Efficiently update multiple grades without Excel. Great for re-evaluations.

**Request Body:**

```json
{
  "updates": [
    {
      "studentId": "O210008",
      "subjectId": "UUID-HERE",
      "semesterId": "SEM-1",
      "grade": "EX" // or numeric points like 9.5
    }
  ]
}
```

### 27. Publish Results via Email

**Endpoint:** `POST /academics/grades/publish-email`
**Auth Required:** Yes (Director Only)
**Request Body:** `{"semesterId": "SEM-1"}`
**Note:** Triggers a background job to email report cards.

### 28. Monitor Progress

**Endpoints:**

- Uploads: `GET /academics/grades/upload/progress`
- Publishing: `GET /academics/grades/publish/progress`

**Response:**

```json
{
  "success": true,
  "progress": {
    "status": "processing",
    "percent": 45,
    "processed": 150,
    "total": 330
  }
}
```

---

## 🛠️ Webmaster Features

### 21. Create Banners

**Endpoint:** `POST /profile/admin/banners`
**Auth Required:** Yes (Webmaster)

### 22. Publish/Unpublish Banner

**Endpoint:** `POST /profile/admin/banners/:id/publish`
**Request Body:** `{"publish": true}`

### 23. System Health Check

**Endpoint:** `GET /system/health`
**Auth Required:** No
**Description:** Aggregates health status of all microservices in real-time.
**Success Response:**

```json
{
  "success": true,
  "services": [
    { "name": "Auth Service", "status": "UP", "latency": "120ms" },
    { "name": "Mail Service", "status": "UP", "latency": "45ms" }
  ]
}
```

---

## 🛡️ Security Guard Specific Features

### 23. Check-In / Check-Out Student

**Endpoint:** `PUT /profile/student/status`
**Auth Required:** Yes (Security/Warden/Director)
**Use Case:** Security guard scans QR code or enters ID when student enters/leaves.

**Request Body:**

```json
{
  "username": "O210008",
  "isPresent": false // Set to false when leaving, true when entering
}
```

### 24. View All Students Currently OUT

**Endpoint:** `POST /profile/student/search`
**Auth Required:** Yes (Security/Director)
**Use Case:** Generate a report of all students who have not reported back.

**Request Body:**

```json
{
  "isPresentInCampus": false,
  "limit": 50 // Fetch large batch
}
```

---

## 👥 Role & Responsibility Overview

### 1. Student (`student`)

- **Capabilities**: Login, View Profile, View Grades, Apply for Outpass/Outing, View History.
- **Restrictions**: Cannot approve any request, cannot see other students' data.

### 2. Caretaker (`caretaker_male` / `caretaker_female`)

- **Primary Duty**: First level of verification. Checks if parents are informed.
- **Capabilities**:
  - Approve Outpass (Moves request to Warden).
  - View all pending requests for their gender.
  - **Cannot** give final approval for long leaves (Outpass).

### 3. Warden (`warden_male` / `warden_female`)

- **Primary Duty**: Second level of verification. Checks academic schedule/disciplinary issues.
- **Capabilities**:
  - Approve Outpass (Moves request to SWO/Director).
  - **Can** give final approval for certain request types (if configured).

### 4. Security (`security`)

- **Primary Duty**: Gate keeping. Verifies valid outpass before allowing exit.
- **Capabilities**:
  - **View All Approved Outings/Outpasses**: To verify the student standing at the gate.
  - **Check-In/Check-Out**: Mark student status in the system.
  - **Track "Out" Students**: See list of students currently outside.

### 5. Director / Dean (`director` / `dean`)

- **Primary Duty**: Final Authority.
- **Capabilities**:
  - **Super Search**: Can search and view ANY student profile.
  - **Final Approval**: Their approval instantly grants the Outpass.
  - **Override**: Change student status manually if needed.

### 6. Webmaster (`webmaster`)

- **Primary Duty**: Application Maintenance.
- **Capabilities**:
  - Create and Publish **Banners**.
  - Manage technical configurations.
