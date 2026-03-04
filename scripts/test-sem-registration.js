const BASE_URL = "https://api.uniz.rguktong.in/api/v1";

async function run() {
  console.log("🚀 Starting Semester Registration E2E Flow...\n");

  // 1. Webmaster logs in
  console.log("[1] Webmaster Login...");
  const wmRes = await fetch(`${BASE_URL}/auth/login/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "webmaster", password: "webmaster@uniz" }),
  }).then((r) => r.json());
  const wmToken = wmRes.token;
  console.log("  ✅ Webmaster token acquired.");

  console.log("\n[2] Fetching active semesters...");
  const semsRes = await fetch(`${BASE_URL}/academics/semester`, {
    headers: { Authorization: `Bearer ${wmToken}` },
  }).then((r) => r.json());
  const activeSem =
    semsRes.find(
      (s) => s.status === "DEAN_REVIEW" || s.status === "REGISTRATION_OPEN",
    ) || semsRes[0];
  if (!activeSem) {
    console.log("  ❌ No active semester found.");
    return;
  }
  console.log(
    `  📝 Active Semester: ${activeSem.name} (ID: ${activeSem.id}, Status: ${activeSem.status})`,
  );

  // 3. HOD Logs in
  console.log("\n[3] HOD_CSE Login...");
  const hodRes = await fetch(`${BASE_URL}/auth/login/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "hod_cse", password: "hod_cse@uniz" }),
  }).then((r) => r.json());
  const hodToken = hodRes.token;
  console.log("  ✅ HOD token acquired.");

  // 4. HOD fetches CSE review list
  console.log("\n[4] HOD fetching CSE courses for review...");
  const allocsRes = await fetch(
    `${BASE_URL}/academics/dean/review/CSE?semesterId=${activeSem.id}`,
    {
      headers: { Authorization: `Bearer ${hodToken}` },
    },
  ).then((r) => r.json());
  console.log(`  📋 Found ${allocsRes.length} subjects for CSE.`);

  if (allocsRes.length > 0) {
    // 5. Assign a random faculty to the first subject
    console.log("\n[5] HOD fetching CSE faculty list to assign...");
    const facRes = await fetch(`${BASE_URL}/profile/faculty/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        department: "CSE",
        query: "",
        page: 1,
        limit: 10,
      }),
    }).then((r) => r.json());

    if (facRes.faculty && facRes.faculty.length > 0) {
      const firstFac = facRes.faculty[0];
      const selectedAlloc =
        allocsRes.find((a) => a.subject.code === "CSE-E2-SEM-1-C4") ||
        allocsRes[0];
      console.log(
        `  👤 Assigning ${firstFac.name} to ${selectedAlloc.subject.name} (${selectedAlloc.subject.code})...`,
      );

      const updateRes = await fetch(
        `${BASE_URL}/academics/allocation/${selectedAlloc.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${hodToken}`,
          },
          body: JSON.stringify({ facultyId: firstFac.id }),
        },
      ).then((r) => r.json());
      if (updateRes.success) {
        console.log(`  ✅ Faculty Assigned successfully.`);
      }
    }

    // 6. HOD Approves
    console.log("\n[6] HOD Approving CSE Course List...");
    const approveRes = await fetch(`${BASE_URL}/academics/dean/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({ branch: "CSE", semesterId: activeSem.id }),
    }).then((r) => r.json());
    console.log(`  ✅ Approval API says:`, approveRes);
  }

  // 6.5 Webmaster formally opens registration event for all students
  console.log("\n[6.5] Webmaster Opening Registration Window...");
  const statusRes = await fetch(
    `${BASE_URL}/academics/semester/status/${activeSem.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wmToken}`,
      },
      body: JSON.stringify({ status: "REGISTRATION_OPEN" }),
    },
  ).then((r) => r.json());
  console.log(`  ✅ Registration marked as REGISTRATION_OPEN!`, statusRes);

  // 7. Student Login
  console.log("\n[7] Student N220102 Login...");
  const stdRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "N220102", password: "N220102@rguktong" }),
  }).then((r) => r.json());
  const stdToken = stdRes.token;
  console.log("  ✅ Student token acquired.");

  // 8. Student gets available subjects
  console.log("\n[8] Student fetching available subjects...");
  const availRes = await fetch(
    `${BASE_URL}/academics/student/available?branch=CSE&year=E2`,
    {
      headers: { Authorization: `Bearer ${stdToken}` },
    },
  ).then((r) => r.json());

  if (!availRes.isOpen) {
    console.log(
      "  ❌ Registration is seemingly closed according to flag:",
      availRes,
    );
  } else {
    console.log(
      `  📚 Registration is OPEN. Student sees ${availRes.subjects?.length || 0} subjects.`,
    );
    let exSub = availRes.subjects.find((s) => s.faculty !== null);
    if (!exSub && availRes.subjects.length > 0) exSub = availRes.subjects[0];

    if (exSub) {
      console.log(`  👀 Example returned subject info: ${exSub.subject?.name}`);
      if (exSub.faculty) {
        console.log(`  👨‍🏫 Taught by: ${exSub.faculty.name}`);
      }
    }

    if (
      availRes.subjects &&
      availRes.subjects.length > 0 &&
      !availRes.alreadyRegistered
    ) {
      // 9. Register
      const subIds = availRes.subjects.map((s) => s.subject.id);
      console.log("\n[9] Student actually registering for ALL E2 subjects...");
      const regRes = await fetch(`${BASE_URL}/academics/student/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stdToken}`,
        },
        body: JSON.stringify({ subjectIds: subIds }),
      }).then((r) => r.json());
      console.log("  ✅ Final Student Registration Response:", regRes);
    } else if (availRes.alreadyRegistered) {
      console.log("\n  ⚠️ Student is already marked as registered.");
    }
  }

  console.log("\n🎉 End-to-End Test API Script Complete!");
}

run().catch(console.error);
