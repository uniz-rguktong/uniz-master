# Course feedback (live)

Students give anonymous feedback on each subject they are registered for. Faculty and the exam cell only ever see averages, and only once 5 or more students have replied.

## Where
- Students: sidebar "Feedback" (`/student/feedback`). The Grievance page links here for course or faculty feedback. Complaints still go through Grievance.
- Exam cell (coe, webadmin): Webmaster portal, Academic group, "Course Feedback".
- Dean: Dean portal, Academic group, "Course Feedback".
- Faculty, teachers, HODs: Faculty portal, "My Feedback" (only forms tagged with their username).

## Flow
1. Exam cell or Dean picks a semester and subject, optionally a faculty username, and a closing date, then opens the form. Five standard questions on a 1 to 5 scale are used.
2. Students registered for that subject in that semester see the form until it closes. One answer per student per form.
3. Results show the average per question and the comments, only at 5 or more responses.

## Anonymity
- `FeedbackResponse` has no student id. Its date is stored without a time.
- `FeedbackReceipt` only keeps a salted one-way hash of form and student, so repeat answers are blocked without linking a student to an answer.

## API (all need a token, through the gateway)
| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/v1/feedback/status` | any signed in |
| POST | `/api/v1/feedback/forms` | coe, dean, director, webadmin |
| GET | `/api/v1/feedback/forms?semesterId` | coe, dean, director, webadmin |
| POST | `/api/v1/feedback/forms/:id/close` | coe, dean, director, webadmin |
| GET | `/api/v1/feedback/open` | student |
| POST | `/api/v1/feedback/forms/:id/submit` | student registered for the subject |
| GET | `/api/v1/feedback/forms/:id/results` | admins, or the tagged faculty |
| GET | `/api/v1/feedback/mine` | faculty, teacher, hod |

Rate limit: 120 requests per minute per user.

## Data
Tables `FeedbackForm`, `FeedbackResponse`, `FeedbackReceipt` in the academics database. Forms link to `Subject` and `AcademicSemester` by id, and to faculty by username.

## Flag and keys
- Flag: `FEATURE_FEEDBACK`, on by default. Set it to `false` to hide the nav and return 503 on the API.
- Optional `FEEDBACK_SALT` for the receipt hash. Without it the existing JWT key is used. No other keys.
