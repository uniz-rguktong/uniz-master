#!/usr/bin/env python3
"""Build UniZ-UI-Guidance.md and UniZ-UI-Guidance.docx from structured content.

Read-only with respect to apps/uniz-portal — this script only writes under docs/guides/.
"""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

OUT_DIR = Path(__file__).resolve().parent
MD_PATH = OUT_DIR / "UniZ-UI-Guidance.md"
DOCX_PATH = OUT_DIR / "UniZ-UI-Guidance.docx"

TECH_DOCS = "https://api-uniz.rguktong.in/docs"
ACTION_FLOWS = "https://api-uniz.rguktong.in/docs/system/action-flows"
PORTAL = "https://uniz.rguktong.in"


def md_escape(text: str) -> str:
    return text.replace("|", "\\|")


# ---------------------------------------------------------------------------
# Structured content (inventory from portal routes + uniz-docs; no secrets)
# ---------------------------------------------------------------------------

SECTIONS: list[dict] = []


def add_section(title: str, body_md: str, level: int = 1) -> None:
    SECTIONS.append({"title": title, "body": body_md.strip(), "level": level})


add_section(
    "About this guide",
    f"""
This document is a UI walkthrough for UniZ campus users, trainers, and anyone learning the portal screens.

- **Product:** UniZ portal at {PORTAL}
- **Audience:** students, faculty, and administrative staff (all roles)
- **Purpose:** describe every major feature and every UI action a user can take, organized by role
- **Not covered here:** APIs, architecture, deployment, and internal service wiring

For technical detail, always use the live documentation:

- Docs home: {TECH_DOCS}
- Action flows (UI → gateway → service): {ACTION_FLOWS}

### Credentials policy

This guide does not include passwords, tokens, or production credentials. Features were inventoried from the portal route map, role sidebars, and the public role guides in `apps/uniz-docs`. Screens and actions may vary with your assigned role and with feature flags. If something is missing from your view, that is usually a permission or flag difference, not a broken install.

### Production notes that affect the UI

- **Outpass and outing** flows are feature-flagged off by default in production (`VITE_ENABLE_OUTPASS_OUTING`). Related student nav items and admin approval queues are hidden unless the flag is enabled. See {TECH_DOCS}/students/outpass and {TECH_DOCS}/howto/revive-outpass.
- **Maintenance mode** can show an “Under maintenance” interstitial for non-admin visitors when enabled.
- **UI may vary with permissions.** Role shells hide tabs your account cannot use.
""",
)

add_section(
    "How to use this document",
    f"""
1. Find your role section (student, faculty, or the matching admin role).
2. Use the navigation path listed for each feature.
3. Follow the action tables: control → expected outcome.
4. For deep technical behaviour, open the linked docs page under {TECH_DOCS}.

Shared chrome (logo, logout, privacy links, notifications) is described once and applies across signed-in surfaces unless a role shell says otherwise.
""",
)

add_section(
    "Roles at a glance",
    f"""
| Role | Who it is for | Portal entry | Primary UI focus |
| --- | --- | --- | --- |
| Public visitor | Anyone | `/` | Home, privacy, developers, PWA install, SEO pages |
| Student | Enrolled RGUKT students | `/student/signin` → `/student` | Profile, registration, grades, attendance, grievance, help |
| Faculty | Teaching staff | Admin/faculty sign-in → `/faculty` | Overview, profile, branch students, password |
| Webadmin / COE | Platform administrators | `/admin/signin` → `/admin` | Students, academics, semester builder, campus CMS, push, security |
| Director | Institution director | `/admin` | Same academic/CMS breadth as webadmin (no semester-approvals tab) |
| Dean | Dean of academics | `/admin` | Full academic/CMS + semester approvals |
| HOD | Head of department | `/admin` | Department students + semester approvals |
| SWO / DSW | Student welfare | `/admin` | Grievances (outing/outpass when flagged on) |
| Caretaker (M/F) | Hostel caretakers | `/admin` | Status update; outing/outpass approvals when flagged on |
| Warden (M/F) | Hostel wardens | `/admin` | Outing/outpass approvals when flagged on |
| Security | Gate staff | `/admin` or `/admin/security` | Gate scan, log entry/exit, search directory |

Role definitions and capability summaries: {TECH_DOCS}/roles
""",
)

