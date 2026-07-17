---
title: "Attendance"
description: "Retrieve, record, and export student attendance records. Includes Excel template download and bulk upload support."
---

All attendance endpoints require authentication. The specific role required varies per endpoint and is noted in each section.

---

## Get my attendance

`GET /academics/attendance`

Returns the authenticated student's attendance records across all subjects for the current semester.

**Auth required:** Yes (student)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

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
    },
    {
      "id": "att-456",
      "attendedClasses": 38,
      "totalClasses": 50,
      "subject": {
        "code": "CS3102",
        "name": "Compiler Design"
      }
    }
  ]
}
```

### Response fields

- `success` — `true` on success.

- `attendance` — 
    
      Unique attendance record identifier.

    - `attendedClasses` — Number of classes the student attended.

    - `totalClasses` — Total number of classes conducted.

    - `subject` — 
        
          Subject code (e.g. `CS3101`).

        - `name` — Full subject name.

      
    
  

---

## Add attendance

`POST /academics/attendance/add`

Records attendance for a student in a subject for a given session.

**Auth required:** Yes (faculty)

### Request body

  Student roll number (e.g. `O210008`).

  UUID of the subject.

  Semester identifier (e.g. `SEM-1`).

  `true` if the student was present, `false` if absent.

  ISO 8601 date of the class session (e.g. `2026-03-15`). Defaults to today if
  omitted.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance/add \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "studentId": "O210008",
    "subjectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "semesterId": "SEM-1",
    "attended": true,
    "date": "2026-03-15"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Attendance recorded"
}
```

---

## Download attendance template

`GET /academics/attendance/template`

Downloads an Excel template pre-filled with student IDs for the specified batch. Fill in the attendance column and upload the file using the upload endpoint.

**Auth required:** Yes (faculty, admin)

### Query parameters

  Branch code (e.g. `CSE`).

  Academic year (e.g. `E1`).

  Semester label (e.g. `SEM-1`).

  Subject code for which to generate the template (e.g. `E1-SEM-1-CSE-1`).

### Example

```bash
curl --request GET \
  --url 'https://api-uniz.rguktong.in/api/v1/academics/attendance/template?branch=CSE&year=E1&semester=SEM-1&subjectCode=E1-SEM-1-CSE-1' \
  --header 'Authorization: Bearer <token>' \
  --output attendance_template.xlsx
```

Returns a binary Excel file (`.xlsx`).

---

## Upload attendance

`POST /academics/attendance/upload`

Uploads a completed Excel template to import attendance records in bulk.

**Auth required:** Yes (faculty, admin)

**Content type:** `multipart/form-data`

### Request body

  The completed Excel file (`.xlsx`) previously downloaded from the template
  endpoint.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance/upload \
  --header 'Authorization: Bearer <token>' \
  --form 'file=@/path/to/attendance_template.xlsx'
```

**200 OK**

```json
{
  "success": true,
  "message": "Upload started",
  "jobId": "job-def-456"
}
```

::: tip
Poll `GET /academics/attendance/upload/progress` with the returned `jobId` to
  track processing status.
:::

---

## Check upload progress

`GET /academics/attendance/upload/progress`

Polls the status of a background attendance upload job.

**Auth required:** Yes (faculty, admin)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance/upload/progress \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "progress": {
    "status": "processing",
    "percent": 60,
    "processed": 200,
    "total": 330
  }
}
```

### Response fields

- `progress` — 
    
      Current job status. One of `queued`, `processing`, `completed`, `failed`.

    - `percent` — Completion percentage (0–100).

    - `processed` — Number of records processed so far.

    - `total` — Total number of records in the job.

  

---

## Download attendance report

`GET /academics/attendance/download/:semesterId`

Downloads the compiled attendance report for a semester as an Excel file.

**Auth required:** Yes (admin)

### Path parameters

- `semesterId` — Semester identifier (e.g. `SEM-1`).

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance/download/SEM-1 \
  --header 'Authorization: Bearer <token>' \
  --output attendance_report_SEM-1.xlsx
```

Returns a binary Excel file.

---

## Publish attendance via email

`POST /academics/attendance/publish-email`

::: warning
This endpoint is deprecated. Use the download endpoint (`GET
  /academics/attendance/download/:semesterId`) to export attendance reports.
  This endpoint is retained for audit compliance and may be removed in a future
  version.
:::

Triggers a background job to email attendance reports to students for a given semester.

**Auth required:** Yes (director)

### Request body

  Semester identifier whose attendance should be published (e.g. `SEM-1`).

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/attendance/publish-email \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "semesterId": "SEM-1"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Attendance publish job started"
}
```
