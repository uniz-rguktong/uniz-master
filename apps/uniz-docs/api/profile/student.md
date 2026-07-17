---
title: "Student Profile"
description: "Retrieve and update student profile data, manage campus presence status, and search for students across the institution."
---

::: info
All endpoints on this page require `Authorization: Bearer <token>` in the request header.
:::

---

## Get your profile

`GET /profile/student/me`

Returns the profile of the authenticated student.

**Auth required:** Yes (student)

### Response

- `success` — `true` on success.

- `student` — 
    
      Internal unique identifier.

    - `username` — The student's roll number (e.g. `O210008`).

    - `name` — Full name of the student.

    - `year` — Current academic year (e.g. `"3"`).

    - `branch` — Branch of study (e.g. `"CSE"`).

    - `profile_url` — URL of the student's profile photo.

    - `has_pending_requests` — `true` if the student has an outpass or outing request awaiting approval.

    - `is_in_campus` — `true` if the student is currently recorded as present on campus.

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/profile/student/me \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "student": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "O210008",
    "name": "DESU SreeCharan",
    "year": "3",
    "branch": "CSE",
    "profile_url": "https://example.com/photos/O210008.jpg",
    "has_pending_requests": false,
    "is_in_campus": true
  }
}
```

---

## Update your profile

`PUT /profile/student/update`

Updates the authenticated student's own profile fields. All fields are optional; only the fields you include will be changed.

**Auth required:** Yes (student)

### Request body

  Student's phone number (10–15 digits).

  Student's home address.

  Blood group (e.g. `"O+"`).

  Date of birth in ISO 8601 format.

  URL of the student's profile photo.

  Father's full name.

  Mother's full name.

  Father's occupation.

  Mother's occupation.

  Father's email address.

  Mother's email address.

  Father's address.

  Mother's address.

  Hostel room number.

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/profile/student/update \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "phone": "9876543210",
    "address": "New Address, Ongole"
  }'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Update campus presence status

`PUT /profile/student/status`

Sets whether a student is currently present on campus. Security personnel use this when a student exits or enters at the gate. Administrators and wardens may also use it for manual corrections.

**Auth required:** Yes (security, warden, director)

### Request body

  The roll number of the student whose status you are updating.

  Set to `false` when the student leaves campus; `true` when they return.

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/profile/student/status \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O210008",
    "isPresent": false
  }'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Search students

`POST /profile/student/search`

Searches students with optional filters. Returns paginated results. Administrators, directors, and security personnel use this endpoint for lookups and gate-level reporting (e.g. find all students currently outside campus).

**Auth required:** Yes (admin, director, dean, security)

### Request body

  Partial roll number to search by (e.g. `"O21"` matches all roll numbers
  starting with `O21`).

  Filter by branch (e.g. `"CSE"`).

  Filter by academic year (e.g. `"3"`).

  Filter by campus presence. Set to `false` to find all students currently
  outside.

  Page number for pagination. Defaults to `1`.

  Number of results per page. Defaults to `10`. Use a higher value (e.g. `50`)
  to fetch larger batches.

### Response

- `success` — `true` on success.

- `students` — Array of matching student objects.
  
    
      Student roll number.

    - `name` — Student full name.

    - `branch` — Branch of study.

    - `year` — Current academic year.

    - `is_in_campus` — Whether the student is currently on campus.

  

- `pagination` — 
    
      Current page number.

    - `totalPages` — Total number of pages.

    - `total` — Total number of matching students.

  

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/profile/student/search \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "username": "O21",
    "branch": "CSE",
    "page": 1,
    "limit": 10
  }'
```

**200 OK**

```json
{
  "success": true,
  "students": [
    {
      "username": "O210008",
      "name": "DESU SreeCharan",
      "branch": "CSE",
      "year": "3",
      "is_in_campus": true
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 50
  }
}
```

---

## Get a specific student profile (admin)

`GET /admin/student/:username`

Returns the full profile of any student by their roll number. Only accessible to administrators and directors.

**Auth required:** Yes (admin, director, dean)

### Path parameters

- `username` — The student's roll number (e.g. `O210008`).

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/admin/student/O210008 \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "student": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "O210008",
    "name": "DESU SreeCharan",
    "year": "3",
    "branch": "CSE",
    "profile_url": "https://example.com/photos/O210008.jpg",
    "has_pending_requests": false,
    "is_in_campus": true
  }
}
```

### Error responses

| Status          | Meaning                                                       |
| --------------- | ------------------------------------------------------------- |
| `403 Forbidden` | Your role does not permit access to other students' profiles. |
| `404 Not Found` | No student found with the given roll number.                  |