add_section(
    "Shared chrome",
    f"""
### Public footer and legal links

On the home page and related public pages you typically find:

| Control | Where | Outcome |
| --- | --- | --- |
| Privacy | Footer link `/privacy` | Opens privacy policy |
| Developers | Footer link `/developers` | Opens developers / team page |
| Copyright line | Footer | Institutional notice only |

Signed-in layouts may also expose privacy via site legal footer components where present.

### PWA install

UniZ can be installed as a progressive web app.

| Control | Where | Outcome |
| --- | --- | --- |
| Download / Install | Home (`/`) when not already installed | Triggers browser install prompt; on iOS shows Add to Home Screen instructions |
| Install banner | Global `InstallPWA` overlay (mobile / after sign-in) | Install or dismiss; auto-hides after a short delay |
| Dismiss (X) | Install banner | Hides the banner for the session |

### Notifications chrome

| Control | Where | Outcome |
| --- | --- | --- |
| Notification bell | Student shell header | Opens notification panel / centre |
| Notification deep link | `/notifications` | Routes into the notification experience when authenticated |
| Student notifications page | `/student/notifications` | Full inbox list |
| Admin notifications page | `/admin/notifications` | Admin notification surface |

Technical inbox behaviour: {TECH_DOCS}/api/comms/notifications and {ACTION_FLOWS}

### Logout

| Control | Where | Outcome |
| --- | --- | --- |
| Logout / Sign out | Student dock or overflow; admin shell; faculty sidebar | Clears session tokens and returns to public home / sign-in |
| Confirm logout | Student confirm modal | Completes logout only after confirmation |

### Auth redirect behaviour

If you already have a valid student, faculty, or admin session and open `/`, the portal redirects you to the matching dashboard (`/student`, `/faculty`, or `/admin`) instead of the marketing home.

### 404 and maintenance

| Screen | Path / trigger | Actions |
| --- | --- | --- |
| 404 | Unknown route | Go back; Return home |
| Under maintenance | Maintenance flag for non-admin visitors | Go back |
""",
)

add_section(
    "Public and marketing surfaces",
    f"""
Base URL: {PORTAL}

### Home (`/`)

What it is: branded entry to UniZ with campus label, product name, short tagline, and primary CTAs.

| Control | Outcome |
| --- | --- |
| Get started | Navigates to `/student/signin` |
| Download | Starts PWA install (or iOS instructions) |
| Privacy | Opens `/privacy` |
| Developers | Opens `/developers` |
| Hidden admin gesture | Typing the letters `admin` on the keyboard navigates to `/admin/signin` (undocumented convenience; not for students) |

### Privacy (`/privacy`)

Read-only policy sections such as overview, information collected, how information is used, push notifications, sharing, security and retention, your choices, and contact. Navigation is typically via section headings and the back/home links on the page chrome.

### Developers (`/developers`)

Shows the student development team and open-source contribution framing.

| Control | Outcome |
| --- | --- |
| Back to home | Returns to `/` |
| Contribution / globe section | Informational; may link outward to project presence |

### SEO / marketing routes

These routes render the SEO landing template and are public discovery pages, not signed-in tools:

- `/student-project-management`
- `/college-team-collaboration`
- `/academic-task-tracker`
- `/blog/*`

Primary CTA on these pages typically directs visitors toward signing in or learning more about UniZ.

### Cloudflare security check

On production you may briefly see a Cloudflare “Performing security verification” interstitial before the portal loads. Wait for it to finish; no UniZ credentials are entered on that screen.
""",
)

add_section(
    "Authentication",
    f"""
Technical reference: {TECH_DOCS}/students/login · {TECH_DOCS}/api/auth/login · {ACTION_FLOWS}

### Student sign-in (`/student/signin`)

Also reached from `/login` and `/signin` (both redirect here).

| Control / field | Outcome |
| --- | --- |
| Username | Roll number (for example `O210008`) |
| Password | Current password |
| Show/hide password | Toggles password visibility |
| Sign in / submit | On success, stores student session and opens `/student` |
| Forgot password | Switches to OTP reset flow |
| Back to sign-in | Returns from forgot/OTP steps |

#### Forgot password (OTP)

| Step | Control | Outcome |
| --- | --- | --- |
| Request code | Enter username → Send / request OTP | Code queued to registered email or push when available |
| Verify | Enter 6-digit OTP → Verify | Unlocks password reset step |
| Resend via email | Optional resend control | Requests email delivery if push path unavailable |
| Set new password | New password + confirm → Update | Password updated; return to sign-in |

### Admin / staff sign-in (`/admin/signin`)

Same sign-in component with admin type. Faculty commonly enter here as well; the role in the login response determines whether you land in `/admin` or `/faculty`.

| Control | Outcome |
| --- | --- |
| Username / password | Staff credentials issued by administration |
| Sign in | On success, routes by role to the matching admin shell or faculty dashboard |
| Forgot password | Same OTP reset pattern as student sign-in |

Admin overview: {TECH_DOCS}/admin/overview

### Faculty session note

Faculty use staff credentials. After sign-in, faculty land on `/faculty`. Some faculty-token holders who are HODs are resolved into the HOD admin shell instead when their username/role pattern indicates HOD.
""",
)

