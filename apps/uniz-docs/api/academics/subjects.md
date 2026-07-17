---
title: "Subjects"
description: "Manage subjects and semesters, and handle student subject registration."
---

All subjects and semester endpoints require authentication. Administrative operations (add, update, delete) require elevated roles as noted per endpoint.

---

## List subjects

`GET /academics/subjects`

Returns all subjects configured in the system.

**Auth required:** Yes

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/subjects \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "subjects": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "E1-SEM-1-CSE-1",
      "name": "Engineering Mathematics I",
      "credits": 4,
      "branch": "CSE",
      "year": "E1",
      "semesterId": "SEM-1"
    }
  ]
}
```

### Response fields

- `subjects` — 
    
      UUID of the subject.

    - `code` — Subject code (e.g. `E1-SEM-1-CSE-1`).

    - `name` — Full subject name.

    - `credits` — Credit hours.

    - `branch` — Branch this subject belongs to (e.g. `CSE`).

    - `year` — Academic year this subject is offered (e.g. `E1`).

    - `semesterId` — Semester identifier (e.g. `SEM-1`).

  

---

## Add a subject

`POST /academics/subjects/add`

Creates a new subject.

**Auth required:** Yes (dean, director, webmaster)

### Request body

  Unique subject code (e.g. `E1-SEM-1-CSE-1`).

  Full subject name (e.g. `Engineering Mathematics I`).

  Number of credit hours.

  Branch the subject belongs to (e.g. `CSE`).

  Academic year the subject is offered (e.g. `E1`).

  Semester the subject is part of (e.g. `SEM-1`).

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/subjects/add \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "code": "E1-SEM-1-CSE-1",
    "name": "Engineering Mathematics I",
    "credits": 4,
    "branch": "CSE",
    "year": "E1",
    "semesterId": "SEM-1"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Subject added successfully",
  "subject": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "code": "E1-SEM-1-CSE-1",
    "name": "Engineering Mathematics I",
    "credits": 4,
    "branch": "CSE",
    "year": "E1",
    "semesterId": "SEM-1"
  }
}
```

---

## Update a subject

`PUT /academics/subjects/:id`

Updates an existing subject by its UUID.

**Auth required:** Yes (dean, director, webmaster)

### Path parameters

- `id` — UUID of the subject to update.

### Request body

All fields are optional. Provide only the fields you want to change.

  Updated subject name.

  Updated credit hours.

  Updated subject code.

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/academics/subjects/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "credits": 5
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Subject updated successfully"
}
```

---

## Delete a subject

`DELETE /academics/subjects/:id`

Permanently removes a subject by its UUID.

**Auth required:** Yes (director)

### Path parameters

- `id` — UUID of the subject to delete.

### Example

```bash
curl --request DELETE \
  --url https://api-uniz.rguktong.in/api/v1/academics/subjects/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "message": "Subject deleted successfully"
}
```

---

## List semesters

`GET /academics/semester`

Returns all semesters in the system.

**Auth required:** Yes

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/semester \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "semesters": [
    {
      "id": "sem-uuid-001",
      "semesterId": "SEM-1",
      "status": "active",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-06-30T00:00:00.000Z"
    }
  ]
}
```

### Response fields

- `semesters` — 
    
      Internal UUID of the semester record.

    - `semesterId` — Human-readable semester label (e.g. `SEM-1`).

    - `status` — Current status. One of `active`, `inactive`, `archived`.

    - `startDate` — ISO 8601 start date.

    - `endDate` — ISO 8601 end date.

  

---

## Initialize a semester

`POST /academics/semester/init`

Creates and activates a new semester.

**Auth required:** Yes (director, dean)

### Request body

  Identifier for the new semester (e.g. `SEM-2`).

  ISO 8601 start date (e.g. `2026-07-01`).

  ISO 8601 end date (e.g. `2026-12-31`).

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/semester/init \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "semesterId": "SEM-2",
    "startDate": "2026-07-01",
    "endDate": "2026-12-31"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Semester initialized",
  "semester": {
    "id": "sem-uuid-002",
    "semesterId": "SEM-2",
    "status": "active",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-12-31T00:00:00.000Z"
  }
}
```

---

## Update semester status

`PATCH /academics/semester/status/:id`

Changes the status of an existing semester (e.g. mark it as inactive or archived).

**Auth required:** Yes (director, dean)

### Path parameters

- `id` — UUID of the semester record to update.

### Request body

  New status. One of `active`, `inactive`, `archived`.

### Example

```bash
curl --request PATCH \
  --url https://api-uniz.rguktong.in/api/v1/academics/semester/status/sem-uuid-001 \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "status": "inactive"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Semester status updated"
}
```

---

## Semester overview

`GET /academics/semester/overview`

Returns a high-level overview of the current semester, including registration counts and grade publication status.

**Auth required:** Yes (dean, director, webmaster)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/semester/overview \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "overview": {
    "activeSemester": "SEM-1",
    "totalRegistrations": 420,
    "totalSubjects": 12,
    "gradesPublished": false,
    "attendancePublished": false
  }
}
```

---

## Available subjects for registration

`GET /academics/student/available`

Returns the list of subjects available for the authenticated student to register in the current semester.

**Auth required:** Yes (student)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/student/available \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "subjects": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "E3-SEM-1-CSE-1",
      "name": "Operating Systems",
      "credits": 4
    }
  ]
}
```

---

## Register for subjects

`POST /academics/student/register`

Registers the authenticated student for one or more subjects in the current semester.

**Auth required:** Yes (student)

### Request body

  Array of subject UUIDs to register for.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/student/register \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subjectIds": [
      "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "7cb96g75-6828-5673-c4gd-3d074g77bgb7"
    ]
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Subjects registered successfully",
  "registered": 2
}
```

### Error responses

| Status            | Meaning                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `400 Bad Request` | One or more subject IDs are invalid or the registration window is closed. |
| `409 Conflict`    | Student is already registered for one or more of the provided subjects.   |

---

## Get current registered subjects

`GET /academics/student/current/:studentId`

Returns the subjects a student is currently registered for in the active semester.

**Auth required:** Yes

### Path parameters

- `studentId` — Student roll number (e.g. `O210008`). Students may only query their own
  record; admin roles may query any student.

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/student/current/O210008 \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "semesterId": "SEM-1",
  "subjects": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "E3-SEM-1-CSE-1",
      "name": "Operating Systems",
      "credits": 4
    }
  ]
}
```

### Response fields

- `semesterId` — The active semester these registrations belong to.

- `subjects` — List of currently registered subjects.
