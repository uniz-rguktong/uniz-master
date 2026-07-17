---
title: "Outing"
description: "Same-day outing API. Disabled in production unless ENABLE_OUTPASS_OUTING=true — see Revive outpass."
---

::: warning
Production gateway returns **503** for outing routes while outpass is parked. See [Revive outpass](/howto/revive-outpass).
:::

An outing is a short-duration, same-day exit request. Unlike an [outpass](/api/requests/outpass) — which covers multi-day absences and requires a full approval chain — an outing covers a brief window on a single day with a simpler workflow.

| Feature        | Outpass                                  | Outing                            |
| -------------- | ---------------------------------------- | --------------------------------- |
| Duration       | Multi-day                                | Same day, short window            |
| Approval chain | Caretaker → Warden → SWO → Dean/Director | Simplified                        |
| Use case       | Home visits, medical trips               | Groceries, errands, brief outings |

::: info
All endpoints on this page require `Authorization: Bearer <token>` in the request header.
:::

::: warning
The submission endpoint is rate-limited. If you exceed the limit you will
  receive a `429 Too Many Requests` response. Wait before retrying.
:::

---

## Submit an outing request

`POST /requests/outing`

Creates a new outing request for the authenticated student.

**Auth required:** Yes (student)

### Request body

  The reason for the outing (e.g. `"Buying groceries"`).

  Start time as an ISO 8601 datetime string (e.g. `2026-02-10T17:00:00Z`). Must
  be on the same calendar day as `toTime`.

  End time as an ISO 8601 datetime string (e.g. `2026-02-10T20:00:00Z`). Must be
  on the same calendar day as `fromTime`.

### Response

- `success` — `true` when the request was created successfully.

- `data` — 
    
      Unique identifier for the outing request.

    - `status` — Initial status of the request. Typically `"pending"` immediately after
      creation.

  

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/outing \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "reason": "Buying groceries",
    "fromTime": "2026-02-10T17:00:00Z",
    "toTime": "2026-02-10T20:00:00Z"
  }'
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "id": "out-456",
    "status": "pending"
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

## List all outings

`GET /requests/outing/all`

Returns all outing requests in the system. Security personnel use this endpoint to verify students at the gate before allowing them to exit.

**Auth required:** Yes (security, director, admin)

::: info
Security guards use this endpoint to look up a specific student's approved
  outing before permitting exit. Cross-reference the student's ID and the
  current time against `fromTime` and `toTime`.
:::

### Response

- `success` — `true` on success.

- `outings` — Array of outing request objects.
  
    
      Unique outing request identifier.

    - `studentId` — Roll number of the requesting student.

    - `reason` — The stated reason for the outing.

    - `fromTime` — Approved exit start time (ISO 8601).

    - `toTime` — Expected return time (ISO 8601).

    - `status` — Current status: `"pending"`, `"approved"`, or `"rejected"`.

    - `requested_time` — ISO 8601 timestamp of when the request was submitted.

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/requests/outing/all \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "outings": [
    {
      "id": "out-456",
      "studentId": "O210008",
      "reason": "Buying groceries",
      "fromTime": "2026-02-10T17:00:00Z",
      "toTime": "2026-02-10T20:00:00Z",
      "status": "approved",
      "requested_time": "2026-02-10T14:30:00Z"
    }
  ]
}
```

### Error responses

| Status             | Meaning                                                       |
| ------------------ | ------------------------------------------------------------- |
| `401 Unauthorized` | Missing or invalid token.                                     |
| `403 Forbidden`    | The authenticated role does not have access to this endpoint. |