add_section(
    "Student portal",
    f"""
Entry after sign-in: `/student` (My Profile / dashboard).

Student shell navigation (desktop dock and mobile menu) includes:

| Nav label | Path | Notes |
| --- | --- | --- |
| My Profile | `/student` | Default home |
| Registration | `/student/registration` | Course registration / current subjects |
| Results | `/student/gradehub` | Grades / GradeHub |
| Attendance | `/student/attendance` | Attendance view |
| Password | `/student/resetpassword` | Logged-in password change |
| Grievance | `/student/grievance` | Submit grievance |
| Help & Support | `/student/help` | FAQ and contact |
| Outing / Outpass | `/student/outing`, `/student/outpass` | Only when outpass/outing flag is on |
| Notifications | `/student/notifications` | Inbox |
| Logout | Confirm modal | Ends session |

Also present in the shell: notification bell; pull-to-refresh on mobile; optional notice banner that can be dismissed.

Guides: {TECH_DOCS}/students/profile · {TECH_DOCS}/students/academics · {TECH_DOCS}/students/outpass
""",
    level=1,
)

add_section(
    "Student — profile and dashboard",
    f"""
**Path:** `/student`

What it is: central student record with personal, academic, family, seating, and (when enabled) permissions content, plus campus notices.

### Profile header actions

| Control | Outcome |
| --- | --- |
| Edit profile | Enters edit mode for allowed fields |
| Cancel | Discards unsaved edits |
| Save / Save changes | Submits only changed fields |
| Camera / change photo | Opens file picker; uploads new profile photo |
| Seating shortcut (when shown) | Switches to seating tab |

### Profile tabs

| Tab | What you see / can do |
| --- | --- |
| Personal | Name, contact, address, blood group, DOB, gender; campus presence indicators; seating summary widget when available; notices above |
| Academic | Academic overview and academic record (grades context) |
| Family | Parent/guardian names, occupations, phones (editable when in edit mode) |
| Seating | Exam seating arrangement view |
| Permissions | Outpass/outing request history and request forms when the feature flag is on |

Editable by student (typical): phone, address, blood group, date of birth, gender, family contact fields. Not editable: roll number, year, branch, section, room, and other admin-owned academic fields.

### Notices

The notice board on the dashboard lists campus notices. Selecting a notice opens its content. Publishing and CMS of notices is an admin action (see Campus CMS sections).

### Analytics

Student analytics UI may appear integrated into the personal view depending on build configuration. Treat it as read-only insight into academic progress when visible.

Technical profile flows: {ACTION_FLOWS} (Student → Profile bootstrap / update / photo)
""",
    level=2,
)

add_section(
    "Student — registration",
    f"""
**Path:** `/student/registration`

What it is: current-semester subject list and, when registration is open, elective selection and submission.

| Control | Outcome |
| --- | --- |
| Subjects tab | Lists registered / current semester subjects |
| Register tab | Shown only when registration is open and you are not already registered |
| Select elective option | Toggles elective within group limits (mandatory subjects are pre-selected) |
| Confirm / Register subjects | Submits selection; locks further re-registration (duplicate submit returns conflict) |
| Download PDF | Downloads registration confirmation PDF when available |
| Done / complete | Returns to the subjects view after successful registration |

Window rules: registration only works when the semester status is open and the current time (Asia/Kolkata) is inside the configured start/end window.

Docs: {TECH_DOCS}/admin/semester-registration · {TECH_DOCS}/api/academics/registration
""",
    level=2,
)

add_section(
    "Student — current semester",
    """
**Path:** `/student/current-semester`

What it is: dedicated current-semester academic view (subjects/status for the active semester). Use it when you need semester context outside the registration page. Actions are primarily read-only browsing unless registration controls are surfaced through linked components.
""",
    level=2,
)

add_section(
    "Student — results (GradeHub)",
    f"""
**Path:** `/student/gradehub`

What it is: published grade results by semester/subject.

| Control | Outcome |
| --- | --- |
| Semester / filter controls | Narrow which results are shown |
| Subject rows | Display code, name, credits, grade |
| Download / export controls (when present) | Save a local copy of results |

Blank grades usually mean results are not published yet. Letter grades follow the institutional scale (EX, A, B, C, D, F, AB, and related values).

Docs: {TECH_DOCS}/students/academics · {TECH_DOCS}/api/academics/grades
""",
    level=2,
)

add_section(
    "Student — attendance",
    f"""
**Path:** `/student/attendance`

What it is: per-subject attendance with attended vs total classes and percentage.

| Control | Outcome |
| --- | --- |
| Subject list / filters | Browse attendance records |
| Detail rows | Show attended, total, and percentage |

Minimum attendance rules are institutional policy; contact faculty if you are near the threshold.

Docs: {TECH_DOCS}/students/academics · {TECH_DOCS}/api/academics/attendance
""",
    level=2,
)

add_section(
    "Student — password (signed in)",
    f"""
**Path:** `/student/resetpassword`

| Control | Outcome |
| --- | --- |
| Current password | Verifies identity |
| New password / confirm | Must meet strength rules |
| Update password | On success, signs you out so you can sign in with the new password |

Forgot-password from the sign-in page is a separate OTP flow (see Authentication).
""",
    level=2,
)

