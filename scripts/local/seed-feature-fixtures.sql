-- Fictional module rows for local feature screenshots.
-- Run after scripts/local/seed-local.ts. No production data.

UPDATE uniz_auth."AuthCredential" SET username = upper(username);
UPDATE uniz_user."AdminProfile" SET username = upper(username);
UPDATE uniz_user."FacultyProfile" SET username = upper(username);
UPDATE uniz_user."StudentProfile" SET username = upper(username);

UPDATE uniz_user."StudentProfile"
SET
  batch = 'D21',
  gender = 'Female',
  phone = '9000000101',
  "fatherName" = 'Ravi Demo',
  "motherName" = 'Lata Demo',
  "bloodGroup" = 'O+',
  section = 'A',
  campus = 'Ongole',
  cgpa = 8.42,
  "totalBacklogs" = 0
WHERE username = 'D210001';

UPDATE uniz_user."StudentProfile"
SET
  batch = 'D21',
  gender = 'Female',
  phone = '9000000102',
  section = 'A',
  campus = 'Ongole',
  cgpa = 0,
  "totalBacklogs" = 0
WHERE username = 'D210002';

INSERT INTO uniz_academics."Subject" (id, code, name, credits, department, semester)
VALUES
  ('sub-demo-cs401', 'CS401', 'Demo Operating Systems', 4, 'CSE', 'E4-SEM1'),
  ('sub-demo-cs402', 'CS402', 'Demo Computer Networks', 3, 'CSE', 'E4-SEM1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."AcademicSemester"
  (id, name, status, "academicYear", batch, program, "registrationStart", "registrationEnd", "createdAt", "updatedAt")
VALUES
  ('sem-demo-2026', 'AY 2025-26 SEM-I', 'REGISTRATION_OPEN', 'AY 2025-26', 'D21', 'B.Tech', NOW() - INTERVAL '2 days', NOW() + INTERVAL '20 days', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."Grade"
  (id, "studentId", "subjectId", "semesterId", "attemptNumber", grade, batch, "isRemedial", "subjectCode", "subjectName", "createdAt", "updatedAt")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'D210001', 'sub-demo-cs401', 'E4-SEM-1', 1, 9, 'D21', false, 'CS401', 'Demo Operating Systems', NOW(), NOW()),
  ('11111111-1111-4111-8111-111111111112', 'D210001', 'sub-demo-cs402', 'E4-SEM-1', 1, 8, 'D21', false, 'CS402', 'Demo Computer Networks', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."Attendance"
  (id, "studentId", "subjectId", "semesterId", "totalClasses", "attendedClasses", batch, "subjectCode", "subjectName", "createdAt", "updatedAt")
VALUES
  ('22222222-2222-4222-8222-222222222221', 'D210001', 'sub-demo-cs401', 'E4-SEM-1', 40, 36, 'D21', 'CS401', 'Demo Operating Systems', NOW(), NOW()),
  ('22222222-2222-4222-8222-222222222222', 'D210001', 'sub-demo-cs402', 'E4-SEM-1', 32, 30, 'D21', 'CS402', 'Demo Computer Networks', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."BranchAllocation"
  (id, branch, "academicYear", batch, "subjectId", "semesterId", status, "isApproved", "isMandatory")
VALUES
  ('33333333-3333-4333-8333-333333333331', 'CSE', 'E4', 'D21', 'sub-demo-cs401', 'sem-demo-2026', 'APPROVED', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."Registration"
  (id, "studentId", "subjectId", "semesterId", batch, status, "createdAt", "updatedAt")
VALUES
  ('44444444-4444-4444-8444-444444444441', 'D210001', 'sub-demo-cs401', 'sem-demo-2026', 'D21', 'REGISTERED', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."SeatingArrangement"
  (id, "studentId", batch, "subjectId", "semesterId", room, "seatNumber", "examName", date, time, "createdAt", "updatedAt")
VALUES
  ('55555555-5555-4555-8555-555555555551', 'D210001', 'D21', 'sub-demo-cs401', 'sem-demo-2026', 'LH-1', 'A-12', 'SEM-END', NOW() + INTERVAL '14 days', '10:00 AM - 1:00 PM', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."ExamDuty"
  (id, "semesterId", "examName", room, date, time, "studentCount", "facultyUsername", role, "createdBy", "createdAt", "updatedAt")
VALUES
  ('66666666-6666-4666-8666-666666666661', 'sem-demo-2026', 'SEM-END', 'LH-1', CURRENT_DATE + 14, '10:00 AM - 1:00 PM', 30, 'FACULTY_CSE', 'invigilator', 'WEBADMIN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_academics."FeedbackForm"
  (id, "semesterId", "subjectId", "facultyUsername", title, questions, "closesAt", status, "createdBy", "createdAt", "updatedAt")
VALUES
  (
    '77777777-7777-4777-8777-777777777771',
    'sem-demo-2026',
    'sub-demo-cs401',
    'FACULTY_CSE',
    'Demo Operating Systems feedback',
    '[{"id":"q1","text":"The sessions were clear","scale":5}]'::jsonb,
    NOW() + INTERVAL '30 days',
    'open',
    'WEBADMIN',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."FeeStructure"
  (id, name, "academicYear", batch, branch, year, items, "amountPaise", "dueDate", active, "createdBy", "createdAt", "updatedAt")
VALUES
  (
    '88888888-8888-4888-8888-888888888881',
    'Demo tuition 2025-26',
    '2025-26',
    'D21',
    'CSE',
    'E4',
    '[{"label":"Tuition","amountPaise":2500000}]'::jsonb,
    2500000,
    CURRENT_DATE + 30,
    true,
    'WEBADMIN',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."FeeInvoice"
  (id, "studentId", username, "structureId", title, "amountPaise", "paidPaise", status, "dueDate", "issuedBy", "createdAt", "updatedAt")
SELECT
  '88888888-8888-4888-8888-888888888882',
  s.id::text,
  s.username,
  '88888888-8888-4888-8888-888888888881',
  'Demo tuition 2025-26',
  2500000,
  0,
  'due',
  CURRENT_DATE + 30,
  'WEBADMIN',
  NOW(),
  NOW()
FROM uniz_user."StudentProfile" s
WHERE s.username = 'D210001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."Book"
  (id, isbn, title, author, publisher, year, category, "createdBy", "createdAt", "updatedAt")
VALUES
  ('99999999-9999-4999-8999-999999999991', '9780000000001', 'Demo Algorithms', 'Ada Demo', 'Campus Press', '2024', 'CSE', 'LIBRARIAN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."BookCopy"
  (id, "bookId", barcode, shelf, status, "createdAt", "updatedAt")
VALUES
  ('99999999-9999-4999-8999-999999999992', '99999999-9999-4999-8999-999999999991', 'DEMO-BC-001', 'A-1', 'issued', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."Loan"
  (id, "copyId", "bookId", "borrowerUsername", "borrowerType", "issuedAt", "dueDate", "issuedBy")
VALUES
  ('99999999-9999-4999-8999-999999999993', '99999999-9999-4999-8999-999999999992', '99999999-9999-4999-8999-999999999991', 'D210001', 'student', NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days', 'LIBRARIAN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."Company" (id, name, website, contact, notes, "createdBy", "createdAt")
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Demo Labs', 'https://example.test', 'hr@example.test', 'Fictional recruiter', 'WEBADMIN', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."PlacementDrive"
  (id, "companyId", title, "jobRole", "ctcLpa", location, description, branches, batches, "minCgpa", "maxBacklogs", deadline, status, "createdBy", "createdAt", "updatedAt")
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Demo software intern',
    'Intern',
    6,
    'Hyderabad',
    'Fictional drive for local screenshots.',
    'CSE',
    'D21',
    7,
    2,
    NOW() + INTERVAL '21 days',
    'open',
    'WEBADMIN',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."AlumniProfile"
  (id, username, "studentId", name, email, branch, batch, "graduationYear", company, "jobTitle", location, bio, visible, "verifiedAt", "createdAt", "updatedAt")
VALUES
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'D200001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'Kiran Demo',
    'd200001@example.test',
    'CSE',
    'D20',
    2026,
    'Demo Labs',
    'Software engineer',
    'Hyderabad',
    'Fictional alumnus for the local directory.',
    true,
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."AlumniJob"
  (id, "postedBy", company, title, location, kind, "applyUrl", description, deadline, active, "createdAt")
VALUES
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'D200001',
    'Demo Labs',
    'Junior engineer',
    'Hyderabad',
    'full-time',
    'https://example.test/jobs/junior',
    'Fictional alumni job post.',
    NOW() + INTERVAL '40 days',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."InfoItem"
  (id, category, title, summary, url, tags, "eventDate", pinned, "isVisible", "createdBy", "createdAt", "updatedAt")
VALUES
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'academic',
    'Demo academic calendar note',
    'Fictional information-centre item for local screenshots.',
    'https://example.test/calendar',
    'calendar,demo',
    NOW() + INTERVAL '7 days',
    true,
    true,
    'WEBADMIN',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."LeaveBalance"
  (id, "facultyId", year, "leaveType", total, used, "updatedAt")
SELECT
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  f.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::int,
  'CL',
  12,
  1,
  NOW()
FROM uniz_user."FacultyProfile" f
WHERE f.username = 'FACULTY_CSE'
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."LeaveRequest"
  (id, "facultyId", username, department, "leaveType", "fromDate", "toDate", days, reason, status, "createdAt", "updatedAt")
SELECT
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  f.id,
  f.username,
  f.department,
  'CL',
  CURRENT_DATE + 3,
  CURRENT_DATE + 3,
  1,
  'Fictional clinic visit for the local demo.',
  'pending_hod',
  NOW(),
  NOW()
FROM uniz_user."FacultyProfile" f
WHERE f.username = 'FACULTY_CSE'
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_user."Grievance"
  (id, "studentId", "studentEmail", category, description, "isAnonymous", status, "createdAt")
VALUES
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    'D210001',
    'd210001@example.test',
    'academic',
    'Fictional grievance: the demo lab timetable overlaps another class.',
    false,
    'pending',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO uniz_notifications."NotificationInbox"
  (id, username, title, body, type, path, "createdAt")
VALUES
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    'D210001',
    'Demo result published',
    'Your fictional semester grades are available in Results.',
    'ACADEMIC',
    '/student/gradehub',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
