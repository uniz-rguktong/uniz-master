---
title: "Roles"
description: "UniZ uses role-based access to give every user the tools they need. Learn what each role can do on the platform."
---

Every user in UniZ is assigned a role when their account is created. Your role determines which features you can access, which dashboards you see after logging in, and what actions you are authorized to take. There is no manual role switching — your role is fixed to your account.

## Role overview

| Role                                  | Who it's for                | Primary function                                       |
| ------------------------------------- | --------------------------- | ------------------------------------------------------ |
| `student`                             | Enrolled RGUKT students     | Academics, outpass requests, profile management        |
| `caretaker_male` / `caretaker_female` | Hostel caretakers           | First-level outpass approval                           |
| `warden_male` / `warden_female`       | Hostel wardens              | Second-level outpass approval                          |
| `swo`                                 | Student Welfare Officer     | Approval chain for student requests                    |
| `dean`                                | Dean of the institution     | Final outpass authority, batch grade review            |
| `director`                            | Director of the institution | Super authority, student status override               |
| `security`                            | Security staff at gates     | Gate check-in/check-out, approved outpass verification |
| `faculty`                             | Teaching staff              | Grade and attendance uploads, student record access    |
| `hod`                                 | Head of Department          | Department-scoped student view, elective review, registration tracking |
| `webadmin`                            | Platform administrator      | Semester builder, banners, bulk data, system health    |

---

## Detailed role capabilities

- **[Student](/students/login)**

  - **[Caretaker](/admin/approvals)**

  - **[Warden](/admin/approvals)**

  - **[SWO](/admin/approvals)**

  - **[HOD](/admin/semester-registration)**

  - **[Dean](/admin/approvals)**

  - **[Director](/admin/approvals)**

  - **[Security](/admin/security)**

  - **[Faculty](/faculty/grades)**

- **[Webadmin](/admin/overview)**

---

## Outpass approval chain

When a student submits an outpass request, it moves through a structured approval workflow. Each level must approve before it advances to the next.

```
Student submits → Caretaker → Warden → SWO → Dean / Director (final approval)
```

At any stage, the approver can reject the request with a comment. If rejected, the request does not advance further. A dean or director can grant final approval at any point in the chain — their approval immediately marks the outpass as approved regardless of which stage it is currently at.

::: info
Outing requests (short-duration exits, typically a few hours) follow a shorter
  approval path and are handled separately from multi-day outpass requests.
:::