add_section(
    "Student — grievance",
    f"""
**Path:** `/student/grievance`

| Control | Outcome |
| --- | --- |
| Category | Selects grievance type |
| Description | Free-text details |
| Submit anonymously | When checked, identity is protected in staff views |
| Submit | Creates grievance for SWO / welfare handling |

Docs: {ACTION_FLOWS} (SWO / Grievance) · {TECH_DOCS}/api/requests/grievances
""",
    level=2,
)

add_section(
    "Student — help and support",
    """
**Path:** `/student/help`

| Control | Outcome |
| --- | --- |
| FAQ tab | Expand/collapse common questions (profile edits, PWA install, academics, etc.) |
| Contact tab | Shows support contact guidance |
""",
    level=2,
)

add_section(
    "Student — notifications",
    f"""
**Path:** `/student/notifications` (and header bell / `/notifications` deep link)

| Control | Outcome |
| --- | --- |
| Open notification | Shows message detail / routes to related content when applicable |
| Mark read / dismiss patterns | Clear unread state (exact controls depend on panel version) |

Docs: {TECH_DOCS}/api/comms/notifications
""",
    level=2,
)

add_section(
    "Student — outpass and outing (when enabled)",
    f"""
**Paths:** `/student/outpass`, `/student/outing`, request subflows; also Permissions tab on profile.

**Production default:** hidden. When the feature flag is on:

| Control | Outcome |
| --- | --- |
| Request outpass | Opens multi-day leave form (reason, from/to dates) |
| Request outing | Opens same-day leave form (reason, from/to times) |
| Submit | Creates request at caretaker level (outpass chain) |
| History list | Shows pending / approved / rejected status |

Only one pending request at a time is allowed.

Approval chain (outpass): Student → Caretaker → Warden → SWO → Dean/Director (final).

Docs: {TECH_DOCS}/students/outpass · {TECH_DOCS}/admin/approvals · {ACTION_FLOWS}
""",
    level=2,
)

add_section(
    "Admin portal — common shell",
    f"""
**Entry:** `/admin/signin` → `/admin` (role-specific dashboard). Admin section URLs commonly look like `/admin/<section>` via the admin section route hook.

### Shared AdminShell controls

| Control | Outcome |
| --- | --- |
| Sidebar nav items | Switch active section/tab |
| Collapse / expand sidebar | More content width |
| Nav search (when enabled) | Filters sidebar items |
| Avatar / profile | Opens profile popup (photo, name, email) |
| Logout | Ends admin session |
| Mobile menu | Same nav on small screens |

### Legacy / direct admin routes still mapped

These paths exist alongside the role shells (access still depends on role):

| Path | Purpose |
| --- | --- |
| `/admin/addstudents` | Add / import students |
| `/admin/addgrades` | Grades upload page |
| `/admin/addattendance` | Attendance upload page |
| `/admin/current-semester` | Current semester admin |
| `/admin/settings` | Settings |
| `/admin/profile` | Admin profile |
| `/admin/curriculum` | Curriculum / subjects |
| `/admin/roles` | Role management |
| `/admin/banners` | Banner manager |
| `/admin/updatestudentstatus` | Student status update |
| `/admin/searchstudents` | Student search |
| `/admin/security` | Security portal |
| `/admin/addfaculty` | Add faculty |
| `/admin/notifications` | Admin notifications |

Overview: {TECH_DOCS}/admin/overview
""",
)

add_section(
    "Webadmin and COE",
    f"""
**Shell:** Webmaster dashboard (roles `webadmin`, `coe`).

### Navigation groups and sections

| Group | Section | What you do |
| --- | --- | --- |
| — | Overview | Dashboard KPIs / welcome |
| Students | Student Details | Search, view, edit, add, delete, performance, password reset for students |
| Students | Student Bulk Ops | Bulk CSV upload and cohort actions |
| Academic | Attendance Upload | Download template, upload attendance sheet, monitor progress |
| Academic | Grades Upload | Download template, upload grades, monitor progress |
| Academic | Manage Subjects | Curriculum / subject CRUD |
| Academic | Semester Registration | Semester builder, windows, tracking, publish |
| Campus | Home Banners | Create/edit/hide spotlight banners |
| Campus | Campus Updates | Create/edit campus updates |
| Campus | Website Updates | Live-edit landing CMS content |
| Campus | Push Alerts | View subscriptions; send broadcast |
| Management | Faculty Management | Add/edit/delete faculty; download template |
| Management | System & Logs | Operational logs / health oriented views |
| Management | Security | Change own admin password |

If role is SWO and somehow using overlapping tabs, welfare placeholders for grievances/outpass/outings may show “coming soon” in this shell — SWO’s primary working UI is the SWO dashboard described later.

Docs: {TECH_DOCS}/admin/academics · {TECH_DOCS}/admin/semester-registration · {ACTION_FLOWS}
""",
    level=2,
)

