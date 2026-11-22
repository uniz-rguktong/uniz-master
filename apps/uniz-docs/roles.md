---
title: "Roles"
description: "Product roles in uniZ, the single webadmin account, and which gate roles are parked."
---

Every account has a role. The role decides the dashboard after sign-in. There is no manual role switch.

This page is the **product** role list. The webadmin **Roles screen** (directory, permission matrix, assign/remove) is a different page: [Roles screen](/admin/roles-directory).

## Role overview

| Role | Who it's for | Primary function | Status |
| ---- | ------------ | ---------------- | ------ |
| `student` | Enrolled RGUKT students | Academics and profile | Live |
| `faculty` | Teaching staff | Grade and attendance uploads, student records | Live for accounts that already have a login. Individual `firstname.lastname` logins are **not issued yet**. |
| `hod` | Head of Department | Department student view, elective review, registration tracking | Live |
| `dean` | Dean | Academic oversight: curriculum, reports, banners, alerts | Live |
| `director` | Director | Campus direction: reports, curriculum, user records | Live |
| `swo` | Student Welfare Officer | Grievance queue | Live for grievances. Outpass approval is parked. |
| `webadmin` | Canonical platform administrator | Full campus administration | Live, one account only |
| `caretaker_male` / `caretaker_female` | Hostel caretakers | First-level outpass approval | **Parked** |
| `warden_male` / `warden_female` | Hostel wardens | Second-level outpass approval | **Parked** |
| `security` | Gate staff | Check-in / check-out against an approved pass | **Parked** |

Shared accounts such as `director`, `dean`, `swo`, and `webadmin` still exist. Do not treat `dean_cse` or `security_admin` as the only username pattern.

## The webadmin account

Only one account may hold `webadmin`:

- Username exactly `webadmin`
- Mailbox `webadmin@rguktong.ac.in`

A username equal to `webadmin@rguktong.ac.in` is not that account. Any other credential that still stores the role string `webadmin` is treated as `faculty` by `accessRole()` (`packages/uniz-shared/src/admin-role.ts`), so webadmin-only tools miss. The Roles screen cannot edit that role. Details: [Webadmin workspace](/admin/webadmin).

## Guides

- [Student](/students/login)
- [Faculty grades](/faculty/grades) and [attendance](/faculty/attendance)
- [HOD / semester registration](/admin/semester-registration)
- [Webadmin workspace](/admin/webadmin)
- [Grievances](/api/requests/grievances) (live)

Caretaker, warden, and security guides describe the parked outpass design: [Approvals (parked)](/admin/approvals), [Security portal (parked)](/admin/security).

## Outpass approval chain (parked)

::: warning
This chain is **not a live workflow**. Production does not enable outpass or outing. The steps are kept so the design can be revived. See [Feature flags](/ops/feature-flags) and [Revive outpass](/howto/revive-outpass).
:::

When the feature is on, a student outpass would move:

```text
Student submits → Caretaker → Warden → SWO → Dean / Director (final approval)
```

A rejection stops the chain. A dean or director approval would mark the outpass approved from any stage. Outing requests would use a shorter path. Neither path is available to students today.
