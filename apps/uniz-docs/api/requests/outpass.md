---
title: "Outpass"
description: "Submit and manage multi-day leave requests. Disabled in production unless ENABLE_OUTPASS_OUTING=true."
---

::: warning
In current production the gateway returns **503** for `/api/v1/requests/*` (except grievance). Scale outpass and set flags before using these endpoints — [Revive outpass](/howto/revive-outpass).
:::

An outpass is a multi-day leave request. After you submit one, it moves through a chain of approvers before the student is permitted to exit. Use the [Approvals](/api/requests/approvals) endpoints to advance or reject a request at each level.

::: info
All endpoints on this page require `Authorization: Bearer <token>` in the request header.
:::

::: warning
Submission endpoints are rate-limited. If you exceed the limit you will
  receive a `429 Too Many Requests` response. Wait before retrying.
:::

---

## Submit an outpass request

`POST /requests/outpass`

Creates a new outpass request for the authenticated student. The request enters the approval queue at the `caretaker` level.

**Auth required:** Yes (student)

### Request body

  The reason for the leave. Shown to each approver in the chain.

  Start of the leave period as an ISO 8601 datetime string (e.g.
  `2026-02-10T09:00:00Z`).

  End of the leave period as an ISO 8601 datetime string (e.g.
  `2026-02-15T18:00:00Z`).

  The student's gender: `"M"` or `"F"`. Optional — the server derives this from
  the student's profile when omitted.

### Response

- `success` — `true` when the request was created successfully.

- `data` — 
    
      Unique identifier for the outpass request.

    - `currentLevel` — The approval level the request is waiting at. See [approval
      levels](#approval-levels) below.

    - `isApproved` — `true` only when the dean or director has given final approval.

    - `createdAt` — ISO 8601 timestamp of when the request was created.

  

### Approval levels

The `currentLevel` field tells you which role must act next:

| Value               | Meaning                                                   |
| ------------------- | --------------------------------------------------------- |
| `caretaker`         | Awaiting first-level approval from the caretaker.         |
| `warden`            | Caretaker approved; awaiting warden review.               |
| `swo`               | Warden approved; awaiting Student Welfare Officer review. |
| `dean` / `director` | SWO approved; awaiting final approval.                    |
| `approved`          | Dean or director granted final approval.                  |
| `rejected`          | Rejected at some level in the chain.                      |

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/outpass \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "reason": "Emergency visit to home due to health issues",
    "fromDay": "2026-02-10T09:00:00Z",
    "toDay": "2026-02-15T18:00:00Z",
    "studentGender": "M"
  }'
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "id": "req-789",
    "currentLevel": "caretaker",
    "isApproved": false,
    "createdAt": "2026-01-31T10:00:00Z"
  }
}
```

### Error responses

| Status                  | Meaning                                 |
| ----------------------- | --------------------------------------- |
| `400 Bad Request`       | Missing or invalid request body fields. |
| `401 Unauthorized`      | Missing or invalid token.               |
| `429 Too Many Requests` | Submission rate limit exceeded.         |

---

## List all outpasses

`GET /requests/outpass/all`

Returns all outpass requests in the system. Intended for caretakers, wardens, and administrators to view the full queue.

**Auth required:** Yes (caretaker, warden, dean, director, admin)

::: info
The response includes all requests regardless of `currentLevel`. Your client
  should filter by `currentLevel` to show only the requests relevant to the
  current user's role (e.g. a caretaker sees only `currentLevel: "caretaker"`
  entries).
:::

### Response

- `success` — `true` on success.

- `outpasses` — Array of outpass request objects.
  
    
      Unique request identifier.

    - `studentId` — The roll number of the student who submitted the request.

    - `studentGender` — `"M"` or `"F"`.

    - `reason` — The stated reason for the leave.

    - `currentLevel` — The approval level the request is currently waiting at.

    - `requested_time` — ISO 8601 timestamp of when the request was submitted.

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/requests/outpass/all \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "outpasses": [
    {
      "id": "req-123",
      "studentId": "O210008",
      "studentGender": "M",
      "reason": "Home visit",
      "currentLevel": "caretaker",
      "requested_time": "2026-02-10T10:00:00Z"
    }
  ]
}
```

---

## Get request history

`GET /requests/history`

Returns the authenticated student's own outpass and outing request history, newest first.

**Auth required:** Yes (student)

### Response

- `success` — `true` on success.

- `history` — Array of past requests.
  
    
      Unique request identifier.

    - `type` — `"outpass"` or `"outing"`.

    - `status` — Current status of the request: `"pending"`, `"approved"`, or `"rejected"`.

    - `reason` — The reason provided when submitting.

    - `requested_time` — ISO 8601 timestamp of submission.

  

- `pagination` — 
    
      Current page number.

    - `total` — Total number of requests across all pages.

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/requests/history \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

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
  "pagination": {
    "page": 1,
    "total": 5
  }
}
```

---

## List students currently outside

`GET /requests/outside`

Returns the list of students who currently have an approved outpass and have not yet checked back in. Intended for administrators and security personnel.

**Auth required:** Yes (admin, security, director)

### Response

- `success` — `true` on success.

- `students` — Array of student records currently outside campus.
  
    
      The roll number of the student.

    - `name` — Full name of the student.

    - `reason` — Reason stated on the approved outpass.

    - `fromDay` — Approved leave start date.

    - `toDay` — Approved leave end date.

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/requests/outside \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "students": [
    {
      "studentId": "O210008",
      "name": "DESU SreeCharan",
      "reason": "Home visit",
      "fromDay": "2026-02-10T09:00:00Z",
      "toDay": "2026-02-15T18:00:00Z"
    }
  ]
}
```