add_section(
    "Webadmin — student details and bulk ops",
    """
### Student Details

| Control | Outcome |
| --- | --- |
| Search / filters | Narrow student list |
| Add student | Creates a student record |
| Inline edit cells (name, email, etc.) | Saves on blur when permitted |
| Open / view student | Student dashboard / detail drawer |
| Edit details modal | Full profile edit |
| Performance | Opens academic performance modal |
| Reset password | Admin-initiated password reset for that student |
| Delete student | Requires typed confirmation |
| Bulk delete | Deletes selected students after confirmation |

### Student Bulk Ops

| Control | Outcome |
| --- | --- |
| Download / prepare CSV | Template for import |
| Bulk upload | Queues import job; progress polling |
| Cohort actions | Apply a bulk action to a filtered cohort |

UI may vary with permissions for destructive actions.
""",
    level=2,
)

add_section(
    "Webadmin — academics uploads and subjects",
    f"""
### Attendance / Grades upload

| Control | Outcome |
| --- | --- |
| Download template | Excel template for branch/year/semester/subject |
| Choose file / upload | Starts processing job |
| Progress indicator | Shows batch progress |
| Errors / summary | Lists failures for correction |

### Manage subjects / curriculum

| Control | Outcome |
| --- | --- |
| Search subjects | Filter catalog |
| Add subject | Creates subject |
| Edit | Updates subject metadata |
| Delete | Removes subject (with confirmation) |

Docs: {TECH_DOCS}/admin/academics · {TECH_DOCS}/faculty/grades · {TECH_DOCS}/faculty/attendance
""",
    level=2,
)

add_section(
    "Webadmin — semester registration builder",
    f"""
**Nav:** Semester Registration

| Control | Outcome |
| --- | --- |
| Create semester | Opens multi-step builder |
| Save draft | Keeps semester editable as DRAFT |
| Submit for review | Sends to dean review and locks casual edits |
| Add / assign subjects | Builds branch allocations |
| Add elective group | Defines group with selection limit |
| Set registration opens/closes | IST window for students |
| Open registration / advance status | Moves lifecycle toward REGISTRATION_OPEN |
| Close registration / semester | Closes window |
| Publish to students (OTP modal) | Requests email OTP, then publishes/opens after code entry |
| Registration tracking | Per-student pending/registered lists with search |
| Bulk PDF download | Queues and downloads registration PDFs |
| Seating upload (related tools) | Template download + seating Excel upload |

Lifecycle (simplified): DRAFT → DEAN_REVIEW → HOD_REVIEW → APPROVED → REGISTRATION_OPEN → REGISTRATION_CLOSED.

Docs: {TECH_DOCS}/admin/semester-registration · {ACTION_FLOWS}
""",
    level=2,
)

add_section(
    "Webadmin — campus CMS and push",
    """
### Home banners

| Control | Outcome |
| --- | --- |
| Add banner | Opens create modal |
| Upload image | Attaches banner artwork |
| Save | Creates or updates banner |
| Active / Hidden | Visibility toggle |
| Edit / delete | Maintain existing banners |

### Campus updates

| Control | Outcome |
| --- | --- |
| Create update | Opens editor |
| Edit / delete | Maintain posts shown to students |

### Website updates

| Control | Outcome |
| --- | --- |
| Page search / sidebar | Select landing page content to edit |
| Live editor fields | Change copy/images |
| Upload image | Adds media |
| Publish / save | Pushes CMS changes to the public landing site |

### Push alerts

| Control | Outcome |
| --- | --- |
| Browse subscriptions | Lists device subscriptions |
| Send broadcast | Opens modal (target, title, body, optional image) |
| Submit broadcast | Queues push to selected audience |
""",
    level=2,
)

add_section(
    "Webadmin — faculty, logs, and security",
    """
### Faculty management

| Control | Outcome |
| --- | --- |
| Search | Filter staff |
| Add faculty | Create staff account |
| Download template | Bulk template |
| Edit / delete | Maintain records |

### System and logs

Read-oriented operational views for diagnosing platform activity. Prefer health endpoints and runbooks in live docs for incident response.

### Security (password)

| Control | Outcome |
| --- | --- |
| Current password | Verifies identity |
| New password / confirm | Must meet length, number, and symbol rules |
| Update | Changes admin password |
""",
    level=2,
)

add_section(
    "Director",
    f"""
**Shell:** Director dashboard — nearly the same breadth as webadmin/COE for students, academics, campus CMS, faculty, logs, and security.

Notable difference vs dean: **no Semester Approvals tab** in the director shell inventory (final institutional authority still appears in approval chains when outpass is enabled).

Nav groups mirror webadmin: Overview; Student Details; Student Bulk Ops; Attendance/Grades upload; Manage Subjects; Semester Registration; Banners; Campus Updates; Website Updates; Push Alerts; Faculty Management; System & Logs; Security.

Docs: {TECH_DOCS}/admin/overview · {TECH_DOCS}/admin/academics
""",
)

