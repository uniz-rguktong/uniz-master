const XLSX = require("xlsx");
const workbook = XLSX.readFile(
  "/Users/sreecharandesu/Projects/uniz-rguktong/tests/data/full_batch_grades.xlsx",
);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
const studentData = data.filter(
  (r) => r["Student ID"] === "O210008" || r["studentid"] === "O210008",
);
console.log(JSON.stringify(studentData, null, 2));
