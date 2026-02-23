const axios = require("axios");
const ExcelJS = require("exceljs");
const path = require("path");

const API_BASE = "https://api.uniz.rguktong.in/api/v1";
const BATCH_SIZE = 200; // Fire 200 requests at a time

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

  console.log(`Starting load test with ${students.length} students...`);
  const startTime = Date.now();
  let success = 0;
  let fail = 0;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const chunk = students.slice(i, i + BATCH_SIZE);
    console.log(
      `Firing chunk ${i / BATCH_SIZE + 1} (${chunk.length} requests)...`,
    );

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

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.status === 200) success++;
      else {
        fail++;
        if (r.reason?.response) {
          // console.log(`Fail: ${r.reason.response.status}`);
        }
      }
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(
      `Status: Success=${success}, Fail=${fail}, Elapsed=${elapsed.toFixed(1)}s`,
    );
  }

  const finalTime = (Date.now() - startTime) / 1000;
  console.log("--- Load Test Result ---");
  console.log(`Total Requests: ${students.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${fail}`);
  console.log(`Total Time: ${finalTime.toFixed(1)}s`);
  console.log(
    `Avg Response Rate: ${(students.length / finalTime).toFixed(1)} req/s`,
  );
}

loadTest().catch(console.error);