add_section(
    "Dean",
    f"""
**Shell:** Dean dashboard.

Includes webadmin-like academic and CMS tabs **plus** Semester Approvals.

### Semester Approvals (dean)

| Control | Outcome |
| --- | --- |
| Branch filter | Review allocations across departments |
| Inspect subjects / electives / dates | Validate semester package |
| Approve → HODs | Advances DEAN_REVIEW toward HOD_REVIEW |
| Registration tracking embed | Monitor enrollment progress |

Docs: {TECH_DOCS}/admin/semester-registration · {ACTION_FLOWS}
""",
)

add_section(
    "HOD",
    f"""
**Shell:** Slim dean shell for role `hod`.

| Nav | Purpose |
| --- | --- |
| Overview | Dashboard |
| Student Details | Department-scoped student list (read-focused) |
| Semester Approvals | Approve own branch electives/allocations at HOD_REVIEW |

### Semester Approvals (HOD)

| Control | Outcome |
| --- | --- |
| Review pending package for own branch | Validates department electives/credits |
| Approve (own branch) | Advances HOD review for that branch |

Faculty accounts whose username looks like `hod_cse` may be resolved into this admin HOD experience.

Docs: {TECH_DOCS}/admin/semester-registration · {TECH_DOCS}/roles
""",
)

add_section(
    "SWO / DSW",
    f"""
**Shell:** SWO dashboard.

| Nav | Purpose |
| --- | --- |
| Overview | Dashboard |
| Grievances | Queue of student grievances |
| Security | Own password change |
| Outing / Outpass | Only when outpass/outing flag is on |

### Grievances

| Control | Outcome |
| --- | --- |
| Search / category filter | Narrow list |
| Refresh | Reload queue |
| Resolve | Marks resolved; verified students may get email update |
| Delete / delete all | Removes records after confirmation |

### Outing / outpass request management (when enabled)

| Control | Outcome |
| --- | --- |
| Search | Filter requests |
| Approve | Advances or completes approval per chain rules |
| Reject | Prompts for reason; stops chain |
| Forward | Sends to next level without approving |

Docs: {TECH_DOCS}/admin/approvals · {ACTION_FLOWS}
""",
)

add_section(
    "Caretaker",
    f"""
**Shell:** Caretaker dashboard (`caretaker_male` / `caretaker_female`). Labelled M-Caretaker or F-Caretaker portal.

| Nav | Purpose |
| --- | --- |
| Overview | Hostel-oriented KPIs / hub cards |
| Approve Outings / Outpasses | Visible only when feature flag is on |
| Status Update | Update student residential / presence-related status |

### Approvals (when enabled)

Same approve / reject / forward / search pattern as SWO, scoped to caretaker level in the chain.

### Status update

| Control | Outcome |
| --- | --- |
| Find student | Locate record |
| Update status | Applies status change |

Docs: {TECH_DOCS}/admin/approvals
""",
)

add_section(
    "Warden",
    f"""
**Shell:** Warden dashboard (`warden_male` / `warden_female` / `warden`). Labelled M-Warden or F-Warden portal.

| Nav | Purpose |
| --- | --- |
| Overview | Residential KPIs / hub |
| Approve Outings / Outpasses | When feature flag is on |

Actions match the shared approval component: search, approve, reject (with reason), forward. Operates at warden level in the chain.

Docs: {TECH_DOCS}/admin/approvals
""",
)

add_section(
    "Security",
    f"""
**Shell:** Security Portal (`/admin` for security role, also `/admin/security`).

| Nav | Purpose |
| --- | --- |
| Overview / terminal | Gate metrics and scan box |
| Search directory | Student search UI |
| (Other tabs as labelled in shell) | Supporting gate operations |

### Gate terminal actions

| Control | Outcome |
| --- | --- |
| Scan / enter university ID | Searches student |
| Initialize scan | Runs lookup |
| Log Exit | Check-out / leave campus |
| Log Entry | Check-in / return to campus |

### Metrics shown

Students outside; today’s check-ins; today’s check-outs; sync status.

Docs: {TECH_DOCS}/admin/security · {ACTION_FLOWS}
""",
)

add_section(
    "Faculty portal",
    f"""
**Path:** `/faculty`

### Sidebar

| Nav | Purpose |
| --- | --- |
| Overview | Welcome cards and shortcuts into other tabs |
| My Profile | View/edit faculty profile fields |
| Branch Students | Search/filter students in department |
| Change Password | OTP / password update flow for faculty |
| Sign out | Ends session |

### Overview

| Control | Outcome |
| --- | --- |
| Shortcut cards / chevrons | Jump to profile, students, or password |

### My Profile

| Control | Outcome |
| --- | --- |
| Edit / pencil | Enable field edits |
| Save | Persist profile changes |
| Cancel | Discard edits |

Typical fields: name, email, department, designation, contact, bio sections, photo when supported.

### Branch Students

| Control | Outcome |
| --- | --- |
| Search | Filter by id/name |
| Filters | Narrow by year/branch attributes |
| Open student | View student record (read-oriented for standard faculty; HOD may have broader admin tools via HOD shell) |

### Change Password

| Control | Outcome |
| --- | --- |
| Request OTP / verify / set password | Completes faculty password change with strength meter |

Grade and attendance **upload** for many institutions is performed from admin academic upload pages (`/admin/addgrades`, `/admin/addattendance`, or webadmin upload tabs) rather than from the faculty sidebar. Faculty docs for upload workflows: {TECH_DOCS}/faculty/grades · {TECH_DOCS}/faculty/attendance
""",
)

