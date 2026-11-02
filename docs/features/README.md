# UniZ feature guide

UniZ is the campus portal for RGUKT Ongole: the exam-cell app in `apps/uniz-portal` and the public college site in `apps/uniz-landing`.

These pages were written from a local run with fictional seed data. Playwright drove Chromium at 1440×900 and 390×844. Production credentials and real student records were not used.

Outpass and outing stay parked. Their routes were not enabled for this guide. See [Outpass (parked)](outpass.md).

## Local accounts

Password for every account: `password123`.

| Account | Role | What the capture used it for |
| --- | --- | --- |
| `D210001` | student | Asha Demo. Grades, attendance, fees, library, placement, alumni, feedback. |
| `D210002` | student | Nila Demo. Empty academic and fee records. |
| `faculty_cse` | faculty | Dr Meera Demo. Leave, exam duty, profile. |
| `hod_cse` | hod | CSE head. Student list and semester approvals. |
| `dean` | dean | Dean shell. |
| `director` | director | Director shell. |
| `webadmin` | webadmin | Widest admin shell. |
| `coe` | coe | Same shell as webadmin. |
| `swo_office` | swo | Welfare shell. Grievances stay. Outpass tabs do not. |
| `warden_male`, `warden_female` | warden | Hostel overview only. |
| `caretaker_male`, `caretaker_female` | caretaker | Hostel overview only. |
| `security` | security | Gate terminal. Outpass toast. |
| `librarian` | librarian | Library desk. |
| `ao` | ao | Rejected at sign-in. Not in the portal’s allowed admin roles. |

Seed: `scripts/local/seed-local.ts` and `scripts/local/seed-feature-fixtures.sql`.

## How to read a module page

Each module page states what the running UI does, then numbers every screenshot taken for it. Desktop and mobile are both included.

Several admin nav items do not open their panels. `useAdminSectionRoute` only knows the paths in `apps/uniz-portal/src/utils/adminSectionRoutes.ts`. Exam duties, course feedback, fees, library, placements, alumni, the information centre, and leave approvals are rendered in the dashboard switch, but their tab ids are missing from that map, so a click navigates to `/admin` and the overview stays. The screenshots show that result. Student pages and the librarian desk are not affected.

## Modules

| Guide | What it covers |
| --- | --- |
| [Authentication](auth.md) | Sign-in, validation, wrong password, security terminal, 404 |
| [Profile](profile.md) | Student, faculty, and admin profiles, password, grievance, help |
| [Attendance](attendance.md) | Student ledger and staff upload |
| [Grades and registration](grades.md) | Results, registration, subject and semester tools |
| [Fees](fees.md) | Invoices. Online payment is coming soon |
| [Leave](leave.md) | Faculty leave. Admin approval tab does not open |
| [Exam duties](exam-duties.md) | Faculty duty list. Admin tab does not open |
| [Feedback](feedback.md) | Open form. Giving feedback crashes on object questions |
| [Library](library.md) | Student loans and the librarian desk |
| [Placement](placement.md) | Student drives |
| [Alumni](alumni.md) | Claim, jobs, directory |
| [Information centre](information-centre.md) | Notices and the pinned calendar note |
| [Clubs and consultancy](clubs-and-consultancy.md) | No screen. Flag only, and consultancy is not a flag |
| [Admissions](admissions.md) | No workflow. One seeded notice |
| [Establishment](establishment.md) | No screen. `ao` cannot sign in |
| [Notifications](notifications.md) | Inbox, campus banners, push, landing news |
| [Landing site](landing.md) | Public RGUKT Ongole site |
| [Outpass (parked)](outpass.md) | Routes left unmounted on purpose |
