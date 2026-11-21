const test = require("node:test");
const assert = require("node:assert/strict");
const {
  schemaIdent,
  num,
  numOrNull,
  registrationStatus,
  campusSnapshotSql,
  branchDistributionSql,
  grievanceSummarySql,
  authAccountsSql,
  academicsOverviewSql,
  studentAttendanceSql,
} = require("../dist/utils/overview-summary");

test("schema names stay identifiers", () => {
  assert.equal(schemaIdent("uniz_academics", "fallback"), "uniz_academics");
  assert.equal(schemaIdent("bad-name", "fallback"), "fallback");
  assert.equal(schemaIdent("1abc", "fallback"), "fallback");
  assert.equal(schemaIdent("", "fallback"), "fallback");
});

test("numeric helpers coerce database values", () => {
  assert.equal(num(BigInt(12)), 12);
  assert.equal(num(null), 0);
  assert.equal(num("4.5"), 4.5);
  assert.equal(num("nope"), 0);
  assert.equal(numOrNull(null), null);
  assert.equal(numOrNull(""), null);
  assert.equal(numOrNull("8.2"), 8.2);
});

test("registration status covers the home states", () => {
  assert.equal(registrationStatus({ semesterName: null, semesterStatus: null, subjectCount: 0 }).label, "Not open");
  assert.equal(
    registrationStatus({ semesterName: "E4-S1", semesterStatus: "REGISTRATION_OPEN", subjectCount: 2 }).label,
    "Registered",
  );
  assert.equal(
    registrationStatus({ semesterName: "E4-S1", semesterStatus: "REGISTRATION_OPEN", subjectCount: 0 }).label,
    "Action needed",
  );
  assert.equal(
    registrationStatus({ semesterName: "E4-S1", semesterStatus: "REGISTRATION_CLOSED", subjectCount: 0 }).label,
    "Closed",
  );
});

test("overview SQL aggregates in the database", () => {
  const campus = campusSnapshotSql();
  assert.match(campus, /COUNT\(\*\)/);
  assert.match(campus, /FILTER/);
  assert.doesNotMatch(campus, /SELECT \*/);

  const branches = branchDistributionSql();
  assert.match(branches, /GROUP BY branch/);
  assert.match(branches, /COUNT\(\*\)/);

  const grievances = grievanceSummarySql();
  assert.match(grievances, /GROUP BY category, status/);

  const accounts = authAccountsSql("uniz_auth");
  assert.match(accounts, /FROM uniz_auth\."AuthCredential"/);
  assert.match(accounts, /GROUP BY role/);
  assert.match(accounts, /COUNT\(\*\) FILTER/);

  const academics = academicsOverviewSql("uniz_academics");
  assert.match(academics.counts, /AVG\("grade"\)/);
  assert.match(academics.counts, /COUNT\(DISTINCT "studentId"\)/);
  assert.match(academics.semester, /LIMIT 1/);

  const attendance = studentAttendanceSql("uniz_academics");
  assert.match(attendance, /SUM\("attendedClasses"\)/);
  assert.match(attendance, /WHERE "studentId" = \$1/);
});
