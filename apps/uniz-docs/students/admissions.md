# Admissions (live)

Public application form, review, and handover of admitted students to the existing Add Students upload.

## Where
- Public form and status check: `/admissions` on the portal, no login.
- Webadmin: Webmaster portal, "Admissions". Dean and Director: Dean portal, "Admissions".

## Flow
1. Staff create a cycle: name, academic year, programs, open and close dates, application fee.
2. Applicants fill the form while a cycle is open. Cloudflare Turnstile protects it. If `TURNSTILE_SECRET_KEY` is not set on the API, the form shows "Online form not configured" and nothing is accepted.
3. Documents (photo, marks memo, ID proof, caste certificate) are shared as links.
4. Each application gets a reference number. Applicants check status with the reference number and email.
5. Application fee: online payment is not live, the form shows "Payments coming soon". Staff can mark the fee paid at the counter or waived.
6. Staff review: `submitted`, `under_review`, `accepted`, `waitlisted`, `rejected`.
7. Convert: "Download and mark converted" gives a CSV in the Add Students upload format (id, name, email, gender, branch, phone, batch, category). Fill the ID column and upload it in Students. Converted applications are locked.

## API
Under `/api/v1/admissions`.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/public/cycles` | public |
| POST | `/public/apply` | public, Turnstile |
| GET | `/public/status?refNo=&email=` | public |
| GET | `/status` | signed in |
| GET, POST | `/cycles`, PUT `/cycles/:id` | webadmin, director, dean |
| GET | `/cycles/:id/applications`, `/cycles/:id/stats` | staff |
| POST | `/cycles/:id/export` | staff |
| GET | `/applications/:id`, POST `/applications/:id/review` | staff |

Tables: `AdmissionCycle`, `Application`, `ApplicationDocument`. Flag: `FEATURE_ADMISSIONS`. Keys: `TURNSTILE_SECRET_KEY` on the API, `VITE_TURNSTILE_SITE_KEY` on the portal (both already used by sign in).
