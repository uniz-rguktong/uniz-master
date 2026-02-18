const ExcelJS = require("exceljs");
const path = require("path");

async function inspect(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const worksheet = workbook.getWorksheet(1);
  console.log(`\n--- Inspecting: ${file} ---`);
  const headers = [];
  worksheet.getRow(1).eachCell((cell) => headers.push(cell.value));
  console.log("Headers:", headers);

  const firstRow = [];
  worksheet.getRow(2).eachCell((cell) => firstRow.push(cell.value));
  console.log("Row 2:", firstRow);
}

inspect("tests/data/full_batch_grades.xlsx").catch(console.error);
inspect("tests/data/full_batch_attendance.xlsx").catch(console.error);
