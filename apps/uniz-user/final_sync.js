const ExcelJS = require("exceljs");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const axios = require("axios");

// Using ONLY the local VPS database URL
const DATABASE_URL =
  "postgresql://user:password@localhost:5432/uniz_db?sslmode=disable&schema=user_v2";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

const AUTH_SERVICE_URL = "http://uniz-auth-service:3001/api/v1/auth";
const INTERNAL_SECRET = "uniz-core";

const BRANCHES = ["CSE", "ECE", "CIVIL", "MECH", "EEE", "CHEMICAL"];

async function finalFix() {
  console.log("--- FINAL CORRECTIVE SYNC: VPS LOCAL DB ---");
  console.log("Mapping: 2020->E4, 2021->E3, 2022->E2");
  console.log("Action: Profile Sync + Password Reset to idnumber@rguktong");

  const admissionDataDir = "/root/uniz-master/admissiondata";

  const files = [
    { name: "2020-21_RGUKT AP_ONGOLE(20)F.xlsx", year: "E4", sheet: 1 },
    { name: "2021 ONGOLE ADMISSIONS DATA.xlsx", year: "E3", sheet: 1 },
    {
      name: "ONGOLE UG-Admissions2022-23 - COMPLETE DATA after counselling from dean office(22).xlsx",
      year: "E2",
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
      const password = `${id.toLowerCase()}@rguktong`;

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

        try {
          await axios.post(
            `${AUTH_SERVICE_URL}/signup`,
            {
              username: id,
              password,
              role: "student",
              email,
            },
            {
              headers: { "x-internal-secret": INTERNAL_SECRET },
              timeout: 5000,
            },
          );
        } catch (authErr) {}

        fileCount++;
        branchCounter++;
        totalImported++;

        if (fileCount % 100 === 0)
          console.log(`- Synced ${fileCount} students...`);
      } catch (err) {
        console.error(`Failed to sync ${id}:`, err.message);
      }
    }
    console.log(`Finished ${fileInfo.name}: Synced ${fileCount} students.`);
  }

  console.log(`\n--- FINAL VPS LOCAL DB SYNC COMPLETE ---`);
  console.log(`Total Students Synchronized: ${totalImported}`);
}

finalFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
