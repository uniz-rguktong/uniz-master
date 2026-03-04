const BASE_URL = "https://api.uniz.rguktong.in/api/v1";

async function makeRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    console.error(`Error on ${url}:`, await res.text());
    return null;
  }
  return res.json();
}

async function loginUser(username, password, type = "") {
  return await makeRequest(
    `${BASE_URL}/auth/login${type === "admin" ? "/admin" : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function runTest() {
  console.log("=== STARTING SEMESTER REGISTRATION COMPLETE PIPELINE TEST ===");

  // 1. WEBMASTER: Login & Clean DB
  console.log("\n[1] Webmaster Login and cleanup...");
  const wmAuth = await loginUser("webmaster", "webmaster@uniz", "admin");
  const wmToken = wmAuth.token;

  // Get active semesters and delete them
  const sems = await makeRequest(`${BASE_URL}/academics/semester`, {
    headers: authHeader(wmToken),
  });
  if (sems) {
    for (const sem of sems) {
      console.log(`  🗑️ Deleting Semester: ${sem.name} (${sem.id})`);
      await makeRequest(`${BASE_URL}/academics/semester/${sem.id}`, {
        method: "DELETE",
        headers: authHeader(wmToken),
      });
    }
  }

  // 2. WEBMASTER: Create new Registration Event
  console.log("\n[2] Webmaster creating NEW registration event...");
  const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL"];
  const newSemRes = await makeRequest(`${BASE_URL}/academics/semester/init`, {
    method: "POST",
    headers: authHeader(wmToken),
    body: JSON.stringify({
      academicSemester: "AY 2026-27 SEM-2",
      branches: branches,
    }),
  });
  console.log("  ✅ Semester initialized:", newSemRes);
  const activeSemId = newSemRes.semester.id;

  // 3. DEAN: Login and Approve webmaster request
  console.log("\n[3] Dean Login and global review...");
  const deanAuth = await loginUser("dean", "dean@uniz", "admin");
  const deanToken = deanAuth.token;

  console.log("  ✅ Dean pushing status to REGISTRATION_OPEN...");
  await makeRequest(`${BASE_URL}/academics/semester/status/${activeSemId}`, {
    method: "PATCH",
    headers: authHeader(deanToken),
    body: JSON.stringify({ status: "REGISTRATION_OPEN" }), // Bypassing straight to open for this test
  });

  // 4. HODS: Login (or Create then Login), Assign Faculty, and Approve
  for (const branch of branches) {
    console.log(`\n[4] Handling HOD for ${branch}...`);
    const hodUsername = `hod_${branch.toLowerCase()}`;

    let hodAuth = await loginUser(hodUsername, `${hodUsername}@uniz`, "admin");

    if (!hodAuth) {
      console.log(`  ➕ HOD ${hodUsername} not found. Creating...`);
      const createRes = await makeRequest(
        `${BASE_URL}/profile/faculty/create`,
        {
          method: "POST",
          headers: authHeader(wmToken),
          body: JSON.stringify({
            username: hodUsername,
            name: `${branch} HOD`,
            email: `${hodUsername}@uniz.com`,
            department: branch,
            role: "hod",
            designation: "Head of Department",
          }),
        },
      );

      if (createRes) {
        console.log(`  ✅ HOD ${hodUsername} profile created. Logging in...`);
        hodAuth = await loginUser(hodUsername, `${hodUsername}@uniz`, "admin");
      }
    }

    if (!hodAuth) {
      console.log(
        `  ❌ Failed to ensure HOD ${hodUsername}, skipping ${branch}.`,
      );
      continue;
    }

    const hodToken = hodAuth.token;

    // Get courses for branch
    const allocs = await makeRequest(
      `${BASE_URL}/academics/dean/review/${branch}?semesterId=${activeSemId}`,
      {
        headers: authHeader(hodToken),
      },
    );
    console.log(`  📋 ${branch} has ${allocs.length} subjects.`);

    if (allocs.length > 0) {
      // Get Faculty from ACADEMICS service
      let faculties = await makeRequest(
        `${BASE_URL}/academics/faculty?department=${branch}`,
        {
          headers: authHeader(hodToken),
        },
      );

      // If no faculty in academics, create a dummy one for the test
      if (!faculties || faculties.length === 0) {
        console.log(
          `  ⚠️ No faculty in Academics for ${branch}. Creating dummy...`,
        );
        const dummyFac = await makeRequest(`${BASE_URL}/academics/faculty`, {
          method: "POST",
          headers: authHeader(wmToken),
          body: JSON.stringify({
            name: `${branch} Test Faculty`,
            email: `test_fac_${branch.toLowerCase()}@uniz.com`,
            department: branch,
            designation: "Associate Professor",
            role: "FACULTY",
          }),
        });
        if (dummyFac) faculties = [dummyFac];
      }

      if (faculties && faculties.length > 0) {
        // Assign to first 3 subjects to simulate work
        for (let i = 0; i < Math.min(3, allocs.length); i++) {
          const fac = faculties[i % faculties.length];
          const alloc = allocs[i];
          console.log(`  👤 Assigning ${fac.name} to ${alloc.subject.name}`);
          await makeRequest(
            `${BASE_URL}/academics/dean/allocation/${alloc.id}`,
            {
              method: "PUT",
              headers: authHeader(hodToken),
              body: JSON.stringify({ facultyId: fac.id }),
            },
          );
        }
      } else {
        console.log(`  ❌ Could not ensure faculty for ${branch}`);
      }

      // Approve allocations
      console.log(`  ✅ ${branch} HOD Approving...`);
      await makeRequest(`${BASE_URL}/academics/dean/approve`, {
        method: "POST",
        headers: authHeader(hodToken),
        body: JSON.stringify({ branch, semesterId: activeSemId }),
      });
    }
  }

  // 5. STUDENTS: Login and Register
  console.log("\n[5] Simulating Student Registrations...");
  // Mapping of sample students to branches
  const sampleStudents = [
    { id: "O200258", branch: "CSE", year: "E4" },
    { id: "O200039", branch: "ECE", year: "E4" },
    { id: "O210055", branch: "EEE", year: "E3" },
    { id: "O210070", branch: "MECH", year: "E3" },
    { id: "O200679", branch: "CIVIL", year: "E4" },
  ];

  for (const student of sampleStudents) {
    console.log(
      `\n  🧑‍🎓 Student ${student.id} (${student.branch}, ${student.year}) logging in...`,
    );
    const sAuth = await loginUser(student.id, `${student.id}@rguktong`);
    if (!sAuth) {
      console.log(`  ❌ Failed login for ${student.id}`);
      continue;
    }
    const sToken = sAuth.token;

    const availRes = await makeRequest(
      `${BASE_URL}/academics/student/available?branch=${student.branch}&year=${student.year}`,
      {
        headers: authHeader(sToken),
      },
    );

    if (availRes && availRes.isOpen && !availRes.alreadyRegistered) {
      console.log(
        `  📚 Found ${availRes.subjects.length} subjects. Registering...`,
      );
      const subIds = availRes.subjects.map((s) => s.subject.id);
      const regRes = await makeRequest(
        `${BASE_URL}/academics/student/register`,
        {
          method: "POST",
          headers: authHeader(sToken),
          body: JSON.stringify({ subjectIds: subIds }),
        },
      );
      console.log(`  ✅ Registration response:`, regRes);
    } else {
      console.log(`  ⚠️ Registration state:`, availRes);
    }
  }

  // 6. ADMINISTRATIVE VERIFICATION: Check registrations as Webmaster
  console.log(
    "\n[6] Verification: Checking global registrations as Webmaster...",
  );
  const regs = await makeRequest(
    `${BASE_URL}/academics/registrations?semesterId=${activeSemId}&branch=all`,
    {
      headers: authHeader(wmToken),
    },
  );

  if (regs && Array.isArray(regs)) {
    console.log(`  📊 Total Registrations found: ${regs.length}`);
    if (regs.length > 0) {
      console.log(
        `  ✅ First Registration Entry: Student ${regs[0].studentId} for ${regs[0].subject?.name}`,
      );
    } else {
      console.log("  ❌ No registrations found in administrative view!");
    }
  } else {
    console.log("  ❌ Failed to fetch registrations for verification.");
  }

  console.log("\n=== PIPELINE TEST COMPLETE ===");
}

runTest().catch(console.error);
