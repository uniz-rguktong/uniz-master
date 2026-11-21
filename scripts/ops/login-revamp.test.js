"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  parsePersonName,
  baseSlug,
  allocateSlug,
  planLoginRevamp,
  renderCsv,
  isWriteSql,
  runLoginRevamp,
} = require("./login-revamp.js");

function cred(partial) {
  return {
    role: "teacher",
    mustChangePassword: false,
    tokenVersion: 0,
    realEmail: "",
    ...partial,
  };
}

describe("faculty username slugs", () => {
  it("strips titles and keeps the first given name plus the surname", () => {
    assert.equal(baseSlug(parsePersonName("Dr. Ravi Kumar")), "ravi.kumar");
    assert.equal(baseSlug(parsePersonName("Mr. John A. Smith")), "john.smith");
    assert.equal(baseSlug(parsePersonName("Mrs. Anita Devi")), "anita.devi");
    assert.equal(baseSlug(parsePersonName("Prof. K Tejo Kiran")), "tejo.kiran");
    assert.equal(parsePersonName("Mr. John A. Smith").middleInitial, "a");
    assert.equal(parsePersonName("K Tejo Kiran").middleInitial, "k");
  });

  it("transliterates unicode and drops punctuation", () => {
    assert.equal(baseSlug(parsePersonName("Prof. María García")), "maria.garcia");
    assert.equal(baseSlug(parsePersonName("Jean-Luc Picard")), "jean.picard");
    assert.equal(baseSlug(parsePersonName("John O'Brien")), "john.obrien");
  });

  it("uses a middle initial, then a department suffix, on collisions", () => {
    const taken = new Set();
    const first = allocateSlug(parsePersonName("Dr. Ravi Kumar"), "CSE", taken);
    taken.add(first.slug);
    assert.equal(first.slug, "ravi.kumar");
    assert.equal(first.collision, false);

    const middle = allocateSlug(parsePersonName("Ravi M Kumar"), "ECE", taken);
    taken.add(middle.slug);
    assert.equal(middle.slug, "ravi.m.kumar");
    assert.equal(middle.collision, true);
    assert.equal(middle.detail, "suffix=middle");

    const dept = allocateSlug(parsePersonName("Ravi Kumar"), "ECE", taken);
    assert.equal(dept.slug, "ravi.kumar.ece");
    assert.equal(dept.collision, true);
    assert.equal(dept.detail, "suffix=department");
  });
});

describe("login revamp dry-run", () => {
  const state = {
    credentials: [
      cred({ id: "a1", username: "KTEJOKIRAN", role: "teacher", realEmail: "" }),
      cred({ id: "a2", username: "RKUMAR", role: "teacher" }),
      cred({ id: "a3", username: "hod_cse", role: "hod" }),
      cred({ id: "a4", username: "webadmin", role: "webadmin" }),
      cred({ id: "a5", username: "director", role: "director" }),
      cred({ id: "s1", username: "O210001", role: "student" }),
      cred({ id: "s2", username: "O210002", role: "student", tokenVersion: 1, mustChangePassword: true }),
      cred({ id: "d1", username: "demo-faculty", role: "teacher" }),
    ],
    faculty: [
      { id: "f1", username: "KTEJOKIRAN", name: "Dr. K Tejo Kiran", email: "ktejokiran@rguktong.ac.in", department: "CSE", role: "teacher" },
      { id: "f2", username: "RKUMAR", name: "Ravi Kumar", email: "ravi.kumar@gmail.com", department: "ECE", role: "teacher" },
      { id: "f3", username: "hod_cse", name: "CSE Head", email: "hod.cse@rguktong.ac.in", department: "CSE", role: "hod" },
      { id: "f4", username: "demo-faculty", name: "Demo Person", email: "demo@rguktong.ac.in", department: "CSE", role: "teacher" },
    ],
    admins: [{ username: "webadmin" }, { username: "coe" }],
    students: [
      { username: "O210001", email: "o210001@rguktong.ac.in" },
      { username: "O210002", email: "" },
    ],
  };

  it("renames people, lists shared accounts, and skips admins and finished students", () => {
    const plan = planLoginRevamp(state);
    const byOld = new Map(plan.rows.map((row) => [row.oldUsername.toLowerCase(), row]));
    assert.equal(byOld.get("ktejokiran").newUsername, "tejo.kiran");
    assert.equal(byOld.get("ktejokiran").action, "rename");
    assert.equal(byOld.get("rkumar").newUsername, "ravi.kumar");
    assert.equal(byOld.get("hod_cse").action, "leave-unchanged");
    assert.equal(byOld.get("demo-faculty").action, "leave-unchanged");
    assert.ok(plan.rows.some((row) => row.oldUsername === "webadmin" && row.action === "excluded"));
    assert.ok(plan.rows.some((row) => row.oldUsername === "coe" && row.action === "excluded"));
    assert.equal(byOld.get("director").action, "leave-unchanged");
    assert.equal(plan.counts.students_to_reset, 1);
    assert.equal(plan.counts.students_skipped, 1);
    assert.equal(plan.counts.shared_unchanged, 3);
    assert.equal(plan.facultyActions.find((item) => item.authId === "a2").realEmail, "ravi.kumar@gmail.com");
    assert.equal(plan.facultyActions.find((item) => item.authId === "a1").realEmail, "ktejokiran@rguktong.ac.in");

    const csv = renderCsv(plan);
    assert.equal(csv.includes("passwordHash"), false);
    assert.equal(csv.includes("$2"), false);
    assert.match(csv, /students_to_reset=1/);
    assert.match(csv, /KTEJOKIRAN,tejo\.kiran,no,rename/);
  });

  it("writes nothing on the default dry-run", async () => {
    const seen = [];
    const answer = (rows) => async (sql) => {
      seen.push(sql);
      if (isWriteSql(sql)) throw new Error(`dry-run wrote: ${sql}`);
      if (sql.includes("AuthCredential")) return { rows: state.credentials };
      if (sql.includes("FacultyProfile")) return { rows: state.faculty };
      if (sql.includes("AdminProfile")) return { rows: state.admins };
      if (sql.includes("StudentProfile")) return { rows: state.students };
      return { rows: [] };
    };
    const result = await runLoginRevamp({
      mode: "dry-run",
      authQuery: answer(state.credentials),
      userQuery: async (sql) => {
        seen.push(sql);
        if (isWriteSql(sql)) throw new Error(`dry-run wrote: ${sql}`);
        if (sql.includes("FacultyProfile")) return { rows: state.faculty };
        if (sql.includes("AdminProfile")) return { rows: state.admins };
        if (sql.includes("StudentProfile")) return { rows: state.students };
        return { rows: [] };
      },
    });
    assert.equal(result.applied, null);
    assert.ok(seen.length >= 4);
    assert.ok(seen.every((sql) => !isWriteSql(sql)));
    assert.ok(seen.every((sql) => !/passwordHash/i.test(sql)));
    const csv = renderCsv(result.plan);
    assert.equal(csv.includes("@rguktong"), false);
  });
});
