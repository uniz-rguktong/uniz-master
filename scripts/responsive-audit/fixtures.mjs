/** Realistic portal and landing payloads. Long names, many rows, optional empty lists. */

export const LONG_NAME =
  "Padmavathi Venkata Subrahmanyam Krishnamacharyulu";
export const LONG_EMAIL =
  "padmavathi.venkata.subrahmanyam.krishnamacharyulu@rguktong.ac.in";
export const LONG_TITLE =
  "Advanced electromagnetic wave propagation and antenna design for rural campus networks";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function studentRow(i) {
  return {
    id: `stu-${i}`,
    _id: `stu-${i}`,
    username: `O1900${String(i).padStart(2, "0")}`,
    name: i % 5 === 0 ? LONG_NAME : `Student Example Name ${i} Reddy`,
    email: i % 5 === 0 ? LONG_EMAIL : `student.example.name.${i}@rguktong.ac.in`,
    gender: i % 2 === 0 ? "Female" : "Male",
    year: ["E1", "E2", "E3", "E4"][i % 4],
    branch: ["CSE", "ECE", "EEE", "ME", "CIVIL"][i % 5],
    section: "A",
    roomno: `B-${200 + i}`,
    batch: "2022",
    has_pending_requests: false,
    is_in_campus: i % 3 !== 0,
    is_suspended: false,
    phone_number: `98480123${String(i).padStart(2, "0")}`,
    blood_group: "O+",
    date_of_birth: "2004-06-15",
    address: "House 18, Near the old bus stand, Ongole, Prakasam district, Andhra Pradesh 523001",
    father_name: "Venkata Subrahmanyam Krishnamacharyulu",
    father_phonenumber: "9848099901",
    mother_name: "Lakshmi Padmavathi",
    mother_phonenumber: "9848099902",
    cgpa: 8.42,
    total_backlogs: i % 7 === 0 ? 1 : 0,
    attendance_pct: 86.5,
    profile_url: "",
  };
}

function facultyRow(i) {
  return {
    id: `fac-${i}`,
    username: `faculty.cse.${i}`,
    Username: `faculty.cse.${i}`,
    name: i === 0 ? `Dr. ${LONG_NAME}` : `Dr. Faculty Example Name ${i}`,
    Name: i === 0 ? `Dr. ${LONG_NAME}` : `Dr. Faculty Example Name ${i}`,
    email: i === 0 ? LONG_EMAIL : `faculty.example.name.${i}@rguktong.ac.in`,
    Email: i === 0 ? LONG_EMAIL : `faculty.example.name.${i}@rguktong.ac.in`,
    department: "Computer Science and Engineering",
    Department: "CSE",
    designation: "Assistant Professor of Computer Science and Engineering",
    Designation: "Assistant Professor",
    role: i === 1 ? "hod" : "teacher",
    Role: i === 1 ? "hod" : "teacher",
    contact: "9848011100",
    Contact: "9848011100",
    is_suspended: false,
  };
}

function grades() {
  return Array.from({ length: 8 }, (_, i) => ({
    subject: i === 0 ? LONG_TITLE : `Subject ${i + 1} — Engineering mathematics`,
    subjectCode: `CS${200 + i}`,
    grade: 9,
    gradePoint: 9,
    credits: 4,
    semester: { name: "Sem - 2" },
    semesterId: "sem-2",
    year: "E2",
  }));
}

function attendance() {
  return Array.from({ length: 8 }, (_, i) => ({
    subject: i === 0 ? { name: LONG_TITLE } : { name: `Subject ${i + 1}` },
    totalClasses: 42,
    attendedClasses: 36,
    percentage: 85.7,
  }));
}

const profileStudent = {
  ...studentRow(0),
  username: "o190001",
  grades: grades(),
  attendance: attendance(),
  outings_list: [],
  outpasses_list: [],
};

