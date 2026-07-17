---
title: "Grades"
description: "Retrieve, add, update, and publish student grades. Includes Excel template download and bulk upload support."
---

All grades endpoints require authentication. The specific role required varies per endpoint and is noted in each section.

::: info
`GET /academics/grades` is served from a cache layer and typically responds in
  under 50 ms.
:::

---

## Get my grades

`GET /academics/grades`

Returns the authenticated student's grades across all semesters.

**Auth required:** Yes (student)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

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
  "source": "cache"
}
```

### Response fields

- `success` — `true` on success.

- `grades` — 
    
      Unique grade record identifier.

    - `grade` — Letter grade assigned (e.g. `EX`, `A`, `B`, `C`, `F`).

    - `semesterId` — Semester the grade belongs to (e.g. `E3S1`).

    - `subject` — 
        
          Subject code (e.g. `CS3101`).

        - `name` — Full subject name.

        - `credits` — Credit hours for the subject.

      
    
  

- `source` — `cache` if served from the cache layer, `db` if fetched directly from the
  database.

---

## Get batch grades

`GET /academics/grades/batch`

Returns grades for an entire batch, with optional filtering. Intended for administrative use.

**Auth required:** Yes (webmaster, dean, director)

### Query parameters

  Branch code (e.g. `CSE`, `ECE`, `ME`).

  Academic year (e.g. `E1`, `E2`, `E3`, `E4`).

  Semester identifier (e.g. `SEM-1`, `SEM-2`).

  When `true`, returns only students with failing grades. Defaults to `false`.

### Example

```bash
curl --request GET \
  --url 'https://api-uniz.rguktong.in/api/v1/academics/grades/batch?branch=CSE&year=E2&semesterId=SEM-1&failedOnly=true' \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "summary": {
    "totalStudents": 3,
    "totalRecords": 7,
    "failedRecords": 7,
    "timestamp": "2026-02-01T10:00:00.000Z"
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

### Response fields

- `summary` — 
    
      Number of distinct students in the result set.

    - `totalRecords` — Total grade records returned.

    - `failedRecords` — Number of failing grade records.

    - `timestamp` — ISO 8601 timestamp of when the data was fetched.

  

- `students` — Array of student grade summaries.

---

## Add grade

`POST /academics/grades/add`

Records a grade for a single student in a specific subject and semester.

**Auth required:** Yes (faculty, admin)

### Request body

  Student roll number (e.g. `O210008`).

  UUID of the subject.

  Semester identifier (e.g. `SEM-1`).

  Letter grade or numeric points to assign (e.g. `EX`, `A`, `9.5`).

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/add \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "studentId": "O210008",
    "subjectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "semesterId": "SEM-1",
    "grade": "EX"
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Grade added successfully"
}
```

---

## Bulk update grades

`PUT /academics/grades/bulk-update`

Updates multiple grade records in a single request. Useful for re-evaluations or corrections without uploading an Excel file.

**Auth required:** Yes (webmaster, dean)

### Request body

  Array of grade update objects.
  
    
      Student roll number.
    
    
      UUID of the subject.
    
    
      Semester identifier.
    
    
      New letter grade or numeric points.
    
  

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/bulk-update \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "updates": [
      {
        "studentId": "O210008",
        "subjectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "semesterId": "SEM-1",
        "grade": "EX"
      },
      {
        "studentId": "O210139",
        "subjectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "semesterId": "SEM-1",
        "grade": "A"
      }
    ]
  }'
```

**200 OK**

```json
{
  "success": true,
  "message": "Grades updated successfully",
  "updated": 2
}
```

---

## Download grade template

`GET /academics/grades/template`

Downloads an Excel template pre-filled with student IDs for the specified batch. Fill in the grade column and upload the file using the upload endpoint.

**Auth required:** Yes (faculty, admin)

### Query parameters

  Branch code (e.g. `CSE`).

  Academic year (e.g. `E1`).

  Semester label (e.g. `SEM-1`).

  Subject code to generate the template for (e.g. `E1-SEM-1-CSE-1`).

### Example

```bash
curl --request GET \
  --url 'https://api-uniz.rguktong.in/api/v1/academics/grades/template?branch=CSE&year=E1&semester=SEM-1&subjectCode=E1-SEM-1-CSE-1' \
  --header 'Authorization: Bearer <token>' \
  --output grades_template.xlsx
```

Returns a binary Excel file (`.xlsx`).

---

## Upload grades

`POST /academics/grades/upload`

Uploads a filled-in Excel template to import grades in bulk. The file is processed in batches in the background.

**Auth required:** Yes (faculty, admin)

**Content type:** `multipart/form-data`

### Request body

  The completed Excel file (`.xlsx`) previously downloaded from the template
  endpoint.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/upload \
  --header 'Authorization: Bearer <token>' \
  --form 'file=@/path/to/grades_template.xlsx'
```

**200 OK**

```json
{
  "success": true,
  "message": "Upload started",
  "jobId": "job-abc-123"
}
```

::: tip
Poll `GET /academics/grades/upload/progress` with the returned `jobId` to
  track processing status.
:::

---

## Check upload progress

`GET /academics/grades/upload/progress`

Polls the status of a background grade upload job.

**Auth required:** Yes (faculty, admin)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/upload/progress \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

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

### Response fields

- `progress` — 
    
      Current job status. One of `queued`, `processing`, `completed`, `failed`.

    - `percent` — Completion percentage (0–100).

    - `processed` — Number of records processed so far.

    - `total` — Total number of records in the job.

  

---

## Check publish progress

`GET /academics/grades/publish/progress`

Polls the status of a background grade publishing (email dispatch) job.

**Auth required:** Yes (director)

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/publish/progress \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "progress": {
    "status": "processing",
    "percent": 72,
    "processed": 240,
    "total": 330
  }
}
```

---

## Download grade report

`GET /academics/grades/download/:semesterId`

Downloads the compiled grade report for a semester as a file.

**Auth required:** Yes (admin)

### Path parameters

- `semesterId` — Semester identifier (e.g. `SEM-1`).

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/download/SEM-1 \
  --header 'Authorization: Bearer <token>' \
  --output grades_report_SEM-1.xlsx
```

Returns a binary Excel file.

---

## Publish results via email

`POST /academics/grades/publish-email`

Triggers a background job that emails grade report cards to all students for the given semester.

**Auth required:** Yes (director only)

### Request body

  Semester identifier whose results should be published (e.g. `SEM-1`).

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/academics/grades/publish-email \
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
  "message": "Publishing job started"
}
```

::: tip
Poll `GET /academics/grades/publish/progress` to monitor email dispatch
  status.
:::
