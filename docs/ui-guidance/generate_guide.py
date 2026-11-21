#!/usr/bin/env python3
"""Generate UniZ UI Feature Guide (Markdown + DOCX)."""
from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
SHOTS = ROOT / "screenshots"
DOCS_BASE = "https://api-uniz.rguktong.in/docs"
PORTAL = "https://uniz.rguktong.in"
TODAY = date.today().strftime("%d %B %Y")

# ---------------------------------------------------------------------------
# Content model
# ---------------------------------------------------------------------------

def feat(title, what, who, entry, actions, docs=None, screenshot=None, note=None):
    return {
        "title": title,
        "what": what,
        "who": who,
        "entry": entry,
        "actions": actions,  # list of (control, outcome)
        "docs": docs,
        "screenshot": screenshot,
        "note": note,
    }

PUBLIC = [
    feat(
        "Home",
        "Public landing page for the UniZ campus portal. Signed-in users are redirected to their role home.",
        "Public (unauthenticated)",
        "Nav: direct visit · URL: `/`",
        [
            ("Get started (header / hero)", "Opens student sign-in at `/student/signin`."),
            ("Download / Install (platform-aware)", "Triggers PWA install when available; on iOS shows Add to Home Screen instructions."),
            ("Privacy footer link", "Opens `/privacy`."),
            ("Developers footer link", "Opens `/developers`."),
            ("Hidden keyboard sequence `admin`", "Navigates to `/admin/signin` (staff entry shortcut)."),
        ],
        docs=f"{DOCS_BASE}/",
        screenshot="01-home.png",
    ),
    feat(
        "Developers",
        "Public credits page for the student engineering team and open-source contribution callout.",
        "Public",
        "Nav: Home footer → Developers · URL: `/developers`",
        [
            ("Back to home", "Returns to `/`."),
            ("Team / contribution content", "Read-only presentation; external contribution links where present."),
            ("Legal footer links", "Navigate to privacy and related legal surfaces."),
        ],
        docs=f"{DOCS_BASE}/introduction",
        note="Live screenshot pending: production SPA currently soft-falls to home for this path in some builds. Controls listed from `Developers.tsx`.",
    ),
    feat(
        "Privacy policy",
        "Institutional privacy notice covering account data, academic records, push tokens, and retention.",
        "Public",
        "Nav: Home footer → Privacy · URL: `/privacy`",
        [
            ("Back to home", "Returns to `/`."),
            ("Policy sections (scroll)", "Read-only text blocks for overview, collection, use, push, sharing, security, choices, contact."),
        ],
        note="Live screenshot pending: production SPA currently soft-falls to home for this path in some builds. Controls listed from `PrivacyPolicy.tsx`.",
    ),
    feat(
        "Notification deep link",
        "Bridge route used when a push notification is opened. Routes the user to the correct inbox or to sign-in.",
        "Public → then student or admin",
        "URL: `/notifications` (optional `?n=` highlight id)",
        [
            ("Automatic redirect (admin token present)", "Goes to `/admin/notifications` with optional highlight."),
            ("Automatic redirect (student token present)", "Goes to `/student/notifications` with optional highlight."),
            ("No token", "Stores pending path and sends user to student sign-in with return URL."),
        ],
        docs=f"{DOCS_BASE}/api/comms/notifications",
    ),
    feat(
        "SEO marketing landings",
        "Public marketing/SEO pages for project management, collaboration, task tracking, and blog-style paths.",
        "Public",
        "URLs: `/student-project-management`, `/college-team-collaboration`, `/academic-task-tracker`, `/blog/*`",
        [
            ("Back / home navigation", "Returns toward portal home."),
            ("Primary CTA (Get started / sign in)", "Routes toward student authentication."),
            ("Feature checklist content", "Read-only marketing copy keyed by pathname."),
        ],
        note="Live screenshot pending test capture on each SEO path.",
    ),
    feat(
        "StudySpace (promotional)",
        "Promotional surface for the StudySpace experiment. Route is currently commented out in `App.tsx`.",
        "Public / student (when enabled)",
        "Intended URL: `/studyspace` (not mounted while commented)",
        [
            ("External StudySpace links", "Open the hosted StudySpace experience in a new context."),
            ("Back / portal navigation", "Return to student shell when mounted under Sidebar."),
        ],
        note="Route commented in App.tsx. Page component remains at `pages/promotions/StudySpace.tsx`.",
    ),
    feat(
        "CampusHub (promotional)",
        "Promotional surface for CampusHub. Route is currently commented out in `App.tsx`.",
        "Public / student (when enabled)",
        "Intended URL: `/campushub` (not mounted while commented)",
        [
            ("External CampusHub links", "Open the hosted CampusHub experience."),
            ("Back / portal navigation", "Return to student shell when mounted under Sidebar."),
        ],
        note="Route commented in App.tsx. Page component remains at `pages/promotions/CampusHub.tsx`.",
    ),
    feat(
        "Student sign-in",
        "Credential entry for students, including Turnstile check and OTP password recovery.",
        "Student (public entry)",
        "Nav: Home → Get started · URL: `/student/signin` · Aliases: `/login`, `/signin` → this route",
        [
            ("University ID or email", "Identifies the student account."),
            ("Password + show/hide", "Enters credentials; visibility toggle reveals text."),
            ("Forgot password?", "Switches to OTP request step."),
            ("Cloudflare Turnstile", "Completes bot check before Continue enables."),
            ("Continue / Sign in", "Authenticates; stores `student_token`; navigates to `/student`."),
            ("Request OTP", "Sends one-time code to registered channel."),
            ("OTP digits + Verify", "Confirms ownership of the account."),
            ("Send via email (fallback)", "Requests email delivery of OTP when push is unavailable."),
            ("New password + Set new password", "Writes new password hash; returns to sign-in."),
            ("Back", "Returns toward home / previous step."),
        ],
        docs=f"{DOCS_BASE}/students/login",
        screenshot="02-student-signin.png",
    ),
    feat(
        "Admin / staff sign-in",
        "Shared staff sign-in. Role in the login response decides admin vs faculty destination.",
        "Admin roles, faculty, security, webadmin",
        "URL: `/admin/signin` (also reachable via typing `admin` on the home page)",
        [
            ("Username + password", "Staff credentials."),
            ("Forgot password / OTP flow", "Same reset steps as student sign-in."),
            ("Turnstile + Continue", "Authenticates staff; faculty role stores `faculty_token` and opens `/faculty`; other admin roles store `admin_token` and open `/admin`."),
            ("Role mismatch guards", "Blocks students from admin portal and vice versa with an error toast."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account. No separate `/faculty/signin` route; faculty use admin sign-in.",
    ),
    feat(
        "Maintenance interstitial",
        "Shown when `VITE_MAINTENANCE_MODE=true` and no admin token is present.",
        "All unauthenticated users",
        "Any guarded route under MaintenanceGuard",
        [
            ("Go Back", "History back."),
        ],
        docs=f"{DOCS_BASE}/ops/feature-flags",
    ),
    feat(
        "404 error page",
        "Catch-all for unknown portal paths.",
        "Any",
        "URL: unmatched `*`",
        [
            ("Go Back", "History back."),
            ("Return Home", "Navigates to `/`."),
        ],
    ),
    feat(
        "PWA install prompt",
        "Global overlay (`InstallPWA`) offering Add to Home Screen / install after load or login on mobile.",
        "Any (mobile / non-standalone)",
        "Global component mounted in `App.tsx`",
        [
            ("Install / Add to Home Screen", "Shows native install prompt or iOS share instructions."),
            ("Dismiss (X)", "Hides the banner; auto-dismisses after a few seconds."),
        ],
    ),
]

STUDENT_SHELL = feat(
    "Student shell (sidebar, dock, profile chrome)",
    "Authenticated student chrome: desktop dock, mobile bottom menu, header profile, notifications, logout, optional outpass/outing banner.",
    "Student",
    "Any `/student/*` route rendered through `Sidebar`",
    [
        ("Desktop dock items", "Navigate among My Profile, Registration, Results, Attendance, Password, Grievance, Help; optional Outing/Outpass when feature flag on."),
        ("Logout (dock / header)", "Opens confirm modal; confirm ends session."),
        ("Notification bell", "Opens `/student/notifications`."),
        ("Mobile bottom menu: Home / Register / Academics / Grievance / Help", "Primary navigation; Academics expands Results, Attendance, Security (password)."),
        ("Mobile back chevron", "Returns to `/student` from nested pages."),
        ("Dismiss outpass disabled banner", "Hides the administrative notice for the session view."),
        ("Pull-to-refresh (touch)", "Reloads the page when pulled from top."),
    ],
    docs=f"{DOCS_BASE}/students/profile",
    note="Live screenshot pending test account.",
)

STUDENT = [
    STUDENT_SHELL,
    feat(
        "Student dashboard / profile",
        "Home profile for the signed-in student: personal details, academic snapshot, seating entry, and (when enabled) outing/outpass request forms.",
        "Student",
        "Nav: My Profile / Home · URL: `/student`",
        [
            ("Edit profile", "Enables editable fields (contact/email and similar allowed fields)."),
            ("Save / Save Changes", "Persists profile updates."),
            ("Cancel", "Exits edit mode without saving."),
            ("Upload photo (avatar control)", "Uploads image then updates `profile_url`."),
            ("Tab switches (personal / academic / etc.)", "Show corresponding profile panels."),
            ("Seating arrangement entry", "Opens seating view within the student experience."),
            ("Outing / Outpass request toggles (flag on)", "Open request forms with reason, dates/times, submit/cancel."),
            ("Submit request (flag on)", "Creates outing or outpass request for approval chain."),
        ],
        docs=f"{DOCS_BASE}/students/profile",
        note="Live screenshot pending test account. Nested components: InfoCard, AcademicRecord, StudentAnalytics, ProfileSemesterSubjects, SeatingArrangement.",
    ),
    feat(
        "Outing requests",
        "List and create short-duration outing requests. Feature-flagged; routes commented when disabled.",
        "Student",
        "Nav: Outing Requests · URL: `/student/outing` · Request form: `/student/outing/requestouting`",
        [
            ("New request", "Opens request form."),
            ("Reason, from/to times", "Describe the outing window."),
            ("Submit Request", "Sends request into approval queue."),
            ("Cancel / back", "Returns without submitting."),
            ("Status chips on list", "Show Approved / Rejected / Pending / Expired."),
        ],
        docs=f"{DOCS_BASE}/students/outpass",
        note="Disabled when `VITE_ENABLE_OUTPASS_OUTING` is not true. Routes currently commented in App.tsx.",
    ),
    feat(
        "Outpass requests",
        "List and create multi-day outpass requests. Feature-flagged; routes commented when disabled.",
        "Student",
        "Nav: Outpass Requests · URL: `/student/outpass` · Request form: `/student/outpass/requestoutpass`",
        [
            ("New request", "Opens outpass form."),
            ("Reason, from/to dates", "Describe leave window."),
            ("Submit Request", "Sends request into caretaker→warden→SWO→dean chain."),
            ("Cancel / back", "Returns without submitting."),
        ],
        docs=f"{DOCS_BASE}/students/outpass",
        note="Disabled when feature flag off. Routes currently commented in App.tsx.",
    ),
    feat(
        "Attendance",
        "Subject-wise attendance view for the student.",
        "Student",
        "Nav: Attendance · URL: `/student/attendance`",
        [
            ("Subject / semester filters (if present)", "Narrow the attendance table."),
            ("Read-only percentages and logs", "No student write actions; disputes go through Grievance."),
        ],
        docs=f"{DOCS_BASE}/students/academics",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Results (GradeHub)",
        "Published semester results with SGPA/CGPA and PDF export.",
        "Student",
        "Nav: Results · URL: `/student/gradehub`",
        [
            ("Semester dropdown", "Select which published semester to load."),
            ("Fetch / view results", "Loads grades for the selected semester."),
            ("Output PDF", "Downloads official results PDF."),
            ("Output Remedial PDF", "Downloads remedial results PDF when applicable."),
        ],
        docs=f"{DOCS_BASE}/students/academics",
        note="Live screenshot pending test account. Grades appear only after administrative publish.",
    ),
    feat(
        "Current semester",
        "Focused view of the active semester context for the student.",
        "Student",
        "URL: `/student/current-semester`",
        [
            ("Semester summary panels", "Read registered/current semester information."),
            ("Cross-links to registration / results", "Navigate to related academic pages when shown."),
        ],
        docs=f"{DOCS_BASE}/students/academics",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Course registration",
        "Enroll in core and elective subjects while the registration window is open; later view registered subjects and PDF.",
        "Student",
        "Nav: Registration · URL: `/student/registration`",
        [
            ("My subjects tab", "Shows already registered subjects for the current semester."),
            ("Register tab (when open)", "Opens CourseRegistration for elective selection."),
            ("Select elective subject cards", "Toggle electives within group limits; cores are pre-selected."),
            ("Confirm registration", "Submits selected subject IDs; locks further changes."),
            ("Download PDF", "Downloads registration confirmation PDF from RegisteredSubjectsPanel."),
            ("Done / complete", "Returns to subjects view after success."),
        ],
        docs=f"{DOCS_BASE}/api/academics/registration",
        note="Live screenshot pending test account. Nested: MySubjects, CourseRegistration, RegisteredSubjectsPanel.",
    ),
    feat(
        "Grievance",
        "Submit an official campus grievance, optionally anonymously.",
        "Student",
        "Nav: Grievance · URL: `/student/grievance`",
        [
            ("Category / details fields", "Describe the issue."),
            ("Submit Anonymously toggle", "Masks identity when enabled."),
            ("Submit Official Grievance", "Creates grievance for SWO / admin queue."),
        ],
        docs=f"{DOCS_BASE}/api/requests/grievances",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Notifications inbox",
        "In-app notification center for the student portal.",
        "Student",
        "Nav: notification bell · URL: `/student/notifications`",
        [
            ("Open notification row", "Shows detail / marks read as implemented."),
            ("Deep-link highlight (`?n=`)", "Focuses a specific notification from push."),
        ],
        docs=f"{DOCS_BASE}/api/comms/notifications",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Help & support",
        "FAQ accordion and contact guidance for the student portal.",
        "Student",
        "Nav: Help & Support · URL: `/student/help`",
        [
            ("FAQs tab", "Lists common questions."),
            ("Expand / collapse FAQ row", "Shows answer text."),
            ("Contact us tab", "Shows contact channels / mailto links."),
        ],
        note="Live screenshot pending test account.",
    ),
    feat(
        "Reset password (signed-in)",
        "Change password while authenticated.",
        "Student",
        "Nav: Password / Security · URL: `/student/resetpassword`",
        [
            ("Current / new password fields", "Enter replacement credentials."),
            ("Reset / update password button", "Updates password for the student account."),
        ],
        docs=f"{DOCS_BASE}/api/auth/password",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Toaster demo",
        "Internal demo page for toast notifications.",
        "Student / developers",
        "URL: `/student/toast-demo`",
        [
            ("Demo toast triggers", "Fire sample toasts; not a production workflow."),
        ],
        note="Internal/demo route.",
    ),
]

ADMIN_SHARED = [
    feat(
        "Admin shell chrome",
        "Shared layout for role dashboards: collapsible sidebar, nav search, avatar profile popup, logout.",
        "All admin portal roles using AdminShell",
        "Any `/admin` section rendered by Webadmin/Dean/Director/SWO/Warden/Caretaker/Security shells",
        [
            ("Collapse / expand sidebar", "Toggles nav width."),
            ("Search operations", "Filters sidebar nav labels."),
            ("Nav item click", "Navigates to `/admin/<section>` via `useAdminSectionRoute`."),
            ("Avatar → profile popup", "Opens ProfilePopup for quick profile view/edit."),
            ("Logout", "Clears admin session."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Admin notifications",
        "Staff notification inbox page.",
        "Admin (authenticated)",
        "URL: `/admin/notifications`",
        [
            ("Open / highlight notification", "Same pattern as student inbox with admin portal."),
        ],
        docs=f"{DOCS_BASE}/api/comms/notifications",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Legacy admin hub (fallback)",
        "Card hub used when role is not mapped to a specialized dashboard.",
        "Unmapped admin roles",
        "URL: `/admin`",
        [
            ("Quick action cards", "Navigate to approve outing/outpass, security, grades, attendance, curriculum, faculty, students, search, settings, roles, banners, etc., based on role gates."),
            ("Logout", "Ends session."),
        ],
        note="Most production roles resolve to specialized dashboards (Webadmin, Dean, SWO, Warden, Caretaker, Director, Security).",
    ),
]

# Shared section features reused across webadmin/dean/director
SECTION_FEATURES = [
    feat(
        "Overview",
        "Role overview with profile summary, institutional analytics widgets, and photo upload.",
        "Webadmin, COE, Dean, Director (and SWO overview reuse)",
        "Nav: Overview · URL: `/admin`",
        [
            ("Upload profile photo", "Uploads image and updates admin profile URL."),
            ("Edit / Save profile fields", "Updates email, contact, designation, department."),
            ("Cancel edit", "Discards draft field changes."),
            ("Analytics panels (read)", "Show institutional counts where loaded."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account. Component: WebadminOverview (+ analytics panels).",
    ),
    feat(
        "Student details",
        "Search and inspect individual student records; open performance and edit modals where permitted.",
        "Webadmin, COE, Dean, HOD (students only), Director",
        "Nav: Student Details · URL: `/admin/students`",
        [
            ("Search students", "Query by ID / name filters."),
            ("Open student row", "Shows detail / performance modal."),
            ("Edit student (modal)", "Update permitted demographic/status fields."),
            ("Save / close modal", "Persist or discard changes."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account. Components: StudentDetails, StudentEditModal, StudentPerformanceModal.",
    ),
    feat(
        "Student bulk operations",
        "Bulk upload, export, and cohort-wide status actions.",
        "Webadmin, COE, Dean, Director",
        "Nav: Student Bulk Ops · URL: `/admin/students/bulk`",
        [
            ("Bulk Upload tab", "Select XLSX/CSV via FileUploader."),
            ("Download Template", "Downloads Student_Upload_Template.xlsx."),
            ("Start Uploading", "Begins bulk create and monitors progress."),
            ("Batch Export tab + field checkboxes", "Choose export columns; Select all / essentials shortcuts."),
            ("Download the data", "Exports filtered student fields."),
            ("Actions tab → Mark IN campus", "Bulk set students present on campus."),
            ("Actions → Mark OUT of campus", "Bulk set students off campus."),
            ("Actions → Promote academic year", "Advance year cohort (e.g. E1→E2) with confirmation phrase."),
            ("Actions → Clear pending flags", "Clear stale outpass/outing pending flags."),
            ("Actions → Suspend / Unsuspend", "Bulk suspend or restore accounts with confirmation."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Attendance upload",
        "Upload attendance records for academic logging.",
        "Webadmin, COE, Dean, Director; also legacy `/admin/addattendance`",
        "Nav: Attendance Upload · URL: `/admin/attendance` · Legacy: `/admin/addattendance`",
        [
            ("Choose file / FileUploader", "Select attendance CSV/XLSX."),
            ("Upload / submit", "Imports attendance into Academics service."),
            ("Progress / result messages", "Confirm success or show errors."),
        ],
        docs=f"{DOCS_BASE}/admin/academics",
        note="Live screenshot pending test account. Component: UploadSection type=attendance.",
    ),
    feat(
        "Grades upload",
        "Upload grade sheets prior to publish.",
        "Webadmin, COE, Dean, Director; also legacy `/admin/addgrades`",
        "Nav: Grades Upload · URL: `/admin/grades` · Legacy: `/admin/addgrades`",
        [
            ("Choose file / FileUploader", "Select grades CSV/XLSX."),
            ("Upload / submit", "Imports grades."),
            ("Publish workflows (related semester tools)", "Students see grades only after publish."),
        ],
        docs=f"{DOCS_BASE}/admin/academics",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Manage subjects / curriculum",
        "Maintain subject catalog and curriculum mappings.",
        "Webadmin, COE, Dean, Director; also `/admin/curriculum`",
        "Nav: Manage Subjects · URL: `/admin/subjects` · Legacy: `/admin/curriculum`",
        [
            ("Add / edit subject fields", "Create or update subject records."),
            ("Save / delete subject", "Persist catalog changes."),
            ("Search / filter subjects", "Locate codes and titles."),
        ],
        docs=f"{DOCS_BASE}/admin/academics",
        note="Live screenshot pending test account. Components: CurriculumManager / SubjectManagement.",
    ),
    feat(
        "Semester registration builder",
        "Create semesters, attach subjects/electives, publish to students, track registration, delete semesters.",
        "Webadmin, COE, Dean, Director",
        "Nav: Semester Registration · URL: `/admin/semester-registration`",
        [
            ("Create semester / open builder", "Starts SemesterBuilder flow."),
            ("Add subjects from catalog", "Attach core/elective offerings."),
            ("Manage semester", "Edit allocation details."),
            ("Publish to Students", "Opens DirectPublishModal; makes registration visible."),
            ("Track registration", "Opens RegistrationTracking for completion rates."),
            ("Delete semester", "Irreversible remove after confirm."),
        ],
        docs=f"{DOCS_BASE}/admin/semester-registration",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Semester approvals",
        "HOD/Dean review of semester subject allocations and electives before advance/publish.",
        "Dean, HOD",
        "Nav: Semester Approvals · URL: `/admin/semester-approvals`",
        [
            ("Select semester card", "Loads allocations and elective groups (HOD scoped to department)."),
            ("Approve / advance actions", "Moves semester through HOD_REVIEW / DEAN_REVIEW states."),
            ("Registration tracking entry", "Inspect department registration progress."),
            ("Back", "Returns to list."),
        ],
        docs=f"{DOCS_BASE}/admin/semester-registration",
        note="Live screenshot pending test account. Component: SemesterApproval.",
    ),
    feat(
        "Home banners",
        "Manage home-page banners shown on the public/student surfaces.",
        "Webadmin, COE, Dean, Director; also `/admin/banners`",
        "Nav: Home Banners · URL: `/admin/campus/banners`",
        [
            ("Add / upload banner image", "Creates a banner asset."),
            ("Reorder / enable / disable", "Controls which banners display."),
            ("Delete banner", "Removes banner."),
            ("Save", "Persists banner configuration."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Campus updates",
        "Publish campus notices/updates visible to students.",
        "Webadmin, COE, Dean, Director",
        "Nav: Campus Updates · URL: `/admin/campus/updates`",
        [
            ("Create update", "Compose title/body."),
            ("Publish / delete update", "Push or remove notice."),
        ],
        docs=f"{DOCS_BASE}/api/cms/notices",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Website updates / live editor",
        "Edit institutional website content blocks and publish changes.",
        "Webadmin, COE, Dean, Director",
        "Nav: Website Updates · URL: `/admin/campus/website`",
        [
            ("Open live editor", "Edit page content chrome."),
            ("Save / publish website changes", "Writes CMS content for landing site."),
            ("Tenders / department staff editors (subsections)", "Maintain related institutional listings."),
        ],
        note="Live screenshot pending test account. Components: WebsiteUpdatesSection, WebsiteLiveEditor.",
    ),
    feat(
        "Push alerts",
        "Send push notifications to subscribed devices.",
        "Webadmin, COE, Dean, Director",
        "Nav: Push Alerts · URL: `/admin/campus/push-alerts`",
        [
            ("Compose title/body", "Draft alert payload."),
            ("Audience / send controls", "Dispatch push via notifications service."),
            ("History list (if shown)", "Review prior sends."),
        ],
        docs=f"{DOCS_BASE}/api/comms/notifications",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Faculty management",
        "Create, search, update, suspend, and bulk-manage faculty accounts.",
        "Webadmin, COE, Dean, Director; also `/admin/addfaculty`",
        "Nav: Faculty Management · URL: `/admin/faculty`",
        [
            ("Search faculty", "Locate staff by username/name."),
            ("Create faculty", "Add single faculty record."),
            ("Edit / suspend faculty", "Update profile or suspend account."),
            ("Bulk create / update / delete uploads", "Batch faculty CSV operations."),
        ],
        docs=f"{DOCS_BASE}/faculty/grades",
        note="Live screenshot pending test account.",
    ),
    feat(
        "System & logs",
        "Operational health, upload analytics, and system user insights for platform admins.",
        "Webadmin, COE, Dean, Director",
        "Nav: System & Logs · URL: `/admin/system-logs`",
        [
            ("Refresh / inspect log panels", "Read service health and recent activity."),
            ("Upload health analytics", "Inspect bulk upload job status."),
        ],
        docs=f"{DOCS_BASE}/health",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Security (password / access section)",
        "Per-admin security controls inside AdminShell (password change and related access settings).",
        "Most admin dashboards",
        "Nav: Security · URL: `/admin/access-control`",
        [
            ("Change password fields + submit", "Updates admin password."),
            ("Related security toggles", "As rendered by SecuritySection."),
        ],
        docs=f"{DOCS_BASE}/api/auth/password",
        note="Live screenshot pending test account. Distinct from Security Portal gate terminal.",
    ),
]

LEGACY_ADMIN = [
    feat(
        "Add students (legacy page)",
        "Standalone student import page.",
        "Dean / webadmin paths",
        "URL: `/admin/addstudents`",
        [
            ("CSV/XLSX uploader", "Import student rows."),
            ("Submit upload", "Creates student accounts."),
        ],
        docs=f"{DOCS_BASE}/admin/overview",
        note="Live screenshot pending test account. Prefer Student Bulk Ops in shell.",
    ),
    feat(
        "Search students (legacy)",
        "Directory search page reused by security search tab.",
        "Admin / security",
        "URL: `/admin/searchstudents`",
        [
            ("Search field + submit", "Returns matching students."),
            ("Open result", "View student directory card."),
        ],
        note="Live screenshot pending test account.",
    ),
    feat(
        "Update student status",
        "Manually update presence/status flags for a student.",
        "Caretaker, Warden (status_update), legacy URL",
        "Nav: Status Update · URL: `/admin/student-status` · Legacy: `/admin/updatestudentstatus`",
        [
            ("Search student", "Locate target."),
            ("Status controls + save", "Apply presence or status change."),
        ],
        docs=f"{DOCS_BASE}/admin/security",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Settings",
        "Admin settings page.",
        "Admin",
        "URL: `/admin/settings`",
        [
            ("Settings form controls + save", "Persist portal settings as implemented."),
        ],
        note="Live screenshot pending test account.",
    ),
    feat(
        "Role management",
        "Assign or inspect administrative roles.",
        "Webadmin-capable admins",
        "URL: `/admin/roles`",
        [
            ("Role list / assign controls", "Update role bindings."),
            ("Save", "Persist role changes."),
        ],
        docs=f"{DOCS_BASE}/roles",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Admin profile page",
        "Full-page admin profile (in addition to shell popup).",
        "Admin",
        "URL: `/admin/profile`",
        [
            ("Edit profile fields + save", "Update admin profile."),
            ("Photo upload", "Change avatar."),
        ],
        note="Live screenshot pending test account.",
    ),
    feat(
        "Current semester admin",
        "Admin tool for current-semester configuration.",
        "Academic admins",
        "URL: `/admin/current-semester`",
        [
            ("Semester selectors + save", "Configure active semester context."),
        ],
        docs=f"{DOCS_BASE}/admin/semester-registration",
        note="Live screenshot pending test account.",
    ),
]

APPROVALS = [
    feat(
        "Approve outings",
        "Process pending short outing requests: approve, reject with reason, or forward.",
        "Caretaker, Warden (when outpass/outing flag enabled); SWO request management",
        "Nav: Approve Outings · URL: `/admin/approve-outings` · Legacy hub: `/admin/approveouting`",
        [
            ("Search by ID / name / reason", "Filter pending queue."),
            ("Approve", "Marks outing approved."),
            ("Reject (prompt for reason)", "Rejects with message; stops chain."),
            ("Forward", "Escalates to next approver and removes from current queue."),
            ("Back", "Returns to previous view."),
        ],
        docs=f"{DOCS_BASE}/admin/approvals",
        note="Hidden when outpass/outing feature flag is off. Live screenshot pending test account.",
    ),
    feat(
        "Approve outpasses",
        "Process pending multi-day outpass requests through the residential approval chain.",
        "Caretaker, Warden (flag on); higher roles as configured",
        "Nav: Approve Outpasses · URL: `/admin/approve-outpasses` · Legacy: `/admin/approveoutpass`",
        [
            ("Search", "Filter pending outpasses."),
            ("Approve", "Approves at current level or finalizes per role."),
            ("Reject with reason", "Ends request with comment."),
            ("Forward", "Sends to next level (caretaker→warden→SWO→dean)."),
        ],
        docs=f"{DOCS_BASE}/admin/approvals",
        note="Feature-flagged. Live screenshot pending test account.",
    ),
    feat(
        "SWO request management & grievances",
        "SWO operations for outing/outpass queues (when enabled) and grievance resolution.",
        "SWO / DSW",
        "Nav: Overview `/admin`; Grievances `/admin/grievances`; Outing/Outpass logs when flag on",
        [
            ("Grievance list open / respond controls", "Review and resolve student grievances."),
            ("Outing/Outpass RequestManagement (flag on)", "Approve/reject/forward from SWO queue."),
            ("Security section", "Password/access controls."),
        ],
        docs=f"{DOCS_BASE}/admin/approvals",
        note="Live screenshot pending test account. Outing/outpass nav filtered off when flag disabled.",
    ),
]

SECURITY = [
    feat(
        "Security portal (gate terminal)",
        "Campus gate check-in/check-out terminal with directory search and activity summary.",
        "Security",
        "Role home `/admin` → SecurityPortal · also `/admin/security`",
        [
            ("Overview tab", "Shows access-control summary KPIs."),
            ("Scan / search student ID form", "Looks up student for gate action."),
            ("Check-In", "Records campus entry for approved movement."),
            ("Check-Out", "Records campus exit."),
            ("Search Directory tab", "Embeds SearchStudents directory."),
            ("Activity Logs tab", "Shows recent gate activity list."),
            ("Logout / shell nav", "Standard admin chrome."),
        ],
        docs=f"{DOCS_BASE}/admin/security",
        note="Live screenshot pending test account.",
    ),
]

FACULTY = [
    feat(
        "Faculty portal overview",
        "Single-page faculty dashboard with sidebar tabs for overview, profile, branch students, and password.",
        "Faculty; HOD sees HOD labeling",
        "URL: `/faculty` (after admin sign-in with faculty/teacher role)",
        [
            ("Sidebar: Overview / My Profile / Branch Students / Change Password", "Switch active tab (in-page, not separate routes)."),
            ("Collapse sidebar / Menu", "Toggle sidebar width."),
            ("Quick Access cards", "Jump to Profile, Students, or Password tabs."),
            ("Sign Out", "Clears faculty session."),
        ],
        docs=f"{DOCS_BASE}/faculty/grades",
        note="Live screenshot pending test account.",
    ),
    feat(
        "Faculty profile",
        "View and edit faculty profile fields and bio.",
        "Faculty",
        "Faculty portal → My Profile tab",
        [
            ("Edit Profile", "Enables editable name, contact, designation, profile URL, bio lists."),
            ("Save", "PUT profile update."),
            ("Cancel", "Exit edit mode."),
        ],
        docs=f"{DOCS_BASE}/api/profile/faculty",
        note="Live screenshot pending test account. Username, email, department, system role are read-only.",
    ),
    feat(
        "Branch students",
        "Search and inspect students in the faculty department; HOD may see broader department tooling.",
        "Faculty / HOD",
        "Faculty portal → Branch Students tab",
        [
            ("Search / filter controls", "Filter students by ID, name, year."),
            ("Open student card", "View student summary via admin view endpoint."),
            ("Clear filters", "Reset search."),
        ],
        docs=f"{DOCS_BASE}/faculty/attendance",
        note="Live screenshot pending test account. Grade/attendance upload for faculty is primarily documented under admin academics flows and faculty docs; this portal focuses on profile + student directory.",
    ),
    feat(
        "Faculty change password",
        "OTP-assisted password change for faculty accounts.",
        "Faculty",
        "Faculty portal → Change Password tab",
        [
            ("Request OTP", "Sends OTP to registered channel."),
            ("Verify OTP", "Unlocks new password fields."),
            ("Set new password", "Commits password reset."),
            ("Strength meter", "Visual feedback only."),
        ],
        docs=f"{DOCS_BASE}/api/auth/password",
        note="Live screenshot pending test account.",
    ),
]

ROLE_OVERVIEW = [
    ("Public", "Anyone without a session", "Landing, legal, SEO, sign-in"),
    ("Student", "Enrolled RGUKT students", "Profile, academics, registration, grievance, notifications"),
    ("Faculty", "Teaching staff", "`/faculty` overview, profile, branch students, password"),
    ("HOD", "Head of Department", "Dean shell subset: students + semester approvals"),
    ("Caretaker (M/F)", "Hostel caretakers", "First-level outing/outpass approval, status update"),
    ("Warden (M/F)", "Hostel wardens", "Second-level outing/outpass approval, status tools"),
    ("SWO / DSW", "Student Welfare", "Grievances; outing/outpass when enabled"),
    ("Dean", "Academic dean", "Broad academic + campus admin shell"),
    ("Director", "Institution director", "Broad academic + campus admin shell"),
    ("Webadmin / COE", "Platform / exam admin", "Full webadmin shell including bulk ops & logs"),
    ("Security", "Gate staff", "Check-in/check-out terminal"),
]

ROUTE_MAP = [
    ("/", "Public home"),
    ("/developers", "Developers"),
    ("/privacy", "Privacy"),
    ("/notifications", "Push deep link"),
    ("/student-project-management", "SEO landing"),
    ("/college-team-collaboration", "SEO landing"),
    ("/academic-task-tracker", "SEO landing"),
    ("/blog/*", "SEO blog"),
    ("/login, /signin", "Redirect → /student/signin"),
    ("/student/signin", "Student sign-in"),
    ("/admin/signin", "Admin/faculty sign-in"),
    ("/student", "Student dashboard"),
    ("/student/registration", "Registration"),
    ("/student/gradehub", "Results"),
    ("/student/attendance", "Attendance"),
    ("/student/current-semester", "Current semester"),
    ("/student/grievance", "Grievance"),
    ("/student/notifications", "Student inbox"),
    ("/student/help", "Help"),
    ("/student/resetpassword", "Password"),
    ("/student/outing*", "Outing (flagged / may be unmounted)"),
    ("/student/outpass*", "Outpass (flagged / may be unmounted)"),
    ("/studyspace, /campushub", "Promo pages (currently unmounted)"),
    ("/faculty", "Faculty dashboard"),
    ("/admin", "Role dashboard overview"),
    ("/admin/students", "Student details"),
    ("/admin/students/bulk", "Student bulk ops"),
    ("/admin/attendance", "Attendance upload"),
    ("/admin/grades", "Grades upload"),
    ("/admin/subjects", "Subjects"),
    ("/admin/semester-registration", "Semester builder"),
    ("/admin/semester-approvals", "Semester approvals"),
    ("/admin/campus/banners", "Banners"),
    ("/admin/campus/updates", "Campus updates"),
    ("/admin/campus/website", "Website updates"),
    ("/admin/campus/push-alerts", "Push alerts"),
    ("/admin/faculty", "Faculty management"),
    ("/admin/system-logs", "System & logs"),
    ("/admin/access-control", "Security section"),
    ("/admin/grievances", "Grievances"),
    ("/admin/approve-outings", "Approve outings"),
    ("/admin/approve-outpasses", "Approve outpasses"),
    ("/admin/student-status", "Status update"),
    ("/admin/security", "Security portal page"),
    ("/admin/notifications", "Admin inbox"),
    ("/admin/addstudents, addgrades, addattendance, addfaculty", "Legacy standalone tools"),
    ("/admin/settings, roles, banners, curriculum, profile, searchstudents, updatestudentstatus, current-semester", "Legacy/standalone admin pages"),
]

DOCS_MAP = [
    ("Roles overview", f"{DOCS_BASE}/roles"),
    ("Student login", f"{DOCS_BASE}/students/login"),
    ("Student academics", f"{DOCS_BASE}/students/academics"),
    ("Student outpass", f"{DOCS_BASE}/students/outpass"),
    ("Student profile", f"{DOCS_BASE}/students/profile"),
    ("Admin overview", f"{DOCS_BASE}/admin/overview"),
    ("Admin approvals", f"{DOCS_BASE}/admin/approvals"),
    ("Admin academics", f"{DOCS_BASE}/admin/academics"),
    ("Admin security", f"{DOCS_BASE}/admin/security"),
    ("Semester registration", f"{DOCS_BASE}/admin/semester-registration"),
    ("Faculty grades", f"{DOCS_BASE}/faculty/grades"),
    ("Faculty attendance", f"{DOCS_BASE}/faculty/attendance"),
    ("Action flows", f"{DOCS_BASE}/system/action-flows"),
    ("Auth login API", f"{DOCS_BASE}/api/auth/login"),
    ("Password API", f"{DOCS_BASE}/api/auth/password"),
    ("OTP API", f"{DOCS_BASE}/api/auth/otp"),
    ("Registration API", f"{DOCS_BASE}/api/academics/registration"),
    ("Grades API", f"{DOCS_BASE}/api/academics/grades"),
    ("Attendance API", f"{DOCS_BASE}/api/academics/attendance"),
    ("Grievances API", f"{DOCS_BASE}/api/requests/grievances"),
    ("Notifications API", f"{DOCS_BASE}/api/comms/notifications"),
    ("CMS notices", f"{DOCS_BASE}/api/cms/notices"),
]

# ---------------------------------------------------------------------------
# Markdown writer
# ---------------------------------------------------------------------------

def md_feature(f, heading_level=3):
    h = "#" * heading_level
    lines = [f"{h} {f['title']}", "", f"**What it is.** {f['what']}", "", f"**Who.** {f['who']}", "", f"**Entry path.** {f['entry']}", "", "**Actions.**", ""]
    for control, outcome in f["actions"]:
        lines.append(f"- **{control}** — {outcome}")
    lines.append("")
    if f.get("docs"):
        lines.append(f"**Docs.** [{f['docs']}]({f['docs']})")
        lines.append("")
    if f.get("screenshot"):
        lines.append(f"![Screenshot: {f['title']}](screenshots/{f['screenshot']})")
        lines.append("")
    if f.get("note"):
        lines.append(f"> {f['note']}")
        lines.append("")
    return "\n".join(lines)


def write_markdown():
    parts = []
    parts.append("# UniZ UI Feature Guide")
    parts.append("")
    parts.append(f"**Institution.** RGUKT Ongole  ")
    parts.append(f"**Document date.** {TODAY}  ")
    parts.append(f"**Portal.** [{PORTAL}]({PORTAL})  ")
    parts.append(f"**Technical docs.** [{DOCS_BASE}/]({DOCS_BASE}/)  ")
    parts.append("**Repo mirror.** `apps/uniz-docs/`")
    parts.append("")
    parts.append("---")
    parts.append("")
    parts.append("## How to use this guide")
    parts.append("")
    parts.append("This document is a **UI guidance** inventory: every portal feature and every user-facing action, organized by role. It is not an architecture or API reference.")
    parts.append("")
    parts.append("For each feature you will find: what it is, who can use it, how to open it (navigation + URL from `apps/uniz-portal/src/App.tsx` and admin section routes), every actionable control, and what happens when the control is used. Where a matching page exists under the institutional docs site, a link is included.")
    parts.append("")
    parts.append("> **Technical details.** Implementation and backend behaviour live in [UniZ docs](https://api-uniz.rguktong.in/docs/) (`apps/uniz-docs/`), especially [Roles](https://api-uniz.rguktong.in/docs/roles), [Action flows](https://api-uniz.rguktong.in/docs/system/action-flows), and the Student / Admin / Faculty guides. Prefer those pages for endpoints, storage, and deployment.")
    parts.append("")
    parts.append("**Screenshot policy.** Public pages were captured against the live portal where the route rendered. Authenticated screens are described from React UI source and docs; those sections are marked *Live screenshot pending test account*. No credentials were invented or stored.")
    parts.append("")
    parts.append("**Feature flags.** Outing and outpass student/admin flows are gated by `VITE_ENABLE_OUTPASS_OUTING` (default off). Related routes may be commented out in `App.tsx` while the flag is off.")
    parts.append("")
    parts.append("---")
    parts.append("")
    parts.append("## Role overview")
    parts.append("")
    parts.append("| Role | Audience | Primary UI |")
    parts.append("| --- | --- | --- |")
    for role, audience, primary in ROLE_OVERVIEW:
        parts.append(f"| {role} | {audience} | {primary} |")
    parts.append("")
    parts.append(f"Source of truth for authorization semantics: [{DOCS_BASE}/roles]({DOCS_BASE}/roles).")
    parts.append("")

    sections = [
        ("Public surfaces", PUBLIC),
        ("Student portal", STUDENT),
        ("Admin portal — shared chrome & legacy pages", ADMIN_SHARED + LEGACY_ADMIN),
        ("Admin portal — academic & campus sections", SECTION_FEATURES),
        ("Admin portal — approvals & welfare", APPROVALS),
        ("Admin portal — security gate", SECURITY),
        ("Faculty portal", FACULTY),
    ]
    for title, feats in sections:
        parts.append("---")
        parts.append("")
        parts.append(f"## {title}")
        parts.append("")
        for f in feats:
            parts.append(md_feature(f))

    parts.append("---")
    parts.append("")
    parts.append("## Appendix A. Route map")
    parts.append("")
    parts.append("| Path | Surface |")
    parts.append("| --- | --- |")
    for path, label in ROUTE_MAP:
        parts.append(f"| `{path}` | {label} |")
    parts.append("")
    parts.append("Admin shell tabs sync to paths via `apps/uniz-portal/src/utils/adminSectionRoutes.ts`.")
    parts.append("")
    parts.append("## Appendix B. Feature → docs URL map")
    parts.append("")
    parts.append("| Topic | Docs URL |")
    parts.append("| --- | --- |")
    for topic, url in DOCS_MAP:
        parts.append(f"| {topic} | [{url}]({url}) |")
    parts.append("")
    parts.append("## Appendix C. Screenshot checklist")
    parts.append("")
    parts.append("| Section | Source |")
    parts.append("| --- | --- |")
    parts.append("| Home `/` | Live screenshot embedded |")
    parts.append("| Student sign-in `/student/signin` | Live screenshot embedded |")
    parts.append("| Developers, Privacy (production soft-fallback observed) | Code-derived; re-capture when route serves correctly |")
    parts.append("| SEO landings, StudySpace, CampusHub | Code-derived |")
    parts.append("| All student authenticated pages | Code-derived — Live screenshot pending test account |")
    parts.append("| All admin / faculty authenticated pages | Code-derived — Live screenshot pending test account |")
    parts.append("")

    text = "\n".join(parts)
    (ROOT / "UniZ-UI-Feature-Guide.md").write_text(text, encoding="utf-8")
    return text


# ---------------------------------------------------------------------------
# DOCX writer
# ---------------------------------------------------------------------------

def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def add_para(doc, text, size=11, bold=False, space_after=6, color=None, align=None):
    p = doc.add_paragraph()
    if align:
        p.alignment = align
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, color=color)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    return p


def add_heading_sc(doc, text, level=1):
    # Sentence case already expected in content
    style = f"Heading {min(level, 3)}"
    p = doc.add_paragraph(text, style=style)
    for run in p.runs:
        set_run_font(run, size={1: 18, 2: 14, 3: 12}.get(level, 12), bold=True, color=RGBColor(0x0B, 0x2A, 0x47))
    return p


def add_actions_table(doc, actions):
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Control"
    hdr[1].text = "What happens"
    for c in hdr:
        for p in c.paragraphs:
            for r in p.runs:
                set_run_font(r, size=10, bold=True)
    for control, outcome in actions:
        row = table.add_row().cells
        row[0].text = control
        row[1].text = outcome
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=10)
    doc.add_paragraph()


def add_feature_docx(doc, f):
    add_heading_sc(doc, f["title"], 3)
    add_para(doc, f"What it is. {f['what']}", size=11)
    add_para(doc, f"Who. {f['who']}", size=11)
    add_para(doc, f"Entry path. {f['entry']}", size=11)
    add_para(doc, "Actions.", size=11, bold=True, space_after=4)
    add_actions_table(doc, f["actions"])
    if f.get("docs"):
        add_para(doc, f"Docs. {f['docs']}", size=10, color=RGBColor(0x1D, 0x4E, 0x89))
    if f.get("screenshot"):
        path = SHOTS / f["screenshot"]
        if path.exists():
            try:
                doc.add_picture(str(path), width=Inches(5.8))
                last = doc.paragraphs[-1]
                last.alignment = WD_ALIGN_PARAGRAPH.CENTER
            except Exception as e:
                add_para(doc, f"[Screenshot could not be embedded: {e}]", size=9)
    if f.get("note"):
        add_para(doc, f"Note. {f['note']}", size=10, color=RGBColor(0x52, 0x52, 0x52))


def write_docx():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.85)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

    # Title page
    for _ in range(3):
        doc.add_paragraph()
    add_para(doc, "UniZ UI Feature Guide", size=28, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12, color=RGBColor(0x0B, 0x2A, 0x47))
    add_para(doc, "RGUKT Ongole", size=14, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_para(doc, TODAY, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)
    add_para(doc, f"Portal: {PORTAL}", size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, f"Technical docs: {DOCS_BASE}/", size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, "UI guidance — features and user actions by role", size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=24)
    doc.add_page_break()

    # TOC placeholder
    add_heading_sc(doc, "Contents", 1)
    toc_items = [
        "How to use this guide",
        "Role overview",
        "Public surfaces",
        "Student portal",
        "Admin portal — shared chrome & legacy pages",
        "Admin portal — academic & campus sections",
        "Admin portal — approvals & welfare",
        "Admin portal — security gate",
        "Faculty portal",
        "Appendix A. Route map",
        "Appendix B. Feature → docs URL map",
        "Appendix C. Screenshot checklist",
    ]
    for i, item in enumerate(toc_items, 1):
        add_para(doc, f"{i}. {item}", size=11, space_after=4)
    add_para(doc, "Tip. In Microsoft Word, select this list and use References → Table of Contents to refresh a dynamic TOC if desired.", size=9, color=RGBColor(0x66, 0x66, 0x66))
    doc.add_page_break()

    add_heading_sc(doc, "How to use this guide", 1)
    add_para(doc, "This document is a UI guidance inventory: every portal feature and every user-facing action, organized by role. It is not an architecture or API reference.")
    add_para(doc, "For each feature: what it is, who can use it, entry path (navigation + URL from App.tsx and admin section routes), every actionable control, and the plain-language outcome. Matching docs pages under the institutional docs site are linked when they exist.")
    add_para(doc, f"Technical details callout. Implementation and backend behaviour: {DOCS_BASE}/ — Roles, Action flows, and the Student / Admin / Faculty guides. Prefer those pages for endpoints, storage, and deployment.", size=10, color=RGBColor(0x33, 0x33, 0x33))
    add_para(doc, "Screenshot policy. Public pages were captured against the live portal where the route rendered. Authenticated screens are described from React UI source and docs and marked Live screenshot pending test account. No credentials were invented or stored.")
    add_para(doc, "Feature flags. Outing and outpass flows are gated by VITE_ENABLE_OUTPASS_OUTING (default off). Related routes may be commented out in App.tsx while the flag is off.")

    add_heading_sc(doc, "Role overview", 1)
    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    for i, h in enumerate(["Role", "Audience", "Primary UI"]):
        table.rows[0].cells[i].text = h
        for p in table.rows[0].cells[i].paragraphs:
            for r in p.runs:
                set_run_font(r, size=10, bold=True)
    for role, audience, primary in ROLE_OVERVIEW:
        row = table.add_row().cells
        row[0].text, row[1].text, row[2].text = role, audience, primary
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=10)
    doc.add_paragraph()
    add_para(doc, f"Authorization semantics: {DOCS_BASE}/roles", size=10)

    blocks = [
        ("Public surfaces", PUBLIC),
        ("Student portal", STUDENT),
        ("Admin portal — shared chrome & legacy pages", ADMIN_SHARED + LEGACY_ADMIN),
        ("Admin portal — academic & campus sections", SECTION_FEATURES),
        ("Admin portal — approvals & welfare", APPROVALS),
        ("Admin portal — security gate", SECURITY),
        ("Faculty portal", FACULTY),
    ]
    for title, feats in blocks:
        add_heading_sc(doc, title, 1)
        for f in feats:
            add_feature_docx(doc, f)

    add_heading_sc(doc, "Appendix A. Route map", 1)
    t = doc.add_table(rows=1, cols=2)
    t.style = "Table Grid"
    t.rows[0].cells[0].text = "Path"
    t.rows[0].cells[1].text = "Surface"
    for path, label in ROUTE_MAP:
        row = t.add_row().cells
        row[0].text = path
        row[1].text = label
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=9)
    doc.add_paragraph()
    add_para(doc, "Admin shell tabs sync via apps/uniz-portal/src/utils/adminSectionRoutes.ts.", size=9)

    add_heading_sc(doc, "Appendix B. Feature → docs URL map", 1)
    t = doc.add_table(rows=1, cols=2)
    t.style = "Table Grid"
    t.rows[0].cells[0].text = "Topic"
    t.rows[0].cells[1].text = "Docs URL"
    for topic, url in DOCS_MAP:
        row = t.add_row().cells
        row[0].text = topic
        row[1].text = url
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=9)
    doc.add_paragraph()

    add_heading_sc(doc, "Appendix C. Screenshot checklist", 1)
    t = doc.add_table(rows=1, cols=2)
    t.style = "Table Grid"
    t.rows[0].cells[0].text = "Section"
    t.rows[0].cells[1].text = "Source"
    checklist = [
        ("Home /", "Live screenshot embedded"),
        ("Student sign-in /student/signin", "Live screenshot embedded"),
        ("Developers, Privacy", "Code-derived; production soft-fallback observed"),
        ("SEO / StudySpace / CampusHub", "Code-derived"),
        ("Student authenticated pages", "Code-derived — Live screenshot pending test account"),
        ("Admin / faculty authenticated pages", "Code-derived — Live screenshot pending test account"),
    ]
    for a, b in checklist:
        row = t.add_row().cells
        row[0].text = a
        row[1].text = b
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=9)

    out = ROOT / "UniZ-UI-Feature-Guide.docx"
    doc.save(out)
    return out


def main():
    write_markdown()
    out = write_docx()
    print("Wrote", ROOT / "UniZ-UI-Feature-Guide.md")
    print("Wrote", out)
    probe = ROOT / "_write_probe"
    if probe.exists():
        probe.unlink()


if __name__ == "__main__":
    main()
