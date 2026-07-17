---
description: Perform professional bulk ingestion for Faculty and Grades
---

### 1. Faculty Enrichment (Scraping)

When the Webmaster needs to sync faculty data with the latest institutional bio updates:

1.  Navigate to **Staff Management**.
2.  The Portal logic automatically fetches the list of departments.
3.  For each department, the client triggers `https://college-scraped.vercel.app/api/departments/{dept}?deep=true`.
4.  The `deep=true` param ensures full biographical enrichment.
5.  New or updated faculty profiles are automatically upserted into the `uniz-user` Postgres database with bio payloads.

### 2. Grade Resource Ingestion

To update grades for an entire batch or year:

1.  **Generate Template**:
    - Use the **Resource Ingestion** center in `Grades Management`.
    - Select Department, Academic Year, and Semester.
    - Download the "Smart Template". This pre-populates the Excel file with the current Student IDs and Subject Codes.
2.  **Fill Data**:
    - Assign grades (EX, A, B, C, D, E, R) in the pre-populated rows.
3.  **Execute Ingestion**:
    - Drag & Drop the completed Excel asset into the **Ingestion Center**.
    - The `uniz-academics` service enqueues the rows and processes them in batches of 50.
    - Progress can be monitored via the Live Protocol console.

### 3. Troubleshooting Ingestion

- **Header Mismatch**: If you see "Missing required columns", ensure the headers match the provided template exactly (Case Sensitive).
- **Background Job Failures**: If the ingestion status hangs at "Queued", trigger a manual process poke:
  ```bash
  ssh root@... "curl -X POST http://uniz-academics-service:3004/api/queue/process -H 'x-internal-secret: uniz-core'"
  ```