function homeSummary(empty) {
  return {
    success: true,
    data: {
      cgpa: empty ? null : 8.42,
      backlogs: empty ? 0 : 1,
      attendancePct: empty ? null : 86.4,
      latestSemester: empty ? null : "E2 · Sem 2",
      latestSgpa: empty ? null : 8.1,
      latestResults: empty
        ? []
        : [
            { subject: LONG_TITLE, grade: 9 },
            { subject: "Data structures and algorithms", grade: 8 },
            { subject: "Digital logic design", grade: 10 },
          ],
      registration: {
        label: empty ? "Not open" : "Registered",
        detail: empty
          ? "No active semester registration."
          : "E2 Sem 2 · 6 subjects including electives",
        registered: !empty,
        empty,
      },
      notifications: empty
        ? []
        : [
            {
              id: "n1",
              title: LONG_TITLE,
              content: "Please read the full circular before the Friday deadline.",
              createdAt: "2026-11-18T09:00:00.000Z",
            },
            {
              id: "n2",
              title: "Mid examinations seating",
              content: "Check the hall ticket the evening before the exam.",
              createdAt: "2026-11-12T09:00:00.000Z",
            },
          ],
      partial: { attendance: false, results: false, registration: false },
    },
  };
}

function overview() {
  return {
    success: true,
    data: {
      campus: {
        totalStudents: 4280,
        activeStudents: 4102,
        onCampus: 3900,
        offCampus: 202,
        withBacklogs: 640,
        avgCgpa: 7.84,
      },
      branches: [
        { branch: "Computer Science and Engineering", count: 1316 },
        { branch: "Electronics and Communication Engineering", count: 1302 },
        { branch: "Electrical and Electronics Engineering", count: 244 },
        { branch: "Mechanical Engineering", count: 370 },
        { branch: "Civil Engineering", count: 569 },
      ],
      grievances: [
        { category: "Examination", status: "open", count: 4 },
        { category: "Hostel", status: "resolved", count: 11 },
      ],
      academics: {
        totalStudents: 4280,
        avgGPA: 7.84,
        backlogCount: 640,
        activeSemesters: 2,
        currentSemester: "E2 Sem 2",
      },
      accounts: [
        { role: "student", active: 4102, disabled: 12 },
        { role: "faculty", active: 186, disabled: 3 },
        { role: "webadmin", active: 2, disabled: 0 },
      ],
      partial: { academics: false, accounts: false },
    },
  };
}

function landingFaculty(i, dept) {
  return {
    name: i === 0 ? `Dr. ${LONG_NAME}, Ph.D` : `Dr. Faculty Example Name ${i}, M.Tech`,
    email: i === 0 ? LONG_EMAIL : `faculty.${dept.toLowerCase()}.${i}@rguktong.ac.in`,
    photo: null,
    bio: {
      "Additional Responsibilities": "Head of the undergraduate curriculum committee",
      Specialization: LONG_TITLE,
      Phone: "9855500011",
      Experience: "14 years of teaching and research",
      Education: "Ph.D, Indian Institute of Technology",
    },
  };
}

function landingHome(empty) {
  return {
    announcements: empty
      ? []
      : [
          { text: `${LONG_TITLE}. Read the full notice before Friday.`, link: "/notifications/news" },
          { text: "Educational details verification of newly admitted students", link: "/admissions" },
          { text: "Mid-semester examinations begin next Monday", link: "/notifications/news" },
        ],
    stats: [
      { label: "Pre-University Students", value: "2205" },
      { label: "Computer Science Engineering", value: "1316" },
      { label: "Electronics and Communication Engineering", value: "1302" },
      { label: "Civil Engineering", value: "569" },
    ],
    images: [],
    hero: {
      eyebrow: "Rajiv Gandhi University of Knowledge Technologies",
      title: "RGUKT Ongole",
      subtitle: "A residential campus for engineering and pre-university education in Prakasam district.",
    },
    contact: {
      address: "RGUKT Ongole, Idupulapaya road, Ongole, Prakasam district, Andhra Pradesh 523001",
      phone: "08592-294000",
      email: LONG_EMAIL,
    },
    explore_campus: empty
      ? []
      : [
          { title: "Campus life", description: "Hostels, sports and student clubs.", url: "/institute/campuslife" },
          { title: "Departments", description: "Fourteen teaching departments.", url: "/academics/departments" },
        ],
  };
}

function landingNotes(empty) {
  if (empty) return [];
  return Array.from({ length: 8 }, (_, i) => ({
    title: i === 0 ? LONG_TITLE : `Campus notice ${i + 1}: examination and academic calendar`,
    date: `2026-11-${String(20 - i).padStart(2, "0")}`,
    links: [{ label: "Download the circular (PDF)", url: "/notifications/news" }],
  }));
}

function match(pathname, needle) {
  return pathname.includes(needle);
}

