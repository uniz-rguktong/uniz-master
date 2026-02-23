const axios = require("axios");
const ExcelJS = require("exceljs");
const path = require("path");

const API_BASE = "https://api.uniz.rguktong.in/api/v1";
const BATCH_SIZE = 50;

async function loadTest() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(
    "/Users/sreecharandesu/Projects/uniz-master/admissiondata/Final_Combined_Admissions.xlsx",
  );
  const sheet = wb.getWorksheet(1);
  const students = [];

  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const id = row.getCell(1).value;
    if (id) students.push(id.toString().trim());
  });

  console.log(
    `Phase 1: Logging in ${students.length} students to get tokens...`,
  );
  const studentTokens = [];

  for (let i = 0; i < students.length; i += 100) {
    const chunk = students.slice(i, i + 100);
    const results = await Promise.allSettled(
      chunk.map((id) =>
        axios.post(
          `${API_BASE}/auth/login`,
          {
            username: id,
            password: `${id}@rguktong`,
          },
          { timeout: 15000 },
        ),
      ),
    );

    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        studentTokens.push({ id: chunk[idx], token: r.value.data.token });
      }
    });
    console.log(`Logged in: ${studentTokens.length}/${students.length}`);
  }

  console.log(
    `\nPhase 2: Attacking Academics endpoints with ${studentTokens.length} tokens...`,
  );

  const startTime = Date.now();
  let gradesSuccess = 0;
  let gradesFail = 0;
  let reportSuccess = 0;
  let reportFail = 0;

  for (let i = 0; i < studentTokens.length; i += BATCH_SIZE) {
    const chunk = studentTokens.slice(i, i + BATCH_SIZE);
    console.log(
      `Firing chunk ${i / BATCH_SIZE + 1} (${chunk.length} students)...`,
    );

    // Target 1: GET /grades
    const gradesResults = await Promise.allSettled(
      chunk.map((s) =>
        axios.get(`${API_BASE}/academics/grades`, {
          headers: { Authorization: `Bearer ${s.token}` },
          timeout: 20000,
        }),
      ),
    );

    gradesResults.forEach((r) => {
      if (r.status === "fulfilled") gradesSuccess++;
      else gradesFail++;
    });

    // Target 2: GET /grades/download/SEM-1
    const reportResults = await Promise.allSettled(
      chunk.map((s) =>
        axios.get(`${API_BASE}/academics/grades/download/SEM-1`, {
          headers: { Authorization: `Bearer ${s.token}` },
          timeout: 30000,
          responseType: "arraybuffer", // It's a PDF
        }),
      ),
    );

    reportResults.forEach((r) => {
      if (r.status === "fulfilled") reportSuccess++;
      else {
        reportFail++;
        // if (r.reason?.response) console.log(`Report Fail: ${r.reason.response.status}`);
      }
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(
      `Status -> Grades: ${gradesSuccess}/${gradesFail} | Reports: ${reportSuccess}/${reportFail} | Time: ${elapsed.toFixed(1)}s`,
    );
  }

  console.log("\n--- Final Academics Load Test Result ---");
  console.log(`Grades Success: ${gradesSuccess}, Fail: ${gradesFail}`);
  console.log(`Reports Success: ${reportSuccess}, Fail: ${reportFail}`);
}

loadTest().catch(console.error);
