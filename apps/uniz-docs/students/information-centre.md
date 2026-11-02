# Information Centre (live)

One searchable place for notices, circulars, tenders, academic calendars, downloads and forms.

## Where
- Public: `/info` on the portal, no login.
- Students: sidebar "Info Centre" (`/student/info`).
- Webadmin: Webmaster portal, "Info Centre". Dean and Director: Dean portal, "Info Centre".

## How it works
- The hub merges three sources: Information Centre items, public notices (Notifications tab) and tenders (Tenders tab). Nothing is copied, notices and tenders are still managed where they were.
- Staff add items with a category (`circular`, `calendar`, `download`, `form`, `other`), title, summary, link, tags and an optional date. Items can be pinned to the top or hidden.
- Files: paste a link (PDF on Drive or the existing upload flow). There is no new upload system.
- Search covers title, summary and tags. Category chips filter the list.

## API
Under `/api/v1/infocentre`.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/hub?q=&category=` | public |
| GET | `/categories` | public |
| GET, POST | `/items` | webadmin, director, dean |
| PUT | `/items/:id` | webadmin, director, dean |

Table: `InfoItem`. Reuses `PublicNotification` and `Tender`. Flag: `FEATURE_INFO_CENTRE`. Keys: none.