export function mockFor(urlString, { empty }) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { status: 200, json: { success: true, data: [] } };
  }
  const pathname = url.pathname;

  if (/\.(png|jpe?g|gif|webp|svg|ico)(\?|$)/i.test(pathname) && !pathname.startsWith("/api")) {
    return { status: 200, body: TINY_PNG, contentType: "image/png" };
  }

  if (match(pathname, "/profile/student/bootstrap")) {
    return {
      status: 200,
      json: {
        success: true,
        student: empty ? { ...profileStudent, name: LONG_NAME, email: LONG_EMAIL, grades: [], attendance: [] } : profileStudent,
        grades: empty ? [] : grades(),
        attendance: empty ? [] : attendance(),
      },
    };
  }
  if (match(pathname, "/profile/student/home-summary")) {
    return { status: 200, json: homeSummary(empty) };
  }
  if (match(pathname, "/profile/student/me") || match(pathname, "/profile/faculty/me") || match(pathname, "/profile/admin/me")) {
    return {
      status: 200,
      json: {
        success: true,
        data: {
          name: LONG_NAME,
          email: match(pathname, "/admin/me") ? "webadmin@rguktong.ac.in" : LONG_EMAIL,
          contact: "9848012345",
          designation: "Assistant Professor of Computer Science and Engineering",
          department: "Computer Science and Engineering",
          role: match(pathname, "/admin/me") ? "webadmin" : "student",
          profile_url: "",
          ...profileStudent,
        },
        student: profileStudent,
        faculty: facultyRow(0),
      },
    };
  }
  if (match(pathname, "/overview-summary") || match(pathname, "/analytics")) {
    return { status: 200, json: overview() };
  }
  if (match(pathname, "/profile/faculty/search") || match(pathname, "/academics/faculty")) {
    const faculty = empty ? [] : Array.from({ length: 12 }, (_, i) => facultyRow(i));
    return { status: 200, json: { success: true, faculty, data: faculty, pagination: { total: faculty.length, totalPages: 1, page: 1 } } };
  }
  if (match(pathname, "/profile/student/search")) {
    const students = empty ? [] : Array.from({ length: 18 }, (_, i) => studentRow(i));
    return {
      status: 200,
      json: { success: true, students, data: students, pagination: { total: students.length, totalPages: 1, page: 1 } },
    };
  }
  if (match(pathname, "/profile/admin/batches")) {
    return { status: 200, json: { success: true, batches: ["2020", "2021", "2022", "2023", "2024"] } };
  }
  if (match(pathname, "/profile/admin/roles")) {
    return {
      status: 200,
      json: {
        success: true,
        roles: {
          webadmin: ["students", "faculty", "grades", "roles"],
          dean: ["grades", "attendance"],
          hod: ["grades"],
          faculty: ["attendance"],
          swo: ["grievances"],
        },
      },
    };
  }
  if (match(pathname, "/profile/admin/getadmins")) {
    const admins = empty
      ? []
      : Array.from({ length: 8 }, (_, i) => ({
          id: `admin-${i}`,
          Username: i === 0 ? "webadmin" : `hod.cse.example.${i}`,
          username: i === 0 ? "webadmin" : `hod.cse.example.${i}`,
          role: i === 0 ? "webadmin" : "hod",
          email: i === 0 ? "webadmin@rguktong.ac.in" : LONG_EMAIL,
        }));
    return { status: 200, json: { success: true, admins } };
  }
  if (match(pathname, "/academics/grades")) {
    return { status: 200, json: { success: true, grades: empty ? [] : grades(), gpa: { "SEM-2": { sgpa: 8.1, cgpa: 8.4 } }, calculation_details: empty ? [] : grades() } };
  }
  if (match(pathname, "/academics/attendance")) {
    return { status: 200, json: { success: true, attendance: empty ? [] : attendance(), summary: { percentage: 86 } } };
  }
  if (match(pathname, "/academics/subjects")) {
    const subjects = empty
      ? []
      : Array.from({ length: 10 }, (_, i) => ({
          id: `sub-${i}`,
          code: `CS${200 + i}`,
          name: i === 0 ? LONG_TITLE : `Subject ${i + 1}`,
          credits: 4,
          branch: "CSE",
          year: "E2",
        }));
    return { status: 200, json: { success: true, subjects, data: subjects } };
  }
  if (match(pathname, "/academics/semester")) {
    const semesters = [
      { id: "sem-1", name: "Sem - 1", status: "closed", year: "E1", branch: "CSE" },
      { id: "sem-2", name: "Sem - 2", status: "open", year: "E2", branch: "CSE" },
    ];
    return { status: 200, json: { success: true, semesters, data: empty ? [] : semesters } };
  }
  if (match(pathname, "/requests/outside")) {
    const students = empty
      ? []
      : Array.from({ length: 6 }, (_, i) => ({
          ...studentRow(i),
          outings_list: [
            {
              _id: `out-${i}`,
              from_time: "09:00",
              to_time: "18:00",
              reason: "Medical appointment at the district hospital",
              is_expired: false,
              is_approved: true,
            },
          ],
          outpasses_list: [],
        }));
    return { status: 200, json: { success: true, students } };
  }
  if (match(pathname, "/inbox")) {
    const items = empty
      ? []
      : [
          { id: "n1", title: LONG_TITLE, content: "Circular body", body: "Circular body", createdAt: "2026-11-18T09:00:00.000Z", read: false },
          { id: "n2", title: "Fee reminder", content: "Pay before the deadline.", body: "Pay before the deadline.", createdAt: "2026-11-01T09:00:00.000Z", read: true },
        ];
    return { status: 200, json: { success: true, data: items, notifications: items, items } };
  }
  if (match(pathname, "/cms/banners")) {
    return {
      status: 200,
      json: {
        success: true,
        banners: empty
          ? []
          : [{ id: "b1", title: LONG_TITLE, text: "Campus week", imageUrl: "/carousel/all.jpg.webp", isVisible: true }],
      },
    };
  }
  if (match(pathname, "/api/notifications")) return { status: 200, json: landingNotes(empty) };
  if (match(pathname, "/cms/notifications") || match(pathname, "/cms/")) {
    const updates = empty ? [] : [{ id: "u1", title: LONG_TITLE, content: "Update body", link: "/notifications/news", isVisible: true }];
    return { status: 200, json: { success: true, notifications: { updates }, data: updates, updates } };
  }
  if (match(pathname, "/api/home")) return { status: 200, json: landingHome(empty) };
  if (match(pathname, "/api/departments/")) {
    const dept = pathname.split("/").filter(Boolean).pop()?.toUpperCase() || "CSE";
    return {
      status: 200,
      json: {
        dept,
        faculties: empty ? [] : Array.from({ length: 8 }, (_, i) => landingFaculty(i, dept)),
      },
    };
  }
  if (match(pathname, "/api/institute/")) {
    const page = pathname.split("/").filter(Boolean).pop() || "aboutrgukt";
    return {
      status: 200,
      json: {
        page,
        sections: empty
          ? []
          : [
              {
                title: LONG_TITLE,
                content: [
                  "The institute runs a six-year integrated programme. Students live on campus.",
                  "Laboratories, the library and the examination cell sit along the academic spine.",
                ],
              },
            ],
        profiles: empty
          ? []
          : [
              { name: `Dr. ${LONG_NAME}`, photo: null, text: ["Chairperson", LONG_EMAIL, "9855500011"] },
              { name: "Prof. Lakshmi Padmavathi", photo: null, text: ["Member", "lakshmi.padmavathi@rguktong.ac.in"] },
            ],
      },
    };
  }
  if (match(pathname, "/api/academics/")) {
    return {
      status: 200,
      json: empty
        ? []
        : [
            {
              header: LONG_TITLE,
              links: [
                { label: "Undergraduate regulations (PDF)", url: "/academics/AcademicRegulations" },
                { label: "Academic calendar", url: "/academics/AcademicCalender" },
              ],
            },
          ],
    };
  }
  if (match(pathname, "/requests/grievance")) {
    const items = empty
      ? []
      : [
          {
            id: "g1",
            category: "Examination",
            subject: LONG_TITLE,
            description: "The hall ticket shows the wrong subject code for the afternoon session.",
            status: "open",
            createdAt: "2026-11-02T09:00:00.000Z",
          },
        ];
    return { status: 200, json: { success: true, grievances: items, data: items } };
  }

  const rows = empty ? [] : Array.from({ length: 6 }, (_, i) => studentRow(i));
  return {
    status: 200,
    json: {
      success: true,
      data: rows,
      items: rows,
      rows,
      results: rows,
      students: rows,
      faculty: empty ? [] : Array.from({ length: 6 }, (_, i) => facultyRow(i)),
      message: "ok",
    },
  };
}

export function isApiRequest(urlString, pageOrigin) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }
  if (url.origin !== pageOrigin) return true;
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/api");
}
