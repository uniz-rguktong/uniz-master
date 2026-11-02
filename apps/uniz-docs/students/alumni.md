# Alumni (live)

Graduates claim an alumni profile, choose whether to appear in the public directory, and post jobs for students.

## Where
- Public directory: `/alumni` on the portal, no login. Only profiles that opted in are shown, without email or ID.
- Students and graduates: sidebar "Alumni" (`/student/alumni`): claim profile, edit it, jobs board, directory.
- Webadmin: Webmaster portal, "Alumni". Dean and Director: Dean portal, "Alumni". Staff see all claimed profiles and can post or close jobs.

## Claiming
1. Sign in with the student account and open Alumni.
2. "Send code" mails a 6 digit code to the email on the student profile (existing mail service). Valid 10 minutes, max 5 codes an hour.
3. Enter the code. The profile copies name, branch and batch from the student record. Add company, role, city, LinkedIn, graduation year, bio, and tick "Show me in the public alumni directory" to be listed.

## Jobs board
Verified alumni and staff post jobs with an apply link. Open jobs show to every signed in user until the deadline or until closed by the poster or staff.

## API
Under `/api/v1/alumni`.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/directory?q=&batch=&branch=` | public |
| GET | `/status`, `/me`, `/jobs` | signed in |
| POST | `/claim/start`, `/claim/verify` | student |
| PUT | `/me` | claimed alumni |
| GET | `/all` | webadmin, director, dean |
| POST | `/jobs` | claimed alumni, staff |
| POST | `/jobs/:id/close` | poster, staff |

Tables: `AlumniProfile` (linked to the student by `username` and `studentId` text), `AlumniJob`. Flag: `FEATURE_ALUMNI`. Keys: none, reuses mail.
