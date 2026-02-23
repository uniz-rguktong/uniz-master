const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

async function transform() {
  const dir = "/Users/sreecharandesu/Projects/uniz-master/admissiondata";
  const outPath =
    "/Users/sreecharandesu/Projects/uniz-master/admissiondata/Final_Combined_Admissions.xlsx";

  const workbookOut = new ExcelJS.Workbook();
  const worksheetOut = workbookOut.addWorksheet("Students");

  const templateHeaders = [
    "Student ID",
    "Name",
    "Email",
    "Gender",
    "Branch",
    "Year",
    "Section",
    "Phone",
  ];
  worksheetOut.addRow(templateHeaders);

  const normGender = (g) => {
    if (!g) return "";
    const upper = String(g).toUpperCase();
    if (upper === "M" || upper === "MALE") return "Male";
    if (upper === "F" || upper === "FEMALE") return "Female";
    return g;
  };

  // 1. Process 2020-21 file
  console.log("Processing Batch 2020...");
  const wb2020 = new ExcelJS.Workbook();
  await wb2020.xlsx.readFile(
    path.join(dir, "2020-21_RGUKT AP_ONGOLE(20)F.xlsx"),
  );
  const sheet2020 = wb2020.getWorksheet("Sheet1");
  sheet2020.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const rawId = (row.getCell(3).value || "").toString().trim();
    if (!rawId) return;
    const name = (row.getCell(5).value || "").toString().trim();
    const gender = normGender(row.getCell(7).value);
    const phone = (row.getCell(25).value || row.getCell(24).value || "")
      .toString()
      .trim();
    const email = rawId.toLowerCase() + "@rguktong.ac.in";
    worksheetOut.addRow([
      rawId,
      name,
      email,
      gender,
      "GENERAL",
      "E4",
      "UNKNOWN",
      phone,
    ]);
  });

  // 2. Process 2021 file
  console.log("Processing Batch 2021...");
  const wb2021 = new ExcelJS.Workbook();
  await wb2021.xlsx.readFile(
    path.join(dir, "2021 ONGOLE ADMISSIONS DATA.xlsx"),
  );
  const sheet2021 = wb2021.getWorksheet("Sheet1");
  sheet2021.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const rawId = (row.getCell(3).value || "").toString().trim();
    if (!rawId) return;
    const name = (row.getCell(4).value || "").toString().trim();
    const gender = normGender(row.getCell(6).value);
    const phone = (row.getCell(16).value || row.getCell(17).value || "")
      .toString()
      .trim();
    const email = rawId.toLowerCase() + "@rguktong.ac.in";
    worksheetOut.addRow([
      rawId,
      name,
      email,
      gender,
      "GENERAL",
      "E3",
      "UNKNOWN",
      phone,
    ]);
  });

  // 3. Process 2022 file
  console.log("Processing Batch 2022...");
  const wb2022 = new ExcelJS.Workbook();
  await wb2022.xlsx.readFile(
    path.join(
      dir,
      "ONGOLE UG-Admissions2022-23 - COMPLETE DATA after counselling from dean office(22).xlsx",
    ),
  );
  const sheet2022 = wb2022.getWorksheet("O22 ADMISSION DAT");
  sheet2022.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const rawId = (row.getCell(1).value || "").toString().trim();
    if (!rawId || rawId === "StudentID") return;
    const name = (row.getCell(4).value || "").toString().trim();
    const gender = normGender(row.getCell(38).value);
    const phone = (row.getCell(19).value || "").toString().trim();
    const email = rawId.toLowerCase() + "@rguktong.ac.in";
    worksheetOut.addRow([
      rawId,
      name,
      email,
      gender,
      "GENERAL",
      "E2",
      "UNKNOWN",
      phone,
    ]);
  });

  await workbookOut.xlsx.writeFile(outPath);
  console.log("Final Combined Excel created at:", outPath);
}

transform().catch(console.error);
