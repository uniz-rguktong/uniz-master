---
title: "Semester Registration"
description: "Student subject registration, semester lifecycle, elective groups, and admin registration tracking."
---

::: info
All endpoints require `Authorization: Bearer <token>` unless noted otherwise.
  Base URL: `https://api-uniz.rguktong.in/api/v1/academics`
:::

UniZ manages **in-portal semester registration**. Webmasters configure a semester and subject catalog; deans and HODs review allocations; students register subjects during an IST registration window; administrators track completion per student.

---

## Semester status lifecycle

| Status | Meaning |
| ------ | ------- |
| `DRAFT` | Semester created; not yet in review |
| `DEAN_REVIEW` | Dean reviews branch allocations |
| `HOD_REVIEW` | HOD reviews department electives and allocations |
| `APPROVED` | Curriculum approved; registration not yet opened |
| `REGISTRATION_OPEN` | Students may register subjects |
| `REGISTRATION_CLOSED` | Registration window closed |

Typical flow:

```
DRAFT → DEAN_REVIEW → HOD_REVIEW → APPROVED → REGISTRATION_OPEN → REGISTRATION_CLOSED
```

Registration windows use `registrationStart` and `registrationEnd` on the semester record. Times are evaluated in **Asia/Kolkata (IST)**.

---

## Student: list available subjects

`GET /academics/student/available`

Returns approved subjects for the student's branch/year when registration is open, elective groups, window metadata, and whether the student already registered.

**Auth required:** Student

### Query parameters (optional)

| Parameter | Example | Notes |
| --------- | ------- | ----- |
| `branch` | `CSE` | Inferred from profile if omitted |
| `year` | `E3` | Inferred from profile if omitted |

### Example

```bash
curl --request GET \
  --url 'https://api-uniz.rguktong.in/api/v1/academics/student/available' \
  --header 'Authorization: Bearer <token>'
```

**200 OK** (registration open)

```json
{
  "semester": {
    "id": "E3-SEM-2",
    "name": "E3 SEM-2",
    "status": "REGISTRATION_OPEN",
    "batch": "O21"
  },
  "subjects": [
    {
      "subjectId": "uuid-1",
      "branch": "CSE",
      "academicYear": "E3",
      "isMandatory": true,
      "subject": { "code": "E3-SEM-2-CSE-1", "name": "Compiler Design", "credits": 4 }
    }
  ],
  "electiveGroups": [
    { "id": "grp-1", "name": "Open Elective", "maxSelections": 1, "branch": "CSE", "academicYear": "E3" }
  ],
  "registrationWindow": {
    "start": "2026-06-26T09:00:00.000Z",
    "end": "2026-06-28T17:00:00.000Z"
  },
  "alreadyRegistered": false,
  "isOpen": true,
  "windowMessage": null
}
```

When registration is closed or outside the window, `isOpen` is `false` and `subjects` may be empty.

---

## Student: register subjects

`POST /academics/student/register`

Registers the authenticated student for the active open semester. Each student may register **once per semester**.

**Auth required:** Student

### Request body

```json
{
  "subjectIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Validation rules

- Registration semester must be `REGISTRATION_OPEN` and inside the configured window (IST).
- All **mandatory** subjects for the student's branch/year must be included.
- **Elective group** limits are enforced (e.g. pick at most one from a group).
- Duplicate registration returns **409** with `alreadyRegistered: true`.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/student/register \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{"subjectIds":["uuid-1","uuid-2"]}'
```

**200 OK**

```json
{
  "success": true,
  "message": "Registration successful",
  "registeredCount": 2
}
```

**403** — window closed or registration not open.

**409** — already registered for this semester.

---

## Student: current registered subjects

`GET /academics/student/current/:studentId`

Returns subjects registered for the active semester. Students typically use the portal profile **Academic** tab; this endpoint powers that view.

**Auth required:** Student (own ID) or admin roles

---

## Admin: list semesters

`GET /academics/semester`

Returns all academic semesters. `_count.registrations` is the number of **distinct students** registered (not raw subject rows).

**Auth required:** Webmaster, Dean, HOD, Director, COE

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/semester \
  --header 'Authorization: Bearer <token>'
```

---

## Admin: create semester

`POST /academics/semester/create`

Creates a semester with subjects and elective groups. Webmaster only.

```json
{
  "name": "E3 SEM-2",
  "academicYear": "AY 2025-26",
  "batch": "O21",
  "program": "B.Tech",
  "registrationStart": "2026-06-26T09:00",
  "registrationEnd": "2026-06-28T17:00",
  "subjects": [],
  "electiveGroups": [],
  "submit": false
}
```

Set `submit: true` to move directly into dean review.

---

## Admin: update semester config

`PUT /academics/semester/:id/config`

Updates registration window dates, semester dates, and metadata.

---

## Admin: advance semester status

`POST /academics/semester/:id/advance`

Moves the semester to the next workflow stage (e.g. `DRAFT` → `DEAN_REVIEW` → … → `REGISTRATION_OPEN`).

---

## Admin: direct publish (verified)

When publishing results or opening registration, webmasters may need email OTP verification:

1. `POST /academics/semester/:id/publish/request-code`
2. `POST /academics/semester/:id/publish/resend-code` (optional)
3. `POST /academics/semester/:id/publish` with `{ "code": "123456" }`

---

## Admin: registration tracking

`GET /academics/registrations/tracking`

Per-student registration completion for a semester — registered vs pending, with search and pagination.

**Auth required:** Webmaster, Dean, Director, COE, HOD (HOD scoped to own department)

| Query | Example | Description |
| ----- | ------- | ----------- |
| `semesterId` | `E3-SEM-2` | Semester to report on |
| `branch` | `CSE` | Filter branch (`all` for all) |
| `year` | `E3` | Academic year filter |
| `batch` | `O21` | Batch filter |
| `status` | `registered` / `pending` / `all` | Registration state |
| `query` | `O210008` | Search by student ID or name |
| `page` | `1` | Page number |
| `limit` | `25` | Page size |

```bash
curl --request GET \
  --url 'https://api-uniz.rguktong.in/api/v1/academics/registrations/tracking?semesterId=E3-SEM-2&status=all' \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "semester": { "id": "E3-SEM-2", "name": "E3 SEM-2", "status": "REGISTRATION_OPEN" },
  "summary": { "eligible": 120, "registered": 98, "pending": 22, "percent": 82 },
  "students": [],
  "pagination": { "page": 1, "totalPages": 5, "total": 120 }
}
```

---

## Dean / HOD: branch allocations

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/academics/dean/review/:branch` | GET | List allocations for review |
| `/academics/dean/allocation` | POST | Create allocation |
| `/academics/dean/allocation/:id` | PUT | Update allocation (elective name/credits) |
| `/academics/dean/allocation/:id` | DELETE | Remove allocation |
| `/academics/dean/approve` | POST | Approve branch allocation batch |

HOD accounts use the same allocation endpoints scoped to their department branch.

---

## Elective groups

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/academics/semester/:id/elective-groups` | GET | List groups |
| `/academics/semester/:id/elective-groups` | POST | Create or update group |
| `/academics/semester/elective-groups/:groupId` | DELETE | Delete group |

Elective groups constrain how many electives a student may pick from a named set during registration.
