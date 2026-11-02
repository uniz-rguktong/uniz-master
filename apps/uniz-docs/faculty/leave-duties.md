# Leave and duties (live)

Faculty apply for leave, the HOD reviews it, then the Dean gives final approval. HODs and the Dean also keep a duty roster.

## Where
- Faculty: Faculty portal, sidebar "Leave & Duties".
- HOD: Faculty portal "Leave Approvals", or HOD portal "Leave & Duties".
- Dean, Director, webadmin: Dean portal "Leave & Duties".

## Flow
1. Faculty picks a type (CL, EL, ML, OD, SCL), dates and a reason. Balance is checked first.
2. Status goes `pending_hod`. A HOD's own leave goes straight to `pending_dean`.
3. HOD of that department approves (moves to `pending_dean`) or rejects.
4. Dean approves (`approved`, days booked against the yearly balance) or rejects.
5. The applicant can cancel while it is still pending.

Default yearly balances until the Establishment policy is in: CL 12, EL 15, ML 10, OD 30, SCL 7.

## API (all need a token, through the gateway)
| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/v1/leave/status` | any signed in |
| POST | `/api/v1/leave/apply` | faculty, teacher, hod |
| GET | `/api/v1/leave/mine` | faculty, teacher, hod |
| GET | `/api/v1/leave/balance` | faculty, teacher, hod |
| GET | `/api/v1/leave/pending` | hod (own dept), dean, director, webadmin |
| POST | `/api/v1/leave/:id/decide` | hod then dean |
| POST | `/api/v1/leave/:id/cancel` | owner |
| GET | `/api/v1/duty/mine` | faculty, teacher, hod |
| GET | `/api/v1/duty/roster` | hod (own dept), dean, director, webadmin |
| POST | `/api/v1/duty/assign` | hod (own dept), dean, director, webadmin |
| DELETE | `/api/v1/duty/:id` | hod (own dept), dean, director, webadmin |

## Tables
`LeaveRequest`, `LeaveBalance`, `DutyAssignment` in the user database (additive migration `20261102090000_faculty_leave_duties`).

## Flag and keys
Flag `FEATURE_FACULTY` (on by default). Alerts go through the existing push and notification inbox. SMS shows "SMS alerts not configured" until `SMS_API_KEY` is set.
