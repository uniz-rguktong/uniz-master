# UniZ portal — screen-by-screen UI pass

**Branch.** `polish/ui-screen-by-screen`  
**App.** `apps/uniz-portal`  
**Live.** https://uniz.rguktong.in  
**Tokens.** `src/lib/portal-ui.ts` · navy `#0B2A47`  
**Owner.** Work from GrokBot / cloud agents on this branch only.

## Intent

Portal UI is not finished. Polish **one screen at a time**. Do not claim completion from landing-only work.

## Status legend

| Mark | Meaning |
| --- | --- |
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done on this branch |

## Backlog (suggested order)

### 0. Public / auth

| # | Screen | Primary files | Status |
| --- | --- | --- | --- |
| 0.1 | Home (Elaya) | `pages/home.tsx`, Navbar | `[x]` shipped on main |
| 0.2 | Student sign-in | `pages/auth/CommonSignin.tsx` | `[ ]` |
| 0.3 | Admin / staff sign-in | same | `[ ]` |
| 0.4 | Reset password / OTP | same | `[ ]` |

### 1. Webadmin Control Center (start here)

| # | Screen | Primary files | Status |
| --- | --- | --- | --- |
| 1.1 | Webmaster overview / Control Center | `WebmasterOverview.tsx`, `SystemUserAnalytics.tsx`, `InstitutionAnalytics.tsx`, `IdentityInsightsPanel.tsx` | `[ ]` **next** |
| 1.2 | Admin shell chrome | `components/admin/AdminShell.tsx` | `[ ]` |
| 1.3 | Student Details | `StudentDetails.tsx`, `StudentDashboard.tsx` | `[ ]` |
| 1.4 | Student Bulk Ops | `StudentBulkSection.tsx`, `StudentBulkActionsPanel.tsx` | `[ ]` |
| 1.5 | Attendance / Grades upload | `UploadSection.tsx`, `GradesSection.tsx` | `[ ]` |
| 1.6 | Subjects / Semester registration | `SubjectManagement.tsx`, `SemesterRegistration*.tsx` | `[ ]` |
| 1.7 | Campus CMS (banners, updates, push) | `BannersSection.tsx`, `UpdatesSection.tsx`, `PushNotificationSection.tsx` | `[ ]` |
| 1.8 | Faculty management | `FacultyManagement.tsx` | `[ ]` |
| 1.9 | System & Logs / Security | `SystemLogsSection.tsx`, `SecuritySection.tsx` | `[ ]` |

### 2. Other admin roles

| # | Screen | Notes | Status |
| --- | --- | --- | --- |
| 2.1 | Dean overview | `Dean/DeanOverview.tsx` | `[ ]` |
| 2.2 | HOD / SWO / Warden / Caretaker shells | role dashboards | `[ ]` |

### 3. Faculty

| # | Screen | Primary files | Status |
| --- | --- | --- | --- |
| 3.1 | Faculty dashboard | `pages/faculty/dashboard.tsx` | `[ ]` |

### 4. Student

| # | Screen | Primary files | Status |
| --- | --- | --- | --- |
| 4.1 | Student home / profile | `pages/student/student.tsx` | `[ ]` |
| 4.2 | Registration / academics panels | `Registration.tsx`, `components/*` | `[ ]` |
| 4.3 | Grievance / Help / Notifications | related student pages | `[ ]` |

## How to run a screen

1. Check out `polish/ui-screen-by-screen`
2. Pick the next `[ ]` row (or user-named screen)
3. Mark `[~]`, implement against tokens, open PR → merge when ready
4. Mark `[x]`, move to next

## Out of scope for this env

- Backend/API refactors unless required for that screen
- Docs-only / ops deploys
- Blind whole-app restyles in one PR
