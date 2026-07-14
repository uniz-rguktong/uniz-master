# Semester Registration — Excel Bulk Upload

**Status:** Planned (future integration)  
**Last reviewed:** 2026-07-07  
**Related (shipped):** Registration confirmation PDF — `GET /academics/student/registration/pdf`

---

## Goal

Let academics upload semester registrations via Excel (same mental model as grades/attendance), so admin can:

- Import Google Form exports into uniZ without manual re-entry
- Eventually replace Forms with template → upload → review → done

Students still see registered subjects in the portal and can download the official PDF slip.

---

## What exists today

### Student registration (live)

| Piece | Location |
|-------|----------|
| Register API | `POST /academics/student/register` — `registration.controller.ts` → `registerSubjects` |
| Current subjects | `GET /academics/student/current/:studentId` |
| PDF slip | `GET /academics/student/registration/pdf` — `pdf.util.ts` → `generateRegistrationPdf` |
| Portal UI | `pages/student/components/CourseRegistration.tsx`, `RegisteredSubjectsPanel.tsx` |
| Data model | `Registration`, `AcademicSemester`, `BranchAllocation`, `Subject` — `prisma/schema.prisma` |

### Admin read / export (live)

| Piece | Location |
|-------|----------|
| List registrations | `GET /academics/registrations` — `getRegistrations` |
| Tracking (registered vs pending) | `GET /academics/registrations/tracking` — `getRegistrationTracking` |
| Excel export | `GET /academics/export?type=registrations` — `exportAcademicData` |

### Grades / attendance upload pattern (reuse this)

| Piece | Location |
|-------|----------|
| Upload endpoints | `POST /academics/grades/upload`, `POST /academics/attendance/upload` |
| Templates | `GET /academics/grades/template`, `GET /academics/attendance/template` |
| Worker | `apps/uniz-academics/src/services/upload.service.ts` (Redis `job:queue`, 50-row batches) |
| Progress | `GET /academics/upload/progress?uploadId=` |
| Admin UI reference | `apps/uniz-portal/src/pages/admin/AddGrades.tsx` |

### Not built yet

- `POST /academics/registration/upload`
- `GET /academics/registration/template`
- `REGISTRATIONS` job type in `upload.service.ts`
- Admin upload page (e.g. `AddRegistration.tsx`)
- Shared validation helper extracted from `registerSubjects`

---

## Proposed Excel format (long format)

One row = one student–subject registration (maps directly to `Registration`).

| Student ID | Subject Code | Semester ID |
|------------|--------------|-------------|
| O21CS0123  | CS301        | AY-2025-26-E3-SEM-1 |
| O21CS0123  | CS302        | AY-2025-26-E3-SEM-1 |

**Preferred:** Pre-filled template (like grades):

1. Fetch eligible students from user service (`branch`, `year`, `batch`)
2. Fetch approved `BranchAllocation` rows for the semester
3. Pre-fill mandatory subjects; admin fills electives only

Avoid wide format (one column per subject) unless we add an unpivot step — harder to validate.

---

## Validation (must reuse portal logic)

Bulk upload must call the same rules as `registerSubjects`:

- Semester status = `REGISTRATION_OPEN` (or admin override flag)
- Registration window (`registrationStart` / `registrationEnd`)
- Student branch/year matches allocations
- All mandatory subjects present per student
- Elective group limits (`electiveGroupId`, `electiveLimit`)
- Unique constraint: `@@unique([studentId, subjectId, semesterId])`
- Business rule: one registration event per student per semester (currently 409 if already registered)

**Re-upload policy (decide before build):**

| Mode | Behavior |
|------|----------|
| `skip` | Skip students who already have registrations |
| `replace` | Delete existing rows for student+semester, then insert |
| `merge` | Add missing subjects only; reject conflicts |

Recommend **`skip` default** + optional `replace` for webmaster only.

---

## Review workflow

Reuse existing pieces:

- Upload progress + per-row errors (grades pattern)
- `getRegistrationTracking` for post-upload completion %

Add for safety (registration is harder to undo than grades):

1. **Dry-run** — `?dryRun=true` validates only, no writes
2. **Preview summary** — N students, M rows, K errors before commit
3. Optional push notification after successful bulk import per student

---

## Proposed API surface

```
GET  /academics/registration/template
     ?semesterId=&branch=&year=&batch=

POST /academics/registration/upload
     multipart file + semesterId + mode=skip|replace
     optional dryRun=true

GET  /academics/upload/progress?uploadId=   (existing)
```

### Worker change

In `upload.service.ts`, add `type === "REGISTRATIONS"`:

1. Parse row → `studentId`, `subjectCode`, `semesterId`
2. Group rows by `studentId`
3. For each student: `validateAndRegister(studentId, subjectIds, semesterId)`
4. Record upload history via existing `recordUploadHistory`

### Code to extract

Move validation from `registerSubjects` into e.g.:

```
apps/uniz-academics/src/services/registration.service.ts
  - validateRegistrationSelection(studentId, subjectIds, semesterId)
  - applyRegistration(studentId, subjectIds, semesterId, options)
```

Both portal `POST /student/register` and bulk upload call this.

---

## Frontend (admin)

New page mirroring `AddGrades.tsx`:

- Download template
- Upload file
- Show progress bar (`ACADEMICS_PROGRESS`)
- Error list (row number, student, message)
- Link to registration tracking dashboard

**Endpoints to add in** `apps/uniz-portal/src/api/endpoints.ts`:

```ts
export const GET_REGISTRATION_TEMPLATE = (semesterId, branch, year, batch?) => ...
export const UPLOAD_REGISTRATION = `${BASE_URL}/academics/registration/upload`
```

**Route:** e.g. `/admin/registration-upload` in `App.tsx` + admin sidebar entry.

---

## Use cases

| Scenario | Flow |
|----------|------|
| **A — Google Form backfill** | Form export → map to template → upload → students see subjects + PDF |
| **B — Official bulk reg** | Template from allocations → academics fill → upload → tracking shows % |

Same backend; B is the long-term target.

---

## Effort estimate

| Task | Estimate |
|------|----------|
| Extract `registration.service.ts` validation | 0.5 day |
| Template + upload endpoints + worker branch | 1 day |
| Dry-run + preview response | 0.5 day |
| Admin UI (`AddRegistration.tsx`) | 0.5–1 day |
| Testing with real semester data | 0.5 day |

**Total:** ~2–3 focused days.

---

## Implementation checklist

- [ ] Extract shared validation from `registerSubjects`
- [ ] `GET /registration/template` (ExcelJS, pre-filled mandatory subjects)
- [ ] `POST /registration/upload` (multer → Redis queue)
- [ ] `REGISTRATIONS` handler in `upload.service.ts`
- [ ] Dry-run mode + error report shape
- [ ] `AddRegistration.tsx` admin page
- [ ] Endpoints + admin nav link
- [ ] Document re-upload policy in admin UI
- [ ] E2E test: upload → tracking shows registered → student PDF works

---

## Pitch for administration

> Keep your Google Form this semester if needed — we'll give you an Excel template that matches uniZ. Upload once: every student gets a proper record and can download their registration slip. Same workflow you already use for grades and attendance.

---

## References

- Registration controller: `apps/uniz-academics/src/controllers/registration.controller.ts`
- Upload worker: `apps/uniz-academics/src/services/upload.service.ts`
- PDF generator: `apps/uniz-academics/src/utils/pdf.util.ts`
- Sample PDF script: `apps/uniz-academics/scripts/generate-registration-pdf-sample.ts`
- Grades upload UI: `apps/uniz-portal/src/pages/admin/AddGrades.tsx`
