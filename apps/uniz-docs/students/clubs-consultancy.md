# Clubs and Consultancy (live)

## Clubs
- Students: sidebar "Clubs" (`/student/clubs`). Browse active clubs, request to join, leave.
- Coordinators (student or faculty usernames set on the club) approve or reject members and post events.
- Events also go into the Information Centre feed as a `calendar` item tagged `club`.
- Webadmin, Director, Dean: "Clubs" tab in the Webmaster or Dean portal to create clubs, set coordinators, activate or deactivate.

## Consultancy
- "Consultancy" tab in the Webmaster and Dean portals. Register of projects: title, client, faculty, department, value in Rs, dates, status (`proposed`, `ongoing`, `completed`, `cancelled`), with totals per status.
- Faculty can add projects through the API and see projects that list them. Staff see and edit all.

## API
Under `/api/v1/clubs`, login required.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/`, `/status`, `/events`, `/:id/events` | signed in |
| POST | `/` , PUT `/:id` | webadmin, director, dean |
| POST | `/:id/join`, `/:id/leave` | signed in |
| GET | `/:id/members`, POST `/:id/members/:memberId` | coordinator, staff |
| POST | `/:id/events` | coordinator, staff |
| GET, POST | `/consultancy` | faculty, staff |
| PUT | `/consultancy/:id` | creator, staff |

Tables: `Club`, `ClubMember`, `ClubEvent`, `ConsultancyProject`. Flag: `FEATURE_CLUBS`. Keys: none.
