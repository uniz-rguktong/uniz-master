---
title: "Faculty Profile"
description: "Retrieve and manage faculty member profiles, including self-service updates, admin-level management, bulk operations, and faculty search."
---

::: info
All endpoints on this page require `Authorization: Bearer <token>` in the request header.
:::

---

## Get your faculty profile

`GET /profile/faculty/me`

Returns the profile of the authenticated faculty member.

**Auth required:** Yes (faculty)

### Response

- `success` — `true` on success.

- `faculty` — 
    
      Unique faculty identifier.

    - `name` — Full name of the faculty member.

    - `email` — Institutional email address.

    - `department` — Department the faculty member belongs to (e.g. `"CSE"`).

    - `designation` — Job title (e.g. `"Assistant Professor"`).

    - `role` — System role assigned to the account (e.g. `"faculty"`, `"dean"`).

  

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/profile/faculty/me \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "faculty": {
    "username": "faculty_cse_01",
    "name": "Dr. A. Sharma",
    "email": "a.sharma@rguktong.ac.in",
    "department": "CSE",
    "designation": "Assistant Professor",
    "role": "faculty"
  }
}
```

---

## Update your faculty profile

`PUT /faculty/me/update`

Updates the authenticated faculty member's own profile. All fields are optional.

**Auth required:** Yes (faculty)

### Request body

  Full name.

  Email address.

  Department name.

  Job title.

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/faculty/me/update \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "designation": "Associate Professor"
  }'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Get a faculty member (admin)

`GET /admin/faculty/:username`

Returns the full profile of any faculty member. Only accessible to administrators.

**Auth required:** Yes (admin, director, dean)

### Path parameters

- `username` — The faculty member's username.

### Example

```bash
curl --request GET \
  --url https://api-uniz.rguktong.in/api/v1/admin/faculty/faculty_cse_01 \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true,
  "faculty": {
    "username": "faculty_cse_01",
    "name": "Dr. A. Sharma",
    "email": "a.sharma@rguktong.ac.in",
    "department": "CSE",
    "designation": "Assistant Professor",
    "role": "faculty"
  }
}
```

---

## Update a faculty member (admin)

`PUT /admin/faculty/:username`

Updates any faculty member's profile. Only accessible to administrators.

**Auth required:** Yes (admin, director)

### Path parameters

- `username` — The username of the faculty member to update.

### Request body

  Full name.

  Email address.

  Department name.

  Job title.

  System role to assign (e.g. `"faculty"`, `"dean"`, `"warden_male"`).

### Example

```bash
curl --request PUT \
  --url https://api-uniz.rguktong.in/api/v1/admin/faculty/faculty_cse_01 \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "designation": "Associate Professor",
    "role": "dean"
  }'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Delete a faculty member (admin)

`DELETE /admin/faculty/:username`

Permanently removes a faculty member's account.

**Auth required:** Yes (admin, director)

::: warning
This action is irreversible. The faculty member will lose access to the system
  immediately.
:::

### Path parameters

- `username` — The username of the faculty member to remove.

### Example

```bash
curl --request DELETE \
  --url https://api-uniz.rguktong.in/api/v1/admin/faculty/faculty_cse_01 \
  --header 'Authorization: Bearer <token>'
```

**200 OK**

```json
{
  "success": true
}
```

---

## Search faculty members

`POST /faculty/search`

Searches faculty members with optional filters. Returns matching results.

**Auth required:** Yes (admin, director, dean)

### Request body

  Partial name to search by.

  Filter by department (e.g. `"CSE"`).

  Filter by designation.

  Filter by system role.

  Page number. Defaults to `1`.

  Number of results per page. Defaults to `10`.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/faculty/search \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "department": "CSE",
    "page": 1,
    "limit": 10
  }'
```

**200 OK**

```json
{
  "success": true,
  "faculty": [
    {
      "username": "faculty_cse_01",
      "name": "Dr. A. Sharma",
      "department": "CSE",
      "designation": "Assistant Professor",
      "role": "faculty"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 2,
    "total": 18
  }
}
```

---

## Bulk create faculty (admin)

`POST /admin/faculty/bulk-create`

Creates multiple faculty accounts in a single request. Each object in the array must include the required fields.

**Auth required:** Yes (admin, director)

### Request body

The request body is an array of faculty objects.

  Unique username for the faculty member.

  Full name.

  Institutional email address.

  Department name.

  Job title.

  System role to assign. Defaults to `"faculty"` if omitted.

### Example

```bash
curl --request POST \
  --url https://api-uniz.rguktong.in/api/v1/admin/faculty/bulk-create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '[
    {
      "username": "faculty_ece_01",
      "name": "Dr. B. Rao",
      "email": "b.rao@rguktong.ac.in",
      "department": "ECE",
      "designation": "Associate Professor",
      "role": "faculty"
    },
    {
      "username": "faculty_ece_02",
      "name": "Prof. C. Reddy",
      "email": "c.reddy@rguktong.ac.in",
      "department": "ECE",
      "designation": "Assistant Professor"
    }
  ]'
```

**200 OK**

```json
{
  "success": true,
  "created": 2,
  "failed": 0,
  "errors": []
}
```

### Error responses

| Status            | Meaning                                                        |
| ----------------- | -------------------------------------------------------------- |
| `400 Bad Request` | One or more entries are missing required fields.               |
| `403 Forbidden`   | Your role does not have permission to create faculty accounts. |
| `404 Not Found`   | Faculty member not found.                                      |