add_section(
    "Cross-role workflows",
    f"""
### Semester registration (end-to-end)

1. Webadmin creates semester (draft) and subject/elective package.
2. Dean reviews and approves → HODs.
3. HOD approves department electives.
4. Webadmin sets IST window and opens registration (OTP publish when required).
5. Students register mandatory + electives and download PDF.
6. Staff track completion; close registration; optional seating upload.

Detail: {TECH_DOCS}/admin/semester-registration · {ACTION_FLOWS}

### Outpass (when enabled)

1. Student submits from Permissions / Outpass.
2. Caretaker → Warden → SWO → Dean/Director.
3. Security verifies approved pass at gate (log exit/entry).

Detail: {TECH_DOCS}/admin/approvals · {TECH_DOCS}/admin/security

### Grievance

1. Student submits (optionally anonymous).
2. SWO reviews, resolves, or deletes.
3. Verified students may receive email on resolve.

Detail: {ACTION_FLOWS}
""",
)

add_section(
    "Route map appendix",
    """
### Public

| Route | Surface |
| --- | --- |
| `/` | Home |
| `/privacy` | Privacy |
| `/developers` | Developers |
| `/notifications` | Notification deep link |
| `/student-project-management` | SEO landing |
| `/college-team-collaboration` | SEO landing |
| `/academic-task-tracker` | SEO landing |
| `/blog/*` | SEO landing |

### Auth

| Route | Surface |
| --- | --- |
| `/login`, `/signin` | Redirect to student sign-in |
| `/student/signin` | Student auth |
| `/admin/signin` | Admin/staff auth |

### Student

| Route | Surface |
| --- | --- |
| `/student` | Profile dashboard |
| `/student/registration` | Registration |
| `/student/current-semester` | Current semester |
| `/student/gradehub` | Results |
| `/student/attendance` | Attendance |
| `/student/resetpassword` | Password |
| `/student/grievance` | Grievance |
| `/student/help` | Help |
| `/student/notifications` | Notifications |
| `/student/outing`, `/student/outpass` (+ request paths) | Flagged off by default |

### Admin and faculty

| Route | Surface |
| --- | --- |
| `/admin` and `/admin/*` | Role shell catch-all |
| `/admin/security` | Security portal |
| `/admin/addstudents`, `/admin/addfaculty`, `/admin/addgrades`, `/admin/addattendance` | Legacy academic/people pages |
| `/admin/curriculum`, `/admin/banners`, `/admin/roles`, `/admin/settings`, `/admin/profile` | Management pages |
| `/admin/searchstudents`, `/admin/updatestudentstatus`, `/admin/current-semester`, `/admin/notifications` | Supporting admin tools |
| `/faculty` | Faculty dashboard |

### Catch-all

| Route | Surface |
| --- | --- |
| `*` | 404 |
""",
)

add_section(
    "Gaps and screenshot notes",
    """
- Production public-page screenshots were attempted against uniz.rguktong.in but headless capture stopped on Cloudflare security verification, so no live UI screenshots are embedded.
- Authenticated student/admin/faculty screens were not captured: this guide intentionally uses no production credentials.
- Outpass/outing UI is documented from code and docs but is off in default production builds.
- Some admin sections show “coming soon” placeholders (for example certain SWO welfare tabs inside the webadmin shell). Prefer the dedicated SWO dashboard for grievances.
- Exact button labels can differ slightly between desktop and mobile shells; behaviour matches the tables above.
- For the latest behaviour, trust the live portal plus {TECH_DOCS} over any printed copy of this file.
""".replace(
        "{TECH_DOCS}", TECH_DOCS
    ),
)


def sections_to_markdown() -> str:
    lines: list[str] = [
        "# UniZ UI guidance",
        "",
        f"Portal: {PORTAL}  ",
        f"Technical docs: {TECH_DOCS}  ",
        f"Action flows: {ACTION_FLOWS}",
        "",
        "Audience: campus users, trainers, UI walkthrough readers.  ",
        "Tone: plain institutional guidance. No production secrets.",
        "",
        "## Table of contents",
        "",
    ]
    for sec in SECTIONS:
        indent = "  " * (sec["level"] - 1)
        anchor = sec["title"].lower().replace(" ", "-").replace(",", "").replace("/", "")
        lines.append(f"{indent}- [{sec['title']}](#{anchor})")
    lines.append("")
    for sec in SECTIONS:
        hashes = "#" * (sec["level"] + 1)
        lines.append(f"{hashes} {sec['title']}")
        lines.append("")
        lines.append(sec["body"])
        lines.append("")
    return "\n".join(lines) + "\n"


