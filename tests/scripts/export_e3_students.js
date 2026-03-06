const ExcelJS = require("exceljs");
const { execSync } = require("child_process");
const path = require("path");

const OUTPUT_FILE = path.join(
  process.cwd(),
  "tests/final_data/all_E3_students.xlsx",
);

async function run() {
  try {
    console.log("Fetching E3 students from production DB...");

    // Command to fetch student data via SSH/Docker/PSQL
    const psqlCommand = `ssh root@76.13.241.174 "sudo docker exec uniz-postgres psql -U user -d uniz_db -t -A -F ',' -c 'SELECT username, name, branch, year, section, email, phone FROM \\"user_v2\\".\\"StudentProfile\\" WHERE year = '\\''E3'\\'' ORDER BY branch, username;'"`;

    const csvData = execSync(psqlCommand).toString();
    const lines = csvData.trim().split("\n");

    console.log(`Found ${lines.length} students. Generating Excel...`);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("E3 Students");

    sheet.columns = [
      { header: "Username", key: "username", width: 15 },
      { header: "Name", key: "name", width: 30 },
      { header: "Branch", key: "branch", width: 15 },
      { header: "Year", key: "year", width: 10 },
      { header: "Section", key: "section", width: 10 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
    ];

    lines.forEach((line) => {
      const [username, name, branch, year, section, email, phone] =
        line.split(",");
      if (username) {
        sheet.addRow({ username, name, branch, year, section, email, phone });
      }
    });

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    await workbook.xlsx.writeFile(OUTPUT_FILE);
    console.log(`✅ Success! Data exported to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("Export failed:", err.message);
  }
}

run();
