const ExcelJS = require("exceljs");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=user_v2",
    },
  },
});

const BRANCHES = ["CSE", "ECE", "CIVIL", "MECH", "EEE", "CHEMICAL"];

async function importStudents() {
  console.log("Starting Production Student Import on VPS...");

  // Correct path for VPS
  const admissionDataDir = "/root/uniz-master/admissiondata";

  const files = [
    { name: "2020-21_RGUKT AP_ONGOLE(20)F.xlsx", year: "E3", sheet: 1 },
    { name: "2021 ONGOLE ADMISSIONS DATA.xlsx", year: "E2", sheet: 1 },
    {
      name: "ONGOLE UG-Admissions2022-23 - COMPLETE DATA after counselling from dean office(22).xlsx",
      year: "E1",
      sheet: "Sheet1",
    },
  ];

  let totalImported = 0;

  for (const fileInfo of files) {
    console.log(`\nProcessing ${fileInfo.name} for Year ${fileInfo.year}...`);
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(path.join(admissionDataDir, fileInfo.name));
    } catch (e) {
      console.error(`Error reading ${fileInfo.name}:`, e.message);
      continue;
    }

    const worksheet = workbook.getWorksheet(fileInfo.sheet);

    if (!worksheet) {
      console.error(`Sheet not found in ${fileInfo.name}`);
      continue;
    }

    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(
        String(cell.value || "")
          .toLowerCase()
          .trim(),
      );
    });

    let branchCounter = 0;
    let fileCount = 0;

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.value;
      });

      // Extract ID
      let id = (
        rowData["id no"] ||
        rowData["admissionnumber"] ||
        rowData["studentid"] ||
        ""
      )
        .toString()
        .trim()
        .toUpperCase();

      if (!id || !id.startsWith("O")) continue;

      const name = (
        rowData["name of the student"] ||
        rowData["studentname"] ||
        rowData["name"] ||
        ""
      )
        .toString()
        .trim();
      const gender = (rowData["gender"] || "M")
        .toString()
        .trim()
        .toUpperCase()
        .startsWith("M")
        ? "M"
        : "F";
      const email = `${id.toLowerCase()}@rguktong.ac.in`;
      const phone = (
        rowData["studentmobile"] ||
        rowData["mobile 1"] ||
        rowData["studentmobno"] ||
        ""
      )
        .toString()
        .trim();
      const branch = BRANCHES[branchCounter % BRANCHES.length];

      try {
        await prisma.studentProfile.upsert({
          where: { username: id },
          update: {
            name,
            email,
            gender,
            branch,
            year: fileInfo.year,
            phone: phone || "",
          },
          create: {
            id,
            username: id,
            name,
            email,
            gender,
            branch,
            year: fileInfo.year,
            phone: phone || "",
          },
        });

        fileCount++;
        branchCounter++;
        totalImported++;

        if (fileCount % 100 === 0)
          console.log(`- Processed ${fileCount} students...`);
      } catch (err) {
        console.error(`Failed to import ${id}:`, err.message);
      }
    }
    console.log(`Finished ${fileInfo.name}: Imported ${fileCount} students.`);
  }

  console.log(`\n--- PRODUCTION IMPORT COMPLETE ---`);
  console.log(`Total Students Synchronized: ${totalImported}`);
}

importStudents()
  .catch(console.error)
  .finally(() => prisma.$isconnect());
