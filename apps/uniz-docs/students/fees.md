# Fees (live, online payments coming soon)

Students can see their fee invoices and receipts. Online payment is not switched on yet: the pay button shows "Payments coming soon" and nothing is charged. Pay at the accounts section as usual; staff record it here.

## Where
- Students: sidebar "Fees" (`/student/fees`).
- Webadmin: Webmaster portal, "Fees".
- Dean: Dean portal, Academic group, "Fees".

## Flow
1. Admin creates a fee structure: name, academic year, due date, optional batch, branch and year filters (blank means all students), and line items like `Tuition:35000, Hostel:12000`.
2. Admin clicks "Issue invoices". One invoice is created per matching active student. Clicking again only adds invoices for new students.
3. Students see each invoice with amount, paid so far and status (`due`, `partial`, `paid`).
4. When a student pays at the counter or bank, admin records the amount, method (`cash`, `dd`, `bank_transfer`, `challan`) and the receipt or DD number. The same reference cannot be recorded twice, and an invoice cannot be overpaid.

## API
All under `/api/v1/fees`, login required.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/status` | anyone logged in |
| POST, GET | `/structures` | webadmin, director, dean |
| POST | `/structures/:id/issue` | webadmin, director, dean |
| GET | `/invoices?status=due` | webadmin, director, dean |
| GET | `/mine` | student |
| POST | `/invoices/:id/pay` | student, returns 503 `PAYMENTS_DISABLED` "Payments coming soon" |
| POST | `/invoices/:id/record` | webadmin, director, dean |

Amounts are stored in paise. There is no payment webhook. Turn the module off with `FEATURE_FEES=false`.
