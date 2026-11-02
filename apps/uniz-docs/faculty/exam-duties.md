# Exam duties (live)

The exam cell builds invigilation duties from the seating arrangement halls. Faculty see their duties and can ask for a swap.

## Where
- Exam cell (coe, webadmin): Webmaster portal, Academic group, "Exam Duties".
- Dean: Dean portal, Academic group, "Exam Duties".
- Faculty, teachers, HODs: Faculty portal, sidebar "Exam Duties".

## Flow
1. Upload the seating arrangement for the exam with dates (Seating upload, as before).
2. In "Exam Duties" pick the semester and exam. The page lists the halls found in seating.
3. Paste the faculty usernames on duty and press Generate. One invigilator per 30 students, at most 3 per hall. The first one in a hall is `chief`. Nobody gets two halls in the same slot and load is spread evenly.
4. Faculty get an app notification and see the duty under "Exam Duties".
5. A faculty member can request a swap with a named colleague. The exam cell approves or rejects it. Approval is blocked if the colleague already has a duty in that slot.
6. "Print roster" prints the full table for the exam.

Generating again for the same exam needs a confirm and rebuilds the roster.

## API (all need a token, through the gateway)
| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/v1/examduty/status` | any signed in |
| GET | `/api/v1/examduty/halls?semesterId&examName` | coe, dean, director, webadmin |
| POST | `/api/v1/examduty/generate` | coe, dean, director, webadmin |
| GET | `/api/v1/examduty/roster?semesterId&examName` | coe, dean, director, webadmin |
| GET | `/api/v1/examduty/mine` | faculty, teacher, hod |
| POST | `/api/v1/examduty/:id/swap` | duty owner |
| GET | `/api/v1/examduty/swaps` | coe, dean, director, webadmin |
| POST | `/api/v1/examduty/:id/swap/decide` | coe, dean, director, webadmin |

Rate limit: 120 requests per minute per user.

## Data
Table `ExamDuty` in the academics database. It links to `SeatingArrangement` by semester, exam name, room and date, and to faculty by username (FacultyProfile lives in the user database).

## Flag and keys
- Flag: `FEATURE_EXAM_DUTIES`, on by default. Set it to `false` to hide the nav and return 503 on the API.
- SMS alerts need `SMS_API_KEY`. Without it the page says "SMS alerts not configured" and only app notifications go out.
