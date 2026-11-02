# Placements (live)

Placement drives with eligibility, applications with a resume link, a status pipeline, and offer stats.

## Where
- Students: sidebar "Placements" (`/student/placement`).
- Webadmin: Webmaster portal, "Placements". Dean and Director: Dean portal, Academic group, "Placements" (API access for director).

## Flow
1. Staff add a company, then a drive: title, role, CTC in LPA, location, branches (blank = all), batches, minimum CGPA, maximum backlogs, deadline.
2. Students see open drives with an eligibility check against their profile CGPA, backlogs, branch and batch. Eligible students apply with a public resume link (file upload for PDFs is not wired yet).
3. Staff move each applicant through `applied`, `shortlisted`, `interview`, `selected`, `rejected`. The student gets a notification on each change. `selected` creates an offer.
4. Students accept or decline offers. Stats show students placed, offers, average and max CTC, offers per company.

## API
All under `/api/v1/placement`, login required. Staff are webadmin, director, dean.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/status` | anyone logged in |
| POST, GET | `/companies` | staff |
| POST | `/drives` | staff |
| GET | `/drives` | staff (all), students (open, with eligibility) |
| POST | `/drives/:id/close` | staff |
| POST | `/drives/:id/apply` | student |
| GET | `/drives/:id/applications` | staff |
| GET | `/mine` | student |
| POST | `/applications/:id/status` | staff |
| POST | `/offers/:id/respond` | student |
| GET | `/stats` | staff |

Tables: `Company`, `PlacementDrive`, `DriveApplication`, `Offer`. Flag: `FEATURE_PLACEMENT`.
