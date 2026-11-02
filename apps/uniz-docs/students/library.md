# Library (live)

Catalogue search, issue and return by copy barcode, due reminders and fines. Fines are shown in UniZ; paying them online is coming soon, so they are paid at the library counter and marked paid.

## Where
- Students: sidebar "Library" (`/student/library`): books with you, due dates, fines, catalogue search.
- Faculty, teachers, HODs: Faculty portal, "Library".
- Librarian (existing `librarian` admin role): signs in at the admin portal and lands on the Library Desk.
- Webadmin: Webmaster portal, "Library".

## Rules
- Students borrow up to 3 books for 14 days. Faculty borrow up to 10 books for 30 days.
- A borrower with an unpaid fine cannot borrow until it is paid or waived. Suspended students cannot borrow.
- Fine is Rs 1 per full day late, created when the book comes back.
- "Send due reminders" pushes a notification (and an inbox entry) to everyone with a book due in 2 days or overdue, at most once a day per loan.

## CSV import
Header row with `title` and `barcode` required. Optional: `author`, `isbn`, `publisher`, `year`, `category`, `shelf`. One row per physical copy. Rows with the same ISBN (or same title and author) become one title with many copies. Existing barcodes are skipped, so re-importing is safe. The portal uploads big files in batches of 400 rows.

## API
All under `/api/v1/library`, login required.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/status` | anyone logged in |
| GET | `/books?q=` | anyone logged in |
| POST | `/books` | librarian, webadmin, director |
| POST | `/import` | librarian, webadmin, director |
| POST | `/issue` | librarian, webadmin, director |
| POST | `/return` | librarian, webadmin, director |
| GET | `/loans?status=active` | librarian, webadmin, director |
| GET | `/mine` | borrower |
| GET | `/fines?status=unpaid` | librarian, webadmin, director |
| POST | `/fines/:id/settle` | librarian, webadmin, director |
| POST | `/remind` | librarian, webadmin, director |

Tables: `Book`, `BookCopy`, `Loan`, `LibraryFine`. Turn the module off with `FEATURE_LIBRARY=false`.
