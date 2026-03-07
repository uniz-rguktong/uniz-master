const ExcelJS = require("exceljs");
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("Grades");
worksheet.addRow(["Student ID", "Subject Code", "Grade"]);
worksheet.addRow(["O210008", "CS101", "EX"]);
worksheet.addRow(["O210008", "CS102", "A"]);
workbook.xlsx
  .writeFile("test_grades.xlsx")
  .then(() => console.log("File created"));