def set_run_font(run, size_pt: float | None = None, bold: bool | None = None, color=None):
    run.font.name = "Calibri"
    r = run._element
    rPr = r.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), "Calibri")
    rFonts.set(qn("w:hAnsi"), "Calibri")
    if size_pt is not None:
        run.font.size = Pt(size_pt)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = color


def add_heading(doc: Document, text: str, level: int) -> None:
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        set_run_font(run, size_pt={1: 18, 2: 14, 3: 12}.get(level, 12), bold=True)


def add_paragraph(doc: Document, text: str, *, bold: bool = False, italic: bool = False) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, size_pt=11, bold=bold)
    run.italic = italic
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE


def add_bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        run = p.add_run(item)
        set_run_font(run, size_pt=11)


def parse_table(block: str) -> tuple[list[str], list[list[str]]] | None:
    lines = [ln.strip() for ln in block.strip().splitlines() if ln.strip()]
    if len(lines) < 2 or "|" not in lines[0]:
        return None
    def split_row(ln: str) -> list[str]:
        parts = [c.strip() for c in ln.strip("|").split("|")]
        return parts
    header = split_row(lines[0])
    # skip separator
    rows = []
    for ln in lines[2:]:
        if set(ln.replace("|", "").replace("-", "").replace(":", "").strip()) == set():
            continue
        rows.append(split_row(ln))
    return header, rows


def add_table(doc: Document, header: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(header))
    table.style = "Table Grid"
    for i, h in enumerate(header):
        cell = table.rows[0].cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(h)
        set_run_font(run, size_pt=10, bold=True)
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            if c_idx >= len(header):
                break
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = ""
            run = cell.paragraphs[0].add_run(val)
            set_run_font(run, size_pt=10)
    doc.add_paragraph()


def render_body(doc: Document, body: str) -> None:
    blocks = body.split("\n\n")
    for block in blocks:
        raw = block.strip()
        if not raw:
            continue
        if raw.startswith("|") and "\n" in raw:
            parsed = parse_table(raw)
            if parsed:
                add_table(doc, parsed[0], parsed[1])
                continue
        lines = raw.splitlines()
        if all(ln.strip().startswith(("- ", "* ")) or not ln.strip() for ln in lines):
            add_bullets(
                doc,
                [ln.strip()[2:].strip() for ln in lines if ln.strip().startswith(("- ", "* "))],
            )
            continue
        if len(lines) >= 1 and lines[0].startswith("### "):
            add_heading(doc, lines[0][4:].strip(), level=3)
            rest = "\n".join(lines[1:]).strip()
            if rest:
                render_body(doc, rest)
            continue
        if len(lines) >= 1 and lines[0].startswith("#### "):
            add_heading(doc, lines[0][5:].strip(), level=3)
            rest = "\n".join(lines[1:]).strip()
            if rest:
                render_body(doc, rest)
            continue
        # numbered list?
        if all(
            (ln.strip()[:2].isdigit() and ". " in ln[:4]) or not ln.strip()
            for ln in lines
            if ln.strip()
        ):
            for ln in lines:
                s = ln.strip()
                if not s:
                    continue
                text = s.split(". ", 1)[1] if ". " in s[:4] else s
                p = doc.add_paragraph(style="List Number")
                run = p.add_run(text)
                set_run_font(run, size_pt=11)
            continue
        # bold markers light handling
        text = raw.replace("**", "")
        add_paragraph(doc, text)


def build_docx() -> None:
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.85)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("UniZ UI guidance")
    set_run_font(run, size_pt=24, bold=True, color=RGBColor(0x18, 0x18, 0x1B))

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run(
        f"Campus user and trainer walkthrough for {PORTAL}"
    )
    set_run_font(run, size_pt=12, color=RGBColor(0x52, 0x52, 0x5B))

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run(
        f"Technical docs: {TECH_DOCS}\nAction flows: {ACTION_FLOWS}\n"
        "No production credentials. UI may vary with permissions and feature flags."
    )
    set_run_font(run, size_pt=10, color=RGBColor(0x71, 0x71, 0x7A))

    doc.add_paragraph()
    add_heading(doc, "Table of contents", level=1)
    for sec in SECTIONS:
        prefix = "    " * (sec["level"] - 1)
        add_paragraph(doc, f"{prefix}{sec['title']}")

    for sec in SECTIONS:
        add_heading(doc, sec["title"], level=min(sec["level"], 2))
        render_body(doc, sec["body"])

    doc.save(DOCX_PATH)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MD_PATH.write_text(sections_to_markdown(), encoding="utf-8")
    build_docx()
    print(f"Wrote {MD_PATH}")
    print(f"Wrote {DOCX_PATH}")
    print(f"Size docx={DOCX_PATH.stat().st_size} md={MD_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
