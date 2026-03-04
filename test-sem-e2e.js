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
  const deanAuth = await loginUser("dean_academic", "dean@uniz", "admin");
  const deanToken = deanAuth.token;

  console.log("  ✅ Dean pushing status to REGISTRATION_OPEN...");
  await makeRequest(`${BASE_URL}/academics/semester/status/${activeSemId}`, {
    method: "PATCH",
    headers: authHeader(deanToken),
    body: JSON.stringify({ status: "REGISTRATION_OPEN" }), // Bypassing straight to open for this test
  });

  // 4. HODS: Login, Assign Faculty, and Approve
  for (const branch of branches) {
    console.log(`\n[4] Handling HOD for ${branch}...`);
    const hodUsername = `hod_${branch.toLowerCase()}`;
    const hodAuth = await loginUser(
      hodUsername,
      `${hodUsername}@uniz`,
      "admin",
    );
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
      // Get Faculty
      const facRes = await makeRequest(`${BASE_URL}/profile/faculty/search`, {
        method: "POST",
        headers: authHeader(hodToken),
        body: JSON.stringify({ department: branch }),
      });

      const faculties = facRes?.faculty || [];
      if (faculties.length > 0) {
        // Assign to first 3 subjects to simulate work
        for (let i = 0; i < Math.min(3, allocs.length); i++) {
          const fac = faculties[i % faculties.length];
          const alloc = allocs[i];
          console.log(`  👤 Assigning ${fac.name} to ${alloc.subject.name}`);
          await makeRequest(`${BASE_URL}/academics/allocation/${alloc.id}`, {
            method: "PUT",
            headers: authHeader(hodToken),
            body: JSON.stringify({ facultyId: fac.id }),
          });
        }
      } else {
        console.log(`  ⚠️ No faculty found for ${branch}`);
      }

      // Approve allocations
      console.log(`  ✅ ${branch} HOD Approving...`);
      // Note: We simulate approval even if not all faculty are assigned for test script robustness,
      // The UI prevents this but the API currently allows it if called directly.
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
    { id: "N220102", branch: "CSE" }, // Add valid student IDs here
    // You would add ECE, EEE etc valid students here
  ];

  for (const student of sampleStudents) {
    console.log(
      `\n  🧑‍🎓 Student ${student.id} (${student.branch}) logging in...`,
    );
    const sAuth = await loginUser(student.id, `${student.id}@rguktong`);
    if (!sAuth) {
      console.log(`  ❌ Failed login for ${student.id}`);
      continue;
    }
    const sToken = sAuth.token;

    const availRes = await makeRequest(
      `${BASE_URL}/academics/student/available?branch=${student.branch}&year=E2`,
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

  console.log("\n=== PIPELINE TEST COMPLETE ===");
}

runTest().catch(console.error);
