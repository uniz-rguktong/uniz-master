---
title: "Approvals"
description: "Approve or reject outpass/outing requests and security check-in/out. Gated with outpass in production."
---

::: warning
These endpoints live under `/api/v1/requests/*` and return **503** while `ENABLE_OUTPASS_OUTING` is false. See [Revive outpass](/howto/revive-outpass).
:::

Requests flow through a sequential approval chain. Each role can only act at the level assigned to them. Approving a request moves it to the next level; rejecting it ends the chain.

::: info
All endpoints on this page require `Authorization: Bearer <token>` in the request header.
:::

## Approval chain

  ### Caretaker

First to review. Confirms the student's family is informed. Approving moves
    the request to the warden.

  ### Warden

Second review. Checks the student's academic schedule and disciplinary
    record. Approving moves the request to the SWO.

  ### SWO (Student Welfare Officer)

Third review. Approving forwards the request to the dean or director.

  ### Dean / Director

Final authority. Their approval sets `isApproved: true` and allows the
    student to exit campus.

Once the dean or director approves, security can use the [check-out](#check-out-a-student) endpoint to record the student leaving, and the [check-in](#check-in-a-student) endpoint when they return.

---

## Approve a request

`POST /requests/:id/approve`

Advances the request to the next approval level. The action taken depends on the caller's role:

| Caller role                           | Effect                                              |
| ------------------------------------- | --------------------------------------------------- |
| `caretaker_male` / `caretaker_female` | Moves request from `caretaker` → `warden` level.    |
| `warden_male` / `warden_female`       | Moves request from `warden` → `swo` level.          |
| `swo`                                 | Moves request from `swo` → `dean`/`director` level. |
| `dean` / `director`                   | Sets `isApproved: true`. Final approval granted.    |

`POST /requests/:id/forward` is an alias for this endpoint.

**Auth required:** Yes (caretaker, warden, swo, dean, director)

### Path parameters

- `id` — The unique identifier of the outpass or outing request.

### Request body

  Optional note from the approver. Shown to the student and subsequent
  approvers.

### Response

- `success` — `true` when the approval was recorded.

- `data` — 
    
      Request identifier.

    - `currentLevel` — Updated approval level after this action.

    - `isApproved` — `true` if the dean or director has now given final approval.

  

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/req-789/approve \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "comment": "Parent verified via call."
  }'
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "id": "req-789",
    "currentLevel": "warden",
    "isApproved": false
  }
}
```

### Error responses

| Status          | Meaning                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `403 Forbidden` | Your role is not permitted to approve at this request's current level. |
| `404 Not Found` | No request found with the given `id`.                                  |

---

## Reject a request

`POST /requests/:id/reject`

Rejects the request at the current level and ends the approval chain. The student's request will show `status: "rejected"` in their [request history](/api/requests/outpass#get-request-history).

**Auth required:** Yes (caretaker, warden, swo, dean, director)

### Path parameters

- `id` — The unique identifier of the request to reject.

### Request body

  The reason for rejection. Shown to the student.

### Response

- `success` — `true` when the rejection was recorded.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/req-789/reject \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "comment": "Invalid reason provided."
  }'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Check out a student

`POST /requests/:id/checkout`

Records that a student has physically left campus. Call this after the request is fully approved and the security guard verifies the student at the gate.

**Auth required:** Yes (security)

### Path parameters

- `id` — The unique identifier of the approved outpass or outing request.

### Response

- `success` — `true` when the checkout was recorded.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/req-789/checkout \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Check in a student

`POST /requests/:id/checkin`

Records that a student has returned to campus. Call this when the student arrives back at the gate after an approved outpass or outing.

**Auth required:** Yes (security)

### Path parameters

- `id` — The unique identifier of the request associated with this student's exit.

### Response

- `success` — `true` when the check-in was recorded.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/requests/req-789/checkin \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Get security summary

`GET /requests/security/summary`

Returns a summary of students currently outside campus — those who have checked out but not yet checked back in. Use this for a gate-level overview or end-of-day report.

**Auth required:** Yes (security, director, admin)

### Response

- `success` — `true` on success.

- `summary` — 
    
      Total number of students currently outside campus.

    - `students` — Array of students currently outside.
      
        
          Student roll number.

        - `name` — Student full name.

        - `checkedOutAt` — ISO 8601 timestamp of when the student exited.

        - `expectedReturn` — ISO 8601 timestamp of the approved return time.

      
    
  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/requests/security/summary \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "summary": {
    "totalOut": 2,
    "students": [
      {
        "studentId": "O210008",
        "name": "DESU SreeCharan",
        "checkedOutAt": "2026-02-10T17:05:00Z",
        "expectedReturn": "2026-02-10T20:00:00Z"
      }
    ]
  }
}
```
