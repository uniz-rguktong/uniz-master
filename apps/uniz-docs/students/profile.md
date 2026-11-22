---
title: "Profile"
description: "View and update your personal details and profile photo."
---

Your profile page is the central view of your student record in uniZ. It shows your personal details, academic information, and family details.

Outpass and outing history is **not a current feature**. Those requests are parked. Do not look for a Permissions queue in the production portal.

---

## Profile information

Your profile is divided into tabs:

- **[Personal](#)**

  - **[Academic](#)**

  - **[Family](#)**

**API response example — your profile:**

```json
{
  "success": true,
  "student": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "O210008",
    "name": "DESU SreeCharan",
    "year": "3",
    "branch": "CSE",
    "profile_url": "https://...",
    "has_pending_requests": false,
    "is_in_campus": true
  }
}
```

---

## Update your details

You can update the following fields from the Personal and Family tabs:

- Phone number
- Address
- Blood group
- Date of birth
- Gender
- Father's name and occupation
- Mother's name and occupation
- Father's phone number
- Mother's phone number

  ### Tap the edit icon

On the profile header, tap the pencil icon next to your name, or use the
    **Edit** button (desktop: top-right corner).

  ### Modify the fields you want to change

Only changed fields are sent to the server — unchanged fields are left
    as-is.

  ### Tap Save

On desktop, tap **Save** in the top-right corner. On mobile, tap **Save
    Changes** at the bottom of the editing panel.

The update endpoint only accepts the fields you change:

```json
PUT /profile/student/update
{
  "phone": "9876543210",
  "address": "New Address, Ongole"
}
```

::: info
Academic fields — your roll number, year, branch, section, and room number —
  are managed by the administration and cannot be edited from the portal.
:::

---

## Profile photo

You can upload or replace your profile photo directly from the profile page.

  ### Tap the camera icon

Tap the small camera button at the bottom-right of your profile picture.

  ### Select a photo

Choose an image from your device. Accepted formats are standard image types
    (JPEG, PNG, etc.).

  ### Wait for upload

The photo is uploaded to cloud storage and your profile URL is updated
    automatically. You'll see a loading spinner while it uploads.

::: tip
Use a clear, recent photo — it may be used for identification purposes in
  campus records.
:::

---

## Campus presence status

The `is_in_campus` field on your profile is a stored presence flag.

| Value   | Meaning                                     |
| ------- | ------------------------------------------- |
| `true`  | You are currently recorded as on campus     |
| `false` | You are recorded as outside campus          |

You cannot change this flag yourself. Gate check-in that depends on an approved outpass is **parked** and is not how presence is updated in production today. If the flag looks wrong, contact administration.

---

## Exit-request history (parked)

Outpass and outing history is not shown as a current student feature. The parked reference, including the old history payload, stays on [Outpass](/students/outpass).

---

## Grievances and support

If you have a complaint, use the **Help & Support** section from the main navigation. Grievances are live. Outpass is not.

Submit a short description. It is routed to the Student Welfare Office.

::: info
For a discrepancy in your academic record, contact your academic section as well as filing a grievance.
:::
