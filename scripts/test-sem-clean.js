/**
 * Clean pipeline test — proper Webmaster → Dean → HOD → Student flow.
 */
const BASE = "http://localhost:3000/api/v1";
const CAPTCHA = "uniz_dev_bypass_token_2026";

async function req(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function login(u, p, admin = false) {
  const { body } = await req(`${BASE}/auth/login${admin ? "/admin" : ""}`, {
    method: "POST",
    body: JSON.stringify({ username: u, password: p, captchaToken: CAPTCHA }),
  });
  return body?.token || null;
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

(async () => {
  const wm = await login("webmaster", "password123", true);
  const dean = await login("dean", "password123", true);
  const hod = (await login("hod_cse", "hod_cse@uniz", true)) || (await login("hod_cse", "password123", true));
  if (!hod) { console.error("BLOCKED: hod_cse login failed"); process.exit(1); }
  const student = await login("O210008", "password123");

  // cleanup all semesters
  const { body: sems } = await req(`${BASE}/academics/semester`, { headers: auth(wm) });
  for (const s of sems || []) {
    await req(`${BASE}/academics/semester/${s.id}`, { method: "DELETE", headers: auth(wm) });
  }
  console.log("Cleaned", (sems || []).length, "semesters");

  const label = `AY 2026-27 E3-SEM-1 CLEAN-${Date.now()}`;
  const init = await req(`${BASE}/academics/semester/init`, {
    method: "POST",
    headers: auth(wm),
    body: JSON.stringify({ academicSemester: label, branches: ["CSE"] }),
  });
  const semId = init.body?.semester?.id;
  console.log("1 INIT", init.status, semId, init.body?.semester?.status);

  const deanAdv = await req(`${BASE}/academics/semester/${semId}/advance`, {
    method: "POST",
    headers: auth(dean),
    body: JSON.stringify({ action: "approve" }),
  });
  console.log("2 DEAN", deanAdv.status, deanAdv.body?.semester?.status);

  const hodAdv = await req(`${BASE}/academics/semester/${semId}/advance`, {
    method: "POST",
    headers: auth(hod),
    body: JSON.stringify({ action: "approve", branch: "CSE" }),
  });
  console.log("3 HOD advance", hodAdv.status, JSON.stringify(hodAdv.body));

  const { body: semList } = await req(`${BASE}/academics/semester`, { headers: auth(wm) });
  const sem = semList?.find((s) => s.id === semId);
  console.log("4 SEM STATUS", sem?.status);

  const avail = await req(`${BASE}/academics/student/available?branch=CSE&year=E3`, { headers: auth(student) });
  console.log("5 STUDENT AVAIL", avail.status, "isOpen:", avail.body?.isOpen, "subs:", avail.body?.subjects?.length);

  if (avail.body?.isOpen && avail.body?.subjects?.length) {
    const ids = avail.body.subjects.map((s) => s.subject.id);
    const regPartial = await req(`${BASE}/academics/student/register`, {
      method: "POST",
      headers: auth(student),
      body: JSON.stringify({ subjectIds: ids.slice(0, 2) }),
    });
    console.log("6a PARTIAL REGISTER", regPartial.status, regPartial.body?.error?.slice?.(0, 60) || regPartial.body);

    const regFull = await req(`${BASE}/academics/student/register`, {
      method: "POST",
      headers: auth(student),
      body: JSON.stringify({ subjectIds: ids }),
    });
    console.log("6b FULL REGISTER", regFull.status, regFull.body?.success ?? regFull.body?.error?.slice?.(0, 80));

    const regDup = await req(`${BASE}/academics/student/register`, {
      method: "POST",
      headers: auth(student),
      body: JSON.stringify({ subjectIds: ids }),
    });
    console.log("6c DUPLICATE", regDup.status, regDup.body?.error || regDup.body);
  }

  const regs = await req(`${BASE}/academics/registrations?semesterId=${semId}`, { headers: auth(wm) });
  console.log("7 REGS COUNT", Array.isArray(regs.body) ? regs.body.length : regs.body);
})();
